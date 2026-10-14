<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Services\ReportService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ProfitController extends Controller
{
    public function __construct(private ReportService $reports) {}

    private function clientScope(Request $request): ?int
    {
        $user = $request->user();
        return $user->isClient()
            ? (int) $user->client_id
            : ($request->filled('client_id') ? (int) $request->input('client_id') : null);
    }

    /** GET /api/profit/daily */
    public function daily(Request $request)
    {
        $date = $request->filled('date') ? Carbon::parse($request->input('date')) : Carbon::today();
        $data = $this->reports->daily($date, $this->clientScope($request));

        return ApiResponse::success([
            'date'            => $date->toDateString(),
            'total_receive'   => $data['totals']['total_receive'],
            'total_payment'   => $data['totals']['total_payment'],
            'total_profit'    => $data['totals']['total_profit'],
            'transactions'    => $data['totals']['total_transactions'],
        ], 'Daily profit');
    }

    /** GET /api/profit/weekly */
    public function weekly(Request $request)
    {
        $start = $request->filled('start') ? Carbon::parse($request->input('start')) : Carbon::now()->startOfWeek();
        $end   = $request->filled('end')   ? Carbon::parse($request->input('end'))   : Carbon::now()->endOfWeek();

        $data = $this->reports->weekly($start, $end, $this->clientScope($request));

        return ApiResponse::success([
            'start_date'    => $start->toDateString(),
            'end_date'      => $end->toDateString(),
            'total_receive' => $data['totals']['total_receive'],
            'total_payment' => $data['totals']['total_payment'],
            'total_profit'  => $data['totals']['total_profit'],
            'transactions'  => $data['totals']['total_transactions'],
            'days'          => $data['days'],
        ], 'Weekly profit');
    }

    /** GET /api/profit/monthly */
    public function monthly(Request $request)
    {
        $year  = (int) ($request->input('year')  ?: now()->year);
        $month = (int) ($request->input('month') ?: now()->month);

        $data = $this->reports->monthly($year, $month, $this->clientScope($request));

        return ApiResponse::success([
            'year'          => $year,
            'month'         => $month,
            'total_receive' => $data['totals']['total_receive'],
            'total_payment' => $data['totals']['total_payment'],
            'total_profit'  => $data['totals']['total_profit'],
            'transactions'  => $data['totals']['total_transactions'],
            'days'          => $data['days'],
        ], 'Monthly profit');
    }

    /** GET /api/profit/chart/daily?days=30 */
    public function chartDaily(Request $request)
    {
        $days = (int) $request->input('days', 30);
        $days = max(1, min($days, 365));

        return ApiResponse::success(
            $this->reports->dailyChart($days, $this->clientScope($request)),
            'Daily chart'
        );
    }

    /** GET /api/profit/chart/monthly?months=12 */
    public function chartMonthly(Request $request)
    {
        $months = (int) $request->input('months', 12);
        $months = max(1, min($months, 36));

        return ApiResponse::success(
            $this->reports->monthlyChart($months, $this->clientScope($request)),
            'Monthly chart'
        );
    }
}