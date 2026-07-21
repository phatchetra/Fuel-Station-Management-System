/**
 * Daily expense helpers — validation and display (KHR only).
 */

import { formatKHR } from "./formatters";

export const EXPENSE_CURRENCY_KHR = "KHR";

export function getExpenseCategoryLabel(category) {
  return category?.trim() || "—";
}

export function getExpenseAmountKHR(expense) {
  if (expense?.amountKHR != null) return Number(expense.amountKHR) || 0;
  return Number(expense?.amount) || 0;
}

export function filterSessionExpenses(expenses, sessionStartAt) {
  const start = new Date(sessionStartAt);
  return (expenses ?? []).filter((expense) => new Date(expense.expenseDate) >= start);
}

export function calculateTotalExpensesKHR(expenses) {
  return (expenses ?? []).reduce((sum, expense) => sum + getExpenseAmountKHR(expense), 0);
}

export function formatExpenseAmount(expense) {
  return formatKHR(getExpenseAmountKHR(expense));
}

export function validateExpense({ category, amount, expenseDate }) {
  const categoryText = category?.trim();
  if (!categoryText) {
    return { ok: false, error: "សូមបញ្ចូលប្រភេទចំណាយ" };
  }

  const amountText = amount?.toString().trim();
  if (!amountText) {
    return { ok: false, error: "សូមបញ្ចូលចំនួនលុយ" };
  }

  const parsedAmount = Number(amountText);
  if (!parsedAmount || parsedAmount <= 0) {
    return { ok: false, error: "ចំនួនលុយត្រូវតែធំជាង 0" };
  }

  if (!expenseDate) {
    return { ok: false, error: "សូមជ្រើសរើសថ្ងៃខែឆ្នាំ" };
  }

  const parsedDate = new Date(expenseDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return { ok: false, error: "ថ្ងៃខែឆ្នាំមិនត្រឹមត្រូវ" };
  }

  const amountKHR = Math.round(parsedAmount);

  return {
    ok: true,
    category: categoryText,
    amount: amountKHR,
    amountKHR,
    currency: EXPENSE_CURRENCY_KHR,
    expenseDate: parsedDate,
  };
}
