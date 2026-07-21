<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyReport extends Model
{
    protected $fillable = [
        'report_date',
        'total_normal_fuel_liters',
        'total_super_fuel_liters',
        'total_diesel_liters',
        'total_liters',
        'total_amount_khr',
        'total_amount_usd',
        'discount_amount',
        'debt_collected_khr',
        'final_amount_khr',
        'final_amount_usd',
        'status',
        'is_archived',
        'closed_at',
        'snapshot_json',
    ];

    protected function casts(): array
    {
        return [
            'report_date' => 'date',
            'total_normal_fuel_liters' => 'float',
            'total_super_fuel_liters' => 'float',
            'total_diesel_liters' => 'float',
            'total_liters' => 'float',
            'total_amount_usd' => 'float',
            'final_amount_usd' => 'float',
            'is_archived' => 'boolean',
            'closed_at' => 'datetime',
        ];
    }
}
