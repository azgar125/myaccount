<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ClientDashboardController extends Controller
{
    public function index()
    {
        $user = request()->user();
        $clientId = (int) $user->client_id;

        if (! $clientId) {
            return ApiResponse::error('No client linked.', [], 403);
        }

        $today      = Carbon::today();
        $weekStart  = Carbon::now()->startOfWeek();
        $weekEnd    = Carbon::now()->endOfWeek();
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd   = Carbon::now()->endOfMonth();

        $todayData   = $this->periodSummary($clientId, $today, $today);
        $weekData    = $this->periodSummary($clientId, $weekStart, $weekEnd);
        $monthData   = $this->periodSummary($clientId, $monthStart, $monthEnd);

        $recent = Transaction::query()
            ->with(['account:id,account_name,masked_number,last_four,currency'])
            ->where('client_id', $clientId)
            ->where('is_deleted', false)
            ->orderByDesc('transaction_date')
            ->orderByDesc('id')
            ->limit(10)
            ->get();

        return ApiResponse::success([
            'today'   => $todayData,
            'weekly'  => $weekData,
            'monthly' => $monthData,
            'recent_transactions' => TransactionResource::collection($recent),
        ], 'Client dashboard');
    }

    protected function periodSummary(int $clientId, Carbon $from, Carbon $to): array
    {
        $purchases = Transaction::query()
            ->where('client_id', $clientId)
            ->where('is_deleted', false)
            ->where('type', 'PURCHASE')
            ->whereBetween('transaction_date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('
                COUNT(*) AS cnt,
                COALESCE(SUM(purchase_usd), 0) AS purchase,
                COALESCE(SUM(total_payable), 0) AS payable
            ')
            ->first();

        $sales = Transaction::query()
            ->where('client_id', $clientId)
            ->where('is_deleted', false)
            ->where('type', 'SALE')
            ->whereBetween('transaction_date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('
                COUNT(*) AS cnt,
                COALESCE(SUM(purchase_usd), 0) AS sale,
                COALESCE(SUM(total_payable), 0) AS payable
            ')
            ->first();

        // Realized profit (client as seller — partial sales under their purchases)
        $realizedRow = DB::table('transaction_sales')
            ->join('transactions', 'transactions.id', '=', 'transaction_sales.parent_transaction_id')
            ->where('transactions.client_id', $clientId)
            ->whereBetween('transaction_sales.sale_date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('COALESCE(SUM(transaction_sales.profit_realized), 0) AS realized')
            ->first();

        $realized = (float) $realizedRow->realized;

        // Pending profit — remaining_quantity on client's purchases × estimated rate
        $rem = Transaction::query()
            ->where('client_id', $clientId)
            ->where('is_deleted', false)
            ->where('type', 'PURCHASE')
            ->selectRaw('COALESCE(SUM(remaining_quantity), 0) AS remaining')
            ->first();

        $remaining = (float) $rem->remaining;
        $pending = 0; // Simple: no profit estimate until sale

        return [
            'purchase_amount' => number_format((float) $purchases->purchase, 2, '.', ''),
            'purchase_count'  => (int) $purchases->cnt,
            'sale_amount'     => number_format((float) $sales->sale, 2, '.', ''),
            'sale_count'      => (int) $sales->cnt,
            'profit_realized' => number_format($realized, 2, '.', ''),
            'profit_pending'  => number_format($pending,  2, '.', ''),
            'due_amount'      => '0.00',
        ];
    }
}