<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Drop the old transactions table (we'll recreate with new schema)
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('transactions');
        Schema::enableForeignKeyConstraints();

        // 2. Create new transactions table (header)
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_no', 30)->unique();
            $table->enum('type', ['PURCHASE', 'SALE']);           // ← separate types
            $table->foreignId('client_id')->constrained('clients')->restrictOnDelete();
            $table->foreignId('account_id')->nullable()->constrained('client_accounts')->nullOnDelete();

            $table->date('transaction_date');
            $table->time('transaction_time');

            $table->decimal('amount_usd', 18, 2)->default(0);      // Total USD amount
            $table->decimal('purchase_usd', 18, 2)->default(0);    // Purchase (rate)
            $table->decimal('percentage', 7, 4)->default(0);       // % rate
            $table->decimal('percentage_amount', 18, 2)->default(0); // purchase × %/100
            $table->decimal('total_payable', 18, 2)->default(0);   // = percentage_amount

            // Partial sale tracking (for PURCHASE entries)
            $table->decimal('sold_quantity', 18, 2)->default(0);
            $table->decimal('remaining_quantity', 18, 2)->default(0);
            $table->decimal('total_profit_realized', 18, 2)->default(0);

            $table->enum('status', ['OPEN', 'PARTIAL', 'CLOSED', 'CANCELLED'])->default('OPEN');
            $table->enum('payment_status', ['UNPAID', 'PARTIAL', 'PAID'])->default('UNPAID');

            $table->string('reference', 120)->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('type');
            $table->index('transaction_date');
            $table->index('status');
            $table->index('payment_status');
        });

        // 3. Create transaction_sales (child entries for partial sales)
        Schema::create('transaction_sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_transaction_id')                    // ← links to PURCHASE
                  ->constrained('transactions')
                  ->cascadeOnDelete();
            $table->foreignId('sale_transaction_id')                      // ← links to SALE txn
                  ->nullable()
                  ->constrained('transactions')
                  ->nullOnDelete();

            $table->date('sale_date');
            $table->decimal('sold_quantity', 18, 2);                      // USD amount sold
            $table->decimal('sale_percentage', 7, 4);                     // % rate for this sale
            $table->decimal('sale_amount', 18, 2);                        // sold × %/100

            $table->decimal('purchase_rate', 18, 2);                      // parent's rate
            $table->decimal('purchase_percentage', 7, 4);                 // parent's %
            $table->decimal('cost_of_goods', 18, 2);                      // sold × parent %/100

            $table->decimal('profit_realized', 18, 2)->default(0);        // sale_amount − cost_of_goods

            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('parent_transaction_id');
            $table->index('sale_date');
        });

        // 4. Create payments table (multiple payments per transaction)
        Schema::create('transaction_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained('transactions')->cascadeOnDelete();
            $table->enum('direction', ['PAYMENT_OUT', 'RECEIPT_IN']);     // pay vs receive
            $table->decimal('amount_usd', 18, 2);
            $table->date('payment_date');
            $table->string('method', 60)->nullable();
            $table->string('reference', 120)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index('transaction_id');
            $table->index('payment_date');
        });
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('transaction_payments');
        Schema::dropIfExists('transaction_sales');
        Schema::dropIfExists('transactions');
        Schema::enableForeignKeyConstraints();
    }
};