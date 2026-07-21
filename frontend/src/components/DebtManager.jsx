
import { useMemo, useState } from "react";
import StatusBadge from "./StatusBadge";
import EmptyState from "./EmptyState";
import AddDebtModal from "./AddDebtModal";
import PaymentModal from "./PaymentModal";
import PaymentHistory from "./PaymentHistory";
import { IconSearch } from "./icons";
import { formatKHR, formatUSD } from "@/lib/formatters";
import { formatKhmerDate } from "@/lib/dates";
import { getDebtPaidPercent, getLastPaymentDate, getDebtStatus, unpackDebtContact } from "@/lib/debtHelpers";
import { khrToUsd } from "@/lib/calculations";

const DEBT_FILTERS = [
  { key: "all", label: "ទាំងអស់" },
  { key: "unpaid", label: "មិនទាន់សង" },
  { key: "paid", label: "សងរួច" },
];

function getInitial(name) {
  const trimmed = name?.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

function DebtRow({
  debt,
  deletingDebtId,
  onPay,
  onPayAll,
  onDelete,
}) {
  const status = getDebtStatus(debt);
  const lastPaymentDate = getLastPaymentDate(debt.payments ?? []);
  const paidPercent = getDebtPaidPercent(debt);
  const { phone, notes } = unpackDebtContact(debt.phoneOrNote);

  return (
    <article className={`debt-row debt-row-${status.toLowerCase()}`}>
      <div className="debt-row-main">
        <div className="debt-row-avatar" aria-hidden>
          {getInitial(debt.customerName)}
        </div>

        <div className="debt-row-body">
          <div className="debt-row-head">
            <div className="debt-row-title-block">
              <h3 className="debt-row-name">{debt.customerName}</h3>
              <div className="debt-row-chips">
                <span className="debt-row-chip">
                  <span className="debt-row-chip-label">ថ្ងៃជំពាក់</span>
                  {formatKhmerDate(debt.debtDate)}
                </span>
                {phone && (
                  <span className="debt-row-chip">
                    <span className="debt-row-chip-label">ទូរស័ព្ទ</span>
                    {phone}
                  </span>
                )}
                {notes && (
                  <span className="debt-row-chip">
                    <span className="debt-row-chip-label">កំណត់ចំណាំ</span>
                    {notes}
                  </span>
                )}
                {lastPaymentDate && (
                  <span className="debt-row-chip debt-row-chip-success">
                    <span className="debt-row-chip-label">សងចុងក្រោយ</span>
                    {formatKhmerDate(lastPaymentDate)}
                  </span>
                )}
              </div>
            </div>

            <div className="debt-row-amount-block">
              <StatusBadge status={status} />
              <p className="debt-row-remaining-label">នៅសល់</p>
              <p className="debt-row-remaining-value tabular-nums">
                {formatKHR(debt.remainingAmount)}
              </p>
            </div>
          </div>

          <div className="debt-row-progress">
            <div className="debt-progress-track">
              <div
                className="debt-progress-fill"
                style={{ width: `${paidPercent}%` }}
                role="progressbar"
                aria-valuenow={paidPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`បានសង ${paidPercent}%`}
              />
            </div>
            <div className="debt-row-progress-meta">
              <span className="tabular-nums en">បានសង {paidPercent}%</span>
              <span className="debt-row-progress-amounts tabular-nums">
                {formatKHR(debt.paidAmount)} / {formatKHR(debt.totalAmount)}
              </span>
            </div>
          </div>

          {(debt.payments?.length ?? 0) > 0 && (
            <PaymentHistory payments={debt.payments} defaultOpen={false} />
          )}
        </div>
      </div>

      <div className={`debt-row-actions ${status === "PAID" ? "debt-row-actions-paid" : ""}`}>
        {status !== "PAID" && (
          <>
            <button type="button" className="btn-pay debt-action-btn" onClick={onPay}>
              សងប្រាក់
            </button>
            <button type="button" className="btn-pay-all debt-action-btn" onClick={onPayAll}>
              សងអស់
            </button>
          </>
        )}
        <button
          type="button"
          className="btn-delete debt-action-btn debt-action-delete"
          onClick={onDelete}
          disabled={deletingDebtId === debt.id}
        >
          {deletingDebtId === debt.id ? "..." : "លុប"}
        </button>
      </div>
    </article>
  );
}

export default function DebtManager({
  debts,
  exchangeRate,
  onAddDebt,
  onRecordPayment,
  onDeleteDebt,
}) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payingDebtId, setPayingDebtId] = useState(null);
  const [deletingDebtId, setDeletingDebtId] = useState(null);
  const [debtFilter, setDebtFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [payModal, setPayModal] = useState({ debtId: null, presetAmount: null });

  const totalRemaining = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const unpaidCount = debts.filter((d) => getDebtStatus(d) !== "PAID").length;
  const modalDebt = debts.find((debt) => debt.id === payModal.debtId) ?? null;

  const filteredDebts = useMemo(() => {
    return debts.filter((debt) => {
      const status = getDebtStatus(debt);
      if (debtFilter === "unpaid" && status === "PAID") return false;
      if (debtFilter === "paid" && status !== "PAID") return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          debt.customerName.toLowerCase().includes(q) ||
          (debt.phoneOrNote ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [debts, debtFilter, search]);

  const filterCounts = useMemo(() => {
    const unpaid = debts.filter((d) => getDebtStatus(d) !== "PAID").length;
    const paid = debts.filter((d) => getDebtStatus(d) === "PAID").length;
    return { all: debts.length, unpaid, paid };
  }, [debts]);

  async function handleAddDebt(form) {
    setSubmitting(true);
    const result = await onAddDebt(form);
    setSubmitting(false);
    return result;
  }

  function openPayModal(debtId, presetAmount = null) {
    setPayModal({ debtId, presetAmount });
  }

  function closePayModal() {
    setPayModal({ debtId: null, presetAmount: null });
  }

  async function handleDelete(debtId) {
    if (!window.confirm("តើអ្នកពិតជាចង់លុបបំណុលនេះ?")) return;

    setDeletingDebtId(debtId);
    const result = await onDeleteDebt(debtId);
    setDeletingDebtId(null);

    if (!result?.ok) {
      window.alert(result?.error || "មិនអាចលុបបំណុលបានទេ");
    }
  }

  async function handleSavePayment(debtId, paymentData) {
    setPayingDebtId(debtId);
    const result = await onRecordPayment(debtId, paymentData);
    setPayingDebtId(null);
    return result;
  }

  return (
    <>
      <div className="debt-page card">
        <div className="debt-summary-bar">
          <div className="debt-summary-item debt-summary-item-highlight">
            <span className="debt-summary-label">សរុបនៅសល់</span>
            <span className="debt-summary-value tabular-nums">{formatKHR(totalRemaining)}</span>
            <span className="debt-summary-sub en tabular-nums">
              ≈ {formatUSD(khrToUsd(totalRemaining, exchangeRate))}
            </span>
          </div>
          <div className="debt-summary-item">
            <span className="debt-summary-label">មិនទាន់សង</span>
            <span className="debt-summary-value tabular-nums">{unpaidCount}</span>
            <span className="debt-summary-sub">នាក់</span>
          </div>
          <div className="debt-summary-item">
            <span className="debt-summary-label">បំណុលទាំងអស់</span>
            <span className="debt-summary-value tabular-nums">{debts.length}</span>
            <span className="debt-summary-sub">កំណត់ត្រា</span>
          </div>
        </div>

        <div className="debt-toolbar debt-toolbar-full">
          <div className="debt-toolbar-left">
            <div className="debt-search-field">
              <IconSearch className="debt-search-icon" />
              <input
                type="search"
                className="debt-search-input"
                placeholder="ស្វែងរកឈ្មោះ ឬ កំណត់ចំណាំ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="debt-filter-group">
              {DEBT_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setDebtFilter(f.key)}
                  className={`btn-filter ${debtFilter === f.key ? "btn-filter-active" : ""}`}
                >
                  {f.label} ({filterCounts[f.key]})
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="btn-gold debt-add-btn"
            onClick={() => setAddModalOpen(true)}
          >
            + បន្ថែមអ្នកជំពាក់
          </button>
        </div>

        {filteredDebts.length === 0 ? (
          <EmptyState
            message={
              search.trim() || debtFilter !== "all"
                ? "មិនមានលទ្ធផល"
                : "មិនទាន់មានបំណុល — ចុច «បន្ថែមអ្នកជំពាក់»"
            }
          />
        ) : (
          <div className="debt-list debt-list-rows">
            {filteredDebts.map((debt) => (
              <DebtRow
                key={debt.id}
                debt={debt}
                deletingDebtId={deletingDebtId}
                onPay={() => openPayModal(debt.id)}
                onPayAll={() => openPayModal(debt.id, debt.remainingAmount)}
                onDelete={() => handleDelete(debt.id)}
              />
            ))}
          </div>
        )}
      </div>

      <AddDebtModal
        open={addModalOpen}
        saving={submitting}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddDebt}
      />

      {modalDebt && (
        <PaymentModal
          debt={modalDebt}
          presetAmount={payModal.presetAmount}
          saving={payingDebtId === modalDebt.id}
          onClose={closePayModal}
          onSave={handleSavePayment}
        />
      )}
    </>
  );
}
