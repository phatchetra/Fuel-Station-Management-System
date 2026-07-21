<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Services\AppSettingsService;
use App\Services\CalculationService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class HistoryController extends Controller
{
    public function __construct(
        private readonly AppSettingsService $settings,
        private readonly CalculationService $calc,
    ) {}

    public function index(Request $request)
    {
        $quickFilter = $request->query('quickFilter');
        $from = $request->query('from');
        $to = $request->query('to');
        $q = strtolower(trim($request->query('q', '')));

        $exchangeRate = $this->settings->getExchangeRate();
        $dateFilter = null;

        if ($quickFilter) {
            $dateFilter = $this->calc->getDateRangeFromQuickFilter($quickFilter);
        } elseif ($from || $to) {
            $dateFilter = [
                'start' => $from ? $this->calc->getStartAndEndOfDate($from)['start'] : now()->subYears(100),
                'end' => $to ? $this->calc->getStartAndEndOfDate($to)['end'] : now()->addYears(100),
            ];
        }

        $query = Sale::with('fuelType')->orderByDesc('sale_date');

        if ($dateFilter) {
            $query->whereBetween('sale_date', [$dateFilter['start'], $dateFilter['end']]);
        }

        $sales = $query->get();

        if ($q) {
            $sales = $sales->filter(function (Sale $sale) use ($q) {
                $dateStr = $sale->sale_date?->format('Y-m-d') ?? '';
                $name = strtolower($sale->fuelType?->name_khmer ?? '');
                $slug = strtolower($sale->fuelType?->slug ?? '');

                return str_contains($name, $q) || str_contains($slug, $q) || str_contains($dateStr, $q);
            });
        }

        $groups = [];

        foreach ($sales as $sale) {
            $dateKey = $sale->sale_date?->format('Y-m-d') ?? '';

            if (! isset($groups[$dateKey])) {
                $groups[$dateKey] = ['date' => $dateKey, 'totalKHR' => 0, 'fuelMap' => [], 'sales' => []];
            }

            $groups[$dateKey]['totalKHR'] += $sale->amount_khr;
            $groups[$dateKey]['sales'][] = [
                'id' => $sale->id,
                'fuelTypeId' => $sale->fuel_type_id,
                'liters' => $sale->liters,
                'pricePerLiter' => $sale->price_per_liter,
                'amountKHR' => $sale->amount_khr,
                'saleDate' => $sale->sale_date?->toIso8601String(),
                'note' => $sale->note ?? '',
                'fuelType' => $sale->fuelType ? [
                    'id' => $sale->fuelType->id,
                    'nameKhmer' => $sale->fuelType->name_khmer,
                    'slug' => $sale->fuelType->slug,
                    'accentColor' => $sale->fuelType->accent_color,
                ] : null,
            ];

            $fuelKey = $sale->fuelType?->slug ?? (string) $sale->fuel_type_id;

            if (! isset($groups[$dateKey]['fuelMap'][$fuelKey])) {
                $groups[$dateKey]['fuelMap'][$fuelKey] = [
                    'nameKhmer' => $sale->fuelType?->name_khmer ?? '—',
                    'slug' => $sale->fuelType?->slug ?? $fuelKey,
                    'liters' => 0,
                    'amountKHR' => 0,
                ];
            }

            $groups[$dateKey]['fuelMap'][$fuelKey]['liters'] += $sale->liters;
            $groups[$dateKey]['fuelMap'][$fuelKey]['amountKHR'] += $sale->amount_khr;
        }

        $data = collect($groups)->map(fn ($group) => [
            'date' => $group['date'],
            'totalKHR' => $group['totalKHR'],
            'totalUSD' => $this->calc->khrToUsd($group['totalKHR'], $exchangeRate),
            'fuelSummary' => array_values($group['fuelMap']),
            'sales' => $group['sales'],
        ])->sortByDesc('date')->values();

        return ApiResponse::success($data);
    }
}
