<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Store the exact payment time instead of the date only, so repayments
     * recorded after a mid-day close are counted in the open session
     * (session boundaries are compared with full timestamps).
     */
    public function up(): void
    {
        Schema::table('debt_payments', function (Blueprint $table) {
            $table->dateTime('paid_at')->change();
        });
    }

    public function down(): void
    {
        Schema::table('debt_payments', function (Blueprint $table) {
            $table->date('paid_at')->change();
        });
    }
};
