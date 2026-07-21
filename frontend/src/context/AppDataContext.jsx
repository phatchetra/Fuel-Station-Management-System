import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "@/components/Loading";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/apiClient";
import {
  buildClosingFinancials,
  buildSessionSummaryFromHistory,
  calculateStockPercent,
  getSessionSalesFromHistory,
  khrToUsd,
  validateCloseDay,
} from "@/lib/calculations";
import { normalizeDailyReport, removeDebtFromDailyReports } from "@/lib/dailyReportHelpers";
import { filterSessionExpenses, validateExpense } from "@/lib/expenseHelpers";
import { getStartOfDay, toDateInputValue } from "@/lib/dates";
import { deriveDebtStatus, normalizeDebtFromApi } from "@/lib/debtHelpers";

export const AppDataContext = createContext(null);

export function AppDataProvider({ user, todayLabel, children }) {
  const navigate = useNavigate();
  const summaryDate = toDateInputValue(new Date());

  const [fuels, setFuels] = useState([]);
  const [debts, setDebts] = useState([]);
  const [todayHistory, setTodayHistory] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(4100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionStartAt, setSessionStartAt] = useState(() => getStartOfDay(new Date()));
  const [dailyReports, setDailyReports] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [stockBatches, setStockBatches] = useState([]);
  const [stockBatchesLoading, setStockBatchesLoading] = useState(false);
  /** Track deleted debt IDs for optimistic UI until refresh completes */
  const removedDebtIdsRef = useRef(new Set());

  /** Drop records the user already deleted in this session */
  function filterRemovedDebts(items) {
    const removed = removedDebtIdsRef.current;
    return items.filter((debt) => !removed.has(debt.id));
  }

  /** GET /api/fuels */
  const fetchFuels = useCallback(async () => {
    const data = await apiGet("/api/fuels");
    setFuels(data);
    return data;
  }, []);

  /** GET /api/summary — sync exchange rate from server */
  const fetchSummary = useCallback(async () => {
    const data = await apiGet(`/api/summary?date=${summaryDate}`);
    if (data.exchangeRate) setExchangeRate(data.exchangeRate);
    return data;
  }, [summaryDate]);

  /** GET /api/debts */
  const fetchDebts = useCallback(async () => {
    const data = await apiGet("/api/debts");
    const normalized = filterRemovedDebts(data.map(normalizeDebtFromApi));
    setDebts(normalized);
    return normalized;
  }, []);

  /** GET /api/history — today's sales for close-day session tracking */
  const fetchTodayHistory = useCallback(async () => {
    const data = await apiGet("/api/history?quickFilter=today");
    setTodayHistory(data);
    return data;
  }, []);

  /** GET /api/settings/exchange-rate */
  const fetchExchangeRate = useCallback(async () => {
    const data = await apiGet("/api/settings/exchange-rate");
    setExchangeRate(data.exchangeRate);
    return data;
  }, []);

  /** GET /api/daily-reports */
  const fetchDailyReports = useCallback(async () => {
    const data = await apiGet("/api/daily-reports");
    setDailyReports(data);
    return data;
  }, []);

  /** GET /api/expenses — open session expenses only */
  const fetchExpenses = useCallback(async () => {
    const data = await apiGet("/api/expenses");
    setExpenses(data);
    return data;
  }, []);

  /** GET /api/session */
  const fetchSession = useCallback(async () => {
    const data = await apiGet("/api/session");
    setSessionStartAt(new Date(data.sessionStartAt));
    return data;
  }, []);

  /** GET /api/stock-batches — refill batch history (FIFO tracking) */
  const fetchStockBatches = useCallback(async () => {
    setStockBatchesLoading(true);
    try {
      const data = await apiGet("/api/stock-batches?status=ALL");
      setStockBatches(data);
      return data;
    } catch {
      setStockBatches([]);
      return [];
    } finally {
      setStockBatchesLoading(false);
    }
  }, []);

  /** Load all dashboard data — fuels must succeed; other sections fail gracefully */
  const refreshDashboard = useCallback(async () => {
    const results = await Promise.allSettled([
      fetchFuels(),
      fetchSummary(),
      fetchDebts(),
      fetchTodayHistory(),
      fetchExchangeRate(),
      fetchDailyReports(),
      fetchExpenses(),
      fetchSession(),
      fetchStockBatches(),
    ]);

    if (results[0].status === "rejected") {
      throw results[0].reason;
    }
  }, [
    fetchFuels,
    fetchSummary,
    fetchDebts,
    fetchTodayHistory,
    fetchExchangeRate,
    fetchDailyReports,
    fetchExpenses,
    fetchSession,
    fetchStockBatches,
  ]);

  // Initial load
  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        await refreshDashboard();
      } catch (err) {
        setError(err.message || "មានបញ្ហាក្នុងម៉ាស៊ីនមេ");
        if (err.message === "សូម Login មុន") {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- load once on mount

  /** Fuel sales in the current open session — used for close-day */
  const sessionSummary = useMemo(
    () => buildSessionSummaryFromHistory(fuels, todayHistory, sessionStartAt, exchangeRate),
    [fuels, todayHistory, sessionStartAt, exchangeRate]
  );

  const sessionExpenses = useMemo(
    () => filterSessionExpenses(expenses, sessionStartAt),
    [expenses, sessionStartAt]
  );

  /** All sales recorded today — history table (edit vs correction by session) */
  const todaySales = useMemo(() => {
    const sales = [];
    for (const group of todayHistory ?? []) {
      for (const sale of group.sales ?? []) {
        sales.push(sale);
      }
    }
    return sales;
  }, [todayHistory]);

  /** Sales in open session only — drives summary + close-day */
  const sessionSales = useMemo(
    () => getSessionSalesFromHistory(todayHistory, sessionStartAt),
    [todayHistory, sessionStartAt]
  );

  const closingFinancials = useMemo(
    () =>
      buildClosingFinancials(
        sessionSummary,
        debts,
        sessionStartAt,
        fuels,
        expenses,
        exchangeRate
      ),
    [sessionSummary, debts, sessionStartAt, fuels, expenses, exchangeRate]
  );

  const canCloseDay = useMemo(() => {
    const sessionSales = getSessionSalesFromHistory(todayHistory, sessionStartAt);
    return validateCloseDay(sessionSales, sessionSummary).ok;
  }, [todayHistory, sessionStartAt, sessionSummary]);

  /** Live "សរុបថ្ងៃនេះ" — current open session only; resets after close */
  const activeSummary = useMemo(
    () => ({
      ...sessionSummary,
      debtTodayAmount: closingFinancials.newDebtTotal,
      debtTodayUSD: khrToUsd(closingFinancials.newDebtTotal, exchangeRate),
      grandTotalKHR: closingFinancials.finalCashTotal,
      grandTotalUSD: closingFinancials.finalCashUSD,
    }),
    [sessionSummary, closingFinancials, exchangeRate]
  );

  const quickStats = useMemo(() => {
    const unpaidDebtCount = debts.filter(
      (debt) => deriveDebtStatus(debt.paidAmount, debt.totalAmount) !== "PAID"
    ).length;
    const lowStockCount = fuels.filter((fuel) => {
      if (fuel.currentStock <= 0) return true;
      return calculateStockPercent(fuel.currentStock, fuel.capacity) <= 10;
    }).length;

    return {
      totalLitersSold: activeSummary.totalLitersSold,
      fuelSalesKHR: activeSummary.fuelTotalKHR,
      unpaidDebtCount,
      lowStockCount,
    };
  }, [debts, fuels, activeSummary]);

  async function refreshAfterSaleOrRefill() {
    await Promise.all([
      fetchFuels(),
      fetchSummary(),
      fetchTodayHistory(),
      fetchStockBatches(),
    ]);
  }

  async function refreshAfterDebtChange() {
    await Promise.all([fetchDebts(), fetchSummary()]);
  }

  async function handleExchangeRateSave(rate) {
    const value = Number(rate);
    if (!value || value <= 0) {
      return { ok: false, error: "អត្រាប្តូរប្រាក់ ត្រូវតែធំជាង 0" };
    }

    try {
      const data = await apiPatch("/api/settings/exchange-rate", { exchangeRate: value });
      setExchangeRate(data.exchangeRate);
      await fetchSummary();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handlePriceChange(slug, pricePerLiter) {
    const fuel = fuels.find((item) => item.slug === slug);
    if (!fuel) return { ok: false, error: "មិនរកឃើញប្រភេទប្រេង" };

    const price = Number(pricePerLiter);
    if (!price || price <= 0) {
      return { ok: false, error: "តម្លៃ/លីត្រ ត្រូវតែធំជាង 0" };
    }

    try {
      const updated = await apiPatch(`/api/fuels/${fuel.id}`, { pricePerLiter: price });
      setFuels((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleCapacityChange(slug, capacity) {
    const newCapacity = Number(capacity);
    if (!newCapacity || newCapacity <= 0) {
      return { ok: false, error: "សូមបញ្ចូលសមត្ថភាពធំជាង 0" };
    }

    const fuel = fuels.find((item) => item.slug === slug);
    if (!fuel) return { ok: false, error: "មិនរកឃើញប្រភេទប្រេង" };

    if (newCapacity < fuel.currentStock) {
      return { ok: false, error: "សមត្ថភាពត្រូវតែធំជាងស្តុកបច្ចុប្បន្ន" };
    }

    try {
      const updated = await apiPatch(`/api/fuels/${fuel.id}`, { capacity: newCapacity });
      setFuels((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleRecordSale(slug, liters) {
    const fuel = fuels.find((item) => item.slug === slug);
    if (!fuel) return { ok: false, error: "មិនរកឃើញប្រភេទប្រេង" };

    const soldLiters = Number(liters);
    if (!soldLiters || soldLiters <= 0) {
      return { ok: false, error: "សូមបញ្ចូលលីត្រលក់ធំជាង 0" };
    }

    if (soldLiters > fuel.currentStock) {
      return { ok: false, error: "ស្តុកមិនគ្រប់គ្រាន" };
    }

    try {
      await apiPost("/api/sales", { fuelTypeId: fuel.id, liters: soldLiters });
      await refreshAfterSaleOrRefill();
      return { ok: true, message: "កត់ត្រាលក់បានជោគជ័យ" };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleRefill(slug, refillData) {
    const fuel = fuels.find((item) => item.slug === slug);
    if (!fuel) return { ok: false, error: "មិនរកឃើញប្រភេទប្រេង" };

    const refillLiters = Number(refillData?.liters);
    if (!refillData?.liters || !refillLiters || refillLiters <= 0) {
      return { ok: false, error: "សូមបញ្ចូលលីត្របញ្ចូលធំជាង 0" };
    }

    if (fuel.currentStock + refillLiters > fuel.capacity) {
      return { ok: false, error: "លើសសមត្ថភាពធុង" };
    }

    try {
      await apiPost("/api/refills", {
        fuelTypeId: fuel.id,
        liters: refillLiters,
        refillDate: refillData.refillDate || undefined,
        note: refillData.note || undefined,
      });
      await refreshAfterSaleOrRefill();
      return { ok: true, message: "បញ្ចូលស្តុកបានជោគជ័យ" };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleCloseDay() {
    const sessionSales = getSessionSalesFromHistory(todayHistory, sessionStartAt);
    const validation = validateCloseDay(sessionSales, sessionSummary);

    if (!validation.ok) {
      return validation;
    }

    try {
      const closedAt = new Date();
      const sessionClosing = buildClosingFinancials(
        sessionSummary,
        debts,
        sessionStartAt,
        fuels,
        sessionExpenses,
        exchangeRate
      );

      const snapshotSummary = {
        ...sessionSummary,
        debtTodayAmount: sessionClosing.repaymentTotal,
        debtTodayUSD: khrToUsd(sessionClosing.repaymentTotal, exchangeRate),
        grandTotalKHR: sessionClosing.finalCashTotal,
        grandTotalUSD: sessionClosing.finalCashUSD,
      };

      const snapshot = normalizeDailyReport(
        snapshotSummary,
        sessionStartAt,
        closedAt,
        0,
        exchangeRate,
        { fuels, debts, expenses: sessionExpenses }
      );

      const savedReport = await apiPost("/api/daily-reports", {
        snapshot,
        expenseIds: sessionExpenses.map((expense) => expense.id),
      });

      const sessionExpenseIds = new Set(sessionExpenses.map((expense) => expense.id));
      setDailyReports((prev) => [savedReport, ...prev]);
      setExpenses((prev) => prev.filter((expense) => !sessionExpenseIds.has(expense.id)));
      setSessionStartAt(new Date(savedReport.closedAt ?? closedAt));
      await fetchTodayHistory();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || "មានបញ្ហាក្នុងការបិទបញ្ជី" };
    }
  }

  async function handleAddExpense(expenseData) {
    const validation = validateExpense(expenseData);
    if (!validation.ok) return validation;

    try {
      const created = await apiPost("/api/expenses", {
        category: validation.category,
        amount: validation.amountKHR,
        expenseDate: validation.expenseDate,
        note: expenseData.note?.trim() || undefined,
      });
      setExpenses((prev) => [created, ...prev]);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleUpdateExpense(expenseId, expenseData) {
    const validation = validateExpense(expenseData);
    if (!validation.ok) return validation;

    try {
      const updated = await apiPatch(`/api/expenses/${expenseId}`, {
        category: validation.category,
        amount: validation.amountKHR,
        expenseDate: validation.expenseDate,
        note: expenseData.note?.trim() ?? "",
      });
      setExpenses((prev) =>
        prev.map((expense) => (expense.id === expenseId ? updated : expense))
      );
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleDeleteExpense(expenseId) {
    try {
      await apiDelete(`/api/expenses/${expenseId}`);
      setExpenses((prev) => prev.filter((expense) => expense.id !== expenseId));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleAddDebt(debtData) {
    if (!debtData.customerName?.trim()) {
      return { ok: false, error: "សូមបញ្ចូលឈ្មោះ" };
    }

    const totalAmount = Number(debtData.totalAmount);
    if (!totalAmount || totalAmount <= 0) {
      return { ok: false, error: "សូមបញ្ចូលចំនួនលុយធំជាង 0" };
    }

    if (!debtData.debtDate) {
      return { ok: false, error: "សូមជ្រើសរើសថ្ងៃខែឆ្នាំ" };
    }

    try {
      await apiPost("/api/debts", {
        customerName: debtData.customerName.trim(),
        phoneOrNote: debtData.phoneOrNote?.trim() || undefined,
        totalAmount,
        debtDate: debtData.debtDate,
      });
      await refreshAfterDebtChange();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleRecordPayment(debtId, paymentData) {
    const amountText = paymentData.amount?.toString().trim();
    if (!amountText) {
      return { ok: false, error: "សូមបញ្ចូលចំនួនលុយសង" };
    }

    const payAmount = Number(amountText);
    if (!payAmount || payAmount <= 0) {
      return { ok: false, error: "ចំនួនលុយសងត្រូវតែធំជាង 0" };
    }

    try {
      await apiPost(`/api/debts/${debtId}/payments`, { amount: payAmount });
      await refreshAfterDebtChange();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleUpdateSale(saleId, data) {
    try {
      const result = await apiPatch(`/api/sales/${saleId}`, data);
      if (result.fuel) {
        setFuels((prev) =>
          prev.map((fuel) => (fuel.id === result.fuel.id ? result.fuel : fuel))
        );
      }
      await refreshAfterSaleOrRefill();
      return { ok: true, message: "បានកែប្រែទិន្នន័យជោគជ័យ" };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleDeleteSale(saleId) {
    try {
      const result = await apiDelete(`/api/sales/${saleId}`);
      if (result.fuel) {
        setFuels((prev) =>
          prev.map((fuel) => (fuel.id === result.fuel.id ? result.fuel : fuel))
        );
      }
      await refreshAfterSaleOrRefill();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleCorrectSale(saleId, data) {
    try {
      const result = await apiPost(`/api/sales/${saleId}/corrections`, data);
      return {
        ok: true,
        message: result.message || "បានកត់ត្រាកែតម្រូវជោគជ័យ",
      };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleUpdateStockBatch(batchId, data) {
    try {
      const result = await apiPatch(`/api/stock-batches/${batchId}`, data);
      if (result.fuel) {
        setFuels((prev) =>
          prev.map((fuel) => (fuel.id === result.fuel.id ? result.fuel : fuel))
        );
      }
      await refreshAfterSaleOrRefill();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleDeleteStockBatch(batchId) {
    try {
      const result = await apiDelete(`/api/stock-batches/${batchId}`);
      if (result.fuel) {
        setFuels((prev) =>
          prev.map((fuel) => (fuel.id === result.fuel.id ? result.fuel : fuel))
        );
      }
      await refreshAfterSaleOrRefill();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleDeleteDebt(debtId) {
    try {
      await apiDelete(`/api/debts/${debtId}`);

      // Hide immediately — do not wait for the next refresh
      removedDebtIdsRef.current.add(debtId);
      setDebts((prev) => prev.filter((debt) => debt.id !== debtId));
      setDailyReports((prev) => removeDebtFromDailyReports(prev, debtId, exchangeRate));

      await refreshAfterDebtChange();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  const value = {
    user,
    todayLabel,
    fuels,
    debts,
    todayHistory,
    exchangeRate,
    loading,
    error,
    sessionStartAt,
    dailyReports,
    expenses,
    stockBatches,
    stockBatchesLoading,
    sessionSummary,
    sessionExpenses,
    todaySales,
    sessionSales,
    closingFinancials,
    canCloseDay,
    activeSummary,
    quickStats,
    refreshDashboard,
    handleExchangeRateSave,
    handlePriceChange,
    handleCapacityChange,
    handleRecordSale,
    handleRefill,
    handleCloseDay,
    handleAddExpense,
    handleUpdateExpense,
    handleDeleteExpense,
    handleAddDebt,
    handleRecordPayment,
    handleUpdateSale,
    handleDeleteSale,
    handleCorrectSale,
    handleUpdateStockBatch,
    handleDeleteStockBatch,
    handleDeleteDebt,
  };

  if (loading) {
    return <Loading message="កំពុងផ្ទុកទិន្នន័យ..." />;
  }

  if (error && fuels.length === 0) {
    return (
      <div className="dashboard-container mx-auto w-full px-4 py-12 text-center">
        <p className="error-text text-base">{error}</p>
        <button
          type="button"
          className="btn-gold mt-4"
          onClick={() => {
            setLoading(true);
            refreshDashboard()
              .catch((err) => setError(err.message))
              .finally(() => setLoading(false));
          }}
        >
          ព្យាយាមម្តងទៀត
        </button>
      </div>
    );
  }

  return (
    <AppDataContext.Provider value={value}>
      {error && (
        <p className="error-text text-sm text-center px-4 pt-4" role="alert">
          {error}
        </p>
      )}
      {children}
    </AppDataContext.Provider>
  );
}
