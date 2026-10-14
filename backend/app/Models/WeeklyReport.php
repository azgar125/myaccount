<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WeeklyReport extends Model
{
    protected $fillable = [
        'week_start', 'week_end', 'client_id', 'total_transactions',
        'total_receive', 'total_payment', 'total_profit', 'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'week_start'  => 'date',
            'week_end'    => 'date',
            'generated_at' => 'datetime',
            'total_receive' => 'decimal:2',
            'total_payment' => 'decimal:2',
            'total_profit'  => 'decimal:2',
        ];
    }
}