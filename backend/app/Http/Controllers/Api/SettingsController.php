<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AppSettingsService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function __construct(
        private readonly AppSettingsService $settings,
    ) {}

    public function getExchangeRate()
    {
        return ApiResponse::success(['exchangeRate' => $this->settings->getExchangeRate()]);
    }

    public function updateExchangeRate(Request $request)
    {
        $validated = $request->validate([
            'exchangeRate' => ['required', 'numeric', 'min:0.0001'],
        ]);

        $rate = $this->settings->setExchangeRate((float) $validated['exchangeRate']);

        return ApiResponse::success(['exchangeRate' => $rate]);
    }
}
