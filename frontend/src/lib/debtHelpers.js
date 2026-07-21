/**
 * Debt business helpers — status, payments, last payment date.
 */

/** Get payment date — supports API (paidAt) and UI mock (paymentDate) */
export function getPaymentDate(payment) {
  return payment?.paymentDate ?? payment?.paidAt ?? payment?.paid_at ?? null;
}

/** Derive status from paid vs total amounts */
export function deriveDebtStatus(paidAmount, totalAmount) {
  if (!paidAmount || paidAmount <= 0) return "UNPAID";
  if (paidAmount >= totalAmount) return "PAID";
  return "PARTIAL";
}

/** Derive display status from a normalized debt record */
export function getDebtStatus(debt) {
  if (debt.remainingAmount <= 0 || debt.paidAmount >= debt.totalAmount) {
    return "PAID";
  }
  if (debt.paidAmount > 0) return "PARTIAL";
  return "UNPAID";
}

/** Get the most recent payment date from a debt's payment list */
export function getLastPaymentDate(payments = []) {
  if (!payments.length) return null;

  const sorted = [...payments].sort(
    (a, b) => new Date(getPaymentDate(b)) - new Date(getPaymentDate(a))
  );

  return getPaymentDate(sorted[0]);
}

/** Sort payments newest first */
export function sortPaymentsNewestFirst(payments = []) {
  return [...payments].sort(
    (a, b) => new Date(getPaymentDate(b)) - new Date(getPaymentDate(a))
  );
}

/** Delimiter for packing phone + notes into a single API field */
const DEBT_CONTACT_SEP = "\n---\n";

/** Pack phone and notes for API storage in phone_or_note */
export function packDebtContact(phone, notes) {
  const p = phone?.trim() ?? "";
  const n = notes?.trim() ?? "";
  if (p && n) return `${p}${DEBT_CONTACT_SEP}${n}`;
  if (p) return `${p}${DEBT_CONTACT_SEP}`;
  if (n) return `${DEBT_CONTACT_SEP}${n}`;
  return "";
}

/** Unpack phone_or_note into separate phone and notes for display */
export function unpackDebtContact(phoneOrNote) {
  const value = phoneOrNote?.trim() ?? "";
  if (!value) return { phone: "", notes: "" };

  const sepIndex = value.indexOf(DEBT_CONTACT_SEP);
  if (sepIndex === -1) {
    return { phone: "", notes: value };
  }

  return {
    phone: value.slice(0, sepIndex).trim(),
    notes: value.slice(sepIndex + DEBT_CONTACT_SEP.length).trim(),
  };
}

/** Normalize debt records from API for UI components */
export function normalizeDebtFromApi(debt) {
  const totalAmount = Number(debt.totalAmount ?? debt.total_amount ?? 0);
  const paidAmount = Number(debt.paidAmount ?? debt.paid_amount ?? 0);
  const remainingAmount = Number(
    debt.remainingAmount ?? debt.remaining_amount ?? totalAmount - paidAmount
  );

  return {
    id: debt.id,
    customerName: debt.customerName ?? debt.customer_name ?? "",
    phoneOrNote: debt.phoneOrNote ?? debt.phone_or_note ?? "",
    productType: debt.productType ?? debt.product_type ?? null,
    liters: debt.liters ?? null,
    totalAmount,
    paidAmount,
    remainingAmount,
    status: debt.status ?? deriveDebtStatus(paidAmount, totalAmount),
    debtDate: debt.debtDate ?? debt.debt_date ?? null,
    payments: (debt.payments ?? []).map((payment) => ({
      id: payment.id,
      amount: Number(payment.amount ?? 0),
      note: payment.note ?? null,
      paymentDate: getPaymentDate(payment),
      paidAt: payment.paidAt ?? payment.paid_at ?? null,
    })),
  };
}

/** Paid percentage for progress display (0–100) */
export function getDebtPaidPercent(debt) {
  const total = Number(debt.totalAmount ?? 0);
  if (total <= 0) return 0;
  return Math.min(100, Math.round((Number(debt.paidAmount ?? 0) / total) * 100));
}
