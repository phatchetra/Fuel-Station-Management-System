<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => ['required', 'string'],
                'password' => ['required', 'string'],
            ]);
        } catch (ValidationException) {
            return response()->json(['error' => 'សូមបញ្ចូលអ៊ីមែល និងពាក្យសម្ងាត់'], 400);
        }

        $email = strtolower(trim($validated['email']));
        $user = User::where('email', $email)->first();

        if (! $user || ! Auth::attempt(['email' => $email, 'password' => $validated['password']])) {
            return response()->json(['error' => 'អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ'], 401);
        }

        $request->session()->regenerate();

        return response()->json(['user' => $user->toPublicArray()]);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return ApiResponse::success(['success' => true]);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return ApiResponse::error(ApiResponse::ERRORS['unauthorized'], 401);
        }

        return ApiResponse::success($user->toPublicArray());
    }
}
