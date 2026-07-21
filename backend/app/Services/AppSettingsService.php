<?php

namespace App\Services;

use App\Models\AppSetting;
use Carbon\Carbon;

class AppSettingsService
{
    public const EXCHANGE_RATE_KEY = 'exchangeRate';

    public const DEFAULT_EXCHANGE_RATE = 4100;

    public const SESSION_START_KEY = 'sessionStartAt';

    public function getExchangeRate(): float
    {
        $setting = AppSetting::where('key', self::EXCHANGE_RATE_KEY)->first();
        $rate = (float) ($setting?->value ?? 0);

        return $rate > 0 ? $rate : self::DEFAULT_EXCHANGE_RATE;
    }

    public function setExchangeRate(float $exchangeRate): float
    {
        AppSetting::updateOrCreate(
            ['key' => self::EXCHANGE_RATE_KEY],
            ['value' => (string) $exchangeRate]
        );

        return $exchangeRate;
    }

    public function getSessionStartAt(): Carbon
    {
        $setting = AppSetting::where('key', self::SESSION_START_KEY)->first();
        $todayStart = Carbon::today();

        if (! $setting?->value) {
            return $todayStart;
        }

        $stored = Carbon::parse($setting->value);

        if ($stored->lt($todayStart)) {
            return $todayStart;
        }

        return $stored;
    }

    public function setSessionStartAt(\DateTimeInterface $date): Carbon
    {
        $value = Carbon::parse($date)->toIso8601String();

        AppSetting::updateOrCreate(
            ['key' => self::SESSION_START_KEY],
            ['value' => $value]
        );

        return Carbon::parse($value);
    }
}
