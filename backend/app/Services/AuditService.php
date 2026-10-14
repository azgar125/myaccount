<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class AuditService
{
    /**
     * Log an admin action.
     *
     * @param string      $action    CREATE | UPDATE | DELETE | LOGIN | LOGOUT | SETTINGS_CHANGE ...
     * @param string      $module    CLIENT | ACCOUNT | TRANSACTION | USER | SETTINGS | AUTH ...
     * @param int|string|null $recordId
     * @param array|null  $oldValue
     * @param array|null  $newValue
     * @param Request|null $request
     */
    public function log(
        string $action,
        string $module,
        int|string|null $recordId = null,
        ?array $oldValue = null,
        ?array $newValue = null,
        ?Request $request = null
    ): ActivityLog {
        $request = $request ?? request();
        $user    = $request?->user();

        // Hide sensitive fields
        $oldValue = $this->sanitize($oldValue);
        $newValue = $this->sanitize($newValue);

        return ActivityLog::create([
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

    /**
     * Remove sensitive keys before storing.
     */
    private function sanitize(?array $value): ?array
    {
        if ($value === null) return null;

        $hidden = ['password', 'remember_token', 'card_number', 'token'];
        foreach ($hidden as $key) {
            if (array_key_exists($key, $value)) {
                $value[$key] = '***';
            }
        }
        return $value;
    }
}