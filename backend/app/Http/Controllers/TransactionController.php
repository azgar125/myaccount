<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Resources\TransactionResource;
use App\Models\Client;
use App\Models\ClientAccount;
use App\Models\Transaction;
use App\Models\TransactionPayment;
use App\Models\TransactionSale;
use App\Services\AuditService;
use App\Services\CalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TransactionController extends Controller
{
    public function __construct(
        private CalculationService $calc,
        private AuditService $audit
    ) {}

    /* ============================================================
     |  LIST
     ============================================================ */
    public function index(Request $request)
    {
        $user = $request->user();
        $perPage = (int) $request->input('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;

        $q = Transaction::query()
            ->with([
                'client:id,client_code,name',
                'account:id,account_name,masked_number,last_four,currency',
                'creator:id,name',
            ])
            ->where('is_deleted', false);

        if ($user->isClient()) {
            $q->where('client_id', $user->client_id);
        } elseif ($request->filled('client_id')) {
            $q->where('client_id', $request->integer('client_id'));
        }

        if ($request->filled('type'))       $q->where('type', $request->input('type'));
        if ($request->filled('status'))     $q->where('status', $request->input('status'));
        if ($request->filled('account_id')) $q->where('account_id', $request->integer('account_id'));
        if ($request->filled('date_from'))  $q->whereDate('transaction_date', '>=', $request->input('date_from'));
        if ($request->filled('date_to'))    $q->whereDate('transaction_date', '<=', $request->input('date_to'));

        if ($request->filled('search')) {
            $s = trim($request->input('search'));
            $q->where(function ($w) use ($s) {
                $w->where('transaction_no', 'like', "%{$s}%")
                  ->orWhere('reference', 'like', "%{$s}%")
                  ->orWhereHas('client', fn ($c) => $c->where('name', 'like', "%{$s}%")
                                                        ->orWhere('client_code', 'like', "%{$s}%"));
            });
        }

        $q->orderByDesc('transaction_date')->orderByDesc('id');

        $paginator = $q->paginate($perPage);

        return ApiResponse::success([
            'items' => TransactionResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
        ], 'Transactions');
    }

    /* ============================================================
     |  STORE — Purchase or Sale
     ============================================================ */
    public function store(Request $request)
    {
        $data = $request->validate([
            'type'              => ['required', Rule::in(['PURCHASE', 'SALE'])],
            'client_id'         => ['required', 'exists:clients,id'],
            'account_id'        => ['nullable', 'exists:client_accounts,id'],
            'transaction_date'  => ['required', 'date'],
            'transaction_time'  => ['required', 'date_format:H:i'],
            'amount_usd'        => ['required', 'numeric', 'min:0'],
            'purchase_usd'      => ['required', 'numeric', 'min:0'],
            'percentage'        => ['required', 'numeric', 'min:0', 'max:100'],
            'reference'         => ['nullable', 'string', 'max:120'],
            'notes'             => ['nullable', 'string'],
        ]);

        if (! empty($data['account_id'])) {
            abort_unless(
                ClientAccount::where('id', $data['account_id'])
                    ->where('client_id', $data['client_id'])
                    ->exists(),
                422,
                'Account does not belong to this client.'
            );
        }

        $computed = $this->calc->calculateTransaction([
            'amount_usd'   => $data['amount_usd'],
            'purchase_usd' => $data['purchase_usd'],
            'percentage'   => $data['percentage'],
        ]);

        return DB::transaction(function () use ($data, $computed, $request) {
            $tx = Transaction::create([
                'transaction_no'        => Transaction::nextNumber($data['type']),
                'type'                  => $data['type'],
                'client_id'             => $data['client_id'],
                'account_id'            => $data['account_id'] ?? null,
                'transaction_date'      => $data['transaction_date'],
                'transaction_time'      => $data['transaction_time'],
                'amount_usd'            => $computed['amount_usd'],
                'purchase_usd'          => $computed['purchase_usd'],
                'percentage'            => $computed['percentage'],
                'percentage_amount'     => $computed['percentage_amount'],
                'total_payable'         => $computed['total_payable'],
                'sold_quantity'         => 0,
                'remaining_quantity'    => $data['type'] === 'PURCHASE' ? $computed['purchase_usd'] : 0,
                'total_profit_realized' => 0,
                'status'                => $data['type'] === 'PURCHASE' ? 'OPEN' : 'CLOSED',
                'payment_status'        => 'UNPAID',
                'reference'             => $data['reference'] ?? null,
                'notes'                 => $data['notes'] ?? null,
                'created_by'            => $request->user()->id,
            ]);

            $this->audit->log('CREATE', 'TRANSACTION', $tx->id, null, $tx->toArray(), $request);

            return ApiResponse::success(
                new TransactionResource($tx->load(['client', 'account', 'creator'])),
                ucfirst(strtolower($data['type'])) . ' created',
                201
            );
        });
    }

    /* ============================================================
     |  SHOW
     ============================================================ */
    public function show(Request $request, Transaction $transaction)
    {
        $user = $request->user();
        if ($user->isClient() && (int) $transaction->client_id !== (int) $user->client_id) {
            return ApiResponse::error('Forbidden', [], 403);
        }

        $transaction->load([
            'client', 'account', 'creator',
            'payments.creator',
            'partialSales',
        ]);

        return ApiResponse::success(new TransactionResource($transaction), 'Transaction');
    }

    /* ============================================================
     |  ADD PARTIAL SALE (against a Purchase)
     ============================================================ */
    public function addPartialSale(Request $request, $transaction)
    {
        // 🔑 Manual find — deterministic, no binding issues
        $parent = $transaction instanceof Transaction
            ? $transaction
            : Transaction::findOrFail($transaction);

        if (! $parent->isPurchase()) {
            return ApiResponse::error(
                'Only Purchase transactions can have partial sales. (Type: "'
                    . $parent->typeString() . '", No: ' . $parent->transaction_no . ')',
                [],
                422
            );
        }

        $data = $request->validate([
            'sold_quantity'       => ['required', 'numeric', 'min:0.01'],
            'sale_percentage'     => ['required', 'numeric', 'min:0', 'max:100'],
            'sale_date'           => ['required', 'date'],
            'sale_transaction_id' => ['nullable', 'exists:transactions,id'],
            'notes'               => ['nullable', 'string'],
        ]);

        if ($data['sold_quantity'] > (float) $parent->remaining_quantity) {
            return ApiResponse::error(
                "Sold quantity exceeds remaining ({$parent->remaining_quantity} USD).",
                [],
                422
            );
        }

        return DB::transaction(function () use ($parent, $data, $request) {
            $computed = $this->calc->calculatePartialSaleProfit([
                'sold_quantity'         => $data['sold_quantity'],
                'purchase_purchase_usd' => $parent->purchase_usd,
                'purchase_percentage'   => $parent->percentage,
                'sale_percentage'       => $data['sale_percentage'],
            ]);

            $sale = TransactionSale::create([
                'parent_transaction_id' => $parent->id,
                'sale_transaction_id'   => $data['sale_transaction_id'] ?? null,
                'sale_date'             => $data['sale_date'],
                'sold_quantity'         => $computed['sold_quantity'],
                'sale_percentage'       => $computed['sale_percentage'],
                'sale_amount'           => $computed['sale_amount'],
                'purchase_rate'         => $parent->purchase_usd,
                'purchase_percentage'   => $parent->percentage,
                'cost_of_goods'         => $computed['cost_of_goods'],
                'profit_realized'       => $computed['profit_realized'],
                'notes'                 => $data['notes'] ?? null,
                'created_by'            => $request->user()->id,
            ]);

            $newSold      = (float) $parent->sold_quantity + $computed['sold_quantity'];
            $newRemaining = max(0, (float) $parent->purchase_usd - $newSold);
            $newProfit    = (float) $parent->total_profit_realized + $computed['profit_realized'];

            $parent->update([
                'sold_quantity'         => $newSold,
                'remaining_quantity'    => $newRemaining,
                'total_profit_realized' => $newProfit,
                'status'                => $newRemaining <= 0 ? 'CLOSED' : 'PARTIAL',
            ]);

            $this->audit->log('CREATE', 'PARTIAL_SALE', $sale->id, null, $sale->toArray(), $request);

            return ApiResponse::success([
                'sale'   => $sale,
                'parent' => new TransactionResource(
                    $parent->fresh()->load(['client', 'account', 'creator', 'partialSales'])
                ),
            ], 'Partial sale added', 201);
        });
    }

    /* ============================================================
     |  ADD PAYMENT  (with overpayment guard)
     ============================================================ */
    public function addPayment(Request $request, $transaction)
    {
        // 🔑 Manual find — consistent with addPartialSale
        $transaction = $transaction instanceof Transaction
            ? $transaction
            : Transaction::findOrFail($transaction);

        $data = $request->validate([
            'amount_usd'   => ['required', 'numeric', 'min:0.01'],
            'payment_date' => ['required', 'date'],
            'method'       => ['nullable', 'string', 'max:60'],
            'reference'    => ['nullable', 'string', 'max:120'],
            'notes'        => ['nullable', 'string'],
        ]);

        // Block deleted
        if ($transaction->is_deleted) {
            return ApiResponse::error('Cannot pay a deleted transaction.', [], 422);
        }

        // 🔑 Current due (rounded)
        $payable   = round((float) $transaction->total_payable, 2);
        $paidSoFar = round((float) $transaction->totalPaid(), 2);
        $dueAmount = round(max(0, $payable - $paidSoFar), 2);

        if ($dueAmount <= 0) {
            return ApiResponse::error('This transaction is already fully paid.', [], 422);
        }

        // 🔴 Block overpayment
        $requested = round((float) $data['amount_usd'], 2);
        if ($requested > $dueAmount) {
            return ApiResponse::error(
                'Amount cannot exceed the due amount (Due: '
                    . number_format($dueAmount, 2) . ' USD).',
                [],
                422
            );
        }

        $direction = $transaction->type === 'PURCHASE' ? 'PAYMENT_OUT' : 'RECEIPT_IN';

        return DB::transaction(function () use ($transaction, $data, $direction, $request) {
            $payment = TransactionPayment::create([
                'transaction_id' => $transaction->id,
                'direction'      => $direction,
                'amount_usd'     => $data['amount_usd'],
                'payment_date'   => $data['payment_date'],
                'method'         => $data['method'] ?? null,
                'reference'      => $data['reference'] ?? null,
                'notes'          => $data['notes'] ?? null,
                'created_by'     => $request->user()->id,
            ]);

            $transaction->refreshPaymentStatus();

            $this->audit->log('CREATE', 'PAYMENT', $payment->id, null, $payment->toArray(), $request);

            return ApiResponse::success([
                'payment'     => $payment,
                'transaction' => new TransactionResource(
                    $transaction->fresh()->load(['client', 'account', 'payments', 'partialSales'])
                ),
            ], 'Payment recorded', 201);
        });
    }

    /* ============================================================
     |  DELETE  (with proper rollback + child cleanup)
     ============================================================ */
    public function destroy(Request $request, Transaction $transaction)
    {
        return DB::transaction(function () use ($transaction, $request) {
            $old = $transaction->toArray();

            // 🔑 If this is a PURCHASE, also remove its partial sales
            if ($transaction->isPurchase()) {
                $transaction->update([
                    'sold_quantity'         => 0,
                    'remaining_quantity'    => $transaction->purchase_usd,
                    'total_profit_realized' => 0,
                ]);

                // Delete all child partial-sale records
                $transaction->partialSales()->delete();
            }

            // Detach any partial-sale referencing this as sale_transaction_id
            TransactionSale::where('sale_transaction_id', $transaction->id)->delete();

            // Soft-delete the transaction itself
            $transaction->update(['is_deleted' => true]);
            $transaction->delete();

            $this->audit->log('DELETE', 'TRANSACTION', $transaction->id, $old, null, $request);

            return ApiResponse::success(null, 'Transaction deleted');
        });
    }
}