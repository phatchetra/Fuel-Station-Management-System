<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleCorrection extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'sale_id',
        'original_fuel_type_id',
        'original_liters',
        'original_price_per_liter',
        'original_amount_khr',
        'original_sale_date',
        'corrected_fuel_type_id',
        'corrected_liters',
        'corrected_price_per_liter',
        'corrected_amount_khr',
        'corrected_sale_date',
        'reason',
        'corrected_at',
        'created_by_id',
    ];

    protected function casts(): array
    {
        return [
            'original_liters' => 'float',
            'corrected_liters' => 'float',
            'original_sale_date' => 'datetime',
            'corrected_sale_date' => 'datetime',
            'corrected_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }
}
