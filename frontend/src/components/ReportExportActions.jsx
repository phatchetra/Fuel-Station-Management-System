
import { useEffect, useState } from "react";
import {
  EXPORT_NO_DATA_MESSAGE,
  EXPORT_SUCCESS_MESSAGE,
  copyReportsSummary,
  exportReportsToPDF,
  getExportableReports,
  shareReports,
} from "@/lib/dailyReportHelpers";

export default function ReportExportActions({ reports, disabled }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("success");

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function showToast(message, type = "success") {
    setToastType(type);
    setToast(message);
  }

  function getExportableOrWarn() {
    const exportable = getExportableReports(reports);
    if (!exportable.length) {
      showToast(EXPORT_NO_DATA_MESSAGE, "error");
      return null;
    }
    return exportable;
  }

  function handlePdf() {
    const exportable = getExportableOrWarn();
    if (!exportable) return;

    if (exportReportsToPDF(exportable)) {
      setMenuOpen(false);
    }
  }

  async function handleCopy() {
    const exportable = getExportableOrWarn();
    if (!exportable) return;

    const result = await copyReportsSummary(exportable);
    if (result.ok) {
      showToast(EXPORT_SUCCESS_MESSAGE);
      setMenuOpen(false);
    }
  }

  async function handleShare() {
    const exportable = getExportableOrWarn();
    if (!exportable) return;

    const result = await shareReports(exportable);
    if (result.ok && result.fallback) {
      showToast(EXPORT_SUCCESS_MESSAGE);
    }
    if (result.ok || result.cancelled) {
      setMenuOpen(false);
    }
  }

  return (
    <>
      <div className="report-export-desktop">
        <button
          type="button"
          className="btn-dark"
          onClick={handlePdf}
          disabled={disabled}
        >
          Export PDF
        </button>
      </div>

      <div className="report-export-mobile">
        <button
          type="button"
          className="btn-dark report-export-trigger"
          onClick={() => setMenuOpen(true)}
          disabled={disabled}
        >
          Export / ចែករំលែក
        </button>
      </div>

      {menuOpen && (
        <div
          className="report-export-backdrop"
          onClick={() => setMenuOpen(false)}
          role="presentation"
        >
          <div
            className="report-export-sheet"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-label="Export options"
          >
            <div className="report-export-sheet-handle" />
            <p className="report-export-sheet-title">Export / ចែករំលែក</p>
            <div className="report-export-sheet-actions">
              <button type="button" className="report-export-option" onClick={handlePdf}>
                Export PDF
              </button>
              <button type="button" className="report-export-option" onClick={handleCopy}>
                Copy Summary
              </button>
              <button type="button" className="report-export-option" onClick={handleShare}>
                Share Report
              </button>
            </div>
            <button
              type="button"
              className="report-export-cancel"
              onClick={() => setMenuOpen(false)}
            >
              បិទ
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`report-export-toast ${
            toastType === "error" ? "report-export-toast-error" : ""
          }`}
        >
          {toast}
        </div>
      )}
    </>
  );
}
