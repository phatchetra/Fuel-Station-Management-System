<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyExpense;
use App\Services\AppSettingsService;
use App\Services\CalculationService;
use App\Services\DailyReportService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function __construct(
        private readonly AppSettingsService $settings,
        private readonly CalculationService $calc,
        private readonly DailyReportService $reports,
    ) {}

    public function index()
    {
        $records = DailyExpense::whereNull('daily_report_id')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (DailyExpense $record) => $this->reports->expenseFromDb($record));

        return ApiResponse::success($records);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => ['required', 'string', 'min:1'],
            'amount' => ['required', 'numeric', 'min:0.0001'],
            'expenseDate' => ['nullable', 'date'],
            'note' => ['nullable', 'string'],
        ]);

        $exchangeRate = $this->settings->getExchangeRate();
        $amountKHR = (int) round($validated['amount']);

        $record = DailyExpense::create([
            'category' => trim($validated['category']),
            'amount' => $amountKHR,
            'currency' => 'KHR',
            'amount_khr' => $amountKHR,
            'amount_usd' => $this->calc->khrToUsd($amountKHR, $exchangeRate),
            'expense_date' => $validated['expenseDate'] ?? now()->toDateString(),
            'note' => $validated['note'] ?? null,
        ]);

        return ApiResponse::success($this->reports->expenseFromDb($record), 201);
    }

    public function update(Request $request, int $id)
    {
        $record = DailyExpense::find($id);

        if (! $record) {
            return ApiResponse::error('មិនរកឃើញចំណាយ', 404);
        }

        if ($record->daily_report_id) {
            return ApiResponse::error('ចំណាយនេះត្រូវបានបិទរួចហើយ', 403);
        }

        $validated = $request->validate([
            'category' => ['sometimes', 'string', 'min:1'],
            'amount' => ['sometimes', 'numeric', 'min:0.0001'],
            'expenseDate' => ['sometimes', 'date'],
            'note' => ['nullable', 'string'],
        ]);

        $exchangeRate = $this->settings->getExchangeRate();
        $updates = [];

        if (isset($validated['category'])) {
            $updates['category'] = trim($validated['category']);
        }
        if (isset($validated['amount'])) {
            $amountKHR = (int) round($validated['amount']);
            $updates['amount'] = $amountKHR;
            $updates['amount_khr'] = $amountKHR;
            $updates['amount_usd'] = $this->calc->khrToUsd($amountKHR, $exchangeRate);
        }
        if (isset($validated['expenseDate'])) {
            $updates['expense_date'] = $validated['expenseDate'];
        }
        if (array_key_exists('note', $validated)) {
            $updates['note'] = $validated['note'];
        }

        $record->update($updates);

        return ApiResponse::success($this->reports->expenseFromDb($record->fresh()));
    }

    public function destroy(int $id)
    {
        $record = DailyExpense::find($id);

        if (! $record) {
            return ApiResponse::error('មិនរកឃើញចំណាយ', 404);
        }

        if ($record->daily_report_id) {
            return ApiResponse::error('ចំណាយនេះត្រូវបានបិទរួចហើយ', 403);
        }

        $record->delete();

        return ApiResponse::success(['success' => true]);
    }
}
