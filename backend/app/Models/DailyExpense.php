<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyExpense extends Model
{
    protected $fillable = [
        'expense_date',
        'category',
        'amount',
        'currency',
        'amount_khr',
        'amount_usd',
        'note',
        'daily_report_id',
    ];

    protected function casts(): array
    {
        return [
            'expense_date' => 'date',
            'amount' => 'float',
            'amount_usd' => 'float',
        ];
    }
}
