<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model
{
    use HasFactory, SoftDeletes;

    const TYPE_PURCHASE = 'PURCHASE';
    const TYPE_SALE     = 'SALE';

    protected $fillable = [
        'transaction_no', 'type', 'client_id', 'account_id',
        'transaction_date', 'transaction_time',
        'amount_usd', 'purchase_usd', 'percentage', 'percentage_amount', 'total_payable',
        'sold_quantity', 'remaining_quantity', 'total_profit_realized',
        'status', 'payment_status', 'reference', 'notes', 'is_deleted', 'created_by',
    ];

    /**
     * NOTE: We intentionally do NOT cast `type` as enum.
     * Keep it as plain string to avoid object comparisons.
     */
    protected function casts(): array
    {
        return [
            'transaction_date'         => 'date',
            'transaction_time'         => 'string',
            'amount_usd'               => 'decimal:2',
            'purchase_usd'             => 'decimal:2',
            'percentage'               => 'decimal:4',
            'percentage_amount'        => 'decimal:2',
            'total_payable'            => 'decimal:2',
            'sold_quantity'            => 'decimal:2',
            'remaining_quantity'       => 'decimal:2',
            'total_profit_realized'    => 'decimal:2',
            'is_deleted'               => 'boolean',
        ];
    }

    /* ============================================================
     |  TYPE HELPERS — safe regardless of cast
     ============================================================ */

    public function typeString(): string
    {
        $t = $this->type;

        if (is_object($t) && property_exists($t, 'value')) {
            return (string) $t->value;
        }

        return strtoupper((string) $t);
    }

    public function isPurchase(): bool
    {
        return $this->typeString() === self::TYPE_PURCHASE;
    }

    public function isSale(): bool
    {
        return $this->typeString() === self::TYPE_SALE;
    }

    /* ============================================================
     |  RELATIONSHIPS
     ============================================================ */

    public function client()   { return $this->belongsTo(Client::class); }
    public function account()  { return $this->belongsTo(ClientAccount::class, 'account_id'); }
    public function creator()  { return $this->belongsTo(User::class, 'created_by'); }

    public function payments()
    {
        return $this->hasMany(TransactionPayment::class);
    }

    public function partialSales()
    {
        return $this->hasMany(TransactionSale::class, 'parent_transaction_id');
    }

    public function linkedSales()
    {
        return $this->hasMany(TransactionSale::class, 'sale_transaction_id');
    }

    /* ============================================================
     |  COMPUTED HELPERS
     ============================================================ */

    public function totalPaid(): float
    {
        return (float) $this->payments()->sum('amount_usd');
    }

    public function totalDue(): float
    {
        return max(0, (float) $this->total_payable - $this->totalPaid());
    }

    public function refreshPaymentStatus(): void
    {
        $paid    = $this->totalPaid();
        $payable = (float) $this->total_payable;

        $status = 'UNPAID';
        if ($payable > 0 && $paid >= $payable) {
            $status = 'PAID';
        } elseif ($paid > 0) {
            $status = 'PARTIAL';
        }

        $this->update(['payment_status' => $status]);
    }

    /* ============================================================
     |  NUMBER GENERATOR
     ============================================================ */

    public static function nextNumber(string $type = 'TX'): string
    {
        $prefix = $type === self::TYPE_PURCHASE
            ? 'PUR-'
            : ($type === self::TYPE_SALE ? 'SAL-' : 'TX-');

        $last = self::withTrashed()
            ->where('transaction_no', 'like', $prefix.'%')
            ->orderByDesc('id')
            ->value('transaction_no');

        $next = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;

        return $prefix.str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}