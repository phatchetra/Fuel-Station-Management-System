<?php

namespace App\Services;

use Carbon\Carbon;

class CalculationService
{
    public function calculateAmountKHR(float $liters, int $pricePerLiter): int
    {
        return (int) round($liters * $pricePerLiter);
    }

    public function khrToUsd(float $amountKHR, float $exchangeRate): float
    {
        if ($exchangeRate <= 0) {
            return 0;
        }

        return $amountKHR / $exchangeRate;
    }

    public function getStartAndEndOfDate(string|\DateTimeInterface|null $dateInput = null): array
    {
        if (is_string($dateInput) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateInput)) {
            $base = Carbon::createFromFormat('Y-m-d', $dateInput)->startOfDay();
        } else {
            $base = Carbon::parse($dateInput ?? now())->startOfDay();
        }

        return [
            'start' => $base->copy(),
            'end' => $base->copy()->endOfDay(),
        ];
    }

    public function getDateRangeFromQuickFilter(?string $quickFilter): ?array
    {
        $now = now();

        return match ($quickFilter) {
            'today' => $this->getStartAndEndOfDate($now),
            'yesterday' => $this->getStartAndEndOfDate($now->copy()->subDay()),
            'week' => [
                'start' => $now->copy()->startOfWeek(Carbon::MONDAY),
                'end' => $now->copy()->startOfWeek(Carbon::MONDAY)->addDays(6)->endOfDay(),
            ],
            'month' => [
                'start' => $now->copy()->startOfMonth(),
                'end' => $now->copy()->endOfMonth(),
            ],
            default => null,
        };
    }

    public function deriveDebtStatus(int $paidAmount, int $totalAmount): string
    {
        if ($paidAmount <= 0) {
            return 'UNPAID';
        }

        if ($paidAmount >= $totalAmount) {
            return 'PAID';
        }

        return 'PARTIAL';
    }
}
