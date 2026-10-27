"use client";

import { useState, useMemo, useCallback } from "react";
import {
  User,
  Calendar,
  TrendingUp,
  AlertCircle,
  Activity,
  ChevronDown,
  ChevronUp,
  FileText,
  IndianRupee,
  Banknote,
} from "lucide-react";

// ---------- Dummy Data ----------

const dummyWorkers = [
  { id: "w1", name: "Ramesh Kumar", city: "Mumbai", totalEarnings: 48200 },
  { id: "w2", name: "Sita Devi", city: "Delhi", totalEarnings: 35400 },
  { id: "w3", name: "Amit Sharma", city: "Bangalore", totalEarnings: 52700 },
];

const getProjects = () => [
  {
    id: "p1",
    company: "BuildRight Constructions",
    designation: "Site Supervisor",
    jobType: "Daily Wage",
    workStart: "2026-04-15",
    workEnd: "2026-04-20",
    perDayRate: 1500,
    piecesPerDay: null,
    ratePerPiece: null,
    paymentDate: "2026-04-22",
    paid: true,
  },
  {
    id: "p2",
    company: "Tech Solutions Inc.",
    designation: "Software Engineer",
    jobType: "Fixed Contract",
    workStart: "2026-04-10",
    workEnd: "2026-04-12",
    perDayRate: 4000,
    piecesPerDay: null,
    ratePerPiece: null,
    paymentDate: "2026-04-14",
    paid: true,
  },
  {
    id: "p3",
    company: "Global Manufacturing Ltd.",
    designation: "Assembly Worker",
    jobType: "Piece Rate",
    workStart: "2026-04-21",
    workEnd: "2026-04-25",
    perDayRate: null,
    piecesPerDay: 170,
    ratePerPiece: 15,
    paymentDate: null,
    paid: false,
  },
  {
    id: "p4",
    company: "Retail Masters Corporation",
    designation: "Sales Executive",
    jobType: "Daily Wage",
    workStart: "2026-04-01",
    workEnd: "2026-04-09",
    perDayRate: 750,
    piecesPerDay: null,
    ratePerPiece: null,
    paymentDate: "2026-05-02",
    paid: true,
  },
];

const generateDailyWorkEntries = () => {
  const projects = getProjects();
  const entries = [];

  projects.forEach((proj) => {
    const start = new Date(proj.workStart);
    const end = new Date(proj.workEnd);
    const current = new Date(start);

    while (current <= end) {
      const dateKey = current.toISOString().slice(0, 10);
      let grossEarnings = 0;
      let hours = 8;
      let pieces = null;

      if (proj.jobType === "Piece Rate" && proj.piecesPerDay) {
        pieces = proj.piecesPerDay;
        grossEarnings = pieces * proj.ratePerPiece;
      } else {
        grossEarnings = proj.perDayRate || 0;
      }

      const pf = Math.round(grossEarnings * 0.12);
      const esi = Math.round(grossEarnings * 0.03);
      const tds = Math.round(grossEarnings * 0.01);
      const totalDeductions = pf + esi + tds;
      const netEarnings = grossEarnings - totalDeductions;

      entries.push({
        date: dateKey,
        projectId: proj.id,
        company: proj.company,
        designation: proj.designation,
        jobType: proj.jobType,
        hours,
        pieces,
        ratePerPiece: proj.ratePerPiece,
        grossEarnings,
        deductions: { pf, esi, tds, total: totalDeductions },
        netEarnings,
        paymentDate: proj.paymentDate,
        paid: proj.paid,
        isPayoutDay: proj.paymentDate === dateKey,
      });

      current.setDate(current.getDate() + 1);
    }
  });

  return entries.sort((a, b) => a.date.localeCompare(b.date));
};

