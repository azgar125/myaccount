<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Resources\TransactionResource;
use App\Models\Client;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Throwable;

class AdminDashboardController extends Controller
{
    public function index()
    {
        try {
            // ✅ 5 minute cache — dashboard data বারবার query হবে না
            $data = Cache::remember('admin_dashboard_v1', 300, function () {
                return $this->buildDashboard();
            });

            return ApiResponse::success($data, 'Admin dashboard');
        } catch (Throwable $e) {
            Log::error('Admin dashboard error', [
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
            ]);

            if (config('app.debug')) {
                return response()->json([
                    'status'  => false,
                    'message' => $e->getMessage(),
                    'file'    => $e->getFile(),
                    'line'    => $e->getLine(),
                ], 500);
            }

            return ApiResponse::error('Failed to load dashboard', 500);
        }
    }

    /* =========================================================
     |  Main builder — সব query optimized
     ========================================================= */
    protected function buildDashboard(): array
    {
        $today      = Carbon::today();
        $weekStart  = Carbon::now()->startOfWeek();
        $weekEnd    = Carbon::now()->endOfWeek();
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd   = Carbon::now()->endOfMonth();

        /* ---------- Summary cards (single queries) ---------- */
        $clientStats = Client::query()
            ->selectRaw('
                COUNT(*) AS total,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) AS active
            ', ['ACTIVE'])
            ->first();

        $totalClients  = (int) ($clientStats->total  ?? 0);
        $activeClients = (int) ($clientStats->active ?? 0);

        /* ---------- Transactions summary in ONE query ---------- */
        $summary = $this->transactionSummary($today, $today, $weekStart, $weekEnd, $monthStart, $monthEnd);

        /* ---------- Profit (single queries) ---------- */
        $profit = $this->profitSummaryAll($today, $today, $weekStart, $weekEnd, $monthStart, $monthEnd);

        /* ---------- Due ---------- */
        $due = $this->totalDueBoth();

        $netDue = round(
            (float) $due['sale']['due_raw'] - (float) $due['purchase']['due_raw'],
            2
        );

        /* ---------- Charts (optimized) ---------- */
        $dailyChart    = $this->dailyChart(14);
        $monthlyChart  = $this->monthlyChart(12);
        $clientWise    = $this->clientWiseChart(
            Carbon::today()->subDays(29),
            Carbon::today()
        );

        /* ---------- Recent + Open ---------- */
        $recent = Transaction::query()
            ->with($this->transactionRelations())
            ->when($this->hasColumn('transactions', 'is_deleted'), fn ($q) => $q->where('is_deleted', false))
            ->orderByDesc('transaction_date')
            ->orderByDesc('id')
            ->limit(10)
            ->get();

        $openPurchases = Transaction::query()
            ->with(['client:id,client_code,name', 'payments'])
            ->where('type', 'PURCHASE')
            ->when($this->hasColumn('transactions', 'is_deleted'), fn ($q) => $q->where('is_deleted', false))
            ->whereIn('status', ['OPEN', 'PARTIAL'])
            ->orderByDesc('transaction_date')
            ->limit(5)
            ->get();

        return [
            'today' => [
                'clients'          => $totalClients,
                'active_clients'   => $activeClients,
                'purchase_amount'  => $summary['today']['purchase_usd'],
                'purchase_count'   => $summary['today']['purchase_count'],
                'purchase_payable' => $summary['today']['purchase_payable'],
                'sale_amount'      => $summary['today']['sale_usd'],
                'sale_count'       => $summary['today']['sale_count'],
                'sale_receivable'  => $summary['today']['sale_payable'],
                'profit_realized'  => $profit['today']['realized'],
                'profit_pending'   => $profit['today']['pending'],
                'profit_total'     => $profit['today']['total'],
            ],
            'weekly' => [
                'purchase_amount' => $summary['week']['purchase_usd'],
                'purchase_count'  => $summary['week']['purchase_count'],
                'sale_amount'     => $summary['week']['sale_usd'],
                'sale_count'      => $summary['week']['sale_count'],
                'profit_realized' => $profit['week']['realized'],
                'profit_pending'  => $profit['week']['pending'],
                'profit_total'    => $profit['week']['total'],
            ],
            'monthly' => [
                'purchase_amount' => $summary['month']['purchase_usd'],
                'purchase_count'  => $summary['month']['purchase_count'],
                'sale_amount'     => $summary['month']['sale_usd'],
                'sale_count'      => $summary['month']['sale_count'],
                'profit_realized' => $profit['month']['realized'],
                'profit_pending'  => $profit['month']['pending'],
                'profit_total'    => $profit['month']['total'],
            ],
            'due' => [
                'payables'    => $due['purchase'],
                'receivables' => $due['sale'],
                'net'         => number_format($netDue, 2, '.', ''),
            ],
            'charts' => [
                'daily'       => $dailyChart,
                'monthly'     => $monthlyChart,
                'client_wise' => $clientWise,
            ],
            'recent_transactions' => TransactionResource::collection($recent),
            'open_purchases'      => TransactionResource::collection($openPurchases),
        ];
    }

