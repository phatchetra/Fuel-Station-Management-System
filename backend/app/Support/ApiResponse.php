<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    public const ERRORS = [
        'unauthorized' => 'សូម Login មុន',
        'serverError' => 'មានបញ្ហាក្នុងម៉ាស៊ីនមេ',
        'invalidJson' => 'ទិន្នន័យ JSON មិនត្រឹមត្រូវ',
        'invalidId' => 'លេខ ID មិនត្រឹមត្រូវ',
    ];

    public static function success(mixed $data, int $status = 200): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $data], $status)
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate')
            ->header('Pragma', 'no-cache');
    }

    public static function error(string $message, int $status = 400): JsonResponse
    {
        return response()->json(['success' => false, 'error' => $message], $status)
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate')
            ->header('Pragma', 'no-cache');
    }
}
