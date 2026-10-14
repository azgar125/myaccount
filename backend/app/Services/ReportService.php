<?php

namespace App\Services;

use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * Base query — non-deleted transactions.
     * Purchases and Sales both included for reporting.
     */
    protected function baseQuery()
    {
        return Transaction::query()
            ->where('transactions.is_deleted', false);
    }

    protected function scopeClient($query, ?int $clientId)
    {
        if ($clientId) {
            $query->where('transactions.client_id', $clientId);
        }
        return $query;
    }

    protected function scopeType($query, ?string $type)
    {
        if ($type) {
            $query->where('transactions.type', $type);
        }
        return $query;
    }

    /**
     * Aggregate totals for a date range.
     * Note: "total_receive" represents Purchases; "total_payment" represents Payable.
     *       "total_profit" comes from transaction_sales (realized profit).
     */
    public function totalsForRange(
        Carbon $from,
        Carbon $to,
        ?int $clientId = null,
        ?int $accountId = null,
        ?string $type = null
    ): array {
        $q = $this->baseQuery()
            ->whereBetween('transactions.transaction_date', [$from->toDateString(), $to->toDateString()]);

        $this->scopeClient($q, $clientId);
        $this->scopeType($q, $type);

        if ($accountId) $q->where('transactions.account_id', $accountId);

        $row = $q->selectRaw('
            COUNT(*) AS total_transactions,
            COALESCE(SUM(transactions.amount_usd), 0)    AS total_amount,
            COALESCE(SUM(transactions.purchase_usd), 0)  AS total_receive,
            COALESCE(SUM(transactions.total_payable), 0) AS total_payment,
            COALESCE(SUM(transactions.total_profit_realized), 0) AS total_profit
        ')->first();

        return [
            'total_transactions' => (int) $row->total_transactions,
            'total_amount'       => number_format((float) $row->total_amount,   2, '.', ''),
            'total_receive'      => number_format((float) $row->total_receive,  2, '.', ''),
            'total_payment'      => number_format((float) $row->total_payment,  2, '.', ''),
            'total_profit'       => number_format((float) $row->total_profit,   2, '.', ''),
        ];
    }

    public function daily(
        Carbon $date,
        ?int $clientId = null,
        ?int $accountId = null,
        ?string $type = null
    ): array {
        $totals = $this->totalsForRange($date, $date, $clientId, $accountId, $type);

        $rows = $this->baseQuery()
            ->with([
                'client:id,client_code,name',
                'account:id,account_name,masked_number,last_four,currency',
            ])
            ->whereDate('transactions.transaction_date', $date->toDateString());

        $this->scopeClient($rows, $clientId);
        $this->scopeType($rows, $type);
        if ($accountId) $rows->where('transactions.account_id', $accountId);

        $rows = $rows->orderByDesc('transactions.transaction_time')->get();

        // Add computed paid/due for each row
        $rows = $rows->map(function ($t) {
            $paid = (float) DB::table('transaction_payments')
                ->where('transaction_id', $t->id)
                ->sum('amount_usd');
            $t->paid_amount = number_format($paid, 2, '.', '');
            $t->due_amount  = number_format(max(0, (float) $t->total_payable - $paid), 2, '.', '');
            return $t;
        });

        return [
            'date'   => $date->toDateString(),
            'totals' => $totals,
            'rows'   => $rows,
        ];
    }

    public function weekly(
        Carbon $start,
        Carbon $end,
        ?int $clientId = null,
        ?int $accountId = null,
        ?string $type = null
    ): array {
        return [
            'start_date' => $start->toDateString(),
            'end_date'   => $end->toDateString(),
            'totals'     => $this->totalsForRange($start, $end, $clientId, $accountId, $type),
            'days'       => $this->dailyBreakdown($start, $end, $clientId, $accountId, $type),
        ];
    }

    public function monthly(
        int $year,
        int $month,
        ?int $clientId = null,
        ?int $accountId = null,
        ?string $type = null
    ): array {
        $start = Carbon::create($year, $month, 1)->startOfMonth();
        $end   = $start->copy()->endOfMonth();

        return [
            'year'       => $year,
            'month'      => $month,
            'start_date' => $start->toDateString(),
            'end_date'   => $end->toDateString(),
            'totals'     => $this->totalsForRange($start, $end, $clientId, $accountId, $type),
            'days'       => $this->dailyBreakdown($start, $end, $clientId, $accountId, $type),
        ];
    }

    /**
     * Daily breakdown.
     * total_receive = Purchases total (purchase_usd)
     * total_payment = Payable total (total_payable)
     * total_profit  = Realized profit from transaction_sales
     */
    public function dailyBreakdown(
        Carbon $start,
        Carbon $end,
        ?int $clientId = null,
        ?int $accountId = null,
        ?string $type = null
    ): array {
        // Transactions aggregated per day
        $q = $this->baseQuery()
            ->whereBetween('transactions.transaction_date', [$start->toDateString(), $end->toDateString()]);

        $this->scopeClient($q, $clientId);
        $this->scopeType($q, $type);
        if ($accountId) $q->where('transactions.account_id', $accountId);

        $rows = $q->selectRaw('
            transactions.transaction_date,
            COUNT(*) AS total_transactions,
            COALESCE(SUM(transactions.amount_usd), 0)    AS total_amount,
            COALESCE(SUM(transactions.purchase_usd), 0)  AS total_receive,
            COALESCE(SUM(transactions.total_payable), 0) AS total_payment,
            COALESCE(SUM(transactions.total_profit_realized), 0) AS total_profit
        ')
        ->groupBy('transactions.transaction_date')
        ->orderBy('transactions.transaction_date')
        ->get();

        $byDate = $rows->keyBy(fn ($r) => Carbon::parse($r->transaction_date)->toDateString());

        // Realized profit from transaction_sales per day
        $profitQuery = DB::table('transaction_sales')
            ->join('transactions', 'transactions.id', '=', 'transaction_sales.parent_transaction_id')
            ->whereBetween('transaction_sales.sale_date', [$start->toDateString(), $end->toDateString()]);

        if ($clientId) $profitQuery->where('transactions.client_id', $clientId);

        $profitByDate = $profitQuery
            ->selectRaw('transaction_sales.sale_date AS day, COALESCE(SUM(transaction_sales.profit_realized), 0) AS profit')
            ->groupBy('transaction_sales.sale_date')
            ->pluck('profit', 'day')
            ->toArray();

        $out = [];
        $cursor = $start->copy();
        while ($cursor->lte($end)) {
            $key = $cursor->toDateString();
            $row = $byDate->get($key);
            $realizedProfit = (float) ($profitByDate[$key] ?? 0);

            $out[] = [
                'date'               => $key,
                'total_transactions' => $row ? (int) $row->total_transactions : 0,
                'total_amount'       => number_format((float) ($row->total_amount   ?? 0), 2, '.', ''),
                'total_receive'      => number_format((float) ($row->total_receive  ?? 0), 2, '.', ''),
                'total_payment'      => number_format((float) ($row->total_payment  ?? 0), 2, '.', ''),
                'total_profit'       => number_format($realizedProfit, 2, '.', ''),
            ];

            $cursor->addDay();
        }

        return $out;
    }

    public function clientSummary(int $clientId): array
    {
        return [
            'client_id' => $clientId,
            'today'     => $this->totalsForRange(Carbon::today(), Carbon::today(), $clientId),
            'weekly'    => $this->totalsForRange(Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek(), $clientId),
            'monthly'   => $this->totalsForRange(Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth(), $clientId),
            'all_time'  => $this->totalsForRange(Carbon::create(2000, 1, 1), Carbon::today()->addYear(), $clientId),
        ];
    }

    public function dailyChart(int $days = 30, ?int $clientId = null): array
    {
        return $this->dailyBreakdown(Carbon::today()->subDays($days - 1), Carbon::today(), $clientId);
    }

    public function monthlyChart(int $months = 12, ?int $clientId = null): array
    {
        $out = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $start = Carbon::today()->subMonths($i)->startOfMonth();
            $end   = $start->copy()->endOfMonth();
            $totals = $this->totalsForRange($start, $end, $clientId);
            $out[] = [
                'label'         => $start->format('Y-m'),
                'total_receive' => $totals['total_receive'],
                'total_payment' => $totals['total_payment'],
                'total_profit'  => $totals['total_profit'],
            ];
        }
        return $out;
    }

    public function clientWiseChart(Carbon $from, Carbon $to): array
    {
        $rows = $this->baseQuery()
            ->whereBetween('transactions.transaction_date', [$from->toDateString(), $to->toDateString()])
            ->join('clients', 'clients.id', '=', 'transactions.client_id')
            ->selectRaw('
                clients.id   AS client_id,
                clients.name AS client_name,
                clients.client_code,
                COUNT(*)     AS total_transactions,
                COALESCE(SUM(transactions.purchase_usd), 0)  AS total_receive,
                COALESCE(SUM(transactions.total_payable), 0) AS total_payment,
                COALESCE(SUM(transactions.total_profit_realized), 0) AS total_profit
            ')
            ->groupBy('clients.id', 'clients.name', 'clients.client_code')
            ->orderByDesc('total_profit')
            ->get();

        return $rows->map(fn ($r) => [
            'client_id'          => (int) $r->client_id,
            'client_name'        => $r->client_name,
            'client_code'        => $r->client_code,
            'total_transactions' => (int) $r->total_transactions,
            'total_receive'      => number_format((float) $r->total_receive, 2, '.', ''),
            'total_payment'      => number_format((float) $r->total_payment, 2, '.', ''),
            'total_profit'       => number_format((float) $r->total_profit,  2, '.', ''),
        ])->toArray();
    }
}