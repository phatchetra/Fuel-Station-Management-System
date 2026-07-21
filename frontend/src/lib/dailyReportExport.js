/**
 * Daily closing report export — full calculated details for PDF, Excel, copy, share.
 */

import {
  formatKhmerDateExport,
  formatKhmerDateTimeExport,
  formatKhmerTimeExport,
} from "./dates";
import { formatUSD } from "./formatters";
import { getExpenseCategoryLabel, getExpenseAmountKHR } from "./expenseHelpers";

export const EXPORT_SUCCESS_MESSAGE = "បានចម្លងរបាយការណ៍ជោគជ័យ";
export const EXPORT_NO_DATA_MESSAGE = "មិនមានទិន្នន័យសម្រាប់ Export ទេ";

const REPORT_TITLE = "របាយការណ៍បិទបញ្ជីប្រចាំថ្ងៃ";

/** Khmer font for PDF / print export */
const PDF_FONT_FAMILY = '"Siemreap", sans-serif';
const PDF_FONT_STYLESHEET =
  "https://fonts.googleapis.com/css2?family=Siemreap&display=swap";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function formatAmountPlain(amount) {
  if (amount == null || Number.isNaN(amount)) return "0៛";
  return `${Number(amount).toLocaleString("en-US")}៛`;
}

function formatLitersPlain(liters) {
  return `${Number(liters ?? 0).toLocaleString("en-US")} L`;
}

function formatFuelFormula(row) {
  const liters = Number(row.litersSold ?? 0);
  const price = Number(row.pricePerLiter ?? 0);
  const amount = Number(row.amountKHR ?? 0);

  if (liters <= 0) {
    return `${row.name}\n0 L × ${price.toLocaleString("en-US")}៛ = 0៛`;
  }

  return `${row.name}\n${formatLitersPlain(liters)} × ${price.toLocaleString("en-US")}៛ = ${formatAmountPlain(amount)}`;
}

function formatDebtFormula(debt) {
  const liters = Number(debt.liters ?? 0);
  const price = Number(debt.pricePerLiter ?? 0);
  const amount = Number(debt.totalAmount ?? 0);

  if (liters <= 0) {
    return `ចំនួន: ${formatAmountPlain(amount)}`;
  }

  return `ចំនួន: ${formatLitersPlain(liters)} × ${price.toLocaleString("en-US")}៛ = ${formatAmountPlain(amount)}`;
}

export function canExportReport(report) {
  const liters = report?.totalLiters ?? 0;
  const fuelTotal =
    report?.fuelSalesTotal ?? report?.totalAmountKHR ?? report?.fuelTotalKHR ?? 0;
  return liters > 0 && fuelTotal > 0;
}

export function getExportableReports(reports) {
  return (reports ?? []).filter(canExportReport);
}

function getReportRows(report) {
  return (report.fuelRows ?? []).filter((row) => Number(row.litersSold) > 0);
}

function getNewDebts(report) {
  return report.newDebts ?? [];
}

function getRepayments(report) {
  return report.repayments ?? [];
}

function getExpenses(report) {
  return report.expenses ?? [];
}

function getReportCalculations(report) {
  const fuelSalesTotal =
    report.fuelSalesTotal ?? report.totalAmountKHR ?? report.fuelTotalKHR ?? 0;
  const newDebtTotal =
    report.newDebtTotal ??
    getNewDebts(report).reduce((sum, debt) => sum + (debt.totalAmount ?? 0), 0);
  const repaymentTotal =
    report.repaymentTotal ??
    report.debtTodayAmount ??
    getRepayments(report).reduce((sum, payment) => sum + (payment.amount ?? 0), 0);
  const totalExpenses =
    report.totalExpenses ??
    report.totalExpensesKHR ??
    report.discountAmount ??
    getExpenses(report).reduce(
      (sum, expense) => sum + getExpenseAmountKHR(expense),
      0
    );
  const cashFromFuelSales =
    report.cashFromFuelSales ?? fuelSalesTotal - newDebtTotal;
  const finalCashTotal =
    report.finalCashTotal ??
    cashFromFuelSales + repaymentTotal - totalExpenses;

  return {
    fuelSalesTotal,
    newDebtTotal,
    repaymentTotal,
    totalExpenses,
    cashFromFuelSales,
    finalCashTotal,
    newDebtCount: report.newDebtCount ?? getNewDebts(report).length,
    repaymentCount: report.repaymentCount ?? getRepayments(report).length,
    totalLiters: report.totalLiters ?? 0,
    finalAmountUSD: report.finalAmountUSD ?? report.grandTotalUSD ?? 0,
  };
}

