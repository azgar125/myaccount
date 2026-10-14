<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    use HasFactory;

    /**
     * Table name (explicit for safety).
     */
    protected $table = 'activity_logs';

    /**
     * This table is append-only — no updated_at.
     */
    public const UPDATED_AT = null;

    /**
     * Mass-assignable attributes.
     */
    protected $fillable = [
        'user_id',
        'user_name',
        'action',
        'module',
        'record_id',
        'old_value',
        'new_value',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    /**
     * Attribute casting.
     * old_value / new_value are JSON columns → auto encode/decode.
     */
    protected function casts(): array
    {
        return [
            'old_value'  => 'array',
            'new_value'  => 'array',
            'created_at' => 'datetime',
        ];
    }

    /* -------------------------------------------------
     |  Relationships
     ------------------------------------------------- */

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /* -------------------------------------------------
     |  Scopes
     ------------------------------------------------- */

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForModule($query, string $module)
    {
        return $query->where('module', $module);
    }

    public function scopeForAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    public function scopeBetweenDates($query, string $from, string $to)
    {
        return $query->whereBetween('created_at', [$from.' 00:00:00', $to.' 23:59:59']);
    }

    public function scopeSearch($query, ?string $term)
    {
        if (! $term) return $query;

        $term = trim($term);

        return $query->where(function ($w) use ($term) {
            $w->where('user_name', 'like', "%{$term}%")
              ->orWhere('action', 'like', "%{$term}%")
              ->orWhere('module', 'like', "%{$term}%")
              ->orWhere('record_id', 'like', "%{$term}%")
              ->orWhere('ip_address', 'like', "%{$term}%");
        });
    }

    /* -------------------------------------------------
     |  Static helper
     ------------------------------------------------- */

    public static function record(
        string $action,
        string $module,
        int|string|null $recordId = null,
        ?array $oldValue = null,
        ?array $newValue = null
    ): self {
        $request = request();
        $user    = $request?->user();

        return static::create([
            'user_id'    => $user?->id,
            'user_name'  => $user?->name,
            'action'     => $action,
            'module'     => $module,
            'record_id'  => $recordId !== null ? (string) $recordId : null,
            'old_value'  => $oldValue,
            'new_value'  => $newValue,
            'ip_address' => $request?->ip(),
            'user_agent' => substr((string) $request?->userAgent(), 0, 255),
            'created_at' => now(),
        ]);
    }

    /* -------------------------------------------------
     |  Labels (for UI)
     ------------------------------------------------- */

    public function moduleLabel(): string
    {
        return ucwords(strtolower(str_replace('_', ' ', (string) $this->module)));
    }

    public function actionLabel(): string
    {
        return match (strtoupper((string) $this->action)) {
            'CREATE'          => 'Created',
            'UPDATE'          => 'Updated',
            'DELETE'          => 'Deleted',
            'LOGIN'           => 'Logged in',
            'LOGOUT'          => 'Logged out',
            'SETTINGS_CHANGE' => 'Settings changed',
            default           => ucfirst(strtolower((string) $this->action)),
        };
    }
}