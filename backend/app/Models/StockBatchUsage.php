<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockBatchUsage extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'stock_batch_id',
        'sale_id',
        'liters_used',
    ];

    protected function casts(): array
    {
        return [
            'liters_used' => 'float',
            'created_at' => 'datetime',
        ];
    }

    public function stockBatch(): BelongsTo
    {
        return $this->belongsTo(StockBatch::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }
}