    /* =========================================================
     |  Optimization Helpers
     ========================================================= */

    protected function transactionSummary(
        Carbon $today, Carbon $todayEnd,
        Carbon $weekStart, Carbon $weekEnd,
        Carbon $monthStart, Carbon $monthEnd
    ): array {
        try {
            // ✅ এক query তে today/week/month সব পেয়ে যাব
            $rows = Transaction::query()
                ->when($this->hasColumn('transactions', 'is_deleted'), fn ($q) => $q->where('is_deleted', false))
                ->whereBetween('transaction_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->selectRaw('
                    DATE(transaction_date) as d,
                    type,
                    COUNT(*) as cnt,
                    COALESCE(SUM(purchase_usd), 0) as purchase,
                    COALESCE(SUM(total_payable), 0) as payable
                ')
                ->groupBy('d', 'type')
                ->get();

            $result = [
                'today' => $this->emptyPeriod(),
                'week'  => $this->emptyPeriod(),
                'month' => $this->emptyPeriod(),
            ];

            $todayStr = $today->toDateString();
            $weekStartStr = $weekStart->toDateString();
            $weekEndStr   = $weekEnd->toDateString();

            foreach ($rows as $row) {
                $d = $row->d;
                $isPurchase = $row->type === 'PURCHASE';
                $isSale     = $row->type === 'SALE';

                // Month
                $this->accumulate($result['month'], $row, $isPurchase, $isSale);

                // Week
                if ($d >= $weekStartStr && $d <= $weekEndStr) {
                    $this->accumulate($result['week'], $row, $isPurchase, $isSale);
                }

                // Today
                if ($d === $todayStr) {
                    $this->accumulate($result['today'], $row, $isPurchase, $isSale);
                }
            }

            // Format
            foreach ($result as &$p) {
                $p['purchase_usd']    = number_format($p['purchase_usd_raw'], 2, '.', '');
                $p['purchase_payable']= number_format($p['purchase_payable_raw'], 2, '.', '');
                $p['sale_usd']        = number_format($p['sale_usd_raw'], 2, '.', '');
                $p['sale_payable']    = number_format($p['sale_payable_raw'], 2, '.', '');
            }
            unset($p);

            return $result;
        } catch (Throwable $e) {
            Log::warning('transactionSummary failed: ' . $e->getMessage());
            return [
                'today' => $this->emptyPeriodFormatted(),
                'week'  => $this->emptyPeriodFormatted(),
                'month' => $this->emptyPeriodFormatted(),
            ];
        }
    }

    protected function emptyPeriod(): array
    {
        return [
            'purchase_count'        => 0,
            'purchase_usd_raw'      => 0.0,
            'purchase_payable_raw'  => 0.0,
            'sale_count'            => 0,
            'sale_usd_raw'          => 0.0,
            'sale_payable_raw'      => 0.0,
            'purchase_usd'          => '0.00',
            'purchase_payable'      => '0.00',
            'sale_usd'              => '0.00',
            'sale_payable'          => '0.00',
        ];
    }

    protected function emptyPeriodFormatted(): array
    {
        return [
            'purchase_count'   => 0,
            'purchase_usd'     => '0.00',
            'purchase_payable' => '0.00',
            'sale_count'       => 0,
            'sale_usd'         => '0.00',
            'sale_payable'     => '0.00',
        ];
    }

    protected function accumulate(array &$period, $row, bool $isPurchase, bool $isSale): void
    {
        if ($isPurchase) {
            $period['purchase_count']       += (int) $row->cnt;
            $period['purchase_usd_raw']     += (float) $row->purchase;
            $period['purchase_payable_raw'] += (float) $row->payable;
        }
        if ($isSale) {
            $period['sale_count']       += (int) $row->cnt;
            $period['sale_usd_raw']     += (float) $row->purchase;
            $period['sale_payable_raw'] += (float) $row->payable;
        }
    }

    /* =========================================================
     |  Profit — single query each period
     ========================================================= */
    protected function profitSummaryAll(
        Carbon $today, Carbon $todayEnd,
        Carbon $weekStart, Carbon $weekEnd,
        Carbon $monthStart, Carbon $monthEnd
    ): array {
        try {
            $monthStartStr = $monthStart->toDateString();
            $monthEndStr   = $monthEnd->toDateString();

            $realizedByDate = collect();
            $soldByDate     = collect();

            if ($this->hasTable('transaction_sales')) {
                $realizedByDate = DB::table('transaction_sales')
                    ->whereBetween('sale_date', [$monthStartStr, $monthEndStr])
                    ->selectRaw('DATE(sale_date) as d, COALESCE(SUM(profit_realized),0) as v')
                    ->groupBy('d')
                    ->pluck('v', 'd');

                $soldByDate = DB::table('transaction_sales')
                    ->whereBetween('sale_date', [$monthStartStr, $monthEndStr])
                    ->selectRaw('DATE(sale_date) as d, COALESCE(SUM(sold_quantity),0) as v')
                    ->groupBy('d')
                    ->pluck('v', 'd');
            }

            $remainingByDate = collect();
            if ($this->hasColumn('transactions', 'remaining_quantity')) {
                $remainingByDate = Transaction::query()
                    ->when($this->hasColumn('transactions', 'is_deleted'), fn ($q) => $q->where('is_deleted', false))
                    ->where('type', 'PURCHASE')
                    ->whereBetween('transaction_date', [$monthStartStr, $monthEndStr])
                    ->selectRaw('DATE(transaction_date) as d, COALESCE(SUM(remaining_quantity),0) as v')
                    ->groupBy('d')
                    ->pluck('v', 'd');
            }

            $calc = function (Carbon $from, Carbon $to) use ($realizedByDate, $soldByDate, $remainingByDate) {
                $fromStr = $from->toDateString();
                $toStr   = $to->toDateString();

                $realized = 0.0; $sold = 0.0; $remaining = 0.0;
                foreach ($realizedByDate as $d => $v) {
                    if ($d >= $fromStr && $d <= $toStr) $realized += (float) $v;
                }
                foreach ($soldByDate as $d => $v) {
                    if ($d >= $fromStr && $d <= $toStr) $sold += (float) $v;
                }
                foreach ($remainingByDate as $d => $v) {
                    if ($d >= $fromStr && $d <= $toStr) $remaining += (float) $v;
                }

                $avgRate = ($realized > 0 && $sold > 0) ? ($realized / $sold) : 0;
                $pending = round($remaining * $avgRate, 2);
                $total   = round($realized + $pending, 2);

                return [
                    'realized' => number_format($realized, 2, '.', ''),
                    'pending'  => number_format($pending,  2, '.', ''),
                    'total'    => number_format($total,    2, '.', ''),
                ];
            };

            return [
                'today' => $calc($today, $todayEnd),
                'week'  => $calc($weekStart, $weekEnd),
                'month' => $calc($monthStart, $monthEnd),
            ];
        } catch (Throwable $e) {
            Log::warning('profitSummaryAll failed: ' . $e->getMessage());
            $empty = ['realized' => '0.00', 'pending' => '0.00', 'total' => '0.00'];
            return ['today' => $empty, 'week' => $empty, 'month' => $empty];
        }
    }

    /* =========================================================
     |  Due — 1 query total
     ========================================================= */
    protected function totalDueBoth(): array
    {
        $default = [
            'purchase' => ['count' => 0, 'payable' => '0.00', 'paid' => '0.00', 'due' => '0.00', 'due_raw' => 0.0],
            'sale'     => ['count' => 0, 'payable' => '0.00', 'paid' => '0.00', 'due' => '0.00', 'due_raw' => 0.0],
        ];

        try {
            $rows = Transaction::query()
                ->when($this->hasColumn('transactions', 'is_deleted'), fn ($q) => $q->where('is_deleted', false))
                ->whereIn('type', ['PURCHASE', 'SALE'])
                ->whereIn('status', ['OPEN', 'PARTIAL'])
                ->get(['id', 'type', 'total_payable']);

            if ($rows->isEmpty()) return $default;

            $paidMap = collect();
            if ($this->hasTable('transaction_payments')) {
                $paidMap = DB::table('transaction_payments')
                    ->whereIn('transaction_id', $rows->pluck('id')->all())
                    ->selectRaw('transaction_id, COALESCE(SUM(amount_usd),0) as paid')
                    ->groupBy('transaction_id')
                    ->pluck('paid', 'transaction_id');
            }

            $result = [
                'purchase' => ['count' => 0, 'payable_raw' => 0.0, 'paid_raw' => 0.0],
                'sale'     => ['count' => 0, 'payable_raw' => 0.0, 'paid_raw' => 0.0],
            ];

            foreach ($rows as $row) {
                $key = $row->type === 'PURCHASE' ? 'purchase' : 'sale';
                $result[$key]['count']++;
                $result[$key]['payable_raw'] += (float) $row->total_payable;
                $result[$key]['paid_raw']    += (float) ($paidMap[$row->id] ?? 0);
            }

            $final = [];
            foreach (['purchase', 'sale'] as $k) {
                $due = max(0, $result[$k]['payable_raw'] - $result[$k]['paid_raw']);
                $final[$k] = [
                    'count'   => $result[$k]['count'],
                    'payable' => number_format($result[$k]['payable_raw'], 2, '.', ''),
                    'paid'    => number_format($result[$k]['paid_raw'],    2, '.', ''),
                    'due'     => number_format($due, 2, '.', ''),
                    'due_raw' => $due,
                ];
            }

            return $final;
        } catch (Throwable $e) {
            Log::warning('totalDueBoth failed: ' . $e->getMessage());
            return $default;
        }
    }

    /* =========================================================
     |  Daily Chart — 3 queries total (আগে ছিল 42 queries!)
     ========================================================= */
    protected function dailyChart(int $days = 14): array
    {
        try {
            $end   = Carbon::today();
            $start = $end->copy()->subDays($days - 1);
            $sStr  = $start->toDateString();
            $eStr  = $end->toDateString();

            // ✅ প্রতি type এর জন্য 1 query
            $purchaseData = Transaction::query()
                ->when($this->hasColumn('transactions', 'is_deleted'), fn ($q) => $q->where('is_deleted', false))
                ->where('type', 'PURCHASE')
                ->whereBetween('transaction_date', [$sStr, $eStr])
                ->selectRaw('DATE(transaction_date) as d, COALESCE(SUM(purchase_usd),0) as v, COALESCE(SUM(total_payable),0) as p')
                ->groupBy('d')->get()->keyBy('d');

            $saleData = Transaction::query()
                ->when($this->hasColumn('transactions', 'is_deleted'), fn ($q) => $q->where('is_deleted', false))
                ->where('type', 'SALE')
                ->whereBetween('transaction_date', [$sStr, $eStr])
                ->selectRaw('DATE(transaction_date) as d, COALESCE(SUM(purchase_usd),0) as v, COALESCE(SUM(total_payable),0) as p')
                ->groupBy('d')->get()->keyBy('d');

            $profitData = collect();
            if ($this->hasTable('transaction_sales')) {
                $profitData = DB::table('transaction_sales')
                    ->whereBetween('sale_date', [$sStr, $eStr])
                    ->selectRaw('DATE(sale_date) as d, COALESCE(SUM(profit_realized),0) as v')
                    ->groupBy('d')->get()->keyBy('d');
            }

            $out    = [];
            $cursor = $start->copy();
            while ($cursor->lte($end)) {
                $d = $cursor->toDateString();
                $out[] = [
                    'date'             => $d,
                    'purchase_usd'     => number_format((float) ($purchaseData[$d]->v ?? 0), 2, '.', ''),
                    'purchase_payable' => number_format((float) ($purchaseData[$d]->p ?? 0), 2, '.', ''),
                    'sale_usd'         => number_format((float) ($saleData[$d]->v ?? 0), 2, '.', ''),
                    'sale_payable'     => number_format((float) ($saleData[$d]->p ?? 0), 2, '.', ''),
                    'profit_realized'  => number_format((float) ($profitData[$d]->v ?? 0), 2, '.', ''),
                ];
                $cursor->addDay();
            }

            return $out;
        } catch (Throwable $e) {
            Log::warning('dailyChart failed: ' . $e->getMessage());
            return [];
        }
    }

    /* =========================================================
     |  Monthly Chart — 3 queries total
     ========================================================= */
    protected function monthlyChart(int $months = 12): array
    {
        try {
            $start = Carbon::today()->subMonths($months - 1)->startOfMonth();
            $end   = Carbon::today()->endOfMonth();
            $sStr  = $start->toDateString();
            $eStr  = $end->toDateString();

            $purchaseData = Transaction::query()
                ->when($this->hasColumn('transactions', 'is_deleted'), fn ($q) => $q->where('is_deleted', false))
                ->where('type', 'PURCHASE')
                ->whereBetween('transaction_date', [$sStr, $eStr])
                ->selectRaw("DATE_FORMAT(transaction_date, '%Y-%m') as m, COALESCE(SUM(purchase_usd),0) as v")
                ->groupBy('m')->get()->keyBy('m');

            $saleData = Transaction::query()
                ->when($this->hasColumn('transactions', 'is_deleted'), fn ($q) => $q->where('is_deleted', false))
                ->where('type', 'SALE')
                ->whereBetween('transaction_date', [$sStr, $eStr])
                ->selectRaw("DATE_FORMAT(transaction_date, '%Y-%m') as m, COALESCE(SUM(purchase_usd),0) as v")
                ->groupBy('m')->get()->keyBy('m');

            $profitData = collect();
            if ($this->hasTable('transaction_sales')) {
                $profitData = DB::table('transaction_sales')
                    ->whereBetween('sale_date', [$sStr, $eStr])
                    ->selectRaw("DATE_FORMAT(sale_date, '%Y-%m') as m, COALESCE(SUM(profit_realized),0) as v")
                    ->groupBy('m')->get()->keyBy('m');
            }

            $out = [];
            for ($i = $months - 1; $i >= 0; $i--) {
                $date = Carbon::today()->subMonths($i);
                $key  = $date->format('Y-m');
                $out[] = [
                    'label'           => $key,
                    'purchase_usd'    => number_format((float) ($purchaseData[$key]->v ?? 0), 2, '.', ''),
                    'sale_usd'        => number_format((float) ($saleData[$key]->v ?? 0), 2, '.', ''),
                    'profit_realized' => number_format((float) ($profitData[$key]->v ?? 0), 2, '.', ''),
                ];
            }

            return $out;
        } catch (Throwable $e) {
            Log::warning('monthlyChart failed: ' . $e->getMessage());
            return [];
        }
    }

    /* =========================================================
     |  Client-wise Chart — optimized
     ========================================================= */
    protected function clientWiseChart(Carbon $from, Carbon $to): array
    {
        try {
            $fromStr = $from->toDateString();
            $toStr   = $to->toDateString();

            $purchases = Transaction::query()
                ->where('transactions.is_deleted', false)
                ->where('transactions.type', 'PURCHASE')
                ->whereBetween('transactions.transaction_date', [$fromStr, $toStr])
                ->join('clients', 'clients.id', '=', 'transactions.client_id')
                ->selectRaw('
                    clients.id AS client_id,
                    clients.name AS client_name,
                    clients.client_code,
                    COUNT(*) AS total_transactions,
                    COALESCE(SUM(transactions.purchase_usd), 0) AS total_purchase,
                    COALESCE(SUM(transactions.total_payable), 0) AS total_payable
                ')
                ->groupBy('clients.id', 'clients.name', 'clients.client_code')
                ->get();

            $sales = Transaction::query()
                ->where('transactions.is_deleted', false)
                ->where('transactions.type', 'SALE')
                ->whereBetween('transactions.transaction_date', [$fromStr, $toStr])
                ->join('clients', 'clients.id', '=', 'transactions.client_id')
                ->selectRaw('
                    clients.id AS client_id,
                    COUNT(*) AS total_transactions,
                    COALESCE(SUM(transactions.purchase_usd), 0) AS total_sale,
                    COALESCE(SUM(transactions.total_payable), 0) AS total_payable
                ')
                ->groupBy('clients.id')
                ->get()
                ->keyBy('client_id');

            $profitPerClient = collect();
            if ($this->hasTable('transaction_sales')) {
                $profitPerClient = DB::table('transaction_sales')
                    ->join('transactions', 'transactions.id', '=', 'transaction_sales.parent_transaction_id')
                    ->whereBetween('transaction_sales.sale_date', [$fromStr, $toStr])
                    ->selectRaw('transactions.client_id, COALESCE(SUM(transaction_sales.profit_realized), 0) AS total_profit')
                    ->groupBy('transactions.client_id')
                    ->get()
                    ->keyBy('client_id');
            }

            $map = [];

            foreach ($purchases as $p) {
                $map[$p->client_id] = [
                    'client_id'        => (int) $p->client_id,
                    'client_name'      => $p->client_name,
                    'client_code'      => $p->client_code,
                    'purchase_count'   => (int) $p->total_transactions,
                    'purchase_usd'     => number_format((float) $p->total_purchase, 2, '.', ''),
                    'purchase_payable' => number_format((float) $p->total_payable,  2, '.', ''),
                    'sale_count'       => 0,
                    'sale_usd'         => '0.00',
                    'sale_payable'     => '0.00',
                    'profit_realized'  => '0.00',
                ];
            }

            foreach ($sales as $clientId => $s) {
                if (! isset($map[$clientId])) {
                    $map[$clientId] = [
                        'client_id'        => (int) $clientId,
                        'client_name'      => '',
                        'client_code'      => '',
                        'purchase_count'   => 0,
                        'purchase_usd'     => '0.00',
                        'purchase_payable' => '0.00',
                        'sale_count'       => 0,
                        'sale_usd'         => '0.00',
                        'sale_payable'     => '0.00',
                        'profit_realized'  => '0.00',
                    ];
                }
                $map[$clientId]['sale_count']   = (int) $s->total_transactions;
                $map[$clientId]['sale_usd']     = number_format((float) $s->total_sale,    2, '.', '');
                $map[$clientId]['sale_payable'] = number_format((float) $s->total_payable, 2, '.', '');
            }

            foreach ($profitPerClient as $clientId => $p) {
                if (isset($map[$clientId])) {
                    $map[$clientId]['profit_realized'] = number_format((float) $p->total_profit, 2, '.', '');
                }
            }

            $result = array_values($map);
            usort($result, fn ($a, $b) => (float) $b['profit_realized'] <=> (float) $a['profit_realized']);

            return $result;
        } catch (Throwable $e) {
            Log::warning('clientWiseChart failed: ' . $e->getMessage());
            return [];
        }
    }

    /* =========================================================
     |  Helpers
     ========================================================= */
    protected function transactionRelations(): array
    {
        return [
            'client:id,client_code,name',
            'account:id,account_name,masked_number,last_four,currency',
            'creator:id,name',
            'payments',
        ];
    }

    protected function hasColumn(string $table, string $column): bool
    {
        try { return Schema::hasColumn($table, $column); } catch (Throwable $e) { return false; }
    }

    protected function hasTable(string $table): bool
    {
        try { return Schema::hasTable($table); } catch (Throwable $e) { return false; }
    }
}