<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('client_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')
                  ->constrained('clients')
                  ->cascadeOnDelete()
                  ->cascadeOnUpdate();
            $table->string('account_type', 40)->default('CARD');
            $table->string('account_name', 120);
            $table->string('provider_name', 120)->nullable();
            $table->text('card_number')->nullable();     // encrypted at rest via cast
            $table->string('masked_number', 40);
            $table->char('last_four', 4);
            $table->char('currency', 3)->default('USD');
            $table->enum('status', ['ACTIVE', 'INACTIVE', 'BLOCKED'])->default('ACTIVE');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('last_four');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_accounts');
    }
};