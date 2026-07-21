
import { useState } from "react";

function ChevronIcon({ open }) {
  return (
    <svg
      className={`section-chevron ${open ? "section-chevron-open" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Dashboard section with title + dropdown toggle at the end.
 */
export default function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = true,
  headerExtra,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);

  function toggle() {
    setOpen((value) => !value);
  }

  return (
    <section className="card dashboard-section">
      <div className="section-collapse-header">
        <button
          type="button"
          className="section-collapse-title"
          onClick={toggle}
          aria-expanded={open}
        >
          <span className="section-title-block">
            <span className="section-title-row">
              <span className="section-title-dot" />
              <span className="section-title">{title}</span>
            </span>
            {subtitle && <span className="section-subtitle">{subtitle}</span>}
          </span>
        </button>

        <div className="section-header-end">
          {headerExtra && <div className="section-header-extra">{headerExtra}</div>}
          <button
            type="button"
            className="section-collapse-toggle"
            onClick={toggle}
            aria-expanded={open}
            aria-label={open ? "បិទផ្នែក" : "បើកផ្នែក"}
          >
            <ChevronIcon open={open} />
          </button>
        </div>
      </div>

      {open && <div className="section-collapse-body">{children}</div>}
    </section>
  );
}
