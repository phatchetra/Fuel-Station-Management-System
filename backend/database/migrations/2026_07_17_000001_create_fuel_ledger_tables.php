<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fuel_types', function (Blueprint $table) {
            $table->id();
            $table->string('name_khmer');
            $table->string('slug')->unique();
            $table->string('accent_color');
            $table->integer('price_per_liter');
            $table->double('current_stock');
            $table->double('capacity');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fuel_type_id')->constrained('fuel_types');
            $table->double('liters');
            $table->integer('price_per_liter');
            $table->integer('amount_khr');
            $table->dateTime('sale_date');
            $table->text('note')->nullable();
            $table->foreignId('created_by_id')->constrained('users');
            $table->timestamps();

            $table->index('fuel_type_id');
            $table->index('created_by_id');
            $table->index('sale_date');
        });

        Schema::create('stock_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fuel_type_id')->constrained('fuel_types');
            $table->string('type');
            $table->double('liters');
            $table->double('before_stock');
            $table->double('after_stock');
            $table->string('note')->nullable();
            $table->unsignedBigInteger('stock_batch_id')->nullable();
            $table->unsignedBigInteger('sale_id')->nullable();
            $table->dateTime('transaction_date');
            $table->foreignId('created_by_id')->constrained('users');
            $table->timestamp('created_at')->useCurrent();

            $table->index('fuel_type_id');
            $table->index('created_by_id');
            $table->index('transaction_date');
            $table->index('sale_id');
        });

        Schema::create('stock_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fuel_type_id')->constrained('fuel_types');
            $table->double('original_liters');
            $table->double('remaining_liters');
            $table->dateTime('received_at');
            $table->dateTime('depleted_at')->nullable();
            $table->string('status')->default('ACTIVE');
            $table->string('note')->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->dateTime('deleted_at')->nullable();
            $table->text('deleted_reason')->nullable();
            $table->unsignedBigInteger('locked_by_report_id')->nullable();
            $table->foreignId('created_by_id')->constrained('users');
            $table->timestamps();

            $table->index('fuel_type_id');
            $table->index('created_by_id');
            $table->index('received_at');
            $table->index('status');
            $table->index('is_deleted');
            $table->index('locked_by_report_id');
        });

        Schema::create('stock_batch_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_batch_id')->constrained('stock_batches');
            $table->foreignId('sale_id')->constrained('sales');
            $table->double('liters_used');
            $table->timestamp('created_at')->useCurrent();

            $table->index('stock_batch_id');
            $table->index('sale_id');
        });

        Schema::create('sale_corrections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales');
            $table->unsignedBigInteger('original_fuel_type_id');
            $table->double('original_liters');
            $table->integer('original_price_per_liter');
            $table->integer('original_amount_khr');
            $table->dateTime('original_sale_date');
            $table->unsignedBigInteger('corrected_fuel_type_id');
            $table->double('corrected_liters');
            $table->integer('corrected_price_per_liter');
            $table->integer('corrected_amount_khr');
            $table->dateTime('corrected_sale_date');
            $table->text('reason');
            $table->dateTime('corrected_at')->useCurrent();
            $table->foreignId('created_by_id')->constrained('users');
            $table->timestamp('created_at')->useCurrent();

            $table->index('sale_id');
            $table->index('created_by_id');
            $table->index('corrected_at');
        });

        Schema::create('debts', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name');
            $table->string('product_type')->nullable();
            $table->double('liters')->nullable();
            $table->string('phone_or_note')->nullable();
            $table->integer('total_amount');
            $table->integer('paid_amount')->default(0);
            $table->integer('remaining_amount');
            $table->string('status')->default('UNPAID');
            $table->dateTime('debt_date');
            $table->foreignId('created_by_id')->constrained('users');
            $table->timestamps();

            $table->index('created_by_id');
            $table->index('debt_date');
            $table->index('status');
        });

        Schema::create('debt_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('debt_id')->constrained('debts')->cascadeOnDelete();
            $table->integer('amount');
            $table->date('paid_at');
            $table->text('note')->nullable();
            $table->foreignId('created_by_id')->constrained('users');
            $table->timestamps();

            $table->index('debt_id');
            $table->index('created_by_id');
            $table->index('paid_at');
        });

        Schema::create('daily_reports', function (Blueprint $table) {
            $table->id();
            $table->date('report_date');
            $table->double('total_normal_fuel_liters')->default(0);
            $table->double('total_super_fuel_liters')->default(0);
            $table->double('total_diesel_liters')->default(0);
            $table->double('total_liters')->default(0);
            $table->integer('total_amount_khr')->default(0);
            $table->double('total_amount_usd')->default(0);
            $table->integer('discount_amount')->default(0);
            $table->integer('debt_collected_khr')->default(0);
            $table->integer('final_amount_khr')->default(0);
            $table->double('final_amount_usd')->default(0);
            $table->string('status')->default('CLOSED');
            $table->boolean('is_archived')->default(false);
            $table->dateTime('closed_at');
            $table->longText('snapshot_json')->nullable();
            $table->timestamps();

            $table->index('report_date');
            $table->index('is_archived');
            $table->index('closed_at');
        });

        Schema::create('daily_expenses', function (Blueprint $table) {
            $table->id();
            $table->date('expense_date');
            $table->string('category');
            $table->double('amount');
            $table->string('currency')->default('KHR');
            $table->integer('amount_khr');
            $table->double('amount_usd');
            $table->text('note')->nullable();
            $table->unsignedBigInteger('daily_report_id')->nullable();
            $table->timestamps();

            $table->index('expense_date');
            $table->index('daily_report_id');
        });

        Schema::create('app_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('value');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_settings');
        Schema::dropIfExists('daily_expenses');
        Schema::dropIfExists('daily_reports');
        Schema::dropIfExists('debt_payments');
        Schema::dropIfExists('debts');
        Schema::dropIfExists('sale_corrections');
        Schema::dropIfExists('stock_batch_usages');
        Schema::dropIfExists('stock_batches');
        Schema::dropIfExists('stock_transactions');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('fuel_types');
    }
};
