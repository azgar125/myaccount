<?php

namespace App\Models;

use App\Enums\AccountStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id', 'account_type', 'account_name', 'provider_name',
        'card_number', 'masked_number', 'last_four', 'currency', 'status', 'notes',
    ];

    protected $hidden = ['card_number'];

    protected function casts(): array
    {
        return [
            'status'      => AccountStatus::class,
            'card_number' => 'encrypted',
        ];
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'account_id');
    }
}