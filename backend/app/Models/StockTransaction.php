<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockTransaction extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'fuel_type_id',
        'type',
        'liters',
        'before_stock',
        'after_stock',
        'note',
        'stock_batch_id',
        'sale_id',
        'transaction_date',
        'created_by_id',
    ];

    protected function casts(): array
    {
        return [
            'liters' => 'float',
            'before_stock' => 'float',
            'after_stock' => 'float',
            'transaction_date' => 'datetime',
            'created_at' => 'datetime',
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
}
