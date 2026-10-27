"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "@/lib/navigation";
import {
  ArrowLeft,
  Activity,
  IndianRupee,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAdminWorkerWallet } from "../../adminhooks/useAdminWorkerWallet";
import Breadcrumb from "../../../../common/components/Breadcrumb";

const AdminWorkerHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    historyLoading,
    transactions,
    pagination,
    setPagination,
    fetchWalletSummary,
    fetchWalletHistory,
    summary,
  } = useAdminWorkerWallet(id);

  const [filters, setFilters] = useState({
    range: "current_month", // current_month, last_month, custom
    type: "all", // all, credit, withdrawal
    startDate: "",
    endDate: "",
    page: 1,
  });

  const getApiParams = useCallback(() => {
    const params = { page: filters.page, type: filters.type };
    const now = new Date();

    if (filters.range === "current_month") {
      params.month = now.getMonth() + 1;
      params.year = now.getFullYear();
    } else if (filters.range === "last_month") {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      params.month = lastMonth.getMonth() + 1;
      params.year = lastMonth.getFullYear();
    } else if (filters.range === "custom") {
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;
    }
    return params;
  }, [filters]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchWalletSummary(); // Fetch worker name/code for header
    const params = getApiParams();
    fetchWalletHistory(params);
  }, [
    filters.range,
    filters.type,
    filters.startDate,
    filters.endDate,
    filters.page,
    fetchWalletHistory,
    fetchWalletSummary,
    getApiParams,
  ]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumb
          items={[
            { label: "Worker Management", path: "/admin/worker/listing" },
            { label: "Wallet", path: `/admin/worker/wallet/${id}` },
            { label: "Transaction History" },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/admin/worker/wallet/${id}`)}
              className="p-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Transaction History
              </h1>
              <p className="text-sm text-gray-500">
                Viewing transactions for{" "}
                <span className="font-bold text-indigo-600">
                  {summary?.worker_name || "Worker"}
                </span>{" "}
                {summary?.worker_code && `(${summary.worker_code})`}
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
            <Activity className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-semibold text-gray-700">
              {pagination.total} Records
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Range Toggles */}
            <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
              {[
                { label: "Current Month", value: "current_month" },
                { label: "Last Month", value: "last_month" },
                { label: "Custom", value: "custom" },
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => handleFilterChange("range", r.value)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    filters.range === r.value
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Type Selector */}
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-2">
                Type:
              </span>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer"
              >
                <option value="all">All Activities</option>
                <option value="credit">Earnings Only</option>
                <option value="withdrawal">Payouts Only</option>
              </select>
            </div>
          </div>

          {/* Custom Date Inputs */}
          {filters.range === "custom" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-50"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                  Start Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      handleFilterChange("startDate", e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                  End Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      handleFilterChange("endDate", e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* History List */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          {historyLoading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              <p className="text-gray-500 font-medium">
                Fetching transactions...
              </p>
            </div>
          ) : transactions.length > 0 ? (
            <>
              <div className="divide-y divide-gray-100">
                {transactions.map((tx, idx) => (
                  <div
                    key={idx}
                    className="px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-2xl ${
                          tx.type === "credit"
                            ? "bg-green-100 text-green-700"
                            : tx.source === "permanent_deduction"
                              ? "bg-red-50 text-red-600"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {tx.type === "credit" ? (
                          <IndianRupee className="h-6 w-6 text-green-700" />
                        ) : (
                          <Banknote
                            className={`h-6 w-6 ${tx.source === "permanent_deduction" ? "text-red-700" : "text-blue-700"}`}
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-lg">
                          {tx.type === "credit"
                            ? "Daily Earning"
                            : tx.source === "permanent_deduction"
                              ? "Deduction"
                              : "Withdrawal Request"}
                        </p>
                        <p className="text-sm text-gray-500 font-medium">
                          {tx.type === "credit"
                            ? `Project earnings credited to wallet`
                            : tx.source === "permanent_deduction"
                              ? tx.hold_reason
                                ? `Reason: ${tx.hold_reason}`
                                : "Held Funds Deduction"
                              : "Manual payout to linked bank"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                            {tx.transaction_date}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
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
                                (tx.type === "credit"
                                  ? "Success"
                                  : "Processed")}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {tx.company_name && (
                            <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[11px] font-medium">
                              <span className="mr-1">CMP:</span>
                              {tx.company_name}
                            </span>
                          )}

                          {tx.reference_id && (
                            <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-md text-[11px] font-medium">
                              <span className="mr-1">TXN:</span>
                              {tx.reference_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-xl font-black ${tx.type === "credit" ? "text-green-600" : tx.source === "permanent_deduction" ? "text-red-600" : "text-gray-900"}`}
                      >
                        {tx.type === "credit" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page{" "}
                  <span className="font-bold text-gray-700">
                    {pagination.page}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-gray-700">
                    {pagination.totalPages}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page === pagination.totalPages}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 flex flex-col items-center text-center px-6">
              <div className="p-4 bg-gray-50 rounded-full mb-4">
                <Activity className="h-12 w-12 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                No transactions found
              </h3>
              <p className="text-gray-500 max-w-xs mt-1">
                We couldn't find any records for the selected filters. Try a
                different range.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminWorkerHistory;
