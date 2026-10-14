<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('weekly_reports', function (Blueprint $table) {
            $table->id();
            $table->date('week_start');
            $table->date('week_end');
            $table->foreignId('client_id')->nullable()->constrained('clients')->cascadeOnDelete();
            $table->unsignedInteger('total_transactions')->default(0);
            $table->decimal('total_receive', 18, 2)->default(0);
            $table->decimal('total_payment', 18, 2)->default(0);
            $table->decimal('total_profit', 18, 2)->default(0);
            $table->dateTime('generated_at')->useCurrent();

            $table->unique(['week_start', 'week_end', 'client_id'], 'uq_weekly');
            $table->index('week_start');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weekly_reports');
    }
};