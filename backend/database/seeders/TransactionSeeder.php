<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Transaction;
use App\Models\User;
use App\Services\CalculationService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        $calc  = new CalculationService();
        $admin = User::where('role', 'ADMIN')->first();

        if (! $admin) {
            $this->command->warn('No admin user found. Run UserSeeder first.');
            return;
        }

        $clients = Client::with('accounts')->get();

        if ($clients->isEmpty()) {
            $this->command->warn('No clients found. Run ClientSeeder first.');
            return;
        }

        $totalCreated = 0;

        // 30 days of transactions, 2-4 per day per client
        for ($dayOffset = 29; $dayOffset >= 0; $dayOffset--) {
            $date = Carbon::today()->subDays($dayOffset);

            foreach ($clients as $client) {
                $count = random_int(2, 4);

                for ($i = 0; $i < $count; $i++) {
                    $account = $client->accounts->random();
                    if (! $account) continue;

                    // Randomly PURCHASE or SALE
                    $type = random_int(0, 1) === 1 ? 'PURCHASE' : 'SALE';

                    // Base amounts
                    $amountUsd   = random_int(100, 5000);
                    $purchaseUsd = round($amountUsd * random_int(80, 95) / 100, 2);
                    $percentage  = round(random_int(7500, 9500) / 100, 2); // 75.00 – 95.00

                    $computed = $calc->calculateTransaction([
                        'amount_usd'   => $amountUsd,
                        'purchase_usd' => $purchaseUsd,
                        'percentage'   => $percentage,
                    ]);

                    $time = sprintf('%02d:%02d:00', random_int(8, 21), random_int(0, 59));

                    Transaction::create([
                        'transaction_no'        => Transaction::nextNumber($type),
                        'type'                  => $type,
                        'client_id'             => $client->id,
                        'account_id'            => $account->id,
                        'transaction_date'      => $date->toDateString(),
                        'transaction_time'      => $time,
                        'amount_usd'            => $computed['amount_usd'],
                        'purchase_usd'          => $computed['purchase_usd'],
                        'percentage'            => $computed['percentage'],
                        'percentage_amount'     => $computed['percentage_amount'],
                        'total_payable'         => $computed['total_payable'],
                        'sold_quantity'         => 0,
                        'remaining_quantity'    => $type === 'PURCHASE' ? $computed['purchase_usd'] : 0,
                        'total_profit_realized' => 0,
                        'status'                => $type === 'PURCHASE' ? 'OPEN' : 'CLOSED',
                        'payment_status'        => 'UNPAID',
                        'reference'             => 'SEED-' . strtoupper(bin2hex(random_bytes(3))),
                        'notes'                 => 'Seeded ' . strtolower($type),
                        'created_by'            => $admin->id,
                    ]);

                    $totalCreated++;
                }
            }
        }

        $this->command->info("   → {$totalCreated} transactions created for last 30 days.");
    }
}