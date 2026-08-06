
import { useEffect, useState } from "react";
import CollapsibleSection from "./CollapsibleSection";
import CloseDayModal from "./CloseDayModal";
import DailyExpenses from "./DailyExpenses";
import SessionSalesHistory from "./SessionSalesHistory";
import { formatKHR, formatUSD } from "@/lib/formatters";
import { CLOSE_DAY_ERROR } from "@/lib/calculations";

const FUEL_DOT = {
  green: "#34d399",
  blue: "#60a5fa",
  red: "#f87171",
  orange: "#f87171",
};

export default function DailySummary({
  summary,
  closingFinancials,
  sessionExpenses,
  sessionSales,
  sessionStartAt,
  fuels,
  canCloseDay,
  onCloseDay,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onUpdateSale,
  onDeleteSale,
  onCorrectSale,
}) {
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeError, setCloseError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [closingDay, setClosingDay] = useState(false);
  const { fuelRows, debtTodayAmount, debtTodayUSD } = summary;
  const {
    fuelSalesTotal,
    newDebtTotal,
    repaymentTotal,
    totalExpenses,
    cashFromFuelSales,
    finalCashTotal,
    finalCashUSD,
  } = closingFinancials;

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = setTimeout(() => setSuccessMessage(""), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  function handleOpenCloseModal() {
    if (!canCloseDay) return;
    setCloseError("");
    setShowCloseModal(true);
  }

  async function handleConfirmClose() {
    if (closingDay) return;

    setClosingDay(true);
    try {
      const result = await onCloseDay();
      if (!result?.ok) {
        setCloseError(result?.error || CLOSE_DAY_ERROR);
        setShowCloseModal(false);
        return;
      }
      setShowCloseModal(false);
      setCloseError("");
      setSuccessMessage("បានបិទបញ្ជីថ្ងៃនេះជោគជ័យ");
    } catch {
      setCloseError("មានបញ្ហាក្នុងការបិទបញ្ជី");
      setShowCloseModal(false);
    } finally {
      setClosingDay(false);
    }
  }

  return (
    <>
      <CollapsibleSection title="សរុបថ្ងៃនេះ">
        <p className="summary-calc-note">
          សរុបគណនាដោយស្វ័យប្រវត្តិពីកំណត់ត្រាលក់ក្នុងវគ្គបច្ចុប្បន្ន
        </p>

        <div className="summary-table-wrap">
          <table className="summary-table">
            <colgroup>
              <col className="summary-col-type" />
              <col className="summary-col-liters" />
              <col className="summary-col-khr" />
              <col className="summary-col-usd" />
            </colgroup>
            <thead>
              <tr>
                <th className="summary-th-type">ប្រភេទ</th>
                <th className="summary-th-num">បរិមាណលក់</th>
                <th className="summary-th-num">ចំណូល (៛)</th>
                <th className="summary-th-num en">ចំណូល ($)</th>
              </tr>
            </thead>
            <tbody>
              {fuelRows.map((row) => (
                <tr key={row.slug}>
                  <td className="summary-td-type">
                    <span
                      className="summary-fuel-dot"
                      style={{ background: FUEL_DOT[row.accentColor] ?? FUEL_DOT.green }}
                    />
                    {row.name}
                  </td>
                  <td className="summary-td-num tabular-nums en">
                    {row.litersSold.toLocaleString("en-US")} L
                  </td>
                  <td className="summary-td-num tabular-nums">{formatKHR(row.amountKHR)}</td>
                  <td className="summary-td-num tabular-nums en">{formatUSD(row.amountUSD)}</td>
                </tr>
              ))}

              <tr className="summary-debt-row">
                <td className="summary-td-type">អ្នកជំពាក់ថ្មី (ថ្ងៃនេះ)</td>
                <td className="summary-td-num">—</td>
                <td className="summary-td-num tabular-nums">{formatKHR(debtTodayAmount)}</td>
                <td className="summary-td-num tabular-nums en">{formatUSD(debtTodayUSD)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <SessionSalesHistory
          sessionSales={sessionSales}
          sessionStartAt={sessionStartAt}
          fuels={fuels}
          onUpdateSale={onUpdateSale}
          onDeleteSale={onDeleteSale}
          onCorrectSale={onCorrectSale}
          onSuccess={setSuccessMessage}
        />

        <div className="closing-mini-summary">
          <div className="closing-mini-row">
            <span>អ្នកជំពាក់ថ្មីសរុប</span>
            <span className="tabular-nums">{formatKHR(newDebtTotal)}</span>
          </div>
          <div className="closing-mini-row">
            <span>អ្នកសងប្រាក់សរុប</span>
            <span className="tabular-nums">{formatKHR(repaymentTotal)}</span>
          </div>
        </div>

        <DailyExpenses
          expenses={sessionExpenses}
          totalExpenses={totalExpenses}
          onAddExpense={onAddExpense}
          onUpdateExpense={onUpdateExpense}
          onDeleteExpense={onDeleteExpense}
        />

        <div className="closing-final-summary">
          <h3 className="closing-final-title">សង្ខេបចុងក្រោយ</h3>
          <div className="closing-final-row">
            <span>ចំណូលលក់ប្រេងសរុប</span>
            <span className="tabular-nums">{formatKHR(fuelSalesTotal)}</span>
          </div>
          <div className="closing-final-row">
            <span>អ្នកជំពាក់ថ្មីសរុប</span>
            <span className="tabular-nums">{formatKHR(newDebtTotal)}</span>
          </div>
          <div className="closing-final-row">
            <span>សាច់ប្រាក់ពីការលក់ប្រេង</span>
            <span className="tabular-nums">{formatKHR(cashFromFuelSales)}</span>
          </div>
          <div className="closing-final-row">
            <span>អ្នកសងប្រាក់សរុប</span>
            <span className="tabular-nums">{formatKHR(repaymentTotal)}</span>
          </div>
          <div className="closing-final-row">
            <span>ចំណាយផ្សេងៗសរុប</span>
            <span className="tabular-nums">{formatKHR(totalExpenses)}</span>
          </div>
          <div className="closing-final-row closing-final-total">
            <span>សាច់ប្រាក់សរុបថ្ងៃនេះ</span>
            <span className="tabular-nums">{formatKHR(finalCashTotal)}</span>
          </div>
          <p className="closing-final-usd tabular-nums en">≈ {formatUSD(finalCashUSD)}</p>
        </div>

        <div className="summary-close-footer">
          <div className="summary-close-meta">
            {!canCloseDay && (
              <p className="summary-close-hint">មិនមានទិន្នន័យសម្រាប់បិទបញ្ជីទេ</p>
            )}
            {closeError && <p className="error-text">{closeError}</p>}
            {successMessage && (
              <p className="summary-success-text" role="status">
                {successMessage}
              </p>
            )}
          </div>
          <button
            type="button"
            className="btn-gold btn-close-day"
            onClick={handleOpenCloseModal}
            disabled={!canCloseDay}
            aria-disabled={!canCloseDay}
          >
            បិទបញ្ជីថ្ងៃនេះ
          </button>
        </div>
      </CollapsibleSection>

      <CloseDayModal
        open={showCloseModal}
        onConfirm={handleConfirmClose}
        onCancel={() => !closingDay && setShowCloseModal(false)}
        closing={closingDay}
      />
    </>
  );
}
