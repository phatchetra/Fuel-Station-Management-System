<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailyReport;
use App\Services\DailyReportService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class DailyReportController extends Controller
{
    public function __construct(
        private readonly DailyReportService $reports,
    ) {}

    public function index()
    {
        $records = DailyReport::orderByDesc('closed_at')->get()
            ->map(fn (DailyReport $record) => $this->reports->dbRecordToReport($record));

        return ApiResponse::success($records);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'snapshot' => ['required', 'array'],
            'expenseIds' => ['nullable', 'array'],
            'expenseIds.*' => ['integer', 'min:1'],
        ]);

        $report = $this->reports->closeDay($validated['snapshot'], $validated['expenseIds'] ?? []);

        return ApiResponse::success($this->reports->dbRecordToReport($report), 201);
    }
}
