<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Resources\ClientAccountResource;
use App\Http\Resources\ClientResource;
use App\Http\Resources\TransactionResource;
use App\Models\Client;
use App\Models\ClientAccount;
use App\Models\Transaction;
use App\Services\ReportService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ClientPortalController extends Controller
{
    public function __construct(private ReportService $reports) {}

    /** Force the logged-in client's own id */
    private function ownClientId(Request $request): ?int
    {
        $user = $request->user();
        return $user->isClient() ? (int) $user->client_id : null;
    }

    /** GET /api/client/profile */
    public function profile(Request $request)
    {
        $clientId = $this->ownClientId($request);
        if (! $clientId) return ApiResponse::error('No client linked.', [], 403);

        $client = Client::with('accounts')->findOrFail($clientId);

        return ApiResponse::success([
            'client'   => new ClientResource($client),
            'accounts' => ClientAccountResource::collection($client->accounts),
        ], 'Profile');
    }

    /** GET /api/client/accounts */
    public function accounts(Request $request)
    {
        $clientId = $this->ownClientId($request);
        if (! $clientId) return ApiResponse::error('No client linked.', [], 403);

        $perPage = (int) $request->input('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;

        $q = ClientAccount::query()
            ->where('client_id', $clientId)
            ->orderByDesc('id');

        if ($request->filled('status')) {
            $q->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $s = trim((string) $request->input('search'));
            $q->where(function ($w) use ($s) {
                $w->where('account_name', 'like', "%{$s}%")
                  ->orWhere('provider_name', 'like', "%{$s}%")
                  ->orWhere('last_four', 'like', "%{$s}%");
            });
        }

        $paginator = $q->paginate($perPage);

        return ApiResponse::success([
            'items' => ClientAccountResource::collection($paginator->items()),
            'meta'  => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
        ], 'My accounts');
    }

    /** GET /api/client/transactions */
    public function transactions(Request $request)
    {
        $clientId = $this->ownClientId($request);
        if (! $clientId) return ApiResponse::error('No client linked.', [], 403);

        $perPage = (int) $request->input('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;

        $q = Transaction::query()
            ->with(['account:id,account_name,masked_number,last_four,currency'])
            ->where('client_id', $clientId)
            ->where('is_deleted', false);

        if ($request->filled('account_id')) {
            $q->where('account_id', $request->integer('account_id'));
        }
        if ($request->filled('type')) {
            $q->where('transaction_type', $request->input('type'));
        }
        if ($request->filled('status')) {
            $q->where('status', $request->input('status'));
        }
        if ($request->filled('date_from')) {
            $q->whereDate('transaction_date', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $q->whereDate('transaction_date', '<=', $request->input('date_to'));
        }
        if ($request->filled('search')) {
            $s = trim((string) $request->input('search'));
            $q->where(function ($w) use ($s) {
                $w->where('transaction_no', 'like', "%{$s}%")
                  ->orWhere('reference', 'like', "%{$s}%");
            });
        }

        $q->orderByDesc('transaction_date')->orderByDesc('transaction_time');

        $paginator = $q->paginate($perPage);

        return ApiResponse::success([
            'items' => TransactionResource::collection($paginator->items()),
            'meta'  => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
        ], 'My transactions');
    }

    /** GET /api/client/reports?from=&to= */
    public function reports(Request $request)
    {
        $clientId = $this->ownClientId($request);
        if (! $clientId) return ApiResponse::error('No client linked.', [], 403);

        $from = $request->filled('from') ? Carbon::parse($request->input('from')) : Carbon::now()->startOfMonth();
        $to   = $request->filled('to')   ? Carbon::parse($request->input('to'))   : Carbon::now();

        $totals    = $this->reports->totalsForRange($from, $to, $clientId);
        $breakdown = $this->reports->dailyBreakdown($from, $to, $clientId);

        return ApiResponse::success([
            'from'   => $from->toDateString(),
            'to'     => $to->toDateString(),
            'totals' => $totals,
            'days'   => $breakdown,
            'summary' => [
                'today'   => $this->reports->totalsForRange(Carbon::today(), Carbon::today(), $clientId),
                'weekly'  => $this->reports->totalsForRange(Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek(), $clientId),
                'monthly' => $this->reports->totalsForRange(Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth(), $clientId),
            ],
        ], 'My reports');
    }

    /** GET /api/client/statements?from=&to= */
    public function statements(Request $request)
    {
        $clientId = $this->ownClientId($request);
        if (! $clientId) return ApiResponse::error('No client linked.', [], 403);

        $from = $request->filled('from') ? Carbon::parse($request->input('from')) : Carbon::now()->startOfMonth();
        $to   = $request->filled('to')   ? Carbon::parse($request->input('to'))   : Carbon::now();

        $q = Transaction::query()
            ->with(['account:id,account_name,masked_number,last_four,currency'])
            ->where('client_id', $clientId)
            ->where('is_deleted', false)
            ->whereBetween('transaction_date', [$from->toDateString(), $to->toDateString()])
            ->orderBy('transaction_date')
            ->orderBy('transaction_time');

        $rows = $q->get();

        $totals = $this->reports->totalsForRange($from, $to, $clientId);

        return ApiResponse::success([
            'from'   => $from->toDateString(),
            'to'     => $to->toDateString(),
            'totals' => $totals,
            'rows'   => TransactionResource::collection($rows),
        ], 'My statement');
    }
}