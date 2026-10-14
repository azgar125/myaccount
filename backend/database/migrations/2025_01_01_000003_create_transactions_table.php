<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_no', 30)->unique();

            $table->enum('type', ['PURCHASE', 'SALE']);

            $table->foreignId('client_id')
                  ->constrained('clients')
                  ->restrictOnDelete()
                  ->cascadeOnUpdate();

            $table->foreignId('account_id')
                  ->nullable()
                  ->constrained('client_accounts')
                  ->nullOnDelete()
                  ->cascadeOnUpdate();

            $table->date('transaction_date');
            $table->time('transaction_time');

            // Financials
            $table->decimal('amount_usd', 18, 2)->default(0);
            $table->decimal('purchase_usd', 18, 2)->default(0);
            $table->decimal('percentage', 8, 4)->default(0);
            $table->decimal('percentage_amount', 18, 2)->default(0);
            $table->decimal('total_payable', 18, 2)->default(0);

            // Partial-sale tracking
            $table->decimal('sold_quantity', 18, 2)->default(0);
            $table->decimal('remaining_quantity', 18, 2)->default(0);
            $table->decimal('total_profit_realized', 18, 2)->default(0);

            // Status
            $table->enum('status', ['OPEN', 'PARTIAL', 'CLOSED', 'CANCELLED'])->default('OPEN');
            $table->enum('payment_status', ['UNPAID', 'PARTIAL', 'PAID'])->default('UNPAID');

            $table->string('reference', 120)->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_deleted')->default(false);

            $table->foreignId('created_by')
                  ->constrained('users')
                  ->restrictOnDelete()
                  ->cascadeOnUpdate();

            $table->timestamps();
            $table->softDeletes();

            $table->index('transaction_date');
            $table->index('status');
            $table->index('type');
            $table->index('payment_status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};