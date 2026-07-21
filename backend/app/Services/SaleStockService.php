<?php

namespace App\Services;

use App\Models\FuelType;
use App\Models\Sale;
use App\Models\StockBatch;
use App\Models\StockBatchUsage;
use App\Models\StockTransaction;
use Exception;

class SaleStockService
{
    public const EPSILON = 0.0001;

    public function __construct(
        private readonly StockBatchFifoService $fifoService,
    ) {}

    public function reverse(Sale $sale): void
    {
        $usages = StockBatchUsage::query()
            ->where('sale_id', $sale->id)
            ->orderByDesc('id')
            ->get();

        foreach ($usages as $usage) {
            $batch = StockBatch::find($usage->stock_batch_id);

            if (! $batch || $batch->is_deleted) {
                continue;
            }

            $newRemaining = $batch->remaining_liters + $usage->liters_used;

            $batch->update([
                'remaining_liters' => $newRemaining,
                'status' => 'ACTIVE',
                'depleted_at' => null,
            ]);

            $usage->delete();
        }

        FuelType::where('id', $sale->fuel_type_id)->increment('current_stock', $sale->liters);
        StockTransaction::where('sale_id', $sale->id)->delete();
    }

    public function apply(Sale $sale, int $userId, \DateTimeInterface $saleDateValue, ?string $note = null): FuelType
    {
        $fuel = FuelType::find($sale->fuel_type_id);

        if (! $fuel || ! $fuel->is_active) {
            throw new Exception('មិនរកឃើញប្រភេទប្រេង', 404);
        }

        if ($fuel->current_stock < $sale->liters - self::EPSILON) {
            throw new Exception('ស្តុកមិនគ្រប់គ្រាន', 400);
        }

        $beforeStock = $fuel->current_stock;
        $afterStock = $beforeStock - $sale->liters;

        StockTransaction::create([
            'fuel_type_id' => $sale->fuel_type_id,
            'type' => 'SALE',
            'liters' => $sale->liters,
            'before_stock' => $beforeStock,
            'after_stock' => $afterStock,
            'note' => $note,
            'transaction_date' => $saleDateValue,
            'created_by_id' => $userId,
            'sale_id' => $sale->id,
        ]);

        $fuel->update(['current_stock' => $afterStock]);
        $this->fifoService->consume($sale->fuel_type_id, $sale->id, $sale->liters, $saleDateValue);

        return $fuel->fresh();
    }
}
