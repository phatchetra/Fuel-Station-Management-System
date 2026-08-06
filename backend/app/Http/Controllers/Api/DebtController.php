<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Debt;
use App\Models\DebtPayment;
use App\Services\CalculationService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DebtController extends Controller
{
    public function __construct(
        private readonly CalculationService $calc,
    ) {}

    public function index()
    {
        $debts = Debt::with('payments')->orderByDesc('created_at')->get();

        return ApiResponse::success($debts);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customerName' => ['required', 'string', 'min:1'],
            'phoneOrNote' => ['nullable', 'string'],
            'totalAmount' => ['required', 'integer', 'min:1'],
            'debtDate' => ['nullable', 'date'],
        ]);

        $debt = Debt::create([
            'customer_name' => trim($validated['customerName']),
            'phone_or_note' => $validated['phoneOrNote'] ?? null,
            'total_amount' => $validated['totalAmount'],
            'paid_amount' => 0,
            'remaining_amount' => $validated['totalAmount'],
            'status' => 'UNPAID',
            'debt_date' => $validated['debtDate'] ?? now(),
            'created_by_id' => $request->user()->id,
        ]);

        return ApiResponse::success($debt->load('payments'), 201);
    }

    public function destroy(int $id)
    {
        $debt = Debt::find($id);

        if (! $debt) {
            return ApiResponse::error('មិនរកឃើញការជំពាក់', 404);
        }

        $debt->delete();

        return ApiResponse::success(['success' => true]);
    }

    public function storePayment(Request $request, int $id)
    {
        $debt = Debt::find($id);

        if (! $debt) {
            return ApiResponse::error('មិនរកឃើញការជំពាក់', 404);
        }

        if ($debt->status === 'PAID' || $debt->remaining_amount <= 0) {
            return ApiResponse::error('ការជំពាក់នេះសងរួចហើយ', 400);
        }

        $validated = $request->validate([
            'amount' => ['required', 'integer', 'min:1'],
        ]);

        if ($validated['amount'] > $debt->remaining_amount) {
            return ApiResponse::error('ចំនួនលុយសងលើសចំនួននៅសល់', 400);
        }

        $newPaidAmount = $debt->paid_amount + $validated['amount'];
        $newRemainingAmount = $debt->remaining_amount - $validated['amount'];
        $newStatus = $this->calc->deriveDebtStatus($newPaidAmount, $debt->total_amount);

        $updatedDebt = DB::transaction(function () use ($debt, $validated, $newPaidAmount, $newRemainingAmount, $newStatus, $request) {
            DebtPayment::create([
                'debt_id' => $debt->id,
                'amount' => $validated['amount'],
                'paid_at' => now(),
                'created_by_id' => $request->user()->id,
            ]);

            $debt->update([
                'paid_amount' => $newPaidAmount,
                'remaining_amount' => $newRemainingAmount,
                'status' => $newStatus,
            ]);

            return $debt->fresh()->load('payments');
        });

        return ApiResponse::success($updatedDebt, 201);
    }
}
