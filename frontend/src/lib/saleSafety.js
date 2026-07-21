/**
 * Rules for editing/deleting sales in the open session vs closed reports.
 */

export const MSG_SALE_LOCKED =
  "ទិន្នន័យនេះត្រូវបានបិទបញ្ជីរួចហើយ មិនអាចកែ ឬលុបដោយផ្ទាល់បានទេ";

/** Sale belongs to the current open session (after last close-day) */
export function isSaleInOpenSession(saleDate, sessionStartAt) {
  return new Date(saleDate) >= new Date(sessionStartAt);
}

export function getSalePermissions(sale, sessionStartAt) {
  const inOpenSession = isSaleInOpenSession(sale.saleDate, sessionStartAt);

  return {
    inOpenSession,
    canEdit: inOpenSession,
    canDelete: inOpenSession,
    blockReason: inOpenSession ? null : MSG_SALE_LOCKED,
    canCorrect: !inOpenSession,
  };
}
