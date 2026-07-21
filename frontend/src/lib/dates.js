/**
 * Date helpers — Cambodia timezone (UTC+7) + Khmer formatting.
 */

const TIMEZONE = "Asia/Phnom_Penh";

const KHMER_DIGITS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];

export const KHMER_MONTHS = [
  "មករា",
  "កុម្ភៈ",
  "មីនា",
  "មេសា",
  "ឧសភា",
  "មិថុនា",
  "កក្កដា",
  "សីហា",
  "កញ្ញា",
  "តុលា",
  "វិច្ឆិកា",
  "ធ្នូ",
];

/** Convert Western digits to Khmer digits — e.g. 2026 → ២០២៦ */
export function toKhmerDigits(value) {
  return String(value).replace(/\d/g, (digit) => KHMER_DIGITS[Number(digit)]);
}

/**
 * Full Khmer date — e.g. ថ្ងៃទី 7 ខែកក្កដា ឆ្នាំ 2026
 */
export function formatKhmerDate(date) {
  if (!date) return "—";

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";

  const day = d.getDate();
  const month = KHMER_MONTHS[d.getMonth()];
  const year = d.getFullYear();

  return `ថ្ងៃទី ${day} ខែ${month} ឆ្នាំ ${year}`;
}

/** Khmer date with Khmer digits — for exports */
export function formatKhmerDateExport(date) {
  if (!date) return "—";

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";

  const day = toKhmerDigits(d.getDate());
  const month = KHMER_MONTHS[d.getMonth()];
  const year = toKhmerDigits(d.getFullYear());

  return `ថ្ងៃទី ${day} ខែ${month} ឆ្នាំ ${year}`;
}

/** Khmer time for exports — e.g. ម៉ោង ១៥:៥២ */
export function formatKhmerTimeExport(date) {
  if (!date) return "—";

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";

  const hours = toKhmerDigits(d.getHours());
  const minutes = toKhmerDigits(String(d.getMinutes()).padStart(2, "0"));

  return `ម៉ោង ${hours}:${minutes}`;
}

/** Khmer date + time for exports */
export function formatKhmerDateTimeExport(date) {
  if (!date) return "—";
  return `${formatKhmerDateExport(date)} ${formatKhmerTimeExport(date)}`;
}

/** Compact date for tables — e.g. 7 កក្កដា · 14:30 */
export function formatKhmerDateCompact(date) {
  if (!date) return "—";

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";

  const day = d.getDate();
  const month = KHMER_MONTHS[d.getMonth()];
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day} ${month} · ${hours}:${minutes}`;
}

/** Format a date for display — uses Khmer month names and digits */
export function formatDate(date) {
  return formatKhmerDate(date);
}

/** Format date + time */
export function formatDateTime(date) {
  if (!date) return "—";

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";

  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${formatKhmerDate(d)} ${hours}:${minutes}`;
}

/** Short date with weekday prefix */
export function formatDateShort(date) {
  if (!date) return "—";

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";

  const weekday = d.toLocaleDateString("km-KH", {
    timeZone: TIMEZONE,
    weekday: "long",
  });

  return `${weekday} ${formatKhmerDate(d)}`;
}

/** Today's formatted date for dashboard header — e.g. ថ្ងៃពុធ 5/7/2026 */
export function getTodayDate() {
  const now = new Date();
  const weekday = now.toLocaleDateString("km-KH", {
    timeZone: TIMEZONE,
    weekday: "long",
  });
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  return `${weekday} ${day}/${month}/${year}`;
}

/** ISO date string (YYYY-MM-DD) for date inputs */
export function toDateInputValue(date = new Date()) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Check if two dates are the same calendar day */
export function isSameDay(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Get start of a calendar day (00:00:00) */
export function getStartOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Get today's date range (start/end) for filters */
export function getTodayRange() {
  const now = new Date();
  const start = getStartOfDay(now);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/** Get start of today in ISO format */
export function getTodayISO() {
  const { start } = getTodayRange();
  return start.toISOString();
}

/** Check if date is yesterday */
export function isYesterday(date) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

/** Check if date is in current week (Mon–Sun) */
export function isThisWeek(date) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const d = new Date(date);
  return d >= start && d <= end;
}

/** Check if date is in current month */
export function isThisMonth(date) {
  const d = new Date(date);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}
