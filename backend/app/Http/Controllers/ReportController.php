<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\Client;
use App\Services\ReportService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private ReportService $reports) {}

    /* -------------------------------------------------
     |  Access helpers
     ------------------------------------------------- */

    private function clientScope(Request $request): ?int
    {
        $user = $request->user();

        if ($user->isClient()) {
            return (int) $user->client_id; // force own client_id
        }

        return $request->filled('client_id') ? (int) $request->input('client_id') : null;
    }

    /* -------------------------------------------------
     |  GET /api/reports/daily?date=YYYY-MM-DD
     ------------------------------------------------- */

    public function daily(Request $request)
    {
        $request->validate([
            'date'       => ['nullable', 'date'],
            'account_id' => ['nullable', 'integer'],
            'type'       => ['nullable', 'in:RECEIVE,PAYMENT,TRANSFER,ADJUSTMENT'],
        ]);

        $date = $request->filled('date')
            ? Carbon::parse($request->input('date'))
            : Carbon::today();

        $data = $this->reports->daily(
            $date,
            $this->clientScope($request),
            $request->integer('account_id') ?: null,
            $request->input('type')
        );

        return ApiResponse::success($data, 'Daily report');
    }

    /* -------------------------------------------------
     |  GET /api/reports/weekly?start=YYYY-MM-DD&end=YYYY-MM-DD
     ------------------------------------------------- */

    public function weekly(Request $request)
    {
        $request->validate([
            'start'      => ['nullable', 'date'],
            'end'        => ['nullable', 'date', 'after_or_equal:start'],
            'account_id' => ['nullable', 'integer'],
            'type'       => ['nullable', 'in:RECEIVE,PAYMENT,TRANSFER,ADJUSTMENT'],
        ]);

        $start = $request->filled('start')
            ? Carbon::parse($request->input('start'))->startOfDay()
            : Carbon::now()->startOfWeek();

        $end = $request->filled('end')
            ? Carbon::parse($request->input('end'))->endOfDay()
            : Carbon::now()->endOfWeek();

        $data = $this->reports->weekly(
            $start,
            $end,
            $this->clientScope($request),
            $request->integer('account_id') ?: null,
            $request->input('type')
        );

        return ApiResponse::success($data, 'Weekly report');
    }

    /* -------------------------------------------------
     |  GET /api/reports/monthly?year=YYYY&month=MM
     ------------------------------------------------- */

    public function monthly(Request $request)
    {
        $request->validate([
            'year'       => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'month'      => ['nullable', 'integer', 'min:1', 'max:12'],
            'account_id' => ['nullable', 'integer'],
            'type'       => ['nullable', 'in:RECEIVE,PAYMENT,TRANSFER,ADJUSTMENT'],
        ]);

        $year  = (int) ($request->input('year')  ?: now()->year);
        $month = (int) ($request->input('month') ?: now()->month);

        $data = $this->reports->monthly(
            $year,
            $month,
            $this->clientScope($request),
            $request->integer('account_id') ?: null,
            $request->input('type')
        );

        return ApiResponse::success($data, 'Monthly report');
    }

    /* -------------------------------------------------
     |  GET /api/reports/client/{client}   (Admin only)
     ------------------------------------------------- */

    public function client(Request $request, int $clientId)
    {
        $client = Client::findOrFail($clientId);

        $summary = $this->reports->clientSummary($clientId);

        $recent = \App\Models\Transaction::query()
            ->where('client_id', $clientId)
            ->where('is_deleted', false)
            ->with(['account:id,account_name,masked_number,last_four,currency'])
            ->orderByDesc('transaction_date')
            ->orderByDesc('transaction_time')
            ->limit(50)
            ->get();

        return ApiResponse::success([
            'client'  => [
                'id'          => $client->id,
                'client_code' => $client->client_code,
                'name'        => $client->name,
                'status'      => $client->status,
            ],
            'summary' => $summary,
            'recent'  => $recent,
        ], 'Client report');
    }
}