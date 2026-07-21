import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  IconCalculator,
  IconDashboard,
  IconDebt,
  IconExpense,
  IconFuel,
  IconLogout,
  IconReport,
  IconStock,
} from "@/components/icons";
import { logout } from "@/lib/apiClient";
import ConfirmModal from "@/components/ConfirmModal";

const NAV_ITEMS = [
  { to: "/", label: "ផ្ទាំងគ្រប់គ្រង", end: true, Icon: IconDashboard },
  { to: "/stock-batches", label: "ស្តុក", Icon: IconStock },
  { to: "/fuels", label: "ប្រេង", Icon: IconFuel },
  { to: "/daily-summary", label: "ការគណនា", Icon: IconCalculator },
  { to: "/expenses", label: "ការចំណាយ", Icon: IconExpense },
  { to: "/debts", label: "បំណុល", Icon: IconDebt },
  { to: "/reports", label: "របាយការណ៍", Icon: IconReport },
];

export default function Sidebar({ open, onClose, user }) {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  async function confirmLogout() {
    setLoggingOut(true);
    try {
      await logout();
      setLogoutConfirmOpen(false);
      navigate("/login");
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <>
      {open && (
        <button
          type="button"
          className="sidebar-overlay lg:hidden"
          aria-label="បិទម៉ឺនុយ"
          onClick={onClose}
        />
      )}

      <aside className={`app-sidebar ${open ? "app-sidebar-open" : ""}`}>
        <div className="app-sidebar-brand">
          <span className="app-sidebar-icon">
            <IconFuel />
          </span>
          <div>
            <p className="label-brand">FUEL LEDGER</p>
            <p className="text-sm font-semibold">បញ្ជីប្រេងសាំង</p>
          </div>
        </div>

        <nav className="app-sidebar-nav">
          {NAV_ITEMS.map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `app-sidebar-link${isActive ? " app-sidebar-link-active" : ""}`
              }
              onClick={onClose}
            >
              <Icon className="app-sidebar-link-icon" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar-footer">
          {user?.name && (
            <p className="app-sidebar-user en truncate">{user.name}</p>
          )}
          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(true)}
            disabled={loggingOut}
            className="app-sidebar-logout disabled:opacity-50"
            title="ចាកចេញ"
          >
            <IconLogout className="w-4 h-4 shrink-0" />
            {loggingOut ? "..." : "ចាកចេញ"}
          </button>
        </div>
      </aside>

      <ConfirmModal
        open={logoutConfirmOpen}
        title="ចាកចេញ?"
        message="តើអ្នកពិតជាចង់ចាកចេញពីគណនីនេះមែនទេ?"
        confirmLabel="ចាកចេញ"
        cancelLabel="បោះបង់"
        confirmClassName="btn-delete"
        loading={loggingOut}
        onConfirm={confirmLogout}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </>
  );
}
