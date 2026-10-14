<?php

namespace Database\Seeders;

use App\Enums\ClientStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Client;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ClientSeeder extends Seeder
{
    public function run(): void
    {
        $clients = [
            [
                'name'    => 'FOYSAL',
                'phone'   => '+880 1711-000001',
                'email'   => 'foysal@example.com',
                'address' => 'Mirpur, Dhaka',
                'country' => 'Bangladesh',
            ],
            [
                'name'    => 'ARIAN',
                'phone'   => '+880 1711-000002',
                'email'   => 'arian@example.com',
                'address' => 'Gulshan, Dhaka',
                'country' => 'Bangladesh',
            ],
            [
                'name'    => 'YAMIN',
                'phone'   => '+880 1711-000003',
                'email'   => 'yamin@example.com',
                'address' => 'Uttara, Dhaka',
                'country' => 'Bangladesh',
            ],
        ];

        foreach ($clients as $row) {
            $client = Client::updateOrCreate(
                ['name' => $row['name']],
                array_merge($row, [
                    'client_code' => Client::generateCode(),
                    'status'      => ClientStatus::ACTIVE->value,
                    'notes'       => 'Seeded for development.',
                ])
            );

            // Login user for this client (optional but useful for testing)
            $loginEmail = strtolower($client->name).'@client.test';

            User::updateOrCreate(
                ['email' => $loginEmail],
                [
                    'name'      => $client->name.' Login',
                    'password'  => Hash::make('Client123!'),
                    'role'      => UserRole::CLIENT->value,
                    'status'    => UserStatus::ACTIVE->value,
                    'client_id' => $client->id,
                ]
            );

            $this->command->info("   → Client {$client->client_code} ({$client->name}) + login: {$loginEmail}");
        }
    }
}