<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FuelType;
use App\Models\StockBatch;
use App\Models\StockTransaction;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RefillController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'fuelTypeId' => ['required', 'integer', 'min:1'],
            'liters' => ['required', 'numeric', 'min:0.0001'],
            'refillDate' => ['nullable', 'date'],
            'note' => ['nullable', 'string'],
        ]);

        $fuel = FuelType::find($validated['fuelTypeId']);

        if (! $fuel || ! $fuel->is_active) {
            return ApiResponse::error('មិនរកឃើញប្រភេទប្រេង', 404);
        }

        $receivedAt = isset($validated['refillDate']) ? new \DateTime($validated['refillDate']) : now();
        $beforeStock = $fuel->current_stock;
        $afterStock = $beforeStock + $validated['liters'];

        if ($afterStock > $fuel->capacity) {
            return ApiResponse::error('ស្តុកលើសសមត្ថភាពធុង', 400);
        }

        $result = DB::transaction(function () use ($validated, $fuel, $receivedAt, $beforeStock, $afterStock, $request) {
            $stockBatch = StockBatch::create([
                'fuel_type_id' => $validated['fuelTypeId'],
                'original_liters' => $validated['liters'],
                'remaining_liters' => $validated['liters'],
                'received_at' => $receivedAt,
                'status' => 'ACTIVE',
                'note' => $validated['note'] ?? null,
                'created_by_id' => $request->user()->id,
            ]);

            $transaction = StockTransaction::create([
                'fuel_type_id' => $validated['fuelTypeId'],
                'type' => 'REFILL',
                'liters' => $validated['liters'],
                'before_stock' => $beforeStock,
                'after_stock' => $afterStock,
                'note' => $validated['note'] ?? null,
                'transaction_date' => $receivedAt,
                'created_by_id' => $request->user()->id,
                'stock_batch_id' => $stockBatch->id,
            ]);

            $updatedFuel = tap($fuel)->update(['current_stock' => $afterStock]);

            return [
                'fuel' => $updatedFuel->fresh()->toApiArray(),
                'transaction' => $transaction,
                'stockBatch' => $stockBatch,
            ];
        });

        return ApiResponse::success($result, 201);
    }
}
