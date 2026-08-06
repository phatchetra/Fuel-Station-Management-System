import { useEffect, useState } from "react";
import { formatKHR, formatUSD } from "@/lib/formatters";
import { IconFuel } from "./icons";

export default function Header({
  user,
  todayLabel,
  exchangeRate,
  onExchangeRateSave,
  totalKHR,
  totalUSD,
}) {
  const [localRate, setLocalRate] = useState(exchangeRate);
  const [rateError, setRateError] = useState("");
  const [savingRate, setSavingRate] = useState(false);

  useEffect(() => {
    setLocalRate(exchangeRate);
  }, [exchangeRate]);

  async function handleRateBlur() {
    if (localRate === exchangeRate) return;

    setRateError("");
    setSavingRate(true);
    const result = await onExchangeRateSave(localRate);
    setSavingRate(false);

    if (!result.ok) {
      setRateError(result.error);
      setLocalRate(exchangeRate);
    }
  }

  const stationTitle = user?.name
    ? `ការ៉ាស់សាំងម៉ាក់ខ្ញុំ ${user.name}`
    : "ការ៉ាស់សាំងម៉ាក់ខ្ញុំ";

  return (
    <header className="card app-header">
      <div className="app-header-brand flex items-center gap-2 min-w-0 mb-4">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[rgb(242_169_59/0.12)] text-[var(--gold)] shrink-0">
          <IconFuel />
        </span>
        <p className="label-brand truncate">FUEL LEDGER • បញ្ជីប្រេងសាំង</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[1.25rem] sm:text-[1.75rem] font-bold leading-snug tracking-tight break-words">
            {stationTitle}
          </h1>
        </div>

        <div className="header-income lg:min-w-[240px]">
          <p className="header-income-date">{todayLabel}</p>

          <p className="header-income-amount tabular-nums">{formatKHR(totalKHR)}</p>

          <p className="header-income-usd tabular-nums en">≈ {formatUSD(totalUSD)}</p>

          <p className="header-income-label">ចំណូលថ្ងៃនេះ</p>

          <div className="header-income-divider" />

          <div className="header-exchange-row">
            <span className="header-exchange-label">អត្រាប្តូរប្រាក់ 1$ =</span>
            <input
              id="exchangeRate"
              type="number"
              min="1"
              className="header-exchange-input tabular-nums"
              value={localRate}
              disabled={savingRate}
              onChange={(e) => setLocalRate(Number(e.target.value) || 4100)}
              onBlur={handleRateBlur}
            />
            <span className="header-exchange-symbol">៛</span>
          </div>
          {rateError && <p className="error-text text-xs mt-1">{rateError}</p>}
        </div>
      </div>
    </header>
  );
}
