
import { useMemo, useState } from "react";
import { formatKHR } from "@/lib/formatters";
import { formatKhmerDateCompact } from "@/lib/dates";
import { getSalePermissions } from "@/lib/saleSafety";
import EditSaleModal from "./EditSaleModal";
import DeleteSaleModal from "./DeleteSaleModal";

const FUEL_DOT = {
  green: "#34d399",
  blue: "#60a5fa",
  red: "#f87171",
  orange: "#f87171",
};

export default function SessionSalesHistory({
  sessionSales,
  sessionStartAt,
  fuels,
  onUpdateSale,
  onDeleteSale,
  onCorrectSale,
  onSuccess,
}) {
  const [editSale, setEditSale] = useState(null);
  const [deleteSale, setDeleteSale] = useState(null);
  const [deleteMode, setDeleteMode] = useState("confirm");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

  const sortedSales = useMemo(
    () =>
      [...sessionSales].sort(
        (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
      ),
    [sessionSales]
  );

  function enrichSale(sale) {
    return {
      ...sale,
      ...getSalePermissions(sale, sessionStartAt),
    };
  }

  function handleEditClick(sale) {
    const enriched = enrichSale(sale);
    if (enriched.canEdit || enriched.canCorrect) {
      setEditSale(enriched);
      return;
    }
    setDeleteMode("blocked");
    setDeleteMessage(enriched.blockReason || "");
    setDeleteSale(enriched);
  }

  function handleDeleteClick(sale) {
    const enriched = enrichSale(sale);
    if (enriched.canDelete) {
      setDeleteMode("confirm");
      setDeleteMessage("");
      setDeleteSale(enriched);
      return;
    }
    setDeleteMode("blocked");
    setDeleteMessage(enriched.blockReason || "");
    setDeleteSale(enriched);
  }

  async function handleConfirmDelete() {
    if (!deleteSale || deleteMode !== "confirm") return;

    setDeleting(true);
    try {
      const result = await onDeleteSale(deleteSale.id);
      if (!result?.ok) {
        setDeleteMode("blocked");
        setDeleteMessage(result?.error || "មិនអាចលុបបាន");
        return;
      }
      setDeleteSale(null);
      onSuccess?.("បានលុបទិន្នន័យជោគជ័យ");
    } finally {
      setDeleting(false);
    }
  }

  function handleEditClose(message) {
    setEditSale(null);
    if (message) onSuccess?.(message);
  }

  return (
    <>
      <section className="session-sales-history">
        <div className="session-sales-header">
          <div className="session-sales-heading">
            <h3 className="session-sales-title">ប្រវត្តិលក់ (ថ្ងៃនេះ)</h3>
            {sortedSales.length > 0 && (
              <span className="session-sales-count">
                {sortedSales.length} កំណត់ត្រា
              </span>
            )}
          </div>
        </div>

        {sortedSales.length === 0 ? (
          <p className="session-sales-empty">មិនមានកំណត់ត្រាលក់ថ្ងៃនេះ</p>
        ) : (
          <>
            <p className="session-sales-hint">
              កែប្រែ ឬលុបកំណត់ត្រាក្នុងវគ្គបច្ចុប្បន្ន — សរុបថ្ងៃនេះនឹងគណនាឡើងវិញដោយស្វ័យប្រវត្តិ។
              កំណត់ត្រាបិទបញ្ជីរួចហើយអាចកែតម្រូវបានតែជាប្រវត្តិ។
            </p>

            <div className="session-sales-table-wrap">
              <table className="session-sales-table">
                <colgroup>
                  <col className="session-sales-col-fuel" />
                  <col className="session-sales-col-num" />
                  <col className="session-sales-col-num" />
                  <col className="session-sales-col-amount" />
                  <col className="session-sales-col-date" />
                  <col className="session-sales-col-note" />
                  <col className="session-sales-col-actions" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="session-sales-th-type">ប្រភេទប្រេង</th>
                    <th className="session-sales-th-num">លីត្រ</th>
                    <th className="session-sales-th-num">តម្លៃ/លីត្រ</th>
                    <th className="session-sales-th-num">ចំនួនលុយ</th>
                    <th className="session-sales-th-date">ថ្ងៃខែ</th>
                    <th className="session-sales-th-note">កំណត់ចំណាំ</th>
                    <th className="session-sales-th-actions" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {sortedSales.map((sale) => {
                    const enriched = enrichSale(sale);
                    const dotColor =
                      FUEL_DOT[sale.fuelType?.accentColor] ?? FUEL_DOT.green;
                    const isClosed = !enriched.inOpenSession;
                    const editLabel =
                      enriched.canCorrect && !enriched.canEdit ? "កែតម្រូវ" : "កែប្រែ";

                    return (
                      <tr
                        key={sale.id}
                        className={isClosed ? "session-sales-row is-closed" : "session-sales-row"}
                      >
                        <td className="session-sales-td-type">
                          <div className="session-sales-fuel">
                            <span
                              className="summary-fuel-dot"
                              style={{ background: dotColor }}
                            />
                            <span className="session-sales-fuel-name">
                              {sale.fuelType?.nameKhmer ?? "—"}
                            </span>
                          </div>
                          {isClosed && (
                            <span className="session-sales-badge is-closed">បិទបញ្ជី</span>
                          )}
                        </td>
                        <td className="session-sales-td-num tabular-nums en">
                          {sale.liters.toLocaleString("en-US")} L
                        </td>
                        <td className="session-sales-td-num tabular-nums en">
                          {sale.pricePerLiter.toLocaleString("en-US")} ៛
                        </td>
                        <td className="session-sales-td-num tabular-nums session-sales-amount">
                          {formatKHR(sale.amountKHR)}
                        </td>
                        <td className="session-sales-td-date">
                          <time dateTime={sale.saleDate}>
                            {formatKhmerDateCompact(sale.saleDate)}
                          </time>
                        </td>
                        <td className="session-sales-td-note">
                          {sale.note?.trim() || "—"}
                        </td>
                        <td className="session-sales-td-actions">
                          <div className="session-sales-actions">
                            <button
                              type="button"
                              className="session-sales-btn session-sales-btn-edit"
                              onClick={() => handleEditClick(sale)}
                              title={
                                enriched.canEdit
                                  ? "កែប្រែកំណត់ត្រា"
                                  : enriched.canCorrect
                                    ? "កែតម្រូវ (ប្រវត្តិ)"
                                    : enriched.blockReason
                              }
                            >
                              {editLabel}
                            </button>
                            <button
                              type="button"
                              className="session-sales-btn session-sales-btn-delete"
                              onClick={() => handleDeleteClick(sale)}
                              title={enriched.canDelete ? "លុបកំណត់ត្រា" : enriched.blockReason}
                            >
                              លុប
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <EditSaleModal
        open={Boolean(editSale)}
        sale={editSale}
        fuels={fuels}
        sessionStartAt={sessionStartAt}
        onClose={handleEditClose}
        onSave={onUpdateSale}
        onCorrect={onCorrectSale}
      />

      <DeleteSaleModal
        open={Boolean(deleteSale)}
        mode={deleteMode}
        message={deleteMessage}
        deleting={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setDeleteSale(null)}
      />
    </>
  );
}
