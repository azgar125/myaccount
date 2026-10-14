<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyReport extends Model
{
    protected $fillable = [
        'report_date', 'client_id', 'total_transactions',
        'total_receive', 'total_payment', 'total_profit', 'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'report_date' => 'date',
            'generated_at' => 'datetime',
            'total_receive' => 'decimal:2',
            'total_payment' => 'decimal:2',
            'total_profit'  => 'decimal:2',
        ];
    }
}