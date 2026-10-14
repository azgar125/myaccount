<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use App\Services\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;

class StatementController extends Controller
{
    public function __construct(private ReportService $reports) {}

    /** GET /api/statements?from=&to= — paginated statement lines */
    public function index(Request $request)
    {
        $user = $request->user();

        $from = $request->filled('from')
            ? Carbon::parse($request->input('from'))
            : Carbon::now()->startOfMonth();

        $to = $request->filled('to')
            ? Carbon::parse($request->input('to'))
            : Carbon::now();

        $perPage = (int) $request->input('per_page', 25);
        $perPage = in_array($perPage, [10,25,50,100], true) ? $perPage : 25;

        $q = Transaction::query()
            ->with(['client:id,client_code,name', 'account:id,account_name,masked_number,last_four,currency'])
            ->where('is_deleted', false)
            ->whereBetween('transaction_date', [$from->toDateString(), $to->toDateString()])
            ->orderByDesc('transaction_date')
            ->orderByDesc('transaction_time');

        // Force own scope for CLIENT role
        if ($user->isClient()) {
            $q->where('client_id', $user->client_id);
        } elseif ($request->filled('client_id')) {
            $q->where('client_id', $request->integer('client_id'));
        }

        $paginator = $q->paginate($perPage);

        $totals = $this->reports->totalsForRange(
            $from,
            $to,
            $user->isClient() ? (int) $user->client_id : ($request->integer('client_id') ?: null)
        );

        return ApiResponse::success([
            'from'   => $from->toDateString(),
            'to'     => $to->toDateString(),
            'totals' => $totals,
            'items'  => TransactionResource::collection($paginator->items()),
            'meta'   => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
        ], 'Statement');
    }

    /** GET /api/statements/download?from=&to= — PDF */
    public function download(Request $request)
    {
        $user = $request->user();

        $from = $request->filled('from')
            ? Carbon::parse($request->input('from'))
            : Carbon::now()->startOfMonth();

        $to = $request->filled('to')
            ? Carbon::parse($request->input('to'))
            : Carbon::now();

        $clientId = $user->isClient() ? (int) $user->client_id : ($request->integer('client_id') ?: null);

        $q = Transaction::query()
            ->with(['client:id,client_code,name', 'account:id,account_name,masked_number,last_four,currency'])
            ->where('is_deleted', false)
            ->whereBetween('transaction_date', [$from->toDateString(), $to->toDateString()])
            ->orderBy('transaction_date')
            ->orderBy('transaction_time');

        if ($clientId) $q->where('client_id', $clientId);

        $rows = $q->get();

        $totals = $this->reports->totalsForRange($from, $to, $clientId);

        $clientName = $clientId ? optional(\App\Models\Client::find($clientId))->name : null;

        $pdf = Pdf::loadView('reports.pdf', [
            'system_name'  => config('accounting.system_name'),
            'report_type'  => 'Client Statement',
            'range'        => $from->toDateString().' → '.$to->toDateString(),
            'client_name'  => $clientName,
            'currency'     => config('accounting.currency'),
            'totals'       => $totals,
            'rows'         => $rows,
            'columns'      => ['transaction_no','client','account','amount','receive_amount','payment_amount','profit','status'],
            'generated_at' => now()->toDateTimeString(),
        ]);

        return $pdf->download('statement-'.$from->format('Ymd').'-'.$to->format('Ymd').'.pdf');
    }
}