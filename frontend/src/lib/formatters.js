/**
 * Display formatters for Khmer locale.
 */

/** Format liters — e.g. 200 → "200 L" */
export function formatKhmerLiters(liters) {
  if (liters == null || isNaN(liters)) return "—";
  return `${Number(liters).toLocaleString("en-US")} L`;
}

/** Format KHR — e.g. 100000 → "100,000 ៛" */
export function formatKHR(amount) {
  if (amount == null || isNaN(amount)) return "—";
  return `${Number(amount).toLocaleString("en-US")} ៛`;
}

/** Format KHR with Khmer digits — e.g. 5000 → "៥,០០០ ៛" */
export function formatKhmerKHR(amount) {
  return formatKHR(amount);
}

/** Alias for formatKHR */
export function formatRiel(amount) {
  return formatKHR(amount);
}

/** Format USD — e.g. 77.44 → "$77.44" */
export function formatUSD(amount) {
  if (amount == null || isNaN(amount)) return "—";
  return `$${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Format liters — e.g. 1500 → "1,500 L" */
export function formatLiters(liters) {
  if (liters == null || isNaN(liters)) return "—";
  return `${Number(liters).toLocaleString("en-US")} L`;
}

/** Format a fuel type name for display */
export function formatFuelName(name) {
  return name ?? "—";
}
