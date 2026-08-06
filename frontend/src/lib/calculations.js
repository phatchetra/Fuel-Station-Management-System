/**
 * Business calculation helpers for the gas station dashboard.
 */

import { getStartOfDay } from "@/lib/dates";
import { filterSessionExpenses } from "@/lib/expenseHelpers";
export { formatKHR, formatUSD } from "@/lib/formatters";

/** Calculate sale amount in Riel */
export function calculateSaleTotal(liters, pricePerLiter) {
  return liters * pricePerLiter;
}

/** API alias — amount in KHR from liters × price */
export function calculateAmountKHR(liters, pricePerLiter) {
  return Math.round(liters * pricePerLiter);
}

/** API alias — convert KHR to USD */
export function calculateUSD(amountKHR, exchangeRate) {
  return khrToUsd(amountKHR, exchangeRate);
}

/** Start and end of a calendar day — accepts Date or YYYY-MM-DD string */
export function getStartAndEndOfDate(dateInput) {
  let base;

  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [year, month, day] = dateInput.split("-").map(Number);
    base = new Date(year, month - 1, day);
  } else {
    base = new Date(dateInput ?? new Date());
  }

  const start = getStartOfDay(base);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Date range from quick filter — used by /api/history.
 * Returns { start, end } or null for "all" (no date filter).
 */
export function getDateRangeFromQuickFilter(quickFilter) {
  const now = new Date();

  switch (quickFilter) {
    case "today": {
      return getStartAndEndOfDate(now);
    }
    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return getStartAndEndOfDate(yesterday);
    }
    case "week": {
      const start = new Date(now);
      const day = start.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start.setDate(start.getDate() - diff);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      return { start, end };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);

      return { start, end };
    }
    case "all":
    default:
      return null;
  }
}

/** Calculate remaining stock after sale or refill */
export function calculateStock(currentStock, soldLiters = 0, refilledLiters = 0) {
  return currentStock - soldLiters + refilledLiters;
}

/** Stock level as percentage of tank capacity (0–100) */
export function calculateStockPercent(stock, capacity) {
  if (!capacity || capacity <= 0) return 0;
  return Math.min(100, Math.max(0, (stock / capacity) * 100));
}

/** Calculate remaining debt after a payment */
export function calculateDebtBalance(totalAmount, paidAmount) {
  return Math.max(0, totalAmount - paidAmount);
}

/** Convert KHR to USD using exchange rate */
export function khrToUsd(amountKHR, exchangeRate) {
  if (!exchangeRate || exchangeRate <= 0) return 0;
  return amountKHR / exchangeRate;
}

/** Sales recorded in the current open business session */
export function filterSessionSales(sales, sessionStartAt) {
  const start = new Date(sessionStartAt);
  return sales.filter((sale) => new Date(sale.saleDate) >= start);
}

/** Debt payments collected during the current session */
export function calculateDebtPaymentsInSession(debts, sessionStartAt) {
  const start = new Date(sessionStartAt);
  let total = 0;

  for (const debt of debts) {
    for (const payment of debt.payments ?? []) {
      if (new Date(payment.paymentDate) >= start) {
        total += payment.amount;
      }
    }
  }

  return total;
}

/**
 * Build daily summary rows for the summary table.
 * Totals are calculated from saved sales in the current session only.
 */
export function calculateDailySummary(fuels, sales, debts, sessionStartAt, exchangeRate) {
  const sessionSales = filterSessionSales(sales, sessionStartAt);
  const debtTodayAmount = calculateDebtPaymentsInSession(debts, sessionStartAt);

  const fuelRows = fuels.map((fuel) => {
    const fuelSales = sessionSales.filter((sale) => sale.fuelSlug === fuel.slug);

    const litersSold = fuelSales.reduce((sum, sale) => sum + sale.liters, 0);
    const amountKHR = fuelSales.reduce((sum, sale) => sum + sale.amountKHR, 0);

    return {
      name: fuel.nameKhmer,
      slug: fuel.slug,
      accentColor: fuel.accentColor,
      litersSold,
      pricePerLiter:
        litersSold > 0 ? Math.round(amountKHR / litersSold) : fuel.pricePerLiter,
      amountKHR,
      amountUSD: khrToUsd(amountKHR, exchangeRate),
    };
  });

  const fuelTotalKHR = fuelRows.reduce((sum, row) => sum + row.amountKHR, 0);
  const totalLitersSold = fuelRows.reduce((sum, row) => sum + row.litersSold, 0);
  const grandTotalKHR = fuelTotalKHR + debtTodayAmount;

  return {
    fuelRows,
    totalLitersSold,
    fuelTotalKHR,
    debtTodayAmount,
    debtTodayUSD: khrToUsd(debtTodayAmount, exchangeRate),
    grandTotalKHR,
    grandTotalUSD: khrToUsd(grandTotalKHR, exchangeRate),
  };
}

