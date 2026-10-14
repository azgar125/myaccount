<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->index(['type', 'status', 'transaction_date'], 'idx_tx_type_status_date');
            $table->index(['client_id', 'transaction_date'], 'idx_tx_client_date');
            $table->index(['transaction_date', 'is_deleted'], 'idx_tx_date_deleted');
        });

        Schema::table('transaction_payments', function (Blueprint $table) {
            $table->index(['transaction_id', 'payment_date'], 'idx_tp_tx_date');
        });

        Schema::table('transaction_sales', function (Blueprint $table) {
            $table->index(['parent_transaction_id', 'sale_date'], 'idx_ts_parent_date');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('idx_tx_type_status_date');
            $table->dropIndex('idx_tx_client_date');
            $table->dropIndex('idx_tx_date_deleted');
        });
        // ...
    }
};
