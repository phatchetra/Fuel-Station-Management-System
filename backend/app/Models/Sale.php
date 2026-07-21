<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    protected $fillable = [
        'fuel_type_id',
        'liters',
        'price_per_liter',
        'amount_khr',
        'sale_date',
        'note',
        'created_by_id',
    ];

    protected function casts(): array
    {
        return [
            'liters' => 'float',
            'sale_date' => 'datetime',
        ];
    }

    public function fuelType(): BelongsTo
    {
        return $this->belongsTo(FuelType::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function batchUsages(): HasMany
    {
        return $this->hasMany(StockBatchUsage::class);
    }

    public function corrections(): HasMany
    {
        return $this->hasMany(SaleCorrection::class);
    }
}
