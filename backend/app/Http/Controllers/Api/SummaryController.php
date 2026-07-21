<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Debt;
use App\Models\FuelType;
use App\Models\Sale;
use App\Services\AppSettingsService;
use App\Services\CalculationService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class SummaryController extends Controller
{
    public function __construct(
        private readonly AppSettingsService $settings,
        private readonly CalculationService $calc,
    ) {}

    public function index(Request $request)
    {
        $dateKey = $request->query('date') ?: now()->format('Y-m-d');
        $range = $this->calc->getStartAndEndOfDate($dateKey);
        $exchangeRate = $this->settings->getExchangeRate();

        $fuels = FuelType::where('is_active', true)->orderBy('id')->get();
        $sales = Sale::whereBetween('sale_date', [$range['start'], $range['end']])->get();
        $debts = Debt::whereBetween('debt_date', [$range['start'], $range['end']])->with('payments')->get();

        $fuelRows = $fuels->map(function ($fuel) use ($sales, $exchangeRate) {
            $fuelSales = $sales->where('fuel_type_id', $fuel->id);
            $litersSold = $fuelSales->sum('liters');
            $amountKHR = $fuelSales->sum('amount_khr');

            return [
                'fuelTypeId' => $fuel->id,
                'nameKhmer' => $fuel->name_khmer,
                'slug' => $fuel->slug,
                'litersSold' => $litersSold,
                'amountKHR' => $amountKHR,
                'amountUSD' => $this->calc->khrToUsd($amountKHR, $exchangeRate),
            ];
        })->values();

        $debtTodayTotalKHR = 0;
        foreach ($debts as $debt) {
            foreach ($debt->payments as $payment) {
                $debtTodayTotalKHR += $payment->amount;
            }
        }

        $totalLiters = $fuelRows->sum('litersSold');
        $grandTotalKHR = $fuelRows->sum('amountKHR') + $debtTodayTotalKHR;

        return ApiResponse::success([
            'exchangeRate' => $exchangeRate,
            'date' => $dateKey,
            'fuelRows' => $fuelRows,
            'debtTodayTotalKHR' => $debtTodayTotalKHR,
            'debtTodayTotalUSD' => $this->calc->khrToUsd($debtTodayTotalKHR, $exchangeRate),
            'totalLiters' => $totalLiters,
            'grandTotalKHR' => $grandTotalKHR,
            'grandTotalUSD' => $this->calc->khrToUsd($grandTotalKHR, $exchangeRate),
        ]);
    }
}
