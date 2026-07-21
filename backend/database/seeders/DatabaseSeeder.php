<?php

namespace Database\Seeders;

use App\Models\AppSetting;
use App\Models\Debt;
use App\Models\DebtPayment;
use App\Models\FuelType;
use App\Models\Sale;
use App\Models\StockBatch;
use App\Models\StockTransaction;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@fuelledger.local')],
            [
                'name' => env('ADMIN_NAME', 'Admin'),
                'password' => Hash::make(env('ADMIN_PASSWORD', 'password')),
                'role' => 'OWNER',
            ]
        );

        $fuelTypes = [
            ['name_khmer' => 'សាំងធម្មតា', 'slug' => 'regular', 'accent_color' => 'blue', 'price_per_liter' => 500, 'current_stock' => 1500, 'capacity' => 2000],
            ['name_khmer' => 'សាំងស៊ុបពែរ', 'slug' => 'premium', 'accent_color' => 'red', 'price_per_liter' => 500, 'current_stock' => 1500, 'capacity' => 2000],
            ['name_khmer' => 'ម៉ាស៊ូត', 'slug' => 'diesel', 'accent_color' => 'green', 'price_per_liter' => 500, 'current_stock' => 1500, 'capacity' => 2000],
        ];

        $fuels = [];
        foreach ($fuelTypes as $fuel) {
            $fuels[$fuel['slug']] = FuelType::updateOrCreate(
                ['slug' => $fuel['slug']],
                array_merge($fuel, ['is_active' => true])
            );
        }

        AppSetting::updateOrCreate(['key' => 'exchangeRate'], ['value' => '4100']);

        if (StockBatch::count() === 0) {
            foreach ($fuels as $fuel) {
                if ($fuel->current_stock <= 0) {
                    continue;
                }

                StockBatch::create([
                    'fuel_type_id' => $fuel->id,
                    'original_liters' => $fuel->current_stock,
                    'remaining_liters' => $fuel->current_stock,
                    'received_at' => now(),
                    'status' => 'ACTIVE',
                    'note' => 'ស្តុកដំបូង',
                    'created_by_id' => $admin->id,
                ]);
            }
        }

        if (Sale::count() === 0) {
            foreach ($fuels as $slug => $fuel) {
                Sale::create([
                    'fuel_type_id' => $fuel->id,
                    'liters' => 200,
                    'price_per_liter' => 500,
                    'amount_khr' => 100000,
                    'sale_date' => now(),
                    'created_by_id' => $admin->id,
                ]);

                StockTransaction::create([
                    'fuel_type_id' => $fuel->id,
                    'type' => 'SALE',
                    'liters' => 200,
                    'before_stock' => 1700,
                    'after_stock' => 1500,
                    'transaction_date' => now(),
                    'created_by_id' => $admin->id,
                ]);
            }
        }

        if (Debt::count() === 0) {
            $demoDebts = [
                ['customer_name' => 'Bong Van', 'product_type' => 'regular', 'liters' => 20, 'phone_or_note' => 'Demo customer', 'total_amount' => 10000, 'paid_amount' => 5000, 'remaining_amount' => 5000, 'status' => 'PARTIAL', 'payments' => [5000]],
                ['customer_name' => 'Bong lo', 'product_type' => 'premium', 'liters' => 10, 'phone_or_note' => 'Demo customer', 'total_amount' => 5000, 'paid_amount' => 5000, 'remaining_amount' => 0, 'status' => 'PAID', 'payments' => [5000]],
                ['customer_name' => 'Ra bodora', 'product_type' => 'diesel', 'liters' => 15, 'phone_or_note' => 'Demo customer', 'total_amount' => 7500, 'paid_amount' => 7500, 'remaining_amount' => 0, 'status' => 'PAID', 'payments' => [7500]],
            ];

            foreach ($demoDebts as $debtData) {
                $payments = $debtData['payments'];
                unset($debtData['payments']);

                $debt = Debt::create(array_merge($debtData, [
                    'debt_date' => now(),
                    'created_by_id' => $admin->id,
                ]));

                foreach ($payments as $amount) {
                    DebtPayment::create([
                        'debt_id' => $debt->id,
                        'amount' => $amount,
                        'paid_at' => now()->toDateString(),
                        'created_by_id' => $admin->id,
                    ]);
                }
            }
        }
    }
}
