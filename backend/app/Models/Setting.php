<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    use HasFactory;

    /**
     * Table name (explicit for safety).
     */
    protected $table = 'settings';

    /**
     * Mass-assignable attributes.
     */
    protected $fillable = [
        'setting_key',
        'setting_value',
        'updated_by',
    ];

    /**
     * Cache key prefix and TTL (seconds).
     * All settings are cached together for fast reads.
     */
    protected const CACHE_KEY = 'app.settings.all';
    protected const CACHE_TTL = 3600; // 1 hour

    /* -------------------------------------------------
     |  Relationships
     ------------------------------------------------- */

    /**
     * The user who last updated this setting.
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /* -------------------------------------------------
     |  Static helpers (with cache)
     ------------------------------------------------- */

    /**
     * Get all settings as a key → value array (cached).
     */
    public static function all_cached(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return self::query()->pluck('setting_value', 'setting_key')->all();
        });
    }

    /**
     * Get a single setting value.
     * Returns $default if not found.
     */
    public static function getValue(string $key, mixed $default = null): mixed
    {
        $all = self::all_cached();

        return array_key_exists($key, $all) ? $all[$key] : $default;
    }

    /**
     * Get a numeric setting value as float.
     */
    public static function getNumber(string $key, float $default = 0.0): float
    {
        $value = self::getValue($key, $default);

        return is_numeric($value) ? (float) $value : $default;
    }

    /**
     * Get a boolean setting value.
     */
    public static function getBool(string $key, bool $default = false): bool
    {
        $value = self::getValue($key, $default);

        if (is_bool($value)) return $value;

        return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on'], true);
    }

    /**
     * Set a single setting value (upsert) and clear cache.
     */
    public static function setValue(string $key, mixed $value, ?int $updatedBy = null): self
    {
        $setting = self::updateOrCreate(
            ['setting_key' => $key],
            [
                'setting_value' => is_scalar($value) || $value === null
                    ? (string) $value
                    : json_encode($value),
                'updated_by'    => $updatedBy,
            ]
        );

        self::flushCache();

        return $setting;
    }

    /**
     * Bulk update multiple settings at once.
     * $values = ['default_receive_percentage' => 84, 'profit_mode' => 'PAYMENT_MINUS_RECEIVE', ...]
     */
    public static function setMany(array $values, ?int $updatedBy = null): void
    {
        foreach ($values as $key => $value) {
            self::updateOrCreate(
                ['setting_key' => $key],
                [
                    'setting_value' => is_scalar($value) || $value === null
                        ? (string) $value
                        : json_encode($value),
                    'updated_by'    => $updatedBy,
                ]
            );
        }

        self::flushCache();
    }

    /**
     * Convenience: current profit calculation mode.
     */
    public static function mode(): string
    {
        return (string) self::getValue(
            'profit_mode',
            config('accounting.defaults.profit_mode', 'PAYMENT_MINUS_RECEIVE')
        );
    }

    /**
     * Convenience: default receive percentage.
     */
    public static function defaultReceivePercentage(): float
    {
        return self::getNumber(
            'default_receive_percentage',
            (float) config('accounting.defaults.receive_percentage', 84)
        );
    }

    /**
     * Convenience: default payment percentage.
     */
    public static function defaultPaymentPercentage(): float
    {
        return self::getNumber(
            'default_payment_percentage',
            (float) config('accounting.defaults.payment_percentage', 87)
        );
    }

    /* -------------------------------------------------
     |  Cache management
     ------------------------------------------------- */

    /**
     * Clear the settings cache.
     * Called automatically whenever a setting is updated.
     */
    public static function flushCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /* -------------------------------------------------
     |  Boot hooks — auto-clear cache on any write
     ------------------------------------------------- */

    protected static function booted(): void
    {
        static::saved(fn () => self::flushCache());
        static::deleted(fn () => self::flushCache());
    }
}