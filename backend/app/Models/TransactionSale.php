<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransactionSale extends Model
{
    protected $table = 'transaction_sales';

    protected $fillable = [
        'parent_transaction_id', 'sale_transaction_id',
        'sale_date', 'sold_quantity', 'sale_percentage', 'sale_amount',
        'purchase_rate', 'purchase_percentage', 'cost_of_goods',
        'profit_realized', 'notes', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'sale_date'          => 'date',
            'sold_quantity'      => 'decimal:2',
            'sale_percentage'    => 'decimal:4',
            'sale_amount'        => 'decimal:2',
            'purchase_rate'      => 'decimal:2',
            'purchase_percentage'=> 'decimal:4',
            'cost_of_goods'      => 'decimal:2',
            'profit_realized'    => 'decimal:2',
        ];
    }

    public function parent() { return $this->belongsTo(Transaction::class, 'parent_transaction_id'); }
    public function sale()   { return $this->belongsTo(Transaction::class, 'sale_transaction_id'); }
}