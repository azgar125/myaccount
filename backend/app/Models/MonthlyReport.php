<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MonthlyReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'year',
        'month',
        'client_id',
        'total_transactions',
        'total_receive',
        'total_payment',
        'total_profit',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'year'              => 'integer',
            'month'             => 'integer',
            'total_transactions'=> 'integer',
            'total_receive'     => 'decimal:2',
            'total_payment'     => 'decimal:2',
            'total_profit'      => 'decimal:2',
            'generated_at'      => 'datetime',
        ];
    }

    /* -------------------------------------------------
     |  Relationships
     ------------------------------------------------- */

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    /* -------------------------------------------------
     |  Scopes
     ------------------------------------------------- */

    public function scopeForYear($query, int $year)
    {
        return $query->where('year', $year);
    }

    public function scopeForMonth($query, int $month)
    {
        return $query->where('month', $month);
    }

    public function scopeForClient($query, ?int $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    /* -------------------------------------------------
     |  Helpers
     ------------------------------------------------- */

    public function periodLabel(): string
    {
        return sprintf('%04d-%02d', $this->year, $this->month);
    }
}