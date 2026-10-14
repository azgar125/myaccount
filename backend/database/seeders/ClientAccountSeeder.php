<?php

namespace Database\Seeders;

use App\Enums\AccountStatus;
use App\Models\Client;
use App\Models\ClientAccount;
use Illuminate\Database\Seeder;

class ClientAccountSeeder extends Seeder
{
    public function run(): void
    {
        $accountsByClient = [
            'FOYSAL' => [
                ['account_type' => 'CARD',    'account_name' => 'Foysal Primary',    'provider_name' => 'Visa',       'card_number' => '4111111111111111', 'currency' => 'USD'],
                ['account_type' => 'CARD',    'account_name' => 'Foysal Backup',     'provider_name' => 'Mastercard', 'card_number' => '5555555555554444', 'currency' => 'USD'],
            ],
            'ARIAN' => [
                ['account_type' => 'CARD',    'account_name' => 'Arian Primary',     'provider_name' => 'Visa',       'card_number' => '4012888888881881', 'currency' => 'USD'],
            ],
            'YAMIN' => [
                ['account_type' => 'CARD',    'account_name' => 'Yamin Primary',     'provider_name' => 'Amex',       'card_number' => '378282246310005',  'currency' => 'USD'],
                ['account_type' => 'WALLET',  'account_name' => 'Yamin Wallet',      'provider_name' => 'PayPal',     'card_number' => null,               'currency' => 'USD'],
            ],
        ];

        foreach ($accountsByClient as $clientName => $accounts) {
            $client = Client::where('name', $clientName)->first();
            if (! $client) continue;

            foreach ($accounts as $row) {
                $cardNumber = $row['card_number'];
                $lastFour   = $cardNumber ? substr($cardNumber, -4) : '0000';

                $masked = $cardNumber
                    ? '**** **** **** '.$lastFour
                    : '**** **** **** '.$lastFour;

                ClientAccount::updateOrCreate(
                    [
                        'client_id'    => $client->id,
                        'account_name' => $row['account_name'],
                    ],
                    [
                        'account_type'  => $row['account_type'],
                        'provider_name' => $row['provider_name'],
                        'card_number'   => $cardNumber,   // encrypted via cast
                        'masked_number' => $masked,
                        'last_four'     => $lastFour,
                        'currency'      => $row['currency'],
                        'status'        => AccountStatus::ACTIVE->value,
                        'notes'         => 'Seeded test account.',
                    ]
                );
            }

            $this->command->info("   → Accounts seeded for {$clientName}");
        }
    }
}