/** Collect sales from history groups that belong to the open session */
export function getSessionSalesFromHistory(historyGroups, sessionStartAt) {
  const start = new Date(sessionStartAt);
  const sales = [];

  for (const group of historyGroups ?? []) {
    for (const sale of group.sales ?? []) {
      if (new Date(sale.saleDate) >= start) {
        sales.push(sale);
      }
    }
  }

  return sales;
}

/** Build fuel summary for the current open session (used by close-day) */
export function buildSessionSummaryFromHistory(
  fuels,
  historyGroups,
  sessionStartAt,
  exchangeRate
) {
  const sessionSales = getSessionSalesFromHistory(historyGroups, sessionStartAt);
  const soldBySlug = {};

  for (const sale of sessionSales) {
    const slug = sale.fuelType?.slug ?? String(sale.fuelTypeId);
    if (!soldBySlug[slug]) {
      soldBySlug[slug] = { liters: 0, amountKHR: 0 };
    }
    soldBySlug[slug].liters += sale.liters;
    soldBySlug[slug].amountKHR += sale.amountKHR;
  }

  const fuelRows = (fuels ?? []).map((fuel) => {
    const sold = soldBySlug[fuel.slug] ?? { liters: 0, amountKHR: 0 };
    const litersSold = sold.liters;
    const amountKHR = sold.amountKHR;
    const pricePerLiter =
      litersSold > 0 ? Math.round(amountKHR / litersSold) : fuel.pricePerLiter;

    return {
      name: fuel.nameKhmer,
      slug: fuel.slug,
      accentColor: fuel.accentColor,
      litersSold,
      amountKHR,
      amountUSD: khrToUsd(amountKHR, exchangeRate),
      pricePerLiter,
    };
  });

  const totalLitersSold = fuelRows.reduce((sum, row) => sum + row.litersSold, 0);
  const fuelTotalKHR = fuelRows.reduce((sum, row) => sum + row.amountKHR, 0);

  return {
    fuelRows,
    totalLitersSold,
    fuelTotalKHR,
    debtTodayAmount: 0,
    debtTodayUSD: 0,
    grandTotalKHR: fuelTotalKHR,
    grandTotalUSD: khrToUsd(fuelTotalKHR, exchangeRate),
  };
}

export const CLOSE_DAY_ERROR =
  "មិនអាចបិទបញ្ជីបានទេ ព្រោះមិនមានទិន្នន័យលក់សម្រាប់គណនា";

/** True only when the open session has real fuel sales to close */
export function canCloseDailySession(sessionSales, summary) {
  const totalLiters = summary.totalLitersSold ?? 0;
  const fuelTotalKHR = summary.fuelTotalKHR ?? 0;

  return (
    sessionSales.length > 0 &&
    totalLiters > 0 &&
    fuelTotalKHR > 0
  );
}

/** Validate before closing — used by UI and close handler */
export function validateCloseDay(sessionSales, summary) {
  if (canCloseDailySession(sessionSales, summary)) {
    return { ok: true };
  }
  return { ok: false, error: CLOSE_DAY_ERROR };
}

/** Build full closing totals including debts and expenses */
export function buildClosingFinancials(
  summary,
  debts,
  sessionStartAt,
  fuels,
  expenses,
  exchangeRate
) {
  const newDebts = collectSessionDebts(debts, sessionStartAt, fuels);
  const repayments = collectSessionRepayments(debts, sessionStartAt);
  const sessionExpenses = filterSessionExpenses(expenses);

  const fuelSalesTotal = summary.fuelTotalKHR ?? 0;
  const newDebtTotal = newDebts.reduce((sum, debt) => sum + (debt.totalAmount ?? 0), 0);
  const repaymentTotal = repayments.reduce((sum, payment) => sum + (payment.amount ?? 0), 0);
  const totalExpensesKHR = sessionExpenses.reduce(
    (sum, expense) => sum + (Number(expense.amountKHR ?? expense.amount) || 0),
    0
  );
  const totalExpensesUSD = khrToUsd(totalExpensesKHR, exchangeRate);
  const cashFromFuelSales = fuelSalesTotal - newDebtTotal;
  const finalCashTotal = cashFromFuelSales + repaymentTotal - totalExpensesKHR;

  return {
    fuelSalesTotal,
    newDebtTotal,
    repaymentTotal,
    totalExpenses: totalExpensesKHR,
    totalExpensesKHR,
    totalExpensesUSD,
    cashFromFuelSales,
    finalCashTotal,
    finalCashUSD: khrToUsd(finalCashTotal, exchangeRate),
    newDebts,
    repayments,
    sessionExpenses,
    newDebtCount: newDebts.length,
    repaymentCount: repayments.length,
  };
}

