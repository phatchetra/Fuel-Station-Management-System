import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "@/components/Header";
import Sidebar from "@/layouts/Sidebar";
import { AppDataProvider } from "@/context/AppDataContext";
import { useAppData } from "@/hooks/useAppData";
import { toDateInputValue } from "@/lib/dates";

function AppShellContent({ user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    todayLabel,
    exchangeRate,
    handleExchangeRateSave,
    activeSummary,
  } = useAppData();

  useEffect(() => {
    document.body.classList.toggle("sidebar-drawer-open", sidebarOpen);
    return () => document.body.classList.remove("sidebar-drawer-open");
  }, [sidebarOpen]);

  return (
    <div className="app-shell dashboard-page">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />

      <div className="app-main">
        <div className="app-topbar-wrap dashboard-container">
          <button
            type="button"
            className="sidebar-toggle lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="បើកម៉ឺនុយ"
          >
            ☰
          </button>

          <Header
            user={user}
            todayLabel={todayLabel}
            exchangeRate={exchangeRate}
            onExchangeRateSave={handleExchangeRateSave}
            totalKHR={activeSummary.grandTotalKHR}
            totalUSD={activeSummary.grandTotalUSD}
          />
        </div>

        <main className="app-content dashboard-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function AppShell({ user }) {
  const todayLabel = toDateInputValue(new Date());

  return (
    <AppDataProvider user={user} todayLabel={todayLabel}>
      <AppShellContent user={user} />
    </AppDataProvider>
  );
}
