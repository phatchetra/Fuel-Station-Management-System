import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute, PublicOnly } from "@/routes/AuthRoutes";
import LoginPage from "@/pages/LoginPage";
import OverviewPage from "@/pages/OverviewPage";
import FuelsPage from "@/pages/FuelsPage";
import StockBatchesPage from "@/pages/StockBatchesPage";
import DailySummaryPage from "@/pages/DailySummaryPage";
import ExpensesPage from "@/pages/ExpensesPage";
import DebtsPage from "@/pages/DebtsPage";
import ReportsPage from "@/pages/ReportsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />

        <Route element={<ProtectedRoute />}>
          <Route index element={<OverviewPage />} />
          <Route path="fuels" element={<FuelsPage />} />
          <Route path="stock-batches" element={<StockBatchesPage />} />
          <Route path="daily-summary" element={<DailySummaryPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="debts" element={<DebtsPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
