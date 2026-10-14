<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransactionPayment extends Model
{
    protected $table = 'transaction_payments';

    protected $fillable = [
        'transaction_id', 'direction', 'amount_usd',
        'payment_date', 'method', 'reference', 'notes', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'payment_date' => 'date',
            'amount_usd'   => 'decimal:2',
        ];
    }

    public function transaction() { return $this->belongsTo(Transaction::class); }
    public function creator()     { return $this->belongsTo(User::class, 'created_by'); }
}