<?php

namespace App\Services;

use App\Models\AppSetting;
use App\Models\StockBatch;
use App\Models\StockBatchUsage;
use Exception;

class StockBatchFifoService
{
    public const EPSILON = 0.0001;

    public function consume(int $fuelTypeId, int $saleId, float $litersToConsume, \DateTimeInterface $depletedAt): array
    {
        $remaining = $litersToConsume;
        $usages = [];

        $batches = StockBatch::query()
            ->where('fuel_type_id', $fuelTypeId)
            ->where('status', 'ACTIVE')
            ->where('remaining_liters', '>', 0)
            ->orderBy('received_at')
            ->orderBy('id')
            ->get();

        foreach ($batches as $batch) {
            if ($remaining <= self::EPSILON) {
                break;
            }

            $take = min($batch->remaining_liters, $remaining);
            $newRemaining = $batch->remaining_liters - $take;
            $remaining -= $take;

            $usage = StockBatchUsage::create([
                'stock_batch_id' => $batch->id,
                'sale_id' => $saleId,
                'liters_used' => $take,
            ]);

            $batchUpdate = ['remaining_liters' => $newRemaining];

            if ($newRemaining <= self::EPSILON) {
                $batchUpdate['status'] = 'DEPLETED';
                $batchUpdate['depleted_at'] = $depletedAt;
                $batchUpdate['remaining_liters'] = 0;
            }

            $batch->update($batchUpdate);
            $usages[] = $usage;
        }

        if ($remaining > self::EPSILON) {
            throw new Exception('ស្តុកបាច់មិនគ្រប់គ្រាន', 400);
        }

        return $usages;
    }
}
