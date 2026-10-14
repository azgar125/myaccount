<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = ['transaction_id', 'paid_amount', 'paid_at', 'method', 'notes', 'created_by'];

    protected function casts(): array
    {
        return [
            'paid_at'     => 'datetime',
            'paid_amount' => 'decimal:2',
        ];
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}