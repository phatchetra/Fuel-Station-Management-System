<?php

namespace App\Services;

use App\Models\StockBatch;

class StockBatchSafetyService
{
    public const EPSILON = 0.0001;

    public const MSG_DELETE_USED = 'មិនអាចលុបបានទេ ព្រោះស្តុកនេះមានការប្រើប្រាស់រួចហើយ។ សូមប្រើការកែតម្រូវជំនួសវិញ។';

    public const MSG_LOCKED_BY_REPORT = 'ស្តុកនេះត្រូវបានបញ្ចូលក្នុងរបាយការណ៍បិទបញ្ជីរួចហើយ មិនអាចកែ ឬលុបដោយផ្ទាល់បានទេ';

    public function getSoldLiters(StockBatch $batch): float
    {
        $fromRemaining = $batch->original_liters - $batch->remaining_liters;
        $fromUsages = $batch->relationLoaded('usages')
            ? $batch->usages->sum('liters_used')
            : $batch->usages()->sum('liters_used');

        return max(0, $fromRemaining, $fromUsages);
    }

    public function getBatchPermissions(StockBatch $batch): array
    {
        $soldLiters = $this->getSoldLiters($batch);
        $hasUsages = $soldLiters > self::EPSILON || ($batch->usages?->count() ?? 0) > 0;
        $fullyDepleted = $batch->status === 'DEPLETED' || ($batch->remaining_liters <= self::EPSILON && $soldLiters > self::EPSILON);
        $isLockedByReport = $batch->locked_by_report_id !== null;
        $isDeleted = $batch->is_deleted === true;

        $canDelete = false;
        $canEdit = false;
        $deleteBlockReason = null;
        $editBlockReason = null;
        $editRequiresWarning = false;

        if ($isDeleted) {
            $deleteBlockReason = 'បានលុបរួចហើយ';
            $editBlockReason = $deleteBlockReason;
        } elseif ($isLockedByReport) {
            $deleteBlockReason = self::MSG_LOCKED_BY_REPORT;
            $editBlockReason = self::MSG_LOCKED_BY_REPORT;
        } elseif ($fullyDepleted) {
            $canDelete = true;
            $editBlockReason = 'ស្តុកលក់អស់ហើយ — មិនអាចកែប្រែបាន';
        } elseif ($hasUsages) {
            $canEdit = true;
            $editRequiresWarning = true;
            $deleteBlockReason = self::MSG_DELETE_USED;
        } else {
            $canDelete = true;
            $canEdit = true;
        }

        return compact(
            'soldLiters', 'hasUsages', 'fullyDepleted', 'isLockedByReport', 'isDeleted',
            'canDelete', 'canEdit', 'editRequiresWarning', 'deleteBlockReason', 'editBlockReason'
        );
    }
}
