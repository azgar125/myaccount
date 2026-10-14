<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $paid = (float) ($this->relationLoaded('payments')
            ? $this->payments->sum('amount_usd')
            : $this->payments()->sum('amount_usd'));

        $payable = (float) $this->total_payable;
        $due     = max(0, $payable - $paid);

        // Pending profit (from remaining quantity)
        $pendingProfit = 0;
        if ($this->type === 'PURCHASE' && (float) $this->remaining_quantity > 0) {
            // Pending profit = remaining × (% avg) — we use parent's % as baseline
            $pendingProfit = 0; // will be computed when sale happens with actual %
        }

        return [
            'id'             => $this->id,
            'transaction_no' => $this->transaction_no,
            'type'           => $this->type,

            'client'  => $this->whenLoaded('client', fn () => [
                'id'          => $this->client->id,
                'client_code' => $this->client->client_code,
                'name'        => $this->client->name,
            ]),
            'account' => $this->whenLoaded('account', fn () => $this->account ? [
                'id'            => $this->account->id,
                'account_name'  => $this->account->account_name,
                'masked_number' => $this->account->masked_number,
                'last_four'     => $this->account->last_four,
                'currency'      => $this->account->currency,
            ] : null),
            'creator' => $this->whenLoaded('creator', fn () => [
                'id'   => $this->creator->id,
                'name' => $this->creator->name,
            ]),

            'transaction_date' => $this->transaction_date?->format('Y-m-d'),
            'transaction_time' => $this->transaction_time,

            'amount_usd'        => (string) $this->amount_usd,
            'purchase_usd'      => (string) $this->purchase_usd,
            'percentage'        => (string) $this->percentage,
            'percentage_amount' => (string) $this->percentage_amount,
            'total_payable'     => (string) $this->total_payable,

            'sold_quantity'         => (string) $this->sold_quantity,
            'remaining_quantity'    => (string) $this->remaining_quantity,
            'total_profit_realized' => (string) $this->total_profit_realized,
            'pending_profit'        => (string) number_format($pendingProfit, 2, '.', ''),

            'paid_amount'    => (string) number_format($paid, 2, '.', ''),
            'due_amount'     => (string) number_format($due, 2, '.', ''),

            'status'         => $this->status,
            'payment_status' => $this->payment_status,
            'reference'      => $this->reference,
            'notes'          => $this->notes,
            'is_deleted'     => (bool) $this->is_deleted,

            'payments'      => $this->whenLoaded('payments', fn () => $this->payments->map(fn ($p) => [
                'id'           => $p->id,
                'direction'    => $p->direction,
                'amount_usd'   => (string) $p->amount_usd,
                'payment_date' => $p->payment_date?->format('Y-m-d'),
                'method'       => $p->method,
                'reference'    => $p->reference,
                'notes'        => $p->notes,
                'created_at'   => $p->created_at?->toDateTimeString(),
            ])),

            'partial_sales' => $this->whenLoaded('partialSales', fn () => $this->partialSales->map(fn ($s) => [
                'id'               => $s->id,
                'sale_date'        => $s->sale_date?->format('Y-m-d'),
                'sold_quantity'    => (string) $s->sold_quantity,
                'sale_percentage'  => (string) $s->sale_percentage,
                'sale_amount'      => (string) $s->sale_amount,
                'cost_of_goods'    => (string) $s->cost_of_goods,
                'profit_realized'  => (string) $s->profit_realized,
                'notes'            => $s->notes,
            ])),

            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}