// ---------- Main WorkerPaymentDetails Component ----------
const WorkerPaymentDetails = () => {
  const [selectedWorkerId] = useState(dummyWorkers[0].id);
  const selectedWorker = dummyWorkers.find((w) => w.id === selectedWorkerId);

  const today = new Date();
  const [startDate, setStartDate] = useState(() =>
    new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .slice(0, 10),
  );
  const [endDate, setEndDate] = useState(() =>
    new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10),
  );

  const allDailyEntries = useMemo(generateDailyWorkEntries, []);
  const projectsList = useMemo(() => getProjects(), []);
  const [activeTab, setActiveTab] = useState("earnings");

  const filteredEntries = useMemo(() => {
    return allDailyEntries.filter(
      (e) => e.date >= startDate && e.date <= endDate,
    );
  }, [allDailyEntries, startDate, endDate]);

  const projectsInRange = useMemo(() => {
    const projectIds = [...new Set(filteredEntries.map((e) => e.projectId))];
    return projectsList.filter((p) => projectIds.includes(p.id));
  }, [filteredEntries, projectsList]);

  const totalGross = filteredEntries.reduce(
    (sum, e) => sum + e.grossEarnings,
    0,
  );
  const totalDeductions = filteredEntries.reduce(
    (sum, e) => sum + e.deductions.total,
    0,
  );
  const totalNet = filteredEntries.reduce((sum, e) => sum + e.netEarnings, 0);
  const pendingProjects = projectsInRange.filter((p) => !p.paid);
  const pendingNet = filteredEntries
    .filter((e) => pendingProjects.some((p) => p.id === e.projectId))
    .reduce((sum, e) => sum + e.netEarnings, 0);

  const [expandedDays, setExpandedDays] = useState(new Set());
  const toggleDayExpand = useCallback((date) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }, []);

  const [txFilters, setTxFilters] = useState({
    range: "current_month",
    type: "all",
    startDate: "",
    endDate: "",
  });

  const allTransactions = useMemo(() => {
    const txs = [];
    filteredEntries.forEach((entry) => {
      txs.push({
        id: `c-${entry.date}`,
        type: "credit",
        amount: entry.netEarnings,
        description: `Work – ${entry.company} (${entry.designation})`,
        date: entry.date,
        status: "completed",
      });
    });
    projectsList.forEach((proj) => {
      if (proj.paid && proj.paymentDate) {
        const projEntries = allDailyEntries.filter(
          (e) => e.projectId === proj.id,
        );
        const totalNet = projEntries.reduce((s, e) => s + e.netEarnings, 0);
        txs.push({
          id: `p-${proj.id}`,
          type: "debit",
          amount: totalNet,
          description: `Payout – ${proj.company}`,
          date: proj.paymentDate,
          status: "completed",
        });
      }
    });
    return txs.sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredEntries, projectsList, allDailyEntries]);

  const filteredTransactions = useMemo(() => {
    let txs = [...allTransactions];
    const now = new Date();

    const pendingDaily = filteredEntries
      .filter((e) => !e.paid)
      .map((e) => ({
        id: `pc-${e.date}`,
        type: "credit",
        amount: e.netEarnings,
        description: `Work (Pending) – ${e.company} (${e.designation})`,
        date: e.date,
        status: "pending",
      }));
    txs = txs.filter((tx) => tx.status !== "pending");
    txs = [...txs, ...pendingDaily];

    let nonPending = txs.filter((tx) => tx.status !== "pending");
    let pending = txs.filter((tx) => tx.status === "pending");

    if (txFilters.range === "current_month") {
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      nonPending = nonPending.filter((tx) => {
        const d = new Date(tx.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      });
    } else if (txFilters.range === "last_month") {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      nonPending = nonPending.filter((tx) => {
        const d2 = new Date(tx.date);
        return d2.getMonth() + 1 === month && d2.getFullYear() === year;
      });
    } else if (txFilters.range === "custom") {
      if (txFilters.startDate)
        nonPending = nonPending.filter((tx) => tx.date >= txFilters.startDate);
      if (txFilters.endDate)
        nonPending = nonPending.filter((tx) => tx.date <= txFilters.endDate);
    }

    if (txFilters.type !== "all") {
      nonPending = nonPending.filter((tx) => tx.type === txFilters.type);
      pending = pending.filter(
        (tx) => txFilters.type === "all" || tx.type === txFilters.type,
      );
    }

    return [...nonPending, ...pending].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
  }, [allTransactions, txFilters, filteredEntries]);

  const pendingTotal = useMemo(() => {
    const pendingProjs = projectsList.filter((p) => !p.paid);
    return allDailyEntries
      .filter((e) => pendingProjs.some((p) => p.id === e.projectId))
      .reduce((sum, e) => sum + e.netEarnings, 0);
  }, [allDailyEntries, projectsList]);

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  const setCurrentMonth = () => {
    const d = new Date();
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    setStartDate(first.toISOString().slice(0, 10));
    setEndDate(last.toISOString().slice(0, 10));
  };

  const setLastMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    setStartDate(first.toISOString().slice(0, 10));
    setEndDate(last.toISOString().slice(0, 10));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              {activeTab === "earnings" ? (
                <>
                  <User className="h-6 w-6 text-indigo-600" />
                  Worker Payment Details
                </>
              ) : (
                <>
                  <Activity className="h-6 w-6 text-indigo-600" />
                  Transaction History
                </>
              )}
            </h1>
            {activeTab === "earnings" && (
              <p className="text-sm text-gray-500 mt-1">
                Day‑wise earnings, deductions & per‑project breakdown
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-200/50 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("earnings")}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
                  activeTab === "earnings"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <FileText className="inline-block h-4 w-4 mr-1" />
                Earnings
              </button>
              <button
                onClick={() => setActiveTab("transactions")}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
                  activeTab === "transactions"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Activity className="inline-block h-4 w-4 mr-1" />
                Transactions
              </button>
            </div>
          </div>
        </div>

        {/* Date Range Filter (only on Earnings tab) */}
        {activeTab === "earnings" && (
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              <span className="text-sm font-medium text-gray-700">Period:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-gray-400">–</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500"
                min={startDate}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={setCurrentMonth}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 transition"
              >
                This Month
              </button>
              <button
                onClick={setLastMonth}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition"
              >
                Last Month
              </button>
            </div>
          </div>
        )}

        {/* Summary Cards – only on Earnings tab */}
        {activeTab === "earnings" && selectedWorker && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl shadow border border-gray-100 p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">
                  {selectedWorker.name}
                </p>
                <p className="text-xs text-gray-500">{selectedWorker.city}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                Gross Earnings
              </p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {formatCurrency(totalGross)}
              </p>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> {projectsInRange.length}{" "}
                projects
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                Total Deductions
              </p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(totalDeductions)}
              </p>
              <p className="text-xs text-gray-500 mt-2">PF, ESI, TDS</p>
            </div>
            <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                Pending Payout
              </p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {formatCurrency(pendingNet)}
              </p>
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {pendingProjects.length}{" "}
                project(s)
              </p>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === "earnings" ? (
          /* Daily Earnings Table */
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                Daily Earnings
              </h2>
              <span className="text-xs text-gray-500">
                {filteredEntries.length} working days
              </span>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="text-xs uppercase tracking-widest text-gray-500">
                    <th className="px-4 py-3 text-left font-bold">Date</th>
                    <th className="px-4 py-3 text-left font-bold">Company</th>
                    <th className="px-4 py-3 text-left font-bold">
                      Designation
                    </th>
                    <th className="px-4 py-3 text-center font-bold">Type</th>
                    <th className="px-4 py-3 text-center font-bold">
                      Hours/Pcs
                    </th>
                    <th className="px-4 py-3 text-center font-bold">Gross</th>
                    <th className="px-4 py-3 text-center font-bold">
                      Deductions
                    </th>
                    <th className="px-4 py-3 text-center font-bold">Net</th>
                    <th className="px-4 py-3 text-center font-bold">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 text-sm">
                  {filteredEntries.map((entry) => (
                    <>
                      <tr
                        key={entry.date}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-gray-700">
                          {new Date(entry.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </td>
                        <td className="px-4 py-3 text-gray-800">
                          {entry.company}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {entry.designation}
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-medium">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                            {entry.jobType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {entry.pieces ? (
                            <span className="text-gray-700">
                              {entry.pieces} pcs × ₹{entry.ratePerPiece}
                            </span>
                          ) : (
                            <span className="text-gray-700">
                              {entry.hours}h
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-green-700">
                          {formatCurrency(entry.grossEarnings)}
                        </td>
                        <td className="px-4 py-3 text-center text-red-600 font-medium">
                          -{formatCurrency(entry.deductions.total)}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-gray-800">
                          {formatCurrency(entry.netEarnings)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleDayExpand(entry.date)}
                            className="p-2 rounded-lg hover:bg-indigo-50 transition text-indigo-600"
                          >
                            {expandedDays.has(entry.date) ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedDays.has(entry.date) && (
                        <tr className="bg-gray-50">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="flex justify-center">
                              <div className="bg-white border border-gray-200 rounded-xl p-4 w-full max-w-sm shadow-sm">
                                <p className="font-semibold text-gray-700 mb-3">
                                  Deduction Breakdown
                                </p>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="uppercase text-gray-500">
                                      PF
                                    </span>
                                    <span className="font-medium text-red-600">
                                      -{formatCurrency(entry.deductions.pf)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="uppercase text-gray-500">
                                      ESI
                                    </span>
                                    <span className="font-medium text-red-600">
                                      -{formatCurrency(entry.deductions.esi)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="uppercase text-gray-500">
                                      TDS
                                    </span>
                                    <span className="font-medium text-red-600">
                                      -{formatCurrency(entry.deductions.tds)}
                                    </span>
                                  </div>
                                </div>
                                <div className="border-t mt-3 pt-3 flex justify-between text-sm font-semibold">
                                  <span>Total Deductions</span>
                                  <span className="text-red-700">
                                    -{formatCurrency(entry.deductions.total)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                  {filteredEntries.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-8 text-center text-gray-400 text-sm"
                      >
                        No working days found in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Transactions View */
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                All Transaction
              </h2>
              <span className="text-xs text-gray-500">
                {filteredTransactions.length} entries
              </span>
            </div>

            {pendingTotal > 0 && (
              <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-800">
                    Pending Payout: {formatCurrency(pendingTotal)}
                  </span>
                </div>
                <span className="text-xs text-amber-600">
                  Across all unpaid projects
                </span>
              </div>
            )}

            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-gray-200/50 p-1 rounded-xl">
                  {["current_month", "last_month", "custom"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setTxFilters((p) => ({ ...p, range: r }))}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                        txFilters.range === r
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {r === "current_month"
                        ? "This Month"
                        : r === "last_month"
                          ? "Last Month"
                          : "Custom"}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                  <span className="text-xs font-medium text-gray-500">
                    Type:
                  </span>
                  <select
                    value={txFilters.type}
                    onChange={(e) =>
                      setTxFilters((p) => ({ ...p, type: e.target.value }))
                    }
                    className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
                  >
                    <option value="all">All</option>
                    <option value="credit">Credits</option>
                    <option value="debit">Debits</option>
                  </select>
                </div>
              </div>

              {txFilters.range === "custom" && (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={txFilters.startDate}
                      onChange={(e) =>
                        setTxFilters((p) => ({
                          ...p,
                          startDate: e.target.value,
                        }))
                      }
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-gray-400">–</span>
                    <input
                      type="date"
                      value={txFilters.endDate}
                      onChange={(e) =>
                        setTxFilters((p) => ({ ...p, endDate: e.target.value }))
                      }
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {filteredTransactions.length === 0 ? (
                <div className="py-16 text-center">
                  <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No transactions found</p>
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2.5 rounded-2xl ${
                          tx.type === "credit" ? "bg-green-100" : "bg-red-100"
                        }`}
                      >
                        {tx.type === "credit" ? (
                          <IndianRupee className="h-5 w-5 text-green-700" />
                        ) : (
                          <Banknote className="h-5 w-5 text-red-700" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">
                          {tx.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                            {tx.date}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              tx.status === "completed"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p
                      className={`text-lg font-black ${
                        tx.type === "credit" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {tx.type === "credit" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerPaymentDetails;
