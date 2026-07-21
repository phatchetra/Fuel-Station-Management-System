<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FuelType extends Model
{
    protected $fillable = [
        'name_khmer',
        'slug',
        'accent_color',
        'price_per_liter',
        'current_stock',
        'capacity',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'current_stock' => 'float',
            'capacity' => 'float',
            'is_active' => 'boolean',
        ];
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function stockBatches(): HasMany
    {
        return $this->hasMany(StockBatch::class);
    }

    public function stockTransactions(): HasMany
    {
        return $this->hasMany(StockTransaction::class);
    }

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'nameKhmer' => $this->name_khmer,
            'slug' => $this->slug,
            'accentColor' => $this->accent_color,
            'pricePerLiter' => $this->price_per_liter,
            'currentStock' => $this->current_stock,
            'capacity' => $this->capacity,
            'isActive' => $this->is_active,
        ];
    }
}
