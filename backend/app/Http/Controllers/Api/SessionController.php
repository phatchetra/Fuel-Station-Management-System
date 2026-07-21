<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AppSettingsService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function __construct(
        private readonly AppSettingsService $settings,
    ) {}

    public function show()
    {
        $sessionStartAt = $this->settings->getSessionStartAt();

        return ApiResponse::success(['sessionStartAt' => $sessionStartAt->toIso8601String()]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'sessionStartAt' => ['required', 'date'],
        ]);

        $sessionStartAt = $this->settings->setSessionStartAt(new \DateTime($validated['sessionStartAt']));

        return ApiResponse::success(['sessionStartAt' => $sessionStartAt->toIso8601String()]);
    }
}
