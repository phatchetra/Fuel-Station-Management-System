<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DailyReportController;
use App\Http\Controllers\Api\DebtController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\FuelController;
use App\Http\Controllers\Api\HistoryController;
use App\Http\Controllers\Api\RefillController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\SessionController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\StockBatchController;
use App\Http\Controllers\Api\SummaryController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/fuels', [FuelController::class, 'index']);
    Route::patch('/fuels/{id}', [FuelController::class, 'update']);

    Route::post('/sales', [SaleController::class, 'store']);
    Route::patch('/sales/{id}', [SaleController::class, 'update']);
    Route::delete('/sales/{id}', [SaleController::class, 'destroy']);
    Route::post('/sales/{id}/corrections', [SaleController::class, 'correction']);

    Route::post('/refills', [RefillController::class, 'store']);

    Route::get('/stock-batches', [StockBatchController::class, 'index']);
    Route::patch('/stock-batches/{id}', [StockBatchController::class, 'update']);
    Route::delete('/stock-batches/{id}', [StockBatchController::class, 'destroy']);

    Route::get('/history', [HistoryController::class, 'index']);
    Route::get('/summary', [SummaryController::class, 'index']);

    Route::get('/settings/exchange-rate', [SettingsController::class, 'getExchangeRate']);
    Route::patch('/settings/exchange-rate', [SettingsController::class, 'updateExchangeRate']);

    Route::get('/session', [SessionController::class, 'show']);
    Route::patch('/session', [SessionController::class, 'update']);

    Route::get('/debts', [DebtController::class, 'index']);
    Route::post('/debts', [DebtController::class, 'store']);
    Route::delete('/debts/{id}', [DebtController::class, 'destroy']);
    Route::post('/debts/{id}/payments', [DebtController::class, 'storePayment']);

    Route::get('/expenses', [ExpenseController::class, 'index']);
    Route::post('/expenses', [ExpenseController::class, 'store']);
    Route::patch('/expenses/{id}', [ExpenseController::class, 'update']);
    Route::delete('/expenses/{id}', [ExpenseController::class, 'destroy']);

    Route::get('/daily-reports', [DailyReportController::class, 'index']);
    Route::post('/daily-reports', [DailyReportController::class, 'store']);
});
