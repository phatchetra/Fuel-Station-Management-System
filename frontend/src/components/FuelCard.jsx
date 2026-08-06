
import { useEffect, useState } from "react";
import { calculateStockPercent } from "@/lib/calculations";
import { toDateInputValue } from "@/lib/dates";

const FUEL_THEME = {
  green: {
    accent: "fuel-accent-green",
    name: "fuel-name-green",
    gauge: "#66a37a",
    btn: "btn-record-green",
  },
  blue: {
    accent: "fuel-accent-blue",
    name: "fuel-name-blue",
    gauge: "#5b8fd4",
    btn: "btn-record-blue",
  },
  red: {
    accent: "fuel-accent-red",
    name: "fuel-name-red",
    gauge: "#c96b6b",
    btn: "btn-record-red",
  },
  orange: {
    accent: "fuel-accent-red",
    name: "fuel-name-red",
    gauge: "#c96b6b",
    btn: "btn-record-red",
  },
};

const GAUGE = {
  cx: 45,
  cy: 44,
  r: 36,
  stroke: 8,
  track: "#333b47",
  needle: "#ede9dc",
};

function gaugePoint(percent) {
  const angle = Math.PI + (percent / 100) * Math.PI;
  return {
    x: GAUGE.cx + GAUGE.r * Math.cos(angle),
    y: GAUGE.cy + GAUGE.r * Math.sin(angle),
    angle,
  };
}

function gaugeArcPath(startPercent, endPercent) {
  if (endPercent <= startPercent) return "";

  const start = gaugePoint(startPercent);
  const end = gaugePoint(endPercent);
  const span = ((endPercent - startPercent) / 100) * Math.PI;
  const largeArc = span > Math.PI ? 1 : 0;

  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${GAUGE.r} ${GAUGE.r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function StockGauge({ percent, color }) {
  const level = Math.min(100, Math.max(0, percent));
  const trackPath = gaugeArcPath(0, 100);
  const fillPath = level > 0 ? gaugeArcPath(0, level) : "";
  const tip = gaugePoint(level);
  const needleLen = 28;
  const nx = GAUGE.cx + needleLen * Math.cos(tip.angle);
  const ny = GAUGE.cy + needleLen * Math.sin(tip.angle);

  return (
    <div className="fuel-gauge shrink-0">
      <svg viewBox="0 0 90 48" className="fuel-gauge-svg" aria-hidden>
        <path
          d={trackPath}
          fill="none"
          stroke={GAUGE.track}
          strokeWidth={GAUGE.stroke}
          strokeLinecap="round"
        />
        {fillPath && (
          <path
            d={fillPath}
            fill="none"
            stroke={color}
            strokeWidth={GAUGE.stroke}
            strokeLinecap="round"
            style={{ transition: "d 0.45s ease" }}
          />
        )}
        <line
          x1={GAUGE.cx}
          y1={GAUGE.cy}
          x2={nx}
          y2={ny}
          stroke={GAUGE.needle}
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ transition: "all 0.45s ease" }}
        />
        <circle cx={GAUGE.cx} cy={GAUGE.cy} r="2.5" fill={GAUGE.needle} />
      </svg>
    </div>
  );
}

