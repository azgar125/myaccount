<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Receipt extends Model
{
    protected $fillable = ['transaction_id', 'received_amount', 'received_at', 'method', 'notes', 'created_by'];

    protected function casts(): array
    {
        return [
            'received_at'     => 'datetime',
            'received_amount' => 'decimal:2',
        ];
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}