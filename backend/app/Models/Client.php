<?php

namespace App\Models;

use App\Enums\ClientStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'client_code', 'name', 'phone', 'email', 'address',
        'country', 'status', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => ClientStatus::class,
        ];
    }

    public function accounts()
    {
        return $this->hasMany(ClientAccount::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function user()
    {
        return $this->hasOne(User::class);
    }

    public static function generateCode(): string
    {
        $prefix = config('accounting.client_code_prefix', 'CL-');
        $padding = config('accounting.client_code_padding', 5);

        $last = self::withTrashed()
            ->where('client_code', 'like', $prefix.'%')
            ->orderByDesc('id')
            ->value('client_code');

        $next = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;

        return $prefix.str_pad((string) $next, $padding, '0', STR_PAD_LEFT);
    }
}