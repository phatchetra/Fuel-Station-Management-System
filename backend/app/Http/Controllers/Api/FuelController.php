<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FuelType;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class FuelController extends Controller
{
    public function index()
    {
        $fuels = FuelType::where('is_active', true)
            ->orderBy('id')
            ->get()
            ->map(fn (FuelType $fuel) => $fuel->toApiArray());

        return ApiResponse::success($fuels);
    }

    public function update(Request $request, int $id)
    {
        $fuel = FuelType::find($id);

        if (! $fuel) {
            return ApiResponse::error('មិនរកឃើញប្រភេទប្រេង', 404);
        }

        $validated = $request->validate([
            'pricePerLiter' => ['sometimes', 'integer', 'min:1'],
            'capacity' => ['sometimes', 'numeric', 'min:0.0001'],
            'nameKhmer' => ['sometimes', 'string', 'min:1'],
            'accentColor' => ['sometimes', 'string', 'min:1'],
        ]);

        $updates = [];

        if (isset($validated['pricePerLiter'])) {
            $updates['price_per_liter'] = $validated['pricePerLiter'];
        }
        if (isset($validated['capacity'])) {
            $updates['capacity'] = $validated['capacity'];
        }
        if (isset($validated['nameKhmer'])) {
            $updates['name_khmer'] = trim($validated['nameKhmer']);
        }
        if (isset($validated['accentColor'])) {
            $updates['accent_color'] = trim($validated['accentColor']);
        }

        $fuel->update($updates);

        return ApiResponse::success($fuel->fresh()->toApiArray());
    }
}
