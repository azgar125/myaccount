<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Resources\ClientAccountResource;
use App\Models\Client;
use App\Models\ClientAccount;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ClientAccountController extends Controller
{
    public function __construct(private AuditService $audit) {}

    /**
     * GET /api/accounts
     * Filters: client_id, status, search (last4, account_name)
     */
    public function index(Request $request)
    {
        $perPage = (int) $request->input('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;

        $q = ClientAccount::query()->with(['client:id,client_code,name']);

        if ($request->filled('client_id')) {
            $q->where('client_id', $request->integer('client_id'));
        }

        if ($request->filled('status')) {
            $q->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $s = trim((string) $request->input('search'));
            $q->where(function ($w) use ($s) {
                $w->where('account_name', 'like', "%{$s}%")
                  ->orWhere('provider_name', 'like', "%{$s}%")
                  ->orWhere('last_four', 'like', "%{$s}%")
                  ->orWhere('masked_number', 'like', "%{$s}%");
            });
        }

        $paginator = $q->orderByDesc('id')->paginate($perPage);

        return ApiResponse::success([
            'items' => ClientAccountResource::collection($paginator->items()),
            'meta'  => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
        ], 'Accounts');
    }

    /**
     * POST /api/accounts
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'client_id'     => ['required', 'exists:clients,id'],
            'account_type'  => ['nullable', 'string', 'max:40'],
            'account_name'  => ['required', 'string', 'max:120'],
            'provider_name' => ['nullable', 'string', 'max:120'],
            'card_number'   => ['nullable', 'string', 'min:4', 'max:32'],
            'currency'      => ['nullable', 'string', 'size:3'],
            'status'        => ['nullable', Rule::in(['ACTIVE', 'INACTIVE', 'BLOCKED'])],
            'notes'         => ['nullable', 'string'],
        ]);

        return DB::transaction(function () use ($data, $request) {
            $cardNumber = $data['card_number'] ?? null;
            $lastFour   = $cardNumber ? substr(preg_replace('/\D/', '', $cardNumber), -4) : '0000';

            $data['account_type']   = $data['account_type'] ?? 'CARD';
            $data['currency']       = $data['currency'] ?? 'USD';
            $data['status']         = $data['status'] ?? 'ACTIVE';
            $data['last_four']      = $lastFour;
            $data['masked_number']  = $this->maskCard($cardNumber, $lastFour);
            $data['card_number']    = $cardNumber; // encrypted via cast

            $account = ClientAccount::create($data);

            $this->audit->log('CREATE', 'ACCOUNT', $account->id, null, $account->toArray(), $request);

            return ApiResponse::success(
                new ClientAccountResource($account->load('client')),
                'Account created',
                201
            );
        });
    }

    /**
     * GET /api/accounts/{id}
     */
    public function show(ClientAccount $account)
    {
        $account->load(['client:id,client_code,name']);

        return ApiResponse::success(new ClientAccountResource($account), 'Account');
    }

    /**
     * PUT /api/accounts/{id}
     */
    public function update(Request $request, ClientAccount $account)
    {
        $data = $request->validate([
            'account_type'  => ['sometimes', 'string', 'max:40'],
            'account_name'  => ['sometimes', 'string', 'max:120'],
            'provider_name' => ['nullable', 'string', 'max:120'],
            'card_number'   => ['nullable', 'string', 'min:4', 'max:32'],
            'currency'      => ['sometimes', 'string', 'size:3'],
            'status'        => ['sometimes', Rule::in(['ACTIVE', 'INACTIVE', 'BLOCKED'])],
            'notes'         => ['nullable', 'string'],
        ]);

        return DB::transaction(function () use ($account, $data, $request) {
            $old = $account->toArray();

            if (! empty($data['card_number'])) {
                $lastFour = substr(preg_replace('/\D/', '', $data['card_number']), -4);
                $data['last_four']     = $lastFour;
                $data['masked_number'] = $this->maskCard($data['card_number'], $lastFour);
            }

            $account->update($data);

            $this->audit->log('UPDATE', 'ACCOUNT', $account->id, $old, $account->fresh()->toArray(), $request);

            return ApiResponse::success(
                new ClientAccountResource($account->fresh()->load('client')),
                'Account updated'
            );
        });
    }

    /**
     * DELETE /api/accounts/{id}
     */
    public function destroy(Request $request, ClientAccount $account)
    {
        return DB::transaction(function () use ($account, $request) {
            $old = $account->toArray();

            // Prevent deletion if transactions exist
            if ($account->transactions()->exists()) {
                return ApiResponse::error('Cannot delete account with existing transactions. Deactivate instead.', [], 422);
            }

            $account->delete();

            $this->audit->log('DELETE', 'ACCOUNT', $account->id, $old, null, $request);

            return ApiResponse::success(null, 'Account deleted');
        });
    }

    /**
     * Mask a card number based on config.
     */
    private function maskCard(?string $cardNumber, string $lastFour): string
    {
        if (! $cardNumber) {
            return '**** **** **** '.$lastFour;
        }

        $mode = config('accounting.card_masking.mode', 'last_four_only');

        if ($mode === 'first4_last4') {
            $digits = preg_replace('/\D/', '', $cardNumber);
            $first4 = substr($digits, 0, 4);
            return $first4.' **** **** '.$lastFour;
        }

        return '**** **** **** '.$lastFour;
    }
}