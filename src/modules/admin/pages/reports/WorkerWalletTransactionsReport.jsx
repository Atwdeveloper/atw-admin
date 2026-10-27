"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Search,
  Loader2,
  Banknote,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "@/lib/navigation";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import * as reportsApi from "../../../../api/admin/adminReportsAPI";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Download } from "lucide-react";
const containerVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", duration: 0.4, staggerChildren: 0.1 },
  },
};

const WorkerWalletTransactionsReport = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  const [fromDate, setFromDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [activeDeductions, setActiveDeductions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloading, setDownloading] = useState(false);
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  const handleGenerate = async (page = 1) => {
    if (!fromDate || !toDate) {
      toast.error("Please select a date range");
      return;
    }
    setLoading(true);
    try {
      const params = {
        from_date: fromDate,
        to_date: toDate,
        page: page,
        limit: pageSize,
      };
      if (searchQuery) params.search = searchQuery;

      const response =
        await reportsApi.getWorkerWalletTransactionsReport(params);
      if (response.success) {
        setReportData(response.data || []);
        setActiveDeductions(response.active_deductions || []);
        if (response.pagination) {
          setCurrentPage(response.pagination.current_page);
          setTotalPages(response.pagination.last_page);
          setTotalItems(response.pagination.total);
        }
      } else {
        toast.error("Failed to generate report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };
  const handleDownloadExcel = async () => {
    try {
      setDownloading(true);

      const params = {
        from_date: fromDate,
        to_date: toDate,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response =
        await reportsApi.downloadWorkerWalletTransactionsReport(params);

      if (!response.data?.success) {
        toast.error("Failed to download report");
        return;
      }

      const data = response.data.data || [];
      const deductions = response.data.active_deductions || [];

      const exportData = data.map((row) => {
        const item = {
          "Worker Code": row["Worker Code"],
          "Worker Name": row["Worker Name"],
          "Company Name": row["Company Name"],
          State: row["State"],
          City: row["City"],
          Industry: row["Industry"],
          Designation: row["Designation"],
          "Job Type": row["Job Type"],
          Date: row["Date"],
          "In Time": row["In Time"],
          "Out Time": row["Out Time"],
          Hours: row["Hours"],
          Production: row["Production"],
          "Gross Earnings": row["Gross Earnings"],
        };

        deductions.forEach((ded) => {
          item[ded] = row[ded] || 0;
        });

        item["Total Deductions"] = row["Total Deductions"];
        item["Net Earnings"] = row["Net Earnings"];

        return item;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Worker Earnings");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(
        blob,
        `worker-earnings-${new Date().toISOString().split("T")[0]}.xlsx`,
      );

      toast.success("Excel downloaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download Excel");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    handleGenerate(1);
  }, [fromDate, toDate]);

  if (permissionsLoading) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-gray-600 animate-pulse font-medium">
          Loading Permissions...
        </div>
      </div>
    );
  }

  if (!hasPermission("reports", "wallet_transactions")) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view Worker Wallet Transactions.
          </p>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + reportData.length;

  return (
    <motion.div
      className="min-h-screen bg-gray-50 p-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="w-full max-w-full mx-auto space-y-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 inline-flex shadow-sm">
                <Banknote className="w-7 h-7" />
              </span>
              Worker Earning Report
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Check all daily worker earnings, companies worked for, gross
              earnings, and deductions in real-time.
            </p>
          </div>
        </div>

        {/* FILTERS & SEARCH BAR */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            {/* From Date */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                From Date
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-200 bg-gray-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-700 font-medium"
                />
              </div>
            </div>

            {/* To Date */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                To Date
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-200 bg-gray-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-700 font-medium"
                />
              </div>
            </div>

            {/* Quick Search */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Quick Search
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search code, name, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleGenerate(1);
                    }
                  }}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-200 bg-gray-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-700 font-medium"
                />
              </div>
            </div>

            {/* Fetch Button */}
            <div>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleGenerate(1)}
                disabled={loading || !fromDate || !toDate}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-300 disabled:to-indigo-300 text-white rounded-xl font-bold shadow-md shadow-blue-100 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                Refresh Data
              </motion.button>
            </div>
          </div>
        </div>

        {/* RESULTS TABLE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium animate-pulse">
              Fetching transactions, please wait...
            </p>
          </div>
        ) : reportData.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 "
          >
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">
                  Transaction Listing
                </h3>
                <p className="text-xs text-gray-500">
                  Showing {startIndex + 1} - {endIndex} of {totalItems} total
                  entries for {fromDate} to {toDate}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleDownloadExcel}
                disabled={downloading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-semibold shadow-sm transition-all flex items-center gap-2"
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}

                {downloading ? "Downloading..." : "Download Excel"}
              </motion.button>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="min-w-max text-[11px] text-left border-collapse">
                <thead className="bg-gray-100 text-gray-700 uppercase text-[10px] tracking-tight font-bold align-bottom">
                  <tr>
                    <th className="px-1.5 py-2 border-b border-gray-200 whitespace-nowrap">
                      Worker Code
                    </th>
                    <th className="px-1.5 py-2 border-b border-gray-200 whitespace-nowrap">
                      Worker Name
                    </th>
                    <th className="px-1.5 py-2 border-b border-gray-200 whitespace-nowrap">
                      Company Name
                    </th>
                    <th className="px-1.5 py-2 border-b border-gray-200 whitespace-nowrap">
                      State
                    </th>
                    <th className="px-1.5 py-2 border-b border-gray-200 whitespace-nowrap">
                      City
                    </th>
                    <th className="px-1.5 py-2 border-b border-gray-200 whitespace-nowrap">
                      Industry
                    </th>
                    <th className="px-1.5 py-2 border-b border-gray-200 whitespace-nowrap">
                      Designation
                    </th>
                    <th className="px-1.5 py-2 border-b border-gray-200 whitespace-nowrap">
                      Job Type
                    </th>
                    <th className="px-1.5 py-2 border-b border-gray-200 whitespace-nowrap">
                      Date
                    </th>
                    <th className="px-1.5 py-2 border-b border-gray-200 whitespace-nowrap">
                      In Time
                    </th>
                    <th className="px-1.5 py-2 border-b border-gray-200 whitespace-nowrap">
                      Out Time
                    </th>
                    <th className="px-1.5 py-2 border-b border-gray-200 whitespace-nowrap">
                      Hours
                    </th>
                    <th className="px-1.5 py-2 border-b border-gray-200 whitespace-nowrap">
                      Production
                    </th>
                    <th className="px-1.5 py-2 border-b border-gray-200 text-right whitespace-normal min-w-[70px] max-w-[110px] leading-tight">
                      Gross Earnings
                    </th>
                    {activeDeductions.map((ded) => (
                      <th
                        key={ded}
                        className="px-1.5 py-2 border-b border-gray-200 text-right whitespace-normal min-w-[70px] max-w-[110px] leading-tight"
                      >
                        {ded}
                      </th>
                    ))}
                    <th className="px-1.5 py-2 border-b border-gray-200 text-right whitespace-normal min-w-[70px] max-w-[110px] leading-tight">
                      Total Deductions
                    </th>
                    <th className="px-1.5 py-2 border-b border-gray-200 text-right whitespace-normal min-w-[70px] max-w-[110px] leading-tight">
                      Net Earnings
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportData.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-blue-50/30 transition-colors text-[11px]"
                    >
                      <td className="px-1.5 py-2 font-semibold text-gray-700 font-mono text-xs whitespace-nowrap">
                        {row["Worker Code"]}
                      </td>
                      <td className="px-1.5 py-2 font-semibold text-gray-900 whitespace-nowrap">
                        {row["Worker Name"]}
                      </td>
                      <td className="px-1.5 py-2 text-gray-600 whitespace-nowrap">
                        {row["Company Name"]}
                      </td>
                      <td className="px-1.5 py-2 text-gray-600 whitespace-nowrap">
                        {row["State"]}
                      </td>
                      <td className="px-1.5 py-2 text-gray-600 whitespace-nowrap">
                        {row["City"]}
                      </td>
                      <td className="px-1.5 py-2 text-gray-600 whitespace-nowrap">
                        {row["Industry"]}
                      </td>
                      <td className="px-1.5 py-2 text-gray-600 whitespace-nowrap">
                        {row["Designation"]}
                      </td>
                      <td className="px-1.5 py-2 text-gray-600 whitespace-nowrap">
                        {row["Job Type"]}
                      </td>
                      <td className="px-1.5 py-2 text-gray-600 whitespace-nowrap">
                        {row["Date"]}
                      </td>
                      <td className="px-1.5 py-2 text-gray-600 font-mono text-xs whitespace-nowrap">
                        {row["In Time"]}
                      </td>
                      <td className="px-1.5 py-2 text-gray-600 font-mono text-xs whitespace-nowrap">
                        {row["Out Time"]}
                      </td>
                      <td className="px-1.5 py-2 text-gray-600 font-mono text-xs whitespace-nowrap">
                        {row["Hours"]}
                      </td>
                      <td className="px-1.5 py-2 text-gray-600 whitespace-nowrap">
                        {row["Production"]}
                      </td>
                      <td className="px-1.5 py-2 text-right font-medium text-gray-900 whitespace-nowrap">
                        ₹{row["Gross Earnings"].toFixed(2)}
                      </td>
                      {activeDeductions.map((ded) => (
                        <td
                          key={ded}
                          className="px-1.5 py-2 text-right font-medium text-red-500 whitespace-nowrap"
                        >
                          ₹{(row[ded] || 0).toFixed(2)}
                        </td>
                      ))}
                      <td className="px-1.5 py-2 text-right font-bold text-red-600 whitespace-nowrap">
                        ₹{row["Total Deductions"].toFixed(2)}
                      </td>
                      <td className="px-1.5 py-2 text-right font-bold text-emerald-600 whitespace-nowrap">
                        ₹{row["Net Earnings"].toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-gray-50/50">
                <button
                  onClick={() => handleGenerate(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white text-sm font-semibold text-gray-600 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-xs font-semibold text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    handleGenerate(Math.min(currentPage + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white text-sm font-semibold text-gray-600 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">
              No calculations found
            </h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mt-1">
              There are no worker wallet transactions calculated for the
              selected period:{" "}
              <span className="font-semibold">
                {fromDate} to {toDate}
              </span>
              .
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default WorkerWalletTransactionsReport;
