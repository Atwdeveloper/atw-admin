"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "@/lib/navigation";
import {
  IndianRupee,
  Calendar,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Banknote,
  Activity,
  Loader2,
  Shield,
  CheckCircle2,
  XCircle,
  CreditCard,
  Plus,
  HeartHandshake,
  Building,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminWorkerWallet } from "../../adminhooks/useAdminWorkerWallet";
import Breadcrumb from "../../../../common/components/Breadcrumb";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-hot-toast";

import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";

const AdminWorkerWallet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const canManageHold = hasPermission("workers", "manage_wallet_hold");
  const canWithdraw = hasPermission("workers", "withdraw_wallet");
  const {
    loading,
    summaryLoading,
    summary,
    transactions,
    fetchWalletSummary,
    fetchWalletHistory,
    updateWalletHold,
    releaseWalletHold,
    withdrawWorkerWallet,
    updateAutoWithdrawalSettings,
  } = useAdminWorkerWallet(id);

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [deductionView, setDeductionView] = useState("monthly");
  const [customRange, setCustomRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  });

  const [withdrawAmount, setWithdrawAmount] = useState("");

  const [withdrawError, setWithdrawError] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [holdAmountInput, setHoldAmountInput] = useState("");
  const [holdReasonInput, setHoldReasonInput] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    confirmColor: "emerald",
    holdId: null,
    actionType: "release",
    holdAmount: 0,
  });
  const [feedbackPopup, setFeedbackPopup] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const [localAutoWithdraw, setLocalAutoWithdraw] = useState({
    enabled: true,
    frequency: "monthly",
    threshold: 100,
  });
  const [saveStatus, setSaveStatus] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(false);

  useEffect(() => {
    if (selectedDay) {
    }
  }, [selectedDay]);

  useEffect(() => {
    if (summary?.auto_withdrawal) {
      setLocalAutoWithdraw({
        enabled: !!summary.auto_withdrawal.enabled,
        frequency: summary.auto_withdrawal.frequency || "monthly",
        threshold: summary.auto_withdrawal.threshold || 100,
      });
    }
  }, [summary]);

  const handleAutoWithdrawSave = async () => {
    try {
      const response = await updateAutoWithdrawalSettings({
        enabled: true,
        frequency: localAutoWithdraw.frequency,
        threshold: Number(localAutoWithdraw.threshold),
      });
      if (response && response.success) {
        setSaveStatus({ type: "success", message: "Settings saved!" });
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus({
          type: "error",
          message: response?.message || "Save failed",
        });
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (err) {
      setSaveStatus({ type: "error", message: "Save failed" });
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // Financial Year Label Logic
  const today = new Date();
  const currentFYStart =
    today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  const fyLabel = `${currentFYStart}-${String(currentFYStart + 1).slice(2)}`;

  // Auto-switch to daily when a day is selected
  useEffect(() => {
    if (selectedDay) {
      setDeductionView("daily");
    } else if (deductionView === "daily") {
      setDeductionView("monthly");
    }
  }, [selectedDay]);

  // On Mount: Load static data
  useEffect(() => {
    fetchWalletHistory();
  }, [fetchWalletHistory]);

  // On viewDate change: Load monthly summary
  useEffect(() => {
    const loadMonthlySummary = async () => {
      // If it's NOT the first load, use silent mode to avoid blocking buttons
      const isInitialLoad = !summary;
      if (!isInitialLoad) setCalendarLoading(true);

      await fetchWalletSummary(
        {
          month: viewDate.getMonth() + 1,
          year: viewDate.getFullYear(),
        },
        !isInitialLoad,
      );

      setCalendarLoading(false);
    };

    loadMonthlySummary();
  }, [fetchWalletSummary, viewDate]);

  useEffect(() => {
    if (deductionView === "custom" && customRange.start && customRange.end) {
      const startStr =
        customRange.start instanceof Date
          ? customRange.start.toISOString().split("T")[0]
          : customRange.start;
      const endStr =
        customRange.end instanceof Date
          ? customRange.end.toISOString().split("T")[0]
          : customRange.end;
      fetchWalletSummary({
        start_date: startStr,
        end_date: endStr,
      });
    }
  }, [deductionView, customRange, fetchWalletSummary]);

  // --- Dynamic Calendar Logic ---
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const calendarWeeks = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    const prevMonthTotalDays = daysInMonth(year, month - 1);
    const days = [];

    // Filler from prev month
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthTotalDays - i,
        currentMonth: false,
        dateKey: null,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ day: i, currentMonth: true, dateKey });
    }

    // Filler from next month
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false, dateKey: null });
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [viewDate]);

  const isCurrentMonth = () => {
    const now = new Date();
    return (
      viewDate.getMonth() === now.getMonth() &&
      viewDate.getFullYear() === now.getFullYear()
    );
  };

  const changeMonth = (offset) => {
    if (offset > 0 && isCurrentMonth()) return;
    setViewDate(
      new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1),
    );
    setSelectedDay(null);
  };

  const isToday = (day, isCurrMonth) => {
    const now = new Date();
    return (
      isCurrMonth &&
      day === now.getDate() &&
      viewDate.getMonth() === now.getMonth() &&
      viewDate.getFullYear() === now.getFullYear()
    );
  };

  const monthName = viewDate.toLocaleString("default", { month: "long" });
  const viewYear = viewDate.getFullYear();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  if (permissionsLoading || (loading && !summary)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!hasPermission("workers", "view_wallet")) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view worker wallet details.
          </p>
          <button
            onClick={() => navigate("/admin/worker/listing")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go Back to Worker Listing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8 transition-opacity duration-300 ${summaryLoading ? "opacity-70" : "opacity-100"}`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumb
          items={[
            { label: "Worker Management", path: "/admin/worker/listing" },
            { label: "Wallet" },
          ]}
        />

        {/* Admin Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin/worker/listing")}
              className="p-2 hover:bg-white rounded-full transition-colors shadow-sm bg-white"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Worker Wallet
              </h1>
              <p className="text-sm font-medium text-indigo-600">
                {summary?.worker_name} ({summary?.worker_code})
              </p>
            </div>
          </div>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          <div className="md:col-span-2 lg:col-span-2 bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl shadow-lg p-6 text-white overflow-hidden relative flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <IndianRupee className="h-48 w-48 rotate-12" />
            </div>
            <div>
              <p className="text-indigo-200 text-sm font-medium mb-1 relative z-10">
                Current Balance
              </p>
              <p className="text-4xl md:text-5xl font-bold tracking-tight relative z-10">
                {formatCurrency(summary?.currentBalance)}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-indigo-700/50 flex justify-between items-center relative z-10">
              <div className="flex items-end gap-2">
                <div>
                  <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">
                    Withdrawable
                  </p>
                  <p className="text-lg font-bold text-emerald-400">
                    {formatCurrency(summary?.withdrawableBalance)}
                  </p>
                </div>
                {canWithdraw && summary?.withdrawableBalance > 0 && (
                  <button
                    onClick={() => {
                      const el = document.getElementById("withdrawal-input");
                      if (el) {
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                        setTimeout(() => el.focus(), 300);
                      }
                    }}
                    className="ml-3 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-md hover:shadow-emerald-500/20 text-white"
                    title="Withdraw Wallet Balance"
                  >
                    <Banknote className="h-3 w-3" />
                    Withdraw
                  </button>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">
                  On Hold
                </p>
                <div className="flex items-center gap-2 justify-end">
                  <p className="text-lg font-bold text-amber-400">
                    {formatCurrency(summary?.holdAmount)}
                  </p>
                  {canManageHold && (
                    <button
                      onClick={() => setIsHoldModalOpen(true)}
                      className="p-1 hover:bg-white/10 rounded text-indigo-200 hover:text-white transition-colors"
                      title="Manage Hold Amount"
                    >
                      <Shield className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {monthName} {viewYear} Earnings
              </p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-800 mt-1 break-words">
                {formatCurrency(summary?.thisMonthEarnings)}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">Last Withdrawal</p>
              <p className="text-sm font-semibold text-gray-700">
                {summary?.lastWithdrawal
                  ? `${summary.lastWithdrawal.date}, ${formatCurrency(summary.lastWithdrawal.amount)}`
                  : "No recent withdrawals"}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                FY {fyLabel} Earnings
              </p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-800 mt-1 break-words">
                {formatCurrency(summary?.fyDeductions?.earnings)}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">Financial Year</p>
              <p className="text-sm font-semibold text-indigo-600">
                Apr {currentFYStart} - Mar {currentFYStart + 1}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Total Gratuity
              </p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-800 mt-1 break-words">
                {formatCurrency(summary?.totalGratuity)}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                <HeartHandshake className="h-3 w-3 text-emerald-500" />{" "}
                Accumulated
              </p>
              <p className="text-[10px] text-gray-400">
                Provisioned by employer
              </p>
            </div>
          </div>
        </div>

        {/* Middle Row: Calendar, Details & Deductions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Earnings Calendar */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-500" />
                Earnings Calendar
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <span className="text-sm font-bold text-gray-700 min-w-[100px] text-center">
                  {monthName} {viewYear}
                </span>
                <button
                  onClick={() => changeMonth(1)}
                  disabled={isCurrentMonth()}
                  className="p-1 hover:bg-gray-100 rounded-lg transition disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="relative">
              {calendarLoading && (
                <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                  <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
                </div>
              )}

              <div className="text-[10px] text-gray-400 mb-2 grid grid-cols-7 gap-1 text-center font-bold uppercase tracking-widest">
                <div>Su</div>
                <div>Mo</div>
                <div>Tu</div>
                <div>We</div>
                <div>Th</div>
                <div>Fr</div>
                <div>Sa</div>
              </div>
              <div className="space-y-1">
                {calendarWeeks.map((week, i) => (
                  <div key={i} className="grid grid-cols-7 gap-1 text-center">
                    {week.map((dateObj, j) => {
                      const { day, currentMonth, dateKey } = dateObj;
                      const highlighted = isToday(day, currentMonth);
                      const dayData = summary?.calendarData?.[dateKey];

                      const isEarning =
                        dayData?.type === "earning" || dayData?.type === "both";
                      const isPayout =
                        dayData?.type === "payout" || dayData?.type === "both";
                      const isInactive = currentMonth && !isEarning && !dayData;

                      const isSelected = selectedDay?.date === dateKey;

                      return (
                        <div
                          key={j}
                          onClick={() =>
                            dayData &&
                            setSelectedDay({ date: dateKey, ...dayData })
                          }
                          className={`relative py-2.5 text-sm rounded-xl transition-all cursor-pointer group ${
                            isSelected
                              ? "bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold shadow-xs"
                              : currentMonth
                                ? highlighted
                                  ? "text-gray-900 font-semibold hover:bg-gray-50"
                                  : "text-gray-700 hover:bg-gray-50"
                                : "text-gray-200"
                          } ${isInactive ? "text-gray-300 line-through" : ""}`}
                        >
                          <span className="relative z-10">{day}</span>

                          {/* Status Markers */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {isPayout && (
                              <div className="w-8 h-8 rounded-full border-2 border-blue-400 opacity-80" />
                            )}
                          </div>

                          {/* Dot markers */}
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 justify-center pointer-events-none">
                            {isEarning && (
                              <div className="h-1 w-1 rounded-full bg-green-500" />
                            )}
                            {highlighted && (
                              <div className="h-1 w-1 rounded-full bg-indigo-600" />
                            )}
                          </div>

                          {/* Amount Hover/Small Text */}
                          {isEarning && (
                            <span className="absolute -top-1 right-0 text-[8px] font-bold text-green-600 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1 rounded shadow-sm border border-green-100">
                              ₹{Math.round(dayData.amount)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 flex flex-wrap gap-4 items-center justify-center text-[10px] text-gray-500 font-medium">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span>Earnings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full border-2 border-blue-400" />
                <span>Payout</span>
              </div>
              <div className="flex items-center gap-1.5 grayscale opacity-50">
                <span className="line-through">Ab</span>
                <span>Inactive</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                <span>Today</span>
              </div>
            </div>
          </div>

          {/* Day Details Card */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 min-h-[300px] flex flex-col">
            {selectedDay ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 flex flex-col"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-indigo-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">
                      Day Details
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400"
                  >
                    <Plus className="h-5 w-5 rotate-45" />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(selectedDay.date).toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    Breakdown of earnings & transfers
                  </p>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto max-h-[380px] pr-1 custom-scrollbar">
                  {(selectedDay.type === "earning" ||
                    selectedDay.type === "both") &&
                    (selectedDay.shifts && selectedDay.shifts.length > 0 ? (
                      selectedDay.shifts.map((shift, idx) => (
                        <div
                          key={idx}
                          className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 mb-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-emerald-900 font-bold text-[10px] uppercase tracking-widest">
                              <Activity className="h-3.5 w-3.5 text-emerald-600" />
                              {shift.title || `Shift ${idx + 1} Earnings`}
                            </div>
                            {shift.time && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold font-mono">
                                {shift.time}
                              </span>
                            )}
                          </div>
                          {shift.subtitle && (
                            <p className="text-[10px] text-emerald-700 font-semibold mb-2.5 -mt-1">
                              {shift.subtitle}
                            </p>
                          )}
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[10px] text-emerald-500 uppercase font-black tracking-tighter">
                                Hours Worked
                              </p>
                              <p className="text-xl font-black text-emerald-955">
                                {shift.hours}h
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-emerald-500 uppercase font-black tracking-tighter">
                                Net Credit
                              </p>
                              <p className="text-xl font-black text-emerald-955">
                                {formatCurrency(shift.amount)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-emerald-100 flex justify-between text-[10px] text-emerald-600 font-bold overflow-hidden">
                            <span className="truncate mr-2">
                              Gross: {formatCurrency(shift.details?.gross)}
                            </span>
                            <span className="truncate">
                              Ded: {formatCurrency(shift.details?.deductions)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : selectedDay.details ? (
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                        <div className="flex items-center gap-2 mb-3 text-emerald-900 font-bold text-[10px] uppercase tracking-widest">
                          <Activity className="h-3.5 w-3.5 text-emerald-600" />
                          Shift Earnings
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] text-emerald-500 uppercase font-black tracking-tighter">
                              Hours Worked
                            </p>
                            <p className="text-xl font-black text-emerald-955">
                              {selectedDay.hours}h
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-emerald-500 uppercase font-black tracking-tighter">
                              Net Credit
                            </p>
                            <p className="text-xl font-black text-emerald-955">
                              {formatCurrency(selectedDay.amount)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-emerald-100 flex justify-between text-[10px] text-emerald-600 font-bold overflow-hidden">
                          <span className="truncate mr-2">
                            Gross: {formatCurrency(selectedDay.details.gross)}
                          </span>
                          <span className="truncate">
                            Ded:{" "}
                            {formatCurrency(selectedDay.details.deductions)}
                          </span>
                        </div>
                      </div>
                    ) : null)}

                  {(selectedDay.type === "payout" ||
                    selectedDay.type === "both") &&
                    selectedDay.payout &&
                    (selectedDay.payout_info?.source ===
                    "permanent_deduction" ? (
                      <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <div className="flex items-center gap-2 mb-3 text-red-900 font-bold text-[10px] uppercase tracking-widest">
                          <Banknote className="h-3.5 w-3.5 text-red-600" />
                          Permanent Hold Deduction
                        </div>
                        <div className="flex justify-between items-center text-red-900">
                          <div>
                            <p className="text-[10px] text-red-500 uppercase font-bold tracking-tight">
                              {selectedDay.payout_info?.hold_reason
                                ? `Reason: ${selectedDay.payout_info.hold_reason}`
                                : "Held Funds Deducted"}
                            </p>
                            <p className="text-xl font-black">
                              {formatCurrency(selectedDay.payout)}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[9px] font-black uppercase tracking-wider">
                            Deducted
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-3 text-blue-900 font-bold text-[10px] uppercase tracking-widest">
                          <Banknote className="h-3.5 w-3.5 text-blue-600" />
                          Wallet Payout
                        </div>
                        <div className="flex justify-between items-center text-blue-900">
                          <div>
                            <p className="text-[10px] text-blue-400 uppercase font-black tracking-tighter">
                              Transferred
                            </p>
                            <p className="text-xl font-black">
                              {formatCurrency(selectedDay.payout)}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-black uppercase tracking-wider">
                            Success
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <div className="p-3 bg-white rounded-full shadow-sm mb-4">
                  <Calendar className="h-6 w-6 text-gray-300" />
                </div>
                <h3 className="text-sm font-bold text-gray-600 mb-1">
                  Select a Date
                </h3>
                <p className="text-xs text-gray-400 max-w-[150px]">
                  Click on any date to view the worker's payout and earnings.
                </p>
              </div>
            )}
          </div>

          {/* Deductions Summary Card */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 flex flex-col h-full">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-500" />
                Deductions
              </h2>
              <div className="flex bg-gray-200/50 p-1 rounded-xl">
                {["daily", "monthly", "fy", "custom"].map((view) => (
                  <button
                    key={view}
                    onClick={() => setDeductionView(view)}
                    disabled={view === "daily" && !selectedDay}
                    className={`px-2 py-1.5 text-[9px] font-black rounded-lg transition-all tracking-tighter ${
                      deductionView === view
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-gray-400 hover:text-gray-600 disabled:opacity-10"
                    }`}
                  >
                    {view === "fy" ? "YEAR" : view.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 flex-1">
              <AnimatePresence mode="wait">
                {deductionView === "daily" && selectedDay && (
                  <motion.div
                    key="daily"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Selected Day
                        </p>
                        <p className="text-xs font-bold text-gray-800">
                          {new Date(selectedDay.date).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short" },
                          )}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-red-600">
                        -{formatCurrency(selectedDay.details?.deductions || 0)}
                      </p>
                    </div>
                    <div className="space-y-3">
                      {selectedDay.details?.deductions_breakdown?.length > 0 ? (
                        selectedDay.details.deductions_breakdown.map(
                          (ded, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center group"
                            >
                              <span className="text-xs text-gray-500 font-medium capitalize">
                                {ded.name}
                              </span>
                              <span className="text-xs font-bold text-gray-700">
                                -{formatCurrency(ded.amount)}
                              </span>
                            </div>
                          ),
                        )
                      ) : (
                        <p className="text-[10px] text-gray-400 italic text-center py-4">
                          {selectedDay.payout && !selectedDay.details
                            ? "Day contains only a payout transfer."
                            : "No deductions for this shift."}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {deductionView === "monthly" && (
                  <motion.div
                    key="monthly"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Monthly Summary
                        </p>
                        <p className="text-xs font-bold text-gray-800">
                          {monthName} {viewYear}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-red-600">
                        -{formatCurrency(summary?.thisMonthDeductions)}
                      </p>
                    </div>
                    <div className="space-y-3">
                      {summary?.deductionsDistribution?.length > 0 ? (
                        summary.deductionsDistribution.map((ded, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center"
                          >
                            <span className="text-xs text-gray-500 font-medium capitalize">
                              {ded.name}
                            </span>
                            <span className="text-xs font-bold text-gray-700">
                              -{formatCurrency(ded.amount)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-gray-400 italic text-center py-4">
                          No deductions recorded this month.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {deductionView === "fy" && (
                  <motion.div
                    key="fy"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Financial Year
                        </p>
                        <p className="text-xs font-bold text-gray-800">
                          FY {currentFYStart}-
                          {String(currentFYStart + 1).slice(2)}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-red-600">
                        -{formatCurrency(summary?.fyDeductions?.total)}
                      </p>
                    </div>
                    <div className="space-y-3">
                      {summary?.fyDeductions?.distribution?.length > 0 ? (
                        summary.fyDeductions.distribution.map((ded, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center"
                          >
                            <span className="text-xs text-gray-500 font-medium capitalize">
                              {ded.name}
                            </span>
                            <span className="text-xs font-bold text-gray-700">
                              -{formatCurrency(ded.amount)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-gray-400 italic text-center py-4">
                          No financial year data available.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {deductionView === "custom" && (
                  <motion.div
                    key="custom"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest pl-1">
                          Start Date
                        </p>
                        <div className="relative">
                          <DatePicker
                            selected={customRange.start}
                            onChange={(date) =>
                              setCustomRange({ ...customRange, start: date })
                            }
                            dateFormat="dd MMM yyyy"
                            wrapperClassName="w-full"
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[11px] font-bold text-gray-700 outline-none focus:ring-1 focus:ring-indigo-500 hover:border-indigo-200 transition-all"
                          />
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-300 pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest pl-1">
                          End Date
                        </p>
                        <div className="relative">
                          <DatePicker
                            selected={customRange.end}
                            onChange={(date) =>
                              setCustomRange({ ...customRange, end: date })
                            }
                            dateFormat="dd MMM yyyy"
                            minDate={customRange.start}
                            wrapperClassName="w-full"
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[11px] font-bold text-gray-700 outline-none focus:ring-1 focus:ring-indigo-500 hover:border-indigo-200 transition-all"
                          />
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-300 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Selected Period
                        </p>
                        <p className="text-xs font-bold text-gray-800">
                          Net Deductions
                        </p>
                      </div>
                      <p className="text-lg font-bold text-red-600">
                        -
                        {formatCurrency(
                          summary?.customSummary?.deductions || 0,
                        )}
                      </p>
                    </div>

                    <div className="space-y-3 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                      {summary?.customSummary?.distribution?.length > 0 ? (
                        summary.customSummary.distribution.map((ded, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center group"
                          >
                            <span className="text-xs text-gray-500 font-medium capitalize">
                              {ded.name}
                            </span>
                            <span className="text-xs font-bold text-gray-700">
                              -{formatCurrency(ded.amount)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-gray-400 italic text-center py-4">
                          No data for selected period.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100">
              <p className="text-[9px] text-gray-400 leading-tight italic">
                Deductions are calculated according to statutory norms based on
                gross earnings for the selected period.
              </p>
            </div>
          </div>
        </div>

        {/* Withdrawal Hub & Payout Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Manual Payout Card */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col justify-between h-full">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Banknote className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-800 tracking-tight">
                  Manual Payout
                </h2>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                    ₹
                  </span>
                  {/* <input
                    id="withdrawal-input"
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setWithdrawAmount(val);
                      const amountVal = Number(val);
                      if (isNaN(amountVal) || amountVal <= 0) {
                        setWithdrawError("Please enter a valid amount greater than 0");
                      } else if (amountVal > (summary?.withdrawableBalance || 0)) {
                        setWithdrawError("Amount exceeds available withdrawable balance");
                      } else {
                        setWithdrawError("");
                      }
                    }}
                    placeholder="0.00"
                    className={`w-full pl-8 pr-4 py-3 bg-gray-50 border ${withdrawError ? 'border-rose-400 focus:ring-rose-200' : 'border-gray-100 focus:ring-indigo-500'} rounded-xl outline-none focus:ring-2 transition text-lg font-black text-gray-800`}
                  /> */}
                  <input
                    id="withdrawal-input"
                    type="number"
                    min="0"
                    value={withdrawAmount}
                    onChange={(e) => {
                      let val = e.target.value;

                      // Prevent negative values
                      if (Number(val) < 0) {
                        val = 0;
                      }

                      setWithdrawAmount(val);

                      const amountVal = Number(val);

                      if (isNaN(amountVal) || amountVal <= 0) {
                        setWithdrawError(
                          "Please enter a valid amount greater than 0",
                        );
                      } else if (
                        amountVal > (summary?.withdrawableBalance || 0)
                      ) {
                        setWithdrawError(
                          "Amount exceeds available withdrawable balance",
                        );
                      } else {
                        setWithdrawError("");
                      }
                    }}
                    placeholder="0.00"
                    className={`w-full pl-8 pr-4 py-3 bg-gray-50 border ${
                      withdrawError
                        ? "border-rose-400 focus:ring-rose-200"
                        : "border-gray-100 focus:ring-indigo-500"
                    } rounded-xl outline-none focus:ring-2 transition text-lg font-black text-gray-800`}
                  />
                </div>

                <button
                  onClick={async () => {
                    const amountVal = Number(withdrawAmount);
                    if (isNaN(amountVal) || amountVal <= 0) {
                      toast.error("Please enter a valid amount greater than 0");
                      return;
                    }
                    if (amountVal > (summary?.withdrawableBalance || 0)) {
                      toast.error(
                        "Amount exceeds available withdrawable balance",
                      );
                      return;
                    }
                    setIsWithdrawing(true);
                    const result = await withdrawWorkerWallet(amountVal);
                    setIsWithdrawing(false);
                    setWithdrawAmount("");
                    setWithdrawError("");
                    if (result && result.success) {
                      setFeedbackPopup({
                        isOpen: true,
                        type: "success",
                        title: "Withdrawal Successful",
                        message: `A manual withdrawal of ${formatCurrency(amountVal)} has been successfully initiated. The payout transaction is now pending.`,
                      });
                      // Refresh history
                      fetchWalletHistory();
                    } else if (result) {
                      setFeedbackPopup({
                        isOpen: true,
                        type: "error",
                        title: "Withdrawal Failed",
                        message:
                          result.message ||
                          "An error occurred while processing the withdrawal.",
                      });
                    }
                  }}
                  disabled={
                    isWithdrawing ||
                    !withdrawAmount ||
                    !!withdrawError ||
                    !canWithdraw
                  }
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-50 flex items-center justify-center gap-2 text-sm"
                >
                  {isWithdrawing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Withdraw Funds"
                  )}
                </button>
              </div>
              {withdrawError && (
                <p className="text-[11px] font-bold text-rose-600 pl-1">
                  {withdrawError}
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Available Balance
              </p>
              <p className="text-xs font-black text-green-600">
                {formatCurrency(summary?.withdrawableBalance)}
              </p>
            </div>
          </div>

          {/* Automation Card */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Activity className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-800 tracking-tight">
                    Auto Withdrawal
                  </h2>
                </div>
                <button
                  onClick={handleAutoWithdrawSave}
                  disabled={loading}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-[10px] font-black rounded-xl transition shadow-md shadow-indigo-50"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Save Settings"
                  )}
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Payout Schedule
                  </p>
                  <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl">
                    {["daily", "weekly", "monthly"].map((freq) => (
                      <button
                        key={freq}
                        onClick={() =>
                          setLocalAutoWithdraw({
                            ...localAutoWithdraw,
                            frequency: freq,
                          })
                        }
                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-black capitalize transition-all ${
                          localAutoWithdraw.frequency === freq
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Min. Threshold
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="50"
                      value={localAutoWithdraw.threshold}
                      onChange={(e) =>
                        setLocalAutoWithdraw({
                          ...localAutoWithdraw,
                          threshold: e.target.value,
                        })
                      }
                      className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-gray-50 flex items-center justify-between min-h-[24px]">
              {saveStatus ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-[9px] font-black ${saveStatus.type === "success" ? "text-green-500" : "text-rose-500"}`}
                >
                  {saveStatus.message}
                </motion.p>
              ) : (
                <p className="text-[9px] text-gray-400 font-medium italic">
                  Trigger limit: ₹{formatCurrency(localAutoWithdraw.threshold)}
                </p>
              )}
            </div>
          </div>

          {/* Payout Destination Card */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col justify-between h-full">
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-800 tracking-tight">
                  Bank Details
                </h2>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 group relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">
                      Payout Account Details
                    </p>
                    {summary?.bank ? (
                      <div className="space-y-0.5">
                        <h3 className="text-xs font-black text-gray-800 truncate">
                          {summary.bank.name}
                        </h3>
                        <p className="text-[10px] text-gray-500 font-bold tracking-widest">
                          •••• {summary.bank.last4}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">
                        No bank linked.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Activity and Held Funds Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity Table */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-500" />
                  Recent Activity
                </h2>
                <button
                  onClick={() => navigate(`/admin/worker/wallet/history/${id}`)}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                >
                  View History <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {transactions.length > 0 ? (
                  transactions.slice(0, 5).map((tx, idx) => (
                    <div
                      key={idx}
                      className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-full ${
                            tx.type === "credit"
                              ? "bg-green-100 text-green-700"
                              : tx.source === "permanent_deduction"
                                ? "bg-red-50 text-red-600"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {tx.type === "credit" ? (
                            <IndianRupee className="h-5 w-5 text-green-700" />
                          ) : (
                            <Banknote className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {tx.type === "credit"
                              ? "Daily Earning"
                              : tx.source === "permanent_deduction"
                                ? "Deduction"
                                : "Withdrawal"}
                          </p>
                          <p className="text-sm text-gray-500 font-medium">
                            {tx.type === "credit"
                              ? "Shift Payment"
                              : tx.source === "permanent_deduction"
                                ? tx.hold_reason
                                  ? `Reason: ${tx.hold_reason}`
                                  : "Held Funds Deduction"
                                : tx.source === "auto_payout"
                                  ? "Automatic Payout"
                                  : "Manual Payout"}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {tx.transaction_date}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {tx.company_name && (
                              <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[11px] font-medium">
                                <span className="mr-1">CMP:</span>
                                {tx.company_name}
                              </span>
                            )}

                            {tx.reference_id && (
                              <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-[11px] font-medium">
                                <span className="mr-1">TXN:</span>
                                {tx.reference_id}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p
                          className={`font-bold ${
                            tx.type === "credit"
                              ? "text-green-600"
                              : tx.source === "permanent_deduction"
                                ? "text-red-600"
                                : "text-gray-900"
                          }`}
                        >
                          {tx.type === "credit" ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            tx.status === "completed" || tx.type === "credit"
                              ? tx.source === "permanent_deduction"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-green-50 text-green-700 border border-green-200"
                              : tx.status === "failed"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {tx.source === "permanent_deduction"
                            ? "Deducted"
                            : tx.status ||
                              (tx.type === "credit" ? "Credited" : "Processed")}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-12 text-center text-gray-500 italic">
                    No recent transactions found.
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center">
              <button
                onClick={() => navigate(`/admin/worker/wallet/history/${id}`)}
                className="w-full py-2.5 text-xs font-bold text-indigo-600 hover:bg-gray-50 bg-white border border-gray-100 rounded-xl transition"
              >
                View All Transactions
              </button>
            </div>
          </div>

          {/* Held Funds Log Card */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/20">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-amber-500" />
                  Held Funds Log
                </h2>
                {canManageHold && (
                  <button
                    onClick={() => {
                      setHoldAmountInput("");
                      setHoldReasonInput("");
                      setIsHoldModalOpen(true);
                    }}
                    className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Hold
                  </button>
                )}
              </div>
              <div className="divide-y divide-gray-100 max-h-[360px] overflow-y-auto">
                {(() => {
                  const activeAndReleasedHolds =
                    summary?.holds?.filter(
                      (hold) => hold.status !== "deducted",
                    ) || [];
                  return activeAndReleasedHolds.length > 0 ? (
                    activeAndReleasedHolds.map((hold) => (
                      <div
                        key={hold.id}
                        className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                      >
                        <div className="space-y-1 pr-4 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-800 text-sm">
                              {formatCurrency(hold.amount)}
                            </p>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                hold.status === "active"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : hold.status === "deducted"
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-gray-50 text-gray-500 border border-gray-200"
                              }`}
                            >
                              {hold.status === "active" ? "Hold" : hold.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 font-semibold">
                            Reason: {hold.reason}
                          </p>
                          <div className="text-[10px] text-gray-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span>Created: {hold.created_at}</span>
                            {hold.status === "released" && hold.released_at && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-600 font-bold">
                                  Released: {hold.released_at}
                                </span>
                              </>
                            )}
                            {hold.status === "deducted" && hold.released_at && (
                              <>
                                <span>•</span>
                                <span className="text-red-600 font-bold">
                                  Permanently Deducted: {hold.released_at}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {hold.status === "active" && canManageHold && (
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() =>
                                setConfirmDialog({
                                  isOpen: true,
                                  title: "Release Wallet Hold",
                                  message: `Are you sure you want to release the hold of ${formatCurrency(hold.amount)} back to the worker's withdrawable balance?`,
                                  confirmText: "Yes, Release Hold",
                                  confirmColor: "emerald",
                                  holdId: hold.id,
                                  actionType: "release",
                                  holdAmount: hold.amount,
                                })
                              }
                              className="px-3 py-1.5 text-xs font-bold text-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600 hover:bg-emerald-600 rounded-xl transition-all shadow-xs"
                            >
                              Release
                            </button>
                            <button
                              onClick={() =>
                                setConfirmDialog({
                                  isOpen: true,
                                  title: "Permanently Deduct Hold",
                                  message: `Are you sure you want to PERMANENTLY DEDUCT ${formatCurrency(hold.amount)} from this worker's wallet balance? This action is irreversible and cannot be undone.`,
                                  confirmText: "Yes, Deduct Permanently",
                                  confirmColor: "red",
                                  holdId: hold.id,
                                  actionType: "deduct",
                                  holdAmount: hold.amount,
                                })
                              }
                              className="px-3 py-1.5 text-xs font-bold text-red-600 hover:text-white border border-red-200 hover:border-red-600 hover:bg-red-600 rounded-xl transition-all shadow-xs"
                            >
                              Deduct
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-12 text-center text-gray-400 italic text-xs flex flex-col items-center justify-center min-h-[250px]">
                      <Shield className="h-8 w-8 text-gray-200 mb-2" />
                      No holds placed on this wallet.
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center">
              <span className="text-[10px] text-gray-400 font-medium">
                Showing all active and released wallet hold reasons and history
                log.
              </span>
            </div>
          </div>
        </div>

        {/* Hold Amount Management Modal */}
        <AnimatePresence>
          {isHoldModalOpen && canManageHold && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100"
              >
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                      <Shield className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Place Fund Hold
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setIsHoldModalOpen(false);
                      setHoldAmountInput("");
                      setHoldReasonInput("");
                    }}
                    className="p-1 hover:bg-gray-100 rounded-lg transition text-gray-400"
                  >
                    <Plus className="h-5 w-5 rotate-45" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 leading-relaxed">
                    Specify the hold amount and the reason. Setting a hold
                    reserves these funds from being withdrawn by the worker
                    (both manual and automatic withdrawals).
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center py-2 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                        Total Balance
                      </p>
                      <p className="text-base font-black text-gray-700">
                        {formatCurrency(summary?.currentBalance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                        Withdrawable
                      </p>
                      <p className="text-base font-black text-emerald-600">
                        {formatCurrency(
                          Math.max(
                            0,
                            (summary?.currentBalance || 0) -
                              (Number(summary?.holdAmount || 0) +
                                Number(holdAmountInput || 0)),
                          ),
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 pl-1">
                      Hold Amount (₹)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={holdAmountInput}
                        onChange={(e) => setHoldAmountInput(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 hover:border-indigo-200 transition-all"
                        min="0"
                        step="0.01"
                      />
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 pl-1">
                      Reason / Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Pending document verification"
                      value={holdReasonInput}
                      onChange={(e) => setHoldReasonInput(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 hover:border-indigo-200 transition-all"
                      maxLength="255"
                    />

                    {/* Suggestions list */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        "Document verification",
                        "Attendance dispute",
                        "Overpayment adjustment",
                        "Profile incomplete",
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setHoldReasonInput(tag)}
                          className="text-[9px] bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-500 font-bold px-2 py-1 rounded-lg transition-all"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setIsHoldModalOpen(false);
                      setHoldAmountInput("");
                      setHoldReasonInput("");
                    }}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const amountVal = Number(holdAmountInput);
                      if (isNaN(amountVal) || amountVal <= 0) {
                        toast.error(
                          "Please enter a valid amount greater than 0",
                        );
                        return;
                      }
                      if (!holdReasonInput.trim()) {
                        toast.error("Please enter a reason for the hold");
                        return;
                      }
                      const result = await updateWalletHold(
                        amountVal,
                        holdReasonInput.trim(),
                      );
                      setIsHoldModalOpen(false);
                      setHoldAmountInput("");
                      setHoldReasonInput("");
                      if (result && result.success) {
                        setFeedbackPopup({
                          isOpen: true,
                          type: "success",
                          title: "Fund Hold Placed",
                          message: `A fund hold of ${formatCurrency(amountVal)} has been successfully placed on this worker's wallet for: "${holdReasonInput.trim()}"`,
                        });
                      } else if (result) {
                        setFeedbackPopup({
                          isOpen: true,
                          type: "error",
                          title: "Placement Failed",
                          message:
                            result.message ||
                            "An error occurred while placing the fund hold.",
                        });
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-md transition-colors"
                  >
                    Apply Hold
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Custom Confirmation Overlay Modal */}
        <AnimatePresence>
          {confirmDialog.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100"
              >
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-lg ${
                        confirmDialog.confirmColor === "red"
                          ? "bg-red-100 text-red-600"
                          : "bg-emerald-100 text-emerald-600"
                      }`}
                    >
                      <Shield className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {confirmDialog.title}
                    </h3>
                  </div>
                  <button
                    onClick={() =>
                      setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
                    }
                    className="p-1 hover:bg-gray-100 rounded-lg transition text-gray-400"
                  >
                    <Plus className="h-5 w-5 rotate-45" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-sm font-semibold text-gray-700 leading-relaxed">
                    {confirmDialog.message}
                  </p>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    onClick={() =>
                      setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
                    }
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const holdId = confirmDialog.holdId;
                      const actionType = confirmDialog.actionType;
                      const holdAmount = confirmDialog.holdAmount;
                      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                      if (holdId) {
                        const result = await releaseWalletHold(
                          holdId,
                          actionType,
                        );
                        if (result && result.success) {
                          fetchWalletHistory();
                          setFeedbackPopup({
                            isOpen: true,
                            type: "success",
                            title:
                              actionType === "deduct"
                                ? "Hold Permanently Deducted"
                                : "Hold Released",
                            message:
                              actionType === "deduct"
                                ? `A sum of ${formatCurrency(holdAmount)} has been permanently deducted from this worker's wallet balance.`
                                : `A sum of ${formatCurrency(holdAmount)} has been successfully released back to this worker's withdrawable balance.`,
                          });
                        } else if (result) {
                          setFeedbackPopup({
                            isOpen: true,
                            type: "error",
                            title:
                              actionType === "deduct"
                                ? "Deduction Failed"
                                : "Release Failed",
                            message:
                              result.message ||
                              `An error occurred while ${actionType}ing the hold.`,
                          });
                        }
                      }
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-colors ${
                      confirmDialog.confirmColor === "red"
                        ? "bg-red-600 hover:bg-red-700 active:bg-red-800"
                        : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
                    }`}
                  >
                    {confirmDialog.confirmText}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Custom Success/Error Feedback Modal */}
        <AnimatePresence>
          {feedbackPopup.isOpen && (
            <div
              className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              style={{ zIndex: 60 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 p-6 text-center space-y-4"
              >
                <div className="flex justify-center">
                  {feedbackPopup.type === "success" ? (
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 border-4 border-emerald-100 text-emerald-600 animate-bounce">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-50 border-4 border-red-100 text-red-600 animate-bounce">
                      <XCircle className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-gray-900">
                    {feedbackPopup.title}
                  </h3>
                  <p className="text-sm font-semibold text-gray-500 leading-relaxed px-2">
                    {feedbackPopup.message}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() =>
                      setFeedbackPopup((prev) => ({ ...prev, isOpen: false }))
                    }
                    className={`w-full py-3 rounded-2xl font-bold text-sm text-white shadow-lg transition-all active:scale-[0.98] ${
                      feedbackPopup.type === "success"
                        ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-200"
                        : "bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-red-200"
                    }`}
                  >
                    Got It, Thanks
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 transparent;
          }
        `}</style>
      </div>
    </div>
  );
};

export default AdminWorkerWallet;
