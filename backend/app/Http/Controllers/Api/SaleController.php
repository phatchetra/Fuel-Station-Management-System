<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FuelType;
use App\Models\Sale;
use App\Models\SaleCorrection;
use App\Services\AppSettingsService;
use App\Services\CalculationService;
use App\Services\SaleSafetyService;
use App\Services\SaleStockService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    public function __construct(
        private readonly SaleStockService $saleStock,
        private readonly SaleSafetyService $saleSafety,
        private readonly AppSettingsService $settings,
        private readonly CalculationService $calc,
    ) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'fuelTypeId' => ['required', 'integer', 'min:1'],
            'liters' => ['required', 'numeric', 'min:0.0001'],
            'saleDate' => ['nullable', 'date'],
            'note' => ['nullable', 'string'],
        ]);

        $fuel = FuelType::find($validated['fuelTypeId']);

        if (! $fuel || ! $fuel->is_active) {
            return ApiResponse::error('មិនរកឃើញប្រភេទប្រេង', 404);
        }

        if ($fuel->current_stock < $validated['liters']) {
            return ApiResponse::error('ស្តុកមិនគ្រប់គ្រាន', 400);
        }

        $saleDate = isset($validated['saleDate']) ? new \DateTime($validated['saleDate']) : now();
        $amountKHR = $this->calc->calculateAmountKHR($validated['liters'], $fuel->price_per_liter);

        try {
            $result = DB::transaction(function () use ($validated, $fuel, $saleDate, $amountKHR, $request) {
                $sale = Sale::create([
                    'fuel_type_id' => $validated['fuelTypeId'],
                    'liters' => $validated['liters'],
                    'price_per_liter' => $fuel->price_per_liter,
                    'amount_khr' => $amountKHR,
                    'sale_date' => $saleDate,
                    'note' => isset($validated['note']) ? trim($validated['note']) : null,
                    'created_by_id' => $request->user()->id,
                ]);

                $updatedFuel = $this->saleStock->apply(
                    $sale,
                    $request->user()->id,
                    $saleDate,
                    $validated['note'] ?? null
                );

                return [
                    'sale' => $sale->fresh()->load('fuelType'),
                    'fuel' => $updatedFuel->toApiArray(),
                    'batchUsages' => $sale->batchUsages()->get(),
                ];
            });
        } catch (\Exception $e) {
            if ($e->getCode() === 400) {
                return ApiResponse::error($e->getMessage(), 400);
            }
            throw $e;
        }

        return ApiResponse::success($result, 201);
    }

    public function update(Request $request, int $id)
    {
        $sale = Sale::with('fuelType')->find($id);

        if (! $sale) {
            return ApiResponse::error('មិនរកឃើញកំណត់ត្រាលក់', 404);
        }

        $sessionStartAt = $this->settings->getSessionStartAt();
        $permissions = $this->saleSafety->getSalePermissions($sale, $sessionStartAt);

        if (! $permissions['canEdit']) {
            return ApiResponse::error(SaleSafetyService::MSG_SALE_LOCKED, 403);
        }

        $validated = $request->validate([
            'fuelTypeId' => ['required', 'integer', 'min:1'],
            'liters' => ['required', 'numeric', 'min:0.0001'],
            'pricePerLiter' => ['required', 'integer', 'min:1'],
            'saleDate' => ['required', 'date'],
            'note' => ['nullable', 'string'],
        ]);

        $saleDateValue = new \DateTime($validated['saleDate']);

        if ($saleDateValue < $sessionStartAt) {
            return ApiResponse::error('ថ្ងៃលក់ត្រូវតែនៅក្នុងវគ្គបច្ចុប្បន្ន', 400);
        }

        $amountKHR = $this->calc->calculateAmountKHR($validated['liters'], $validated['pricePerLiter']);

        try {
            $result = DB::transaction(function () use ($sale, $validated, $saleDateValue, $amountKHR, $request) {
                $this->saleStock->reverse($sale);

                $updatedSale = tap($sale)->update([
                    'fuel_type_id' => $validated['fuelTypeId'],
                    'liters' => $validated['liters'],
                    'price_per_liter' => $validated['pricePerLiter'],
                    'amount_khr' => $amountKHR,
                    'sale_date' => $saleDateValue,
                    'note' => isset($validated['note']) ? trim($validated['note']) : null,
                ]);

                $fuel = $this->saleStock->apply(
                    $updatedSale->fresh(),
                    $request->user()->id,
                    $saleDateValue,
                    $validated['note'] ?? null
                );

                return [
                    'sale' => $updatedSale->fresh()->load('fuelType'),
                    'fuel' => $fuel->toApiArray(),
                ];
            });
        } catch (\Exception $e) {
            if (in_array($e->getCode(), [400, 404])) {
                return ApiResponse::error($e->getMessage(), $e->getCode());
            }
            throw $e;
        }

        return ApiResponse::success($result);
    }

    public function destroy(int $id)
    {
        $sale = Sale::with('fuelType')->find($id);

        if (! $sale) {
            return ApiResponse::error('មិនរកឃើញកំណត់ត្រាលក់', 404);
        }

        $sessionStartAt = $this->settings->getSessionStartAt();
        $permissions = $this->saleSafety->getSalePermissions($sale, $sessionStartAt);

        if (! $permissions['canDelete']) {
            return ApiResponse::error(SaleSafetyService::MSG_SALE_LOCKED, 403);
        }

        $fuel = DB::transaction(function () use ($sale) {
            $this->saleStock->reverse($sale);
            $updatedFuel = FuelType::find($sale->fuel_type_id);
            $sale->delete();

            return $updatedFuel?->toApiArray();
        });

        return ApiResponse::success(['success' => true, 'fuel' => $fuel]);
    }

    public function correction(Request $request, int $id)
    {
        $sale = Sale::with('fuelType')->find($id);

        if (! $sale) {
            return ApiResponse::error('មិនរកឃើញកំណត់ត្រាលក់', 404);
        }

        $sessionStartAt = $this->settings->getSessionStartAt();
        $permissions = $this->saleSafety->getSalePermissions($sale, $sessionStartAt);

        if ($permissions['inOpenSession']) {
            return ApiResponse::error('កំណត់ត្រានេះនៅក្នុងវគ្គបច្ចុប្បន្ន — សូមប្រើកែប្រែធម្មតា', 400);
        }

        $validated = $request->validate([
            'fuelTypeId' => ['required', 'integer', 'min:1'],
            'liters' => ['required', 'numeric', 'min:0.0001'],
            'pricePerLiter' => ['required', 'integer', 'min:1'],
            'saleDate' => ['required', 'date'],
            'reason' => ['required', 'string', 'min:1'],
            'note' => ['nullable', 'string'],
        ]);

        $correctedAmountKHR = $this->calc->calculateAmountKHR($validated['liters'], $validated['pricePerLiter']);

        $correction = SaleCorrection::create([
            'sale_id' => $sale->id,
            'original_fuel_type_id' => $sale->fuel_type_id,
            'original_liters' => $sale->liters,
            'original_price_per_liter' => $sale->price_per_liter,
            'original_amount_khr' => $sale->amount_khr,
            'original_sale_date' => $sale->sale_date,
            'corrected_fuel_type_id' => $validated['fuelTypeId'],
            'corrected_liters' => $validated['liters'],
            'corrected_price_per_liter' => $validated['pricePerLiter'],
            'corrected_amount_khr' => $correctedAmountKHR,
            'corrected_sale_date' => $validated['saleDate'],
            'reason' => trim($validated['reason']),
            'created_by_id' => $request->user()->id,
        ]);

        if (! empty($validated['note'])) {
            $sale->update(['note' => trim($validated['note'])]);
        }

        return ApiResponse::success([
            'correction' => $correction,
            'message' => 'បានកត់ត្រាកែតម្រូវជោគជ័យ',
        ], 201);
    }
}
