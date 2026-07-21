
import { useMemo, useState } from "react";
import CollapsibleSection from "./CollapsibleSection";
import EmptyState from "./EmptyState";
import ReportExportActions from "./ReportExportActions";
import { formatKHR, formatKhmerLiters } from "@/lib/formatters";
import { formatKhmerDate, formatDateTime } from "@/lib/dates";
import {
  REPORTS_PAGE_SIZE,
  REPORT_STATUS_LABEL,
  filterDailyReports,
  paginateItems,
  summarizeReports,
} from "@/lib/dailyReportHelpers";

const FUEL_CHIP = {
  green: "report-chip-green",
  blue: "report-chip-blue",
  red: "report-chip-red",
};

const EMPTY_FILTERS = { fromDate: "", toDate: "" };

export default function ClosedReportsSection({ dailyReports }) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [applied, setApplied] = useState(EMPTY_FILTERS);

  const filteredReports = useMemo(
    () => filterDailyReports(dailyReports, applied),
    [dailyReports, applied]
  );

  const stats = useMemo(() => summarizeReports(filteredReports), [filteredReports]);

  const pagination = useMemo(
    () => paginateItems(filteredReports, page, REPORTS_PAGE_SIZE),
    [filteredReports, page]
  );

  function handleSearch() {
    setApplied({ fromDate, toDate });
    setPage(1);
  }

  function handleClearFilters() {
    setFromDate("");
    setToDate("");
    setApplied(EMPTY_FILTERS);
    setPage(1);
  }

  return (
    <CollapsibleSection title="របាយការណ៍បិទបញ្ជី">
      <div className="closed-reports-layout">
        <div className="closed-reports-stats">
          <div className="closed-reports-stat">
            <span className="closed-reports-stat-label">ចំនួនរបាយការណ៍</span>
            <span className="closed-reports-stat-value tabular-nums">{stats.count}</span>
          </div>
          <div className="closed-reports-stat">
            <span className="closed-reports-stat-label">លីត្រសរុប</span>
            <span className="closed-reports-stat-value tabular-nums">
              {formatKhmerLiters(stats.totalLiters)}
            </span>
          </div>
          <div className="closed-reports-stat closed-reports-stat-highlight">
            <span className="closed-reports-stat-label">ចំណូលសរុប</span>
            <span className="closed-reports-stat-value tabular-nums">
              {formatKHR(stats.totalKHR)}
            </span>
          </div>
        </div>

        <div className="card-inset closed-reports-filters">
          <div className="closed-reports-filter-bar">
            <div className="closed-reports-filter-dates">
              <div className="closed-reports-filter-field">
                <label className="khmer-label">ពីថ្ងៃទី</label>
                <input
                  type="date"
                  className="input input-sm"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="closed-reports-filter-field">
                <label className="khmer-label">ដល់ថ្ងៃទី</label>
                <input
                  type="date"
                  className="input input-sm"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <div className="closed-reports-filter-buttons">
                <button type="button" className="btn-gold" onClick={handleSearch}>
                  ស្វែងរក
                </button>
                <button type="button" className="btn-dark" onClick={handleClearFilters}>
                  សម្អាត
                </button>
              </div>
            </div>
            <div className="closed-reports-filter-export">
              <ReportExportActions
                reports={filteredReports}
                disabled={filteredReports.length === 0}
              />
            </div>
          </div>
        </div>

        {pagination.totalItems === 0 ? (
          <EmptyState message="មិនមានរបាយការណ៍បិទបញ្ជី" />
        ) : (
          <>
            <div className="closed-reports-list">
              {pagination.items.map((report) => (
                <article key={report.id} className="closed-report-card">
                  <div className="closed-report-header">
                    <div>
                      <div className="closed-report-top">
                        <span className="closed-report-date">
                          {formatKhmerDate(report.reportDate)}
                        </span>
                        <span className="closed-report-status">{REPORT_STATUS_LABEL}</span>
                      </div>
                      <p className="closed-report-meta">
                        បិទនៅ {formatDateTime(report.closedAt)}
                      </p>
                    </div>
                    <span className="closed-report-total tabular-nums">
                      {formatKHR(report.finalAmountKHR)}
                    </span>
                  </div>

                  <div className="closed-report-fuels">
                    {(report.fuelRows ?? [])
                      .filter((row) => row.litersSold > 0)
                      .map((row) => (
                        <span
                          key={row.slug}
                          className={`closed-report-chip ${
                            FUEL_CHIP[row.accentColor] ?? FUEL_CHIP.green
                          }`}
                        >
                          {row.name} {row.litersSold.toLocaleString("en-US")} L
                        </span>
                      ))}
                  </div>

                  <p className="closed-report-detail tabular-nums en">
                    លីត្រសរុប {report.totalLiters.toLocaleString("en-US")} L
                  </p>
                </article>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="report-pagination">
                <button
                  type="button"
                  className="btn-dark report-page-btn"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  មុន
                </button>
                <span className="report-page-info tabular-nums">
                  ទំព័រ {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  type="button"
                  className="btn-dark report-page-btn"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  បន្ទាប់
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </CollapsibleSection>
  );
}