function buildFuelSalesText(report) {
  const rows = getReportRows(report);
  const calc = getReportCalculations(report);

  if (!rows.length) {
    return ["ការលក់ប្រេង", "មិនមានទិន្នន័យ"].join("\n");
  }

  const lines = ["ការលក់ប្រេង", ...rows.map((row) => formatFuelFormula(row)), ""];

  lines.push(`លីត្រសរុប: ${formatLitersPlain(calc.totalLiters)}`);
  lines.push(`ចំណូលលក់ប្រេងសរុប: ${formatAmountPlain(calc.fuelSalesTotal)}`);

  return lines.join("\n");
}

function buildNewDebtsText(report) {
  const debts = getNewDebts(report);
  const lines = ["អ្នកជំពាក់ថ្មី"];

  if (!debts.length) {
    lines.push("មិនមានអ្នកជំពាក់ថ្មី");
    return lines.join("\n");
  }

  for (const debt of debts) {
    lines.push(`ឈ្មោះ: ${debt.customerName}`);
    lines.push(`មុខទំនិញ: ${debt.productName}`);
    lines.push(formatDebtFormula(debt));
    lines.push(`ថ្ងៃជំពាក់: ${formatKhmerDateExport(debt.debtDate)}`);
    if (debt.note?.trim()) {
      lines.push(`កំណត់ចំណាំ: ${debt.note.trim()}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

function buildRepaymentsText(report) {
  const payments = getRepayments(report);
  const lines = ["អ្នកសងប្រាក់"];

  if (!payments.length) {
    lines.push("មិនមានអ្នកសងប្រាក់");
    return lines.join("\n");
  }

  for (const payment of payments) {
    lines.push(`ឈ្មោះ: ${payment.customerName}`);
    lines.push(`បានសង: ${formatAmountPlain(payment.amount)}`);
    lines.push(`ថ្ងៃសង: ${formatKhmerDateExport(payment.paymentDate)}`);
    lines.push(`នៅសល់: ${formatAmountPlain(payment.remainingAfter)}`);
    if (payment.note?.trim()) {
      lines.push(`កំណត់ចំណាំ: ${payment.note.trim()}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

function buildExpensesText(report) {
  const items = getExpenses(report);
  const calc = getReportCalculations(report);
  const lines = ["ចំណាយផ្សេងៗ"];

  if (!items.length) {
    lines.push("មិនមានចំណាយផ្សេងៗ");
    lines.push(`ចំណាយផ្សេងៗសរុប: ${formatAmountPlain(calc.totalExpenses)}`);
    return lines.join("\n");
  }

  for (const expense of items) {
    lines.push(
      `- ${getExpenseCategoryLabel(expense.category)} | ${formatAmountPlain(getExpenseAmountKHR(expense))}`
    );
    lines.push(`  ថ្ងៃខែឆ្នាំ: ${formatKhmerDateExport(expense.expenseDate)}`);
    if (expense.note?.trim()) {
      lines.push(`  កំណត់ចំណាំ: ${expense.note.trim()}`);
    }
  }

  lines.push(`ចំណាយផ្សេងៗសរុប: ${formatAmountPlain(calc.totalExpenses)}`);
  return lines.join("\n");
}

function buildFinalSummaryText(report) {
  const calc = getReportCalculations(report);

  return [
    "សង្ខេបចុងក្រោយ",
    "",
    `ចំណូលលក់ប្រេងសរុប: ${formatAmountPlain(calc.fuelSalesTotal)}`,
    `អ្នកជំពាក់ថ្មីសរុប: ${formatAmountPlain(calc.newDebtTotal)}`,
    `សាច់ប្រាក់ពីការលក់ប្រេង: ${formatAmountPlain(calc.cashFromFuelSales)}`,
    `អ្នកសងប្រាក់សរុប: ${formatAmountPlain(calc.repaymentTotal)}`,
    `ចំណាយផ្សេងៗសរុប: ${formatAmountPlain(calc.totalExpenses)}`,
    "",
    `សាច់ប្រាក់សរុបថ្ងៃនេះ: ${formatAmountPlain(calc.finalCashTotal)}`,
    "",
    "រូបមន្ត:",
    "សាច់ប្រាក់សរុបថ្ងៃនេះ = ចំណូលលក់ប្រេងសរុប - អ្នកជំពាក់ថ្មី + អ្នកសងប្រាក់ - ចំណាយផ្សេងៗ",
  ].join("\n");
}

/** Plain-text summary for one closed report */
export function buildReportSummaryText(report, exportedAt = new Date()) {
  const calc = getReportCalculations(report);

  return [
    REPORT_TITLE,
    formatKhmerDateExport(report.reportDate),
    `បិទបញ្ជី${formatKhmerTimeExport(report.closedAt).replace("ម៉ោង", "នៅម៉ោង")}`,
    `Export: ${formatKhmerDateTimeExport(exportedAt)}`,
    "",
    buildFuelSalesText(report),
    "",
    buildNewDebtsText(report),
    "",
    buildRepaymentsText(report),
    "",
    buildExpensesText(report),
    "",
    buildFinalSummaryText(report),
    calc.finalAmountUSD > 0 ? `\n≈ ${formatUSD(calc.finalAmountUSD)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildReportsSummaryText(reports, exportedAt = new Date()) {
  return getExportableReports(reports)
    .map((report) => buildReportSummaryText(report, exportedAt))
    .join("\n\n====================================\n\n");
}

function buildFuelSalesHtml(report) {
  const rows = getReportRows(report);
  const calc = getReportCalculations(report);

  const rowHtml = rows
    .map(
      (row) => `
      <div class="fuel-line">
        <strong>${row.name}</strong>
        <span>${formatLitersPlain(row.litersSold)} × ${Number(row.pricePerLiter ?? 0).toLocaleString("en-US")}៛ = ${formatAmountPlain(row.amountKHR)}</span>
      </div>
    `
    )
    .join("");

  return `
    <section class="section">
      <h2>ការលក់ប្រេង</h2>
      ${rowHtml || '<p class="empty">មិនមានទិន្នន័យ</p>'}
      <table class="summary-table">
        <tr><td>លីត្រសរុប</td><td>${formatLitersPlain(calc.totalLiters)}</td></tr>
        <tr><td>ចំណូលលក់ប្រេងសរុប</td><td>${formatAmountPlain(calc.fuelSalesTotal)}</td></tr>
      </table>
    </section>
  `;
}

function buildNewDebtsHtml(report) {
  const debts = getNewDebts(report);

  if (!debts.length) {
    return `
      <section class="section">
        <h2>អ្នកជំពាក់ថ្មី</h2>
        <p class="empty">មិនមានអ្នកជំពាក់ថ្មី</p>
      </section>
    `;
  }

  const items = debts
    .map(
      (debt) => `
      <div class="detail-card">
        <p><strong>ឈ្មោះ:</strong> ${debt.customerName}</p>
        <p><strong>មុខទំនិញ:</strong> ${debt.productName}</p>
        <p>${formatDebtFormula(debt)}</p>
        <p><strong>ថ្ងៃជំពាក់:</strong> ${formatKhmerDateExport(debt.debtDate)}</p>
        ${debt.note?.trim() ? `<p><strong>កំណត់ចំណាំ:</strong> ${debt.note.trim()}</p>` : ""}
      </div>
    `
    )
    .join("");

  return `
    <section class="section">
      <h2>អ្នកជំពាក់ថ្មី</h2>
      ${items}
    </section>
  `;
}

function buildRepaymentsHtml(report) {
  const payments = getRepayments(report);

  if (!payments.length) {
    return `
      <section class="section">
        <h2>អ្នកសងប្រាក់</h2>
        <p class="empty">មិនមានអ្នកសងប្រាក់</p>
      </section>
    `;
  }

  const items = payments
    .map(
      (payment) => `
      <div class="detail-card">
        <p><strong>ឈ្មោះ:</strong> ${payment.customerName}</p>
        <p><strong>បានសង:</strong> ${formatAmountPlain(payment.amount)}</p>
        <p><strong>ថ្ងៃសង:</strong> ${formatKhmerDateExport(payment.paymentDate)}</p>
        <p><strong>នៅសល់:</strong> ${formatAmountPlain(payment.remainingAfter)}</p>
        ${payment.note?.trim() ? `<p><strong>កំណត់ចំណាំ:</strong> ${payment.note.trim()}</p>` : ""}
      </div>
    `
    )
    .join("");

  return `
    <section class="section">
      <h2>អ្នកសងប្រាក់</h2>
      ${items}
    </section>
  `;
}

function buildExpensesHtml(report) {
  const items = getExpenses(report);
  const calc = getReportCalculations(report);

  if (!items.length) {
    return `
      <section class="section">
        <h2>ចំណាយផ្សេងៗ</h2>
        <p class="empty">មិនមានចំណាយផ្សេងៗ</p>
        <table class="summary-table">
          <tr><td>ចំណាយផ្សេងៗសរុប</td><td>${formatAmountPlain(calc.totalExpenses)}</td></tr>
        </table>
      </section>
    `;
  }

  const rows = items
    .map(
      (expense) => `
      <div class="detail-card">
        <p><strong>ប្រភេទចំណាយ:</strong> ${getExpenseCategoryLabel(expense.category)}</p>
        <p><strong>ចំនួនលុយ:</strong> ${formatAmountPlain(getExpenseAmountKHR(expense))}</p>
        <p><strong>ថ្ងៃខែឆ្នាំ:</strong> ${formatKhmerDateExport(expense.expenseDate)}</p>
        ${expense.note?.trim() ? `<p><strong>កំណត់ចំណាំ:</strong> ${expense.note.trim()}</p>` : ""}
      </div>
    `
    )
    .join("");

  return `
    <section class="section">
      <h2>ចំណាយផ្សេងៗ</h2>
      ${rows}
      <table class="summary-table">
        <tr><td>ចំណាយផ្សេងៗសរុប</td><td>${formatAmountPlain(calc.totalExpenses)}</td></tr>
      </table>
    </section>
  `;
}

function buildFinalSummaryHtml(report) {
  const calc = getReportCalculations(report);

  return `
    <section class="section final">
      <h2>សង្ខេបចុងក្រោយ</h2>
      <table class="summary-table final-table">
        <tr><td>ចំណូលលក់ប្រេងសរុប</td><td>${formatAmountPlain(calc.fuelSalesTotal)}</td></tr>
        <tr><td>អ្នកជំពាក់ថ្មីសរុប</td><td>${formatAmountPlain(calc.newDebtTotal)}</td></tr>
        <tr><td>សាច់ប្រាក់ពីការលក់ប្រេង</td><td>${formatAmountPlain(calc.cashFromFuelSales)}</td></tr>
        <tr><td>អ្នកសងប្រាក់សរុប</td><td>${formatAmountPlain(calc.repaymentTotal)}</td></tr>
        <tr><td>ចំណាយផ្សេងៗសរុប</td><td>${formatAmountPlain(calc.totalExpenses)}</td></tr>
        <tr class="highlight"><td>សាច់ប្រាក់សរុបថ្ងៃនេះ</td><td>${formatAmountPlain(calc.finalCashTotal)}</td></tr>
      </table>
      <p class="formula">សាច់ប្រាក់សរុបថ្ងៃនេះ = ចំណូលលក់ប្រេងសរុប - អ្នកជំពាក់ថ្មី + អ្នកសងប្រាក់ - ចំណាយផ្សេងៗ</p>
      ${calc.finalAmountUSD > 0 ? `<p class="usd">≈ ${formatUSD(calc.finalAmountUSD)}</p>` : ""}
    </section>
  `;
}

function buildReportPrintSection(report, exportedAt = new Date()) {
  return `
    <article class="report-page">
      <header class="report-header">
        <h1>${REPORT_TITLE}</h1>
        <p>${formatKhmerDateExport(report.reportDate)}</p>
        <p>បិទបញ្ជី${formatKhmerTimeExport(report.closedAt).replace("ម៉ោង", "នៅម៉ោង")}</p>
        <p class="meta">Export: ${formatKhmerDateTimeExport(exportedAt)}</p>
      </header>
      ${buildFuelSalesHtml(report)}
      ${buildNewDebtsHtml(report)}
      ${buildRepaymentsHtml(report)}
      ${buildExpensesHtml(report)}
      ${buildFinalSummaryHtml(report)}
    </article>
  `;
}

function buildReportCsvSections(report, exportedAt = new Date()) {
  const calc = getReportCalculations(report);
  const lines = [];

  lines.push(["=== សង្ខេប ==="]);
  lines.push(["របាយការណ៍", REPORT_TITLE]);
  lines.push(["ថ្ងៃខែ", formatKhmerDateExport(report.reportDate)]);
  lines.push(["បិទបញ្ជី", formatKhmerDateTimeExport(report.closedAt)]);
  lines.push(["Export", formatKhmerDateTimeExport(exportedAt)]);
  lines.push([]);

  lines.push(["=== ការលក់ប្រេង ==="]);
  lines.push(["ប្រភេទ", "លីត្រ", "តម្លៃ/L", "រូបមន្ត", "សរុប"]);
  for (const row of getReportRows(report)) {
    lines.push([
      row.name,
      row.litersSold,
      row.pricePerLiter,
      `${row.litersSold} × ${row.pricePerLiter}`,
      row.amountKHR,
    ]);
  }
  lines.push(["លីត្រសរុប", calc.totalLiters]);
  lines.push(["ចំណូលលក់ប្រេងសរុប", calc.fuelSalesTotal]);
  lines.push([]);

  lines.push(["=== អ្នកជំពាក់ថ្មី ==="]);
  if (!getNewDebts(report).length) {
    lines.push(["មិនមានអ្នកជំពាក់ថ្មី"]);
  } else {
    lines.push(["ឈ្មោះ", "មុខទំនិញ", "លីត្រ", "តម្លៃ/L", "សរុប", "ថ្ងៃជំពាក់", "កំណត់ចំណាំ"]);
    for (const debt of getNewDebts(report)) {
      lines.push([
        debt.customerName,
        debt.productName,
        debt.liters,
        debt.pricePerLiter,
        debt.totalAmount,
        formatKhmerDateExport(debt.debtDate),
        debt.note ?? "",
      ]);
    }
  }
  lines.push([]);

  lines.push(["=== អ្នកសងប្រាក់ ==="]);
  if (!getRepayments(report).length) {
    lines.push(["មិនមានអ្នកសងប្រាក់"]);
  } else {
    lines.push(["ឈ្មោះ", "បានសង", "ថ្ងៃសង", "នៅសល់", "កំណត់ចំណាំ"]);
    for (const payment of getRepayments(report)) {
      lines.push([
        payment.customerName,
        payment.amount,
        formatKhmerDateExport(payment.paymentDate),
        payment.remainingAfter,
        payment.note ?? "",
      ]);
    }
  }
  lines.push([]);

  lines.push(["=== ចំណាយផ្សេងៗ ==="]);
  if (!getExpenses(report).length) {
    lines.push(["មិនមានចំណាយផ្សេងៗ"]);
  } else {
    lines.push(["ប្រភេទចំណាយ", "ចំនួនលុយ (៛)", "ថ្ងៃខែឆ្នាំ", "កំណត់ចំណាំ"]);
    for (const expense of getExpenses(report)) {
      lines.push([
        getExpenseCategoryLabel(expense.category),
        getExpenseAmountKHR(expense),
        formatKhmerDateExport(expense.expenseDate),
        expense.note ?? "",
      ]);
    }
  }
  lines.push(["ចំណាយផ្សេងៗសរុប", calc.totalExpenses]);
  lines.push([]);

  lines.push(["=== សង្ខេបចុងក្រោយ ==="]);
  lines.push(["ចំណូលលក់ប្រេងសរុប", calc.fuelSalesTotal]);
  lines.push(["អ្នកជំពាក់ថ្មីសរុប", calc.newDebtTotal]);
  lines.push(["សាច់ប្រាក់ពីការលក់ប្រេង", calc.cashFromFuelSales]);
  lines.push(["អ្នកសងប្រាក់សរុប", calc.repaymentTotal]);
  lines.push(["ចំណាយផ្សេងៗសរុប", calc.totalExpenses]);
  lines.push(["សាច់ប្រាក់សរុបថ្ងៃនេះ", calc.finalCashTotal]);

  return lines;
}

/** Client-side CSV export — opens in Excel with section blocks */
export function exportReportsToCSV(reports, filename = "daily-reports.csv") {
  const exportable = getExportableReports(reports);
  if (!exportable.length || typeof window === "undefined") return false;

  const exportedAt = new Date();
  const csvLines = [];

  exportable.forEach((report, index) => {
    if (index > 0) {
      csvLines.push([]);
      csvLines.push(["===================================="]);
      csvLines.push([]);
    }

    for (const row of buildReportCsvSections(report, exportedAt)) {
      csvLines.push(row.map(escapeCsv).join(","));
    }
  });

  downloadBlob(
    new Blob(["\uFEFF" + csvLines.join("\n")], { type: "text/csv;charset=utf-8;" }),
    filename
  );
  return true;
}

/** Print-friendly PDF via browser print dialog */
export function exportReportsToPDF(reports) {
  const exportable = getExportableReports(reports);
  if (!exportable.length || typeof window === "undefined") return false;

  const exportedAt = new Date();
  const sections = exportable
    .map((report) => buildReportPrintSection(report, exportedAt))
    .join("");

  const html = `<!DOCTYPE html>
<html lang="km">
<head>
  <meta charset="utf-8" />
  <title>${REPORT_TITLE}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${PDF_FONT_STYLESHEET}" rel="stylesheet" />
  <style>
    body { font-family: ${PDF_FONT_FAMILY}; color: #111; padding: 24px; background: #fff; }
    .report-page { page-break-after: always; margin-bottom: 32px; }
    .report-page:last-child { page-break-after: auto; }
    .report-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #f2a93b; padding-bottom: 12px; }
    .report-header h1 { font-size: 22px; margin: 0 0 8px; color: #b45309; font-weight: 700; }
    .report-header p { margin: 4px 0; font-size: 14px; }
    .report-header .meta { color: #666; font-size: 12px; }
    .section { margin-top: 18px; }
    .section h2 { font-size: 16px; color: #b45309; margin: 0 0 10px; border-bottom: 1px solid #eee; padding-bottom: 4px; font-weight: 600; }
    .fuel-line { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid #f3f3f3; font-size: 13px; }
    .fuel-line strong { min-width: 120px; font-weight: 600; }
    .detail-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; font-size: 13px; }
    .detail-card p { margin: 4px 0; }
    .summary-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
    .summary-table td { padding: 8px 6px; border-bottom: 1px solid #eee; }
    .summary-table td:last-child { text-align: right; font-weight: 600; white-space: nowrap; }
    .final-table tr.highlight td { color: #b45309; font-size: 16px; font-weight: 700; border-top: 2px solid #f2a93b; padding-top: 12px; }
    .formula { margin-top: 10px; color: #666; font-size: 11px; }
    .usd { text-align: right; color: #666; font-size: 12px; }
    .empty { color: #888; font-size: 13px; margin: 0; }
  </style>
</head>
<body>
  ${sections}
  <script>
    function printWhenReady() {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function() { window.print(); });
      } else {
        setTimeout(function() { window.print(); }, 600);
      }
    }
    if (document.readyState === "complete") {
      printWhenReady();
    } else {
      window.addEventListener("load", printWhenReady);
    }
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;

  printWindow.document.write(html);
  printWindow.document.close();
  return true;
}

export async function copyReportsSummary(reports) {
  const exportable = getExportableReports(reports);
  if (!exportable.length || typeof window === "undefined") {
    return { ok: false };
  }

  const text = buildReportsSummaryText(exportable);

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return { ok: true };
    }
  } catch {
    // fall through
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return { ok: true };
  } catch {
    document.body.removeChild(textarea);
    return { ok: false };
  }
}

export async function shareReports(reports) {
  const exportable = getExportableReports(reports);
  if (!exportable.length || typeof window === "undefined") {
    return { ok: false };
  }

  const text = buildReportsSummaryText(exportable);
  const title = REPORT_TITLE;

  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return { ok: true, method: "share" };
    } catch (error) {
      if (error?.name === "AbortError") {
        return { ok: false, cancelled: true };
      }
    }
  }

  const copied = await copyReportsSummary(exportable);
  if (copied.ok) {
    return { ok: true, method: "copy", fallback: true };
  }

  return { ok: false };
}
