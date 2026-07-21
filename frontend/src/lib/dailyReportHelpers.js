/**
 * Daily closed report helpers — filter, paginate, snapshot.
 */

import {
  collectSessionDebts,
  collectSessionRepayments,
  khrToUsd,
} from "./calculations";

export {
  EXPORT_NO_DATA_MESSAGE,
  EXPORT_SUCCESS_MESSAGE,
  buildReportSummaryText,
  buildReportsSummaryText,
  canExportReport,
  copyReportsSummary,
  exportReportsToCSV,
  exportReportsToPDF,
  getExportableReports,
  shareReports,
} from "./dailyReportExport";

export const REPORT_STATUS_CLOSED = "CLOSED";
export const REPORT_STATUS_LABEL = "បានបិទបញ្ជី";
export const REPORTS_PAGE_SIZE = 10;

function getFuelLiters(fuelRows, slug) {
  const row = fuelRows?.find((item) => item.slug === slug);
  return row?.litersSold ?? 0;
}

/** Enrich snapshot with normalized fields for list/filter/export */
export function normalizeDailyReport(
  summary,
  sessionStartAt,
  closedAt = new Date(),
  id,
  exchangeRate = 4000,
  { fuels = [], debts = [], expenses = [] } = {}
) {
  const fuelRows = summary.fuelRows.map((row) => ({ ...row }));
  const reportDate = new Date(sessionStartAt);
  reportDate.setHours(0, 0, 0, 0);
  const fuelTotalKHR = summary.fuelTotalKHR ?? 0;

  const newDebts = collectSessionDebts(debts, sessionStartAt, fuels);
  const repayments = collectSessionRepayments(debts, sessionStartAt);
  const sessionExpenses = expenses.map((expense) => ({ ...expense }));
  const newDebtTotal = newDebts.reduce((sum, debt) => sum + (debt.totalAmount ?? 0), 0);
  const repaymentTotal = repayments.reduce((sum, payment) => sum + (payment.amount ?? 0), 0);
  const totalExpenses = sessionExpenses.reduce(
    (sum, expense) => sum + (Number(expense.amountKHR ?? expense.amount) || 0),
    0
  );
  const cashFromFuelSales = fuelTotalKHR - newDebtTotal;
  const finalCashTotal = cashFromFuelSales + repaymentTotal - totalExpenses;

  return {
    id,
    reportDate,
    sessionStartAt: new Date(sessionStartAt),
    closedAt: new Date(closedAt),
    status: REPORT_STATUS_CLOSED,
    totalNormalFuelLiters: getFuelLiters(fuelRows, "regular"),
    totalSuperFuelLiters: getFuelLiters(fuelRows, "premium"),
    totalDieselLiters: getFuelLiters(fuelRows, "diesel"),
    totalLiters: summary.totalLitersSold ?? 0,
    totalAmountKHR: fuelTotalKHR,
    totalAmountUSD: khrToUsd(fuelTotalKHR, exchangeRate),
    discountAmount: totalExpenses,
    totalExpenses,
    totalExpensesKHR: totalExpenses,
    expenses: sessionExpenses,
    debtTodayAmount: repaymentTotal,
    debtTodayUSD: khrToUsd(repaymentTotal, exchangeRate),
    fuelSalesTotal: fuelTotalKHR,
    newDebts,
    repayments,
    newDebtCount: newDebts.length,
    repaymentCount: repayments.length,
    newDebtTotal,
    repaymentTotal,
    cashFromFuelSales,
    finalCashTotal,
    finalAmountKHR: finalCashTotal,
    finalAmountUSD: khrToUsd(finalCashTotal, exchangeRate),
    fuelRows,
    grandTotalKHR: finalCashTotal,
    grandTotalUSD: khrToUsd(finalCashTotal, exchangeRate),
  };
}

export function filterDailyReports(reports, { fromDate, toDate }) {
  let filtered = [...reports];

  if (fromDate) {
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);
    filtered = filtered.filter((r) => new Date(r.reportDate) >= from);
  }

  if (toDate) {
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    filtered = filtered.filter((r) => new Date(r.reportDate) <= to);
  }

  return filtered.sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt));
}

export function paginateItems(items, page, pageSize = REPORTS_PAGE_SIZE) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    totalItems,
    pageSize,
  };
}

export function summarizeReports(reports) {
  return {
    count: reports.length,
    totalLiters: reports.reduce((s, r) => s + (r.totalLiters ?? 0), 0),
    totalKHR: reports.reduce((s, r) => s + (r.finalAmountKHR ?? 0), 0),
  };
}

/** Recalculate report totals after removing debts or expenses */
export function recalculateDailyReportTotals(report, exchangeRate = 4100) {
  const fuelTotalKHR = report.fuelSalesTotal ?? report.totalAmountKHR ?? 0;
  const newDebts = report.newDebts ?? [];
  const repayments = report.repayments ?? [];
  const expenses = report.expenses ?? [];
  const newDebtTotal = newDebts.reduce((sum, debt) => sum + (debt.totalAmount ?? 0), 0);
  const repaymentTotal = repayments.reduce((sum, payment) => sum + (payment.amount ?? 0), 0);
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + (Number(expense.amountKHR ?? expense.amount) || 0),
    0
  );
  const cashFromFuelSales = fuelTotalKHR - newDebtTotal;
  const finalCashTotal = cashFromFuelSales + repaymentTotal - totalExpenses;

  return {
    ...report,
    newDebts,
    repayments,
    expenses,
    newDebtTotal,
    repaymentTotal,
    totalExpenses,
    totalExpensesKHR: totalExpenses,
    discountAmount: totalExpenses,
    newDebtCount: newDebts.length,
    repaymentCount: repayments.length,
    debtTodayAmount: repaymentTotal,
    debtTodayUSD: khrToUsd(repaymentTotal, exchangeRate),
    cashFromFuelSales,
    finalCashTotal,
    finalAmountKHR: finalCashTotal,
    finalAmountUSD: khrToUsd(finalCashTotal, exchangeRate),
    grandTotalKHR: finalCashTotal,
    grandTotalUSD: khrToUsd(finalCashTotal, exchangeRate),
  };
}

/** Remove a deleted debt from saved closed reports and recalculate totals */
export function removeDebtFromDailyReports(reports, debtId, exchangeRate = 4100) {
  return reports.map((report) => {
    const newDebts = (report.newDebts ?? []).filter((debt) => debt.id !== debtId);
    const repayments = (report.repayments ?? []).filter((payment) => payment.debtId !== debtId);

    return recalculateDailyReportTotals(
      { ...report, newDebts, repayments },
      exchangeRate
    );
  });
}

/** Remove a deleted expense from saved closed reports and recalculate totals */
export function removeExpenseFromDailyReports(reports, expenseId, exchangeRate = 4100) {
  return reports.map((report) => {
    const expenses = (report.expenses ?? []).filter((expense) => expense.id !== expenseId);

    return recalculateDailyReportTotals({ ...report, expenses }, exchangeRate);
  });
}