/** New debtor records created during the open session */
export function collectSessionDebts(debts, sessionStartAt, fuels = []) {
  const start = new Date(sessionStartAt);

  return debts
    .filter((debt) => new Date(debt.debtDate) >= start)
    .map((debt) => {
      const fuel = fuels.find((item) => item.slug === debt.productType);
      const liters = debt.liters ?? 0;
      const pricePerLiter =
        liters > 0 ? Math.round(debt.totalAmount / liters) : fuel?.pricePerLiter ?? 0;

      return {
        id: debt.id,
        customerName: debt.customerName,
        productType: debt.productType,
        productName: fuel?.nameKhmer ?? debt.productType ?? "—",
        liters,
        pricePerLiter,
        totalAmount: debt.totalAmount,
        debtDate: debt.debtDate,
        note: debt.phoneOrNote ?? debt.note ?? "",
      };
    });
}

/** Debt repayment records collected during the open session */
export function collectSessionRepayments(debts, sessionStartAt) {
  const start = new Date(sessionStartAt);
  const items = [];

  for (const debt of debts) {
    const sortedPayments = [...(debt.payments ?? [])].sort(
      (a, b) =>
        new Date(a.paymentDate ?? a.paidAt) - new Date(b.paymentDate ?? b.paidAt)
    );
    let paidSoFar = 0;

    for (const payment of sortedPayments) {
      paidSoFar += payment.amount;
      const paymentDate = payment.paymentDate ?? payment.paidAt;

      if (paymentDate && new Date(paymentDate) >= start) {
        items.push({
          debtId: debt.id,
          customerName: debt.customerName,
          amount: payment.amount,
          paymentDate,
          remainingAfter: Math.max(0, debt.totalAmount - paidSoFar),
          note: payment.note ?? "",
        });
      }
    }
  }

  return items.sort(
    (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)
  );
}

/** Snapshot for daily closing — use normalizeDailyReport for full record shape */
export function buildDailyReportSnapshot(summary, sessionStartAt, closedAt = new Date()) {
  return {
    sessionStartAt: new Date(sessionStartAt),
    closedAt: new Date(closedAt),
    fuelRows: summary.fuelRows.map((row) => ({ ...row })),
    totalLitersSold: summary.totalLitersSold,
    fuelTotalKHR: summary.fuelTotalKHR,
    debtTodayAmount: summary.debtTodayAmount,
    debtTodayUSD: summary.debtTodayUSD,
    grandTotalKHR: summary.grandTotalKHR,
    grandTotalUSD: summary.grandTotalUSD,
  };
}

/**
 * Group sales by date for the history section.
 */
export function groupSalesByDate(sales, exchangeRate) {
  const groups = {};

  for (const sale of sales) {
    const dateKey = new Date(sale.saleDate).toDateString();

    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: new Date(sale.saleDate),
        sales: [],
        totalKHR: 0,
        fuelMap: {},
      };
    }

    groups[dateKey].sales.push(sale);
    groups[dateKey].totalKHR += sale.amountKHR;

    if (!groups[dateKey].fuelMap[sale.fuelSlug]) {
      groups[dateKey].fuelMap[sale.fuelSlug] = {
        name: sale.fuelName,
        slug: sale.fuelSlug,
        accentColor: sale.accentColor,
        liters: 0,
      };
    }

    groups[dateKey].fuelMap[sale.fuelSlug].liters += sale.liters;
  }

  return Object.values(groups)
    .map((group) => ({
      date: group.date,
      totalKHR: group.totalKHR,
      totalUSD: khrToUsd(group.totalKHR, exchangeRate),
      fuelSummary: Object.values(group.fuelMap),
    }))
    .sort((a, b) => b.date - a.date);
}
