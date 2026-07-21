<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockBatch extends Model
{
    protected $fillable = [
        'fuel_type_id',
        'original_liters',
        'remaining_liters',
        'received_at',
        'depleted_at',
        'status',
        'note',
        'is_deleted',
        'deleted_at',
        'deleted_reason',
        'locked_by_report_id',
        'created_by_id',
    ];

    protected function casts(): array
    {
        return [
            'original_liters' => 'float',
            'remaining_liters' => 'float',
            'received_at' => 'datetime',
            'depleted_at' => 'datetime',
            'is_deleted' => 'boolean',
            'deleted_at' => 'datetime',
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

    public function usages(): HasMany
    {
        return $this->hasMany(StockBatchUsage::class);
    }
}
