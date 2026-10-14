<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'system_name'                => 'Client Accounting System',
            'currency'                   => config('accounting.currency', 'USD'),
            'date_format'                => config('accounting.date_format', 'Y-m-d'),
            'timezone'                   => config('accounting.timezone', 'Asia/Dhaka'),
            'default_receive_percentage' => config('accounting.defaults.receive_percentage', 84),
            'default_payment_percentage' => config('accounting.defaults.payment_percentage', 87),
            'profit_mode'                => config('accounting.defaults.profit_mode', 'PAYMENT_MINUS_RECEIVE'),
            'fixed_fee'                  => 0,
            'company_name'               => 'Demo Accounting Ltd.',
            'company_address'            => 'Dhaka, Bangladesh',
            'company_phone'              => '+880 1000-000000',
            'company_email'              => 'support@example.com',
        ];

        foreach ($defaults as $key => $value) {
            Setting::updateOrCreate(
                ['setting_key' => $key],
                ['setting_value' => (string) $value]
            );
        }

        Setting::flushCache();
    }
}