<?php

namespace App\Services;

use App\Models\DailyReport;
use App\Models\DailyExpense;
use App\Models\StockBatch;
use App\Services\AppSettingsService;
use Illuminate\Support\Facades\DB;

class DailyReportService
{
    public function __construct(
        private readonly AppSettingsService $settings,
    ) {}

    public function snapshotToDbRecord(array $snapshot): array
    {
        return [
            'report_date' => $snapshot['reportDate'] ?? now()->toDateString(),
            'total_normal_fuel_liters' => $snapshot['totalNormalFuelLiters'] ?? 0,
            'total_super_fuel_liters' => $snapshot['totalSuperFuelLiters'] ?? 0,
            'total_diesel_liters' => $snapshot['totalDieselLiters'] ?? 0,
            'total_liters' => $snapshot['totalLiters'] ?? 0,
            'total_amount_khr' => $snapshot['totalAmountKHR'] ?? $snapshot['fuelSalesTotal'] ?? 0,
            'total_amount_usd' => $snapshot['totalAmountUSD'] ?? 0,
            'discount_amount' => $snapshot['discountAmount'] ?? $snapshot['totalExpenses'] ?? 0,
            'debt_collected_khr' => $snapshot['debtTodayAmount'] ?? $snapshot['repaymentTotal'] ?? 0,
            'final_amount_khr' => $snapshot['finalAmountKHR'] ?? $snapshot['finalCashTotal'] ?? 0,
            'final_amount_usd' => $snapshot['finalAmountUSD'] ?? 0,
            'status' => $snapshot['status'] ?? 'CLOSED',
            'is_archived' => false,
            'closed_at' => $snapshot['closedAt'] ?? now(),
            'snapshot_json' => json_encode($snapshot),
        ];
    }

    public function dbRecordToReport(DailyReport $record): array
    {
        if ($record->snapshot_json) {
            $parsed = json_decode($record->snapshot_json, true);

            if (is_array($parsed)) {
                return array_merge($parsed, [
                    'id' => $record->id,
                    'reportDate' => $record->report_date?->toIso8601String(),
                    'closedAt' => $record->closed_at?->toIso8601String(),
                ]);
            }
        }

        return [
            'id' => $record->id,
            'reportDate' => $record->report_date?->toIso8601String(),
            'closedAt' => $record->closed_at?->toIso8601String(),
            'status' => $record->status,
            'totalLiters' => $record->total_liters,
            'totalAmountKHR' => $record->total_amount_khr,
            'fuelSalesTotal' => $record->total_amount_khr,
            'finalAmountKHR' => $record->final_amount_khr,
            'finalCashTotal' => $record->final_amount_khr,
            'finalAmountUSD' => $record->final_amount_usd,
            'grandTotalKHR' => $record->final_amount_khr,
            'grandTotalUSD' => $record->final_amount_usd,
            'totalExpenses' => $record->discount_amount,
            'debtTodayAmount' => $record->debt_collected_khr,
            'fuelRows' => [],
            'newDebts' => [],
            'repayments' => [],
            'expenses' => [],
        ];
    }

    public function expenseFromDb(DailyExpense $record): array
    {
        return [
            'id' => $record->id,
            'category' => $record->category,
            'amount' => $record->amount,
            'amountKHR' => $record->amount_khr,
            'amountUSD' => $record->amount_usd,
            'currency' => $record->currency,
            'expenseDate' => $record->expense_date?->toDateString(),
            'note' => $record->note ?? '',
            'dailyReportId' => $record->daily_report_id,
        ];
    }

    public function closeDay(array $snapshot, array $expenseIds = []): DailyReport
    {
        $closedAt = isset($snapshot['closedAt']) ? new \DateTime($snapshot['closedAt']) : now();
        $sessionStartAt = isset($snapshot['sessionStartAt']) ? new \DateTime($snapshot['sessionStartAt']) : $closedAt;
        $snapshot['closedAt'] = $closedAt->format('c');
        $dbPayload = $this->snapshotToDbRecord($snapshot);

        $report = DB::transaction(function () use ($dbPayload, $expenseIds, $sessionStartAt, $closedAt) {
            $created = DailyReport::create($dbPayload);

            if (! empty($expenseIds)) {
                DailyExpense::whereIn('id', $expenseIds)
                    ->whereNull('daily_report_id')
                    ->update(['daily_report_id' => $created->id]);
            }

            StockBatch::where('is_deleted', false)
                ->whereBetween('received_at', [$sessionStartAt, $closedAt])
                ->update(['locked_by_report_id' => $created->id]);

            return $created;
        });

        $this->settings->setSessionStartAt($closedAt);

        return $report;
    }
}
