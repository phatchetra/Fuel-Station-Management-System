<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\StockBatch;
use Carbon\Carbon;

class StockBatchHelperService
{
    public function __construct(
        private readonly StockBatchSafetyService $safety,
    ) {}

    public function getAverageDailyLitersByFuel(array $fuelTypeIds, int $days = 7): array
    {
        if (empty($fuelTypeIds)) {
            return [];
        }

        $since = now()->subDays($days)->startOfDay();

        $grouped = Sale::query()
            ->selectRaw('fuel_type_id, SUM(liters) as total_liters')
            ->whereIn('fuel_type_id', $fuelTypeIds)
            ->where('sale_date', '>=', $since)
            ->groupBy('fuel_type_id')
            ->pluck('total_liters', 'fuel_type_id');

        $averages = array_fill_keys($fuelTypeIds, 0.0);

        foreach ($grouped as $fuelTypeId => $total) {
            $averages[$fuelTypeId] = $total / $days;
        }

        return $averages;
    }

    public function enrichStockBatch(StockBatch $batch, float $averageDailyLiters = 0): array
    {
        $batch->load(['fuelType', 'usages']);
        $permissions = $this->safety->getBatchPermissions($batch);
        $soldLiters = $permissions['soldLiters'];
        $progressPercent = $batch->original_liters > 0
            ? round(($soldLiters / $batch->original_liters) * 100)
            : 0;

        $daysToSellOut = $batch->depleted_at
            ? max(0, (int) floor(Carbon::parse($batch->received_at)->diffInDays($batch->depleted_at)))
            : null;

        $daysActive = max(0, (int) floor(Carbon::parse($batch->received_at)->diffInDays(now())));

        $estimatedDaysLeft = null;
        if ($batch->status === 'ACTIVE' && $averageDailyLiters > 0) {
            $estimatedDaysLeft = (int) ceil($batch->remaining_liters / $averageDailyLiters);
        }

        $statusLabels = ['ACTIVE' => 'កំពុងលក់', 'DEPLETED' => 'លក់អស់'];

        $fuel = $batch->fuelType;

        return array_merge([
            'id' => $batch->id,
            'fuelTypeId' => $batch->fuel_type_id,
            'originalLiters' => $batch->original_liters,
            'remainingLiters' => $batch->remaining_liters,
            'receivedAt' => $batch->received_at?->toIso8601String(),
            'depletedAt' => $batch->depleted_at?->toIso8601String(),
            'status' => $batch->status,
            'note' => $batch->note,
            'isDeleted' => $batch->is_deleted,
            'lockedByReportId' => $batch->locked_by_report_id,
            'fuelType' => $fuel ? [
                'id' => $fuel->id,
                'nameKhmer' => $fuel->name_khmer,
                'slug' => $fuel->slug,
                'accentColor' => $fuel->accent_color,
                'pricePerLiter' => $fuel->price_per_liter,
                'currentStock' => $fuel->current_stock,
                'capacity' => $fuel->capacity,
            ] : null,
            'usages' => $batch->usages->map(fn ($u) => [
                'id' => $u->id,
                'saleId' => $u->sale_id,
                'litersUsed' => $u->liters_used,
                'createdAt' => $u->created_at?->toIso8601String(),
            ])->values()->all(),
        ], [
            'soldLiters' => $soldLiters,
            'progressPercent' => $progressPercent,
            'daysToSellOut' => $daysToSellOut,
            'daysActive' => $daysActive,
            'estimatedDaysLeft' => $estimatedDaysLeft,
            'statusLabel' => $statusLabels[$batch->status] ?? $batch->status,
        ], $permissions);
    }
}