export default function FuelCard({
  fuel,
  onPriceChange,
  onCapacityChange,
  onRecordSale,
  onRefill,
}) {
  const [pricePerLiter, setPricePerLiter] = useState(fuel.pricePerLiter);
  const [capacity, setCapacity] = useState(fuel.capacity);
  const [soldLiters, setSoldLiters] = useState("");
  const [refillLiters, setRefillLiters] = useState("");
  const [refillDate, setRefillDate] = useState(() => toDateInputValue(new Date()));
  const [refillNote, setRefillNote] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saleLoading, setSaleLoading] = useState(false);
  const [refillLoading, setRefillLoading] = useState(false);
  const [savingField, setSavingField] = useState(false);

  useEffect(() => {
    setPricePerLiter(fuel.pricePerLiter);
  }, [fuel.pricePerLiter]);

  useEffect(() => {
    setCapacity(fuel.capacity);
  }, [fuel.capacity]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = setTimeout(() => setSuccessMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const theme = FUEL_THEME[fuel.accentColor] ?? FUEL_THEME.green;
  const stockPercent = calculateStockPercent(fuel.currentStock, fuel.capacity);
  const isOutOfStock = fuel.currentStock <= 0;
  const isVeryLowStock = fuel.currentStock > 0 && stockPercent <= 10;

  async function handleCapacityBlur() {
    setError("");
    setSavingField(true);
    const result = await onCapacityChange(fuel.slug, capacity);
    setSavingField(false);
    if (!result.ok) {
      setError(result.error);
      setCapacity(fuel.capacity);
    }
  }

  async function handlePriceBlur() {
    setError("");
    setSavingField(true);
    const result = await onPriceChange(fuel.slug, pricePerLiter);
    setSavingField(false);
    if (!result.ok) {
      setError(result.error);
      setPricePerLiter(fuel.pricePerLiter);
    }
  }

  async function handleSale() {
    setError("");
    setSuccessMessage("");

    const liters = Number(soldLiters);
    if (!soldLiters.trim() || !liters || liters <= 0) {
      setError("សូមបញ្ចូលលីត្រលក់ធំជាង 0");
      return;
    }

    setSaleLoading(true);
    const result = await onRecordSale(fuel.slug, soldLiters);
    setSaleLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSoldLiters("");
    setSuccessMessage(result.message || "កត់ត្រាលក់បានជោគជ័យ");
  }

  async function handleRefillClick() {
    setError("");
    setSuccessMessage("");

    const liters = Number(refillLiters);
    if (!refillLiters.trim() || !liters || liters <= 0) {
      setError("សូមបញ្ចូលលីត្របញ្ចូលធំជាង 0");
      return;
    }

    setRefillLoading(true);
    const result = await onRefill(fuel.slug, {
      liters: refillLiters,
      refillDate,
      note: refillNote.trim() || undefined,
    });
    setRefillLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setRefillLiters("");
    setRefillNote("");
    setRefillDate(toDateInputValue(new Date()));
    setSuccessMessage(result.message || "បញ្ចូលស្តុកបានជោគជ័យ");
  }

  function handleKeyDown(event, action) {
    if (event.key === "Enter") {
      event.preventDefault();
      action();
    }
  }

  return (
    <article className={`fuel-card-v2 ${theme.accent}`}>
      <div className="fuel-card-header">
        <h3 className={`fuel-card-title ${theme.name}`}>{fuel.nameKhmer}</h3>
        <div className="fuel-inline-field">
          <span className="fuel-field-label">ថ្លៃ/លីត្រ</span>
          <input
            type="number"
            min="0"
            className="fuel-mini-input tabular-nums"
            value={pricePerLiter}
            disabled={savingField}
            onChange={(e) => setPricePerLiter(Number(e.target.value) || 0)}
            onBlur={handlePriceBlur}
          />
        </div>
      </div>

      <div className="fuel-status-row">
        <StockGauge percent={stockPercent} color={theme.gauge} />

        <div className="fuel-stock-block">
          <p className="fuel-stock-value tabular-nums en">
            {fuel.currentStock.toLocaleString("en-US")}{" "}
            <span className="fuel-stock-unit">L</span>
          </p>
          <div className="fuel-inline-field fuel-capacity-field">
            <span className="fuel-field-label">សមត្ថភាព</span>
            <input
              type="number"
              min="1"
              className="fuel-mini-input tabular-nums"
              value={capacity}
              disabled={savingField}
              onChange={(e) => setCapacity(Number(e.target.value) || 0)}
              onBlur={handleCapacityBlur}
            />
            <span className="fuel-field-label en">L</span>
          </div>
        </div>
      </div>

      {isOutOfStock && (
        <p className="fuel-out-of-stock" role="alert">
          <span className="fuel-out-of-stock-dot" />
          ស្តុកអស់ហើយ សូមបញ្ចូលស្តុកថ្មី!
        </p>
      )}
      {!isOutOfStock && isVeryLowStock && (
        <p className="fuel-very-low-stock">
          <span className="fuel-very-low-stock-dot" />
          ស្តុកសល់តិចជាង 10%
        </p>
      )}
      {error && <p className="error-text text-xs px-1">{error}</p>}
      {successMessage && (
        <p className="summary-success-text text-xs px-1" role="status">
          {successMessage}
        </p>
      )}

      <div className="fuel-divider" />

      <div className="fuel-action-block">
        <p className="fuel-action-label">ចំនួនលីត្រលក់បានថ្ងៃនេះ</p>
        <div className="fuel-action-row">
          <input
            type="number"
            min="0"
            className="fuel-action-input tabular-nums"
            placeholder="ចំនួនលីត្រ"
            value={soldLiters}
            disabled={saleLoading}
            onChange={(e) => setSoldLiters(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleSale)}
          />
          <button
            type="button"
            className={theme.btn}
            onClick={handleSale}
            disabled={saleLoading}
          >
            {saleLoading ? "..." : "កត់ត្រា"}
          </button>
        </div>
      </div>

      <div className="fuel-action-block">
        <p className="fuel-action-label">
          បញ្ចូលស្តុកថ្មី{" "}
          <span className="en text-[0.75rem] opacity-75">(Refill)</span>
        </p>
        <div className="fuel-refill-fields">
          <div className="fuel-refill-row">
            <input
              type="number"
              min="0"
              className="fuel-action-input tabular-nums"
              placeholder="ចំនួនលីត្រ"
              value={refillLiters}
              disabled={refillLoading}
              onChange={(e) => setRefillLiters(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, handleRefillClick)}
            />
            <input
              type="date"
              className="fuel-action-input fuel-refill-date"
              value={refillDate}
              disabled={refillLoading}
              onChange={(e) => setRefillDate(e.target.value)}
            />
          </div>
          <input
            type="text"
            className="fuel-action-input"
            placeholder="កំណត់ចំណាំ (ជម្រើស)"
            value={refillNote}
            disabled={refillLoading}
            onChange={(e) => setRefillNote(e.target.value)}
          />
          <button
            type="button"
            className="btn-fuel-outline fuel-refill-btn"
            onClick={handleRefillClick}
            disabled={refillLoading}
          >
            {refillLoading ? "..." : "បញ្ចូល"}
          </button>
        </div>
      </div>
    </article>
  );
}
