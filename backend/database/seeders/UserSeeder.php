<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // ---- Admin (idempotent) ----
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name'     => 'System Admin',
                'password' => Hash::make('ChangeMe123!'),
                'role'     => UserRole::ADMIN->value,
                'status'   => UserStatus::ACTIVE->value,
            ]
        );

        $this->command->info('   → Admin user created: admin@example.com');
    }
}