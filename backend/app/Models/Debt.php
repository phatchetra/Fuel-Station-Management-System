<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Debt extends Model
{
    protected $fillable = [
        'customer_name',
        'product_type',
        'liters',
        'phone_or_note',
        'total_amount',
        'paid_amount',
        'remaining_amount',
        'status',
        'debt_date',
        'created_by_id',
    ];

    protected function casts(): array
    {
        return [
            'liters' => 'float',
            'debt_date' => 'datetime',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(DebtPayment::class)->orderByDesc('paid_at');
    }
}
