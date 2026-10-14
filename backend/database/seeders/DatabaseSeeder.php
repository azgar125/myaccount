<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * Order matters — dependencies first.
     */
    public function run(): void
    {
        $this->call([
            SettingsSeeder::class,
            UserSeeder::class,           // creates admin
            ClientSeeder::class,         // creates FOYSAL, ARIAN, YAMIN
            ClientAccountSeeder::class,  // accounts per client
            TransactionSeeder::class,    // sample transactions (last 30 days)
        ]);

        $this->command->info('');
        $this->command->info('✅  Seed complete.');
        $this->command->info('    Admin login: admin@example.com');
        $this->command->info('    Password   : ChangeMe123!');
        $this->command->info('');
    }
}
