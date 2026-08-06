<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Debts and repayments used to be saved with a date only (midnight),
     * which put them before the open-session start time and excluded them
     * from session totals. Restore the real time from created_at for rows
     * whose recorded date matches their creation date; intentionally
     * backdated rows are left untouched.
     */
    public function up(): void
    {
        DB::table('debts')
            ->whereRaw("TIME(debt_date) = '00:00:00'")
            ->whereRaw('DATE(debt_date) = DATE(created_at)')
            ->update(['debt_date' => DB::raw('created_at')]);

        DB::table('debt_payments')
            ->whereRaw("TIME(paid_at) = '00:00:00'")
            ->whereRaw('DATE(paid_at) = DATE(created_at)')
            ->update(['paid_at' => DB::raw('created_at')]);
    }

    public function down(): void
    {
        // Data repair — not reversible.
    }
};
