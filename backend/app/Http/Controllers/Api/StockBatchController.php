<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FuelType;
use App\Models\StockBatch;
use App\Models\StockTransaction;
use App\Services\StockBatchHelperService;
use App\Services\StockBatchSafetyService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockBatchController extends Controller
{
    public function __construct(
        private readonly StockBatchHelperService $helper,
        private readonly StockBatchSafetyService $safety,
    ) {}

    public function index(Request $request)
    {
        $query = StockBatch::query()->where('is_deleted', false);

        if ($request->filled('fuelTypeId')) {
            $fuelTypeId = (int) $request->query('fuelTypeId');
            if ($fuelTypeId <= 0) {
                return ApiResponse::error('លេខសម្គាល់ប្រេងមិនត្រឹមត្រូវ', 400);
            }
            $query->where('fuel_type_id', $fuelTypeId);
        }

        $statusFilter = strtoupper($request->query('status', 'ALL'));
        if ($statusFilter !== 'ALL') {
            if (! in_array($statusFilter, ['ACTIVE', 'DEPLETED'])) {
                return ApiResponse::error('ស្ថានភាពមិនត្រឹមត្រូវ', 400);
            }
            $query->where('status', $statusFilter);
        }

        if ($request->filled('from')) {
            $from = new \DateTime($request->query('from'));
            if (! $from) {
                return ApiResponse::error('ថ្ងៃចាប់ផ្តើមមិនត្រឹមត្រូវ', 400);
            }
            $query->where('received_at', '>=', $from);
        }

        if ($request->filled('to')) {
            $to = new \DateTime($request->query('to'));
            if (! $to) {
                return ApiResponse::error('ថ្ងៃបញ្ចប់មិនត្រឹមត្រូវ', 400);
            }
            $to->setTime(23, 59, 59);
            $query->where('received_at', '<=', $to);
        }

        $batches = $query->with(['fuelType', 'usages'])->orderByDesc('received_at')->orderByDesc('id')->get();
        $fuelTypeIds = $batches->pluck('fuel_type_id')->unique()->values()->all();
        $averageDailyByFuel = $this->helper->getAverageDailyLitersByFuel($fuelTypeIds);

        $data = $batches->map(fn (StockBatch $batch) => $this->helper->enrichStockBatch(
            $batch,
            $averageDailyByFuel[$batch->fuel_type_id] ?? 0
        ))->values();

        return ApiResponse::success($data);
    }

    public function update(Request $request, int $id)
    {
        $batch = StockBatch::with(['fuelType', 'usages'])->find($id);

        if (! $batch || $batch->is_deleted) {
            return ApiResponse::error('មិនរកឃើញប្រវត្តិស្តុកចូល', 404);
        }

        $permissions = $this->safety->getBatchPermissions($batch);

        if (! $permissions['canEdit']) {
            return ApiResponse::error($permissions['editBlockReason'] ?? StockBatchSafetyService::MSG_LOCKED_BY_REPORT, 403);
        }

        $validated = $request->validate([
            'originalLiters' => ['sometimes', 'numeric', 'min:0.0001'],
            'receivedAt' => ['sometimes', 'date'],
            'note' => ['nullable', 'string'],
            'confirmUsedEdit' => ['sometimes', 'boolean'],
        ]);

        if ($permissions['editRequiresWarning'] && empty($validated['confirmUsedEdit'])) {
            return ApiResponse::error('ស្តុកនេះមានការប្រើប្រាស់រួចហើយ។ សូមបញ្ជាក់មុនកែប្រែ', 409);
        }

        $soldLiters = $this->safety->getSoldLiters($batch);
        $updates = [];
        $stockDelta = 0;

        if (isset($validated['receivedAt'])) {
            $updates['received_at'] = $validated['receivedAt'];
        }

        if (array_key_exists('note', $validated)) {
            $updates['note'] = isset($validated['note']) ? trim($validated['note']) : null;
        }

        if (isset($validated['originalLiters'])) {
            $newOriginal = $validated['originalLiters'];

            if ($newOriginal < $soldLiters) {
                return ApiResponse::error("ចំនួនលីត្រ ត្រូវតែធំជាង ឬស្មើ {$soldLiters}L ដែលលក់រួច", 400);
            }

            $newRemaining = $newOriginal - $soldLiters;
            $stockDelta = $newOriginal - $batch->original_liters;

            $updates['original_liters'] = $newOriginal;
            $updates['remaining_liters'] = $newRemaining;
            $updates['status'] = $newRemaining <= 0 ? 'DEPLETED' : 'ACTIVE';
            $updates['depleted_at'] = $newRemaining <= 0 ? now() : null;
        }

        $fuel = $batch->fuelType;
        $nextStock = $fuel->current_stock + $stockDelta;

        if ($stockDelta !== 0 && $nextStock > $fuel->capacity) {
            return ApiResponse::error('ស្តុកលើសសមត្ថភាពធុង', 400);
        }

        if ($stockDelta !== 0 && $nextStock < 0) {
            return ApiResponse::error('ស្តុកមិនគ្រប់គ្រាន', 400);
        }

        $result = DB::transaction(function () use ($batch, $updates, $stockDelta, $fuel, $nextStock) {
            $batch->update($updates);

            if ($stockDelta !== 0) {
                $fuel->update(['current_stock' => $nextStock]);
            }

            return [
                'batch' => $batch->fresh()->load(['fuelType', 'usages']),
                'fuel' => $fuel->fresh()->toApiArray(),
            ];
        });

        $averageDailyByFuel = $this->helper->getAverageDailyLitersByFuel([$result['batch']->fuel_type_id]);

        return ApiResponse::success([
            'batch' => $this->helper->enrichStockBatch($result['batch'], $averageDailyByFuel[$result['batch']->fuel_type_id] ?? 0),
            'fuel' => $result['fuel'],
        ]);
    }

    public function destroy(Request $request, int $id)
    {
        $batch = StockBatch::with(['fuelType', 'usages'])->find($id);

        if (! $batch || $batch->is_deleted) {
            return ApiResponse::error('មិនរកឃើញប្រវត្តិស្តុកចូល', 404);
        }

        $permissions = $this->safety->getBatchPermissions($batch);

        if (! $permissions['canDelete']) {
            return ApiResponse::error($permissions['deleteBlockReason'] ?? StockBatchSafetyService::MSG_DELETE_USED, 403);
        }

        $validated = $request->validate([
            'deletedReason' => ['nullable', 'string'],
        ]);

        $litersToRemove = $batch->remaining_liters;
        $fuel = $batch->fuelType;
        $nextStock = $fuel->current_stock - $litersToRemove;

        if ($litersToRemove > 0.0001 && $nextStock < 0) {
            return ApiResponse::error('ស្តុកមិនគ្រប់គ្រានសម្រាប់លុប', 400);
        }

        $isArchiveDelete = $permissions['fullyDepleted'];

        $result = DB::transaction(function () use ($batch, $validated, $litersToRemove, $fuel, $nextStock, $isArchiveDelete) {
            $batch->update([
                'is_deleted' => true,
                'deleted_at' => now(),
                'deleted_reason' => $validated['deletedReason'] ?? ($isArchiveDelete ? 'លុបប្រវត្តិស្តុកលក់អស់' : 'លុបដោយអ្នកប្រើ'),
                'status' => 'DEPLETED',
                'remaining_liters' => 0,
            ]);

            if ($litersToRemove > 0.0001) {
                $fuel->update(['current_stock' => $nextStock]);
            }

            StockTransaction::where('stock_batch_id', $batch->id)->update([
                'note' => $isArchiveDelete ? 'បានលុបប្រវត្តិ — ស្តុកលក់អស់' : 'បានលុប — ស្តុកបាច់ត្រូវបានលុប',
            ]);

            return ['fuel' => $fuel->fresh()->toApiArray()];
        });

        return ApiResponse::success(['success' => true, 'fuel' => $result['fuel']]);
    }
}
