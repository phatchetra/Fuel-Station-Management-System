<?php

namespace App\Services;

use App\Models\Sale;
use Carbon\Carbon;

class SaleSafetyService
{
    public const MSG_SALE_LOCKED = 'ទិន្នន័យនេះបានបិទរួចហើយ មិនអាចកែ ឬលុបដោយផ្ទាល់បានទេ';

    public function isSaleInOpenSession(Sale $sale, Carbon $sessionStartAt): bool
    {
        return Carbon::parse($sale->sale_date)->gte($sessionStartAt);
    }

    public function getSalePermissions(Sale $sale, Carbon $sessionStartAt): array
    {
        $inOpenSession = $this->isSaleInOpenSession($sale, $sessionStartAt);

        return [
            'inOpenSession' => $inOpenSession,
            'canEdit' => $inOpenSession,
            'canDelete' => $inOpenSession,
            'blockReason' => $inOpenSession ? null : self::MSG_SALE_LOCKED,
            'canCorrect' => ! $inOpenSession,
        ];
    }
}
