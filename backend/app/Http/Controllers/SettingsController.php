<?php

namespace App\Http\Controllers;

use App\Enums\ProfitMode;
use App\Helpers\ApiResponse;
use App\Models\Setting;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SettingsController extends Controller
{
    public function __construct(private AuditService $audit) {}

    /**
     * Known settings keys and their metadata.
     * Add new keys here as needed.
     */
    protected function schema(): array
    {
        return [
            'system_name'              => ['type' => 'string',  'default' => config('accounting.system_name')],
            'currency'                 => ['type' => 'string',  'default' => config('accounting.currency')],
            'date_format'              => ['type' => 'string',  'default' => config('accounting.date_format')],
            'timezone'                 => ['type' => 'string',  'default' => config('accounting.timezone')],
            'default_receive_percentage' => ['type' => 'number', 'default' => config('accounting.defaults.receive_percentage')],
            'default_payment_percentage' => ['type' => 'number', 'default' => config('accounting.defaults.payment_percentage')],
            'profit_mode'              => ['type' => 'enum',    'default' => config('accounting.defaults.profit_mode'), 'values' => ProfitMode::values()],
            'fixed_fee'                => ['type' => 'number',  'default' => 0],
            'company_name'             => ['type' => 'string',  'default' => ''],
            'company_address'          => ['type' => 'string',  'default' => ''],
            'company_phone'            => ['type' => 'string',  'default' => ''],
            'company_email'            => ['type' => 'string',  'default' => ''],
        ];
    }

    /**
     * GET /api/settings
     */
    public function show()
    {
        $stored = Setting::query()->pluck('setting_value', 'setting_key')->all();

        $out = [];
        foreach ($this->schema() as $key => $meta) {
            $value = array_key_exists($key, $stored) ? $stored[$key] : $meta['default'];

            if ($meta['type'] === 'number') {
                $value = (float) $value;
            }

            $out[$key] = $value;
        }

        return ApiResponse::success($out, 'Settings');
    }

    /**
     * PUT /api/settings
     */
    public function update(Request $request)
    {
        $schema = $this->schema();

        // Build validation rules dynamically
        $rules = [];
        foreach ($schema as $key => $meta) {
            $rule = ['nullable'];

            switch ($meta['type']) {
                case 'number':
                    $rule[] = 'numeric';
                    if (str_contains($key, 'percentage')) {
                        $rule[] = 'min:0';
                        $rule[] = 'max:100';
                    }
                    break;
                case 'enum':
                    $rule[] = Rule::in($meta['values']);
                    break;
                case 'string':
                default:
                    $rule[] = 'string';
                    $rule[] = 'max:255';
                    break;
            }

            $rules[$key] = $rule;
        }

        $data = $request->validate($rules);

        return DB::transaction(function () use ($data, $request) {
            $old = Setting::query()->pluck('setting_value', 'setting_key')->all();
            $oldOut = [];

            foreach ($data as $key => $value) {
                if ($value === null) continue;

                $oldOut[$key] = $old[$key] ?? null;

                Setting::updateOrCreate(
                    ['setting_key' => $key],
                    [
                        'setting_value' => (string) $value,
                        'updated_by'    => $request->user()->id,
                    ]
                );
            }

            $this->audit->log('UPDATE', 'SETTINGS', null, $oldOut, $data, $request);

            // Return the fresh settings using same shape as show()
            $fresh = $this->show()->getData(true);
            return ApiResponse::success($fresh['data'], 'Settings updated');
        });
    }
}