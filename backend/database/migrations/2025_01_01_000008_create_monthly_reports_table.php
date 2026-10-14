<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('monthly_reports', function (Blueprint $table) {
            $table->id();
            $table->smallInteger('year');
            $table->tinyInteger('month');
            $table->foreignId('client_id')->nullable()->constrained('clients')->cascadeOnDelete();
            $table->unsignedInteger('total_transactions')->default(0);
            $table->decimal('total_receive', 18, 2)->default(0);
            $table->decimal('total_payment', 18, 2)->default(0);
            $table->decimal('total_profit', 18, 2)->default(0);
            $table->dateTime('generated_at')->useCurrent();

            $table->unique(['year', 'month', 'client_id'], 'uq_monthly');
            $table->index(['year', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monthly_reports');
    }
};