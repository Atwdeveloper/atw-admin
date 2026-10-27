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
  Download,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "@/lib/navigation";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import * as reportsApi from "../../../../api/admin/adminReportsAPI";
import WorkerProfileModal from "./components/WorkerProfileModal";
import * as XLSX from "xlsx";
const containerVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", duration: 0.4, staggerChildren: 0.1 },
  },
};

const WorkerPayoutReport = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloading, setDownloading] = useState(false);
  // Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  const handleGenerate = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page: page,
        limit: pageSize,
      };
      if (selectedDate) params.date = selectedDate;
      if (searchQuery) params.search = searchQuery;

      const response = await reportsApi.getWorkerPayoutReport(params);
      if (response.success) {
        setReportData(response.data || []);
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

      const params = {};

      if (selectedDate) {
        params.date = selectedDate;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await reportsApi.downloadWorkerPayoutReport(params);

      if (!response.success) {
        toast.error("Failed to download report");
        return;
      }

      const exportData = response.data || [];

      const worksheet = XLSX.utils.json_to_sheet(exportData);

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Worker Payouts");

      XLSX.writeFile(
        workbook,
        `worker-payouts-${new Date().toISOString().split("T")[0]}.xlsx`,
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
  }, [selectedDate]);

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
            You don't have permission to view Worker Payout Reports.
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
              Worker Payout Report
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Check all worker payouts, wallet transactions, current balances,
              and status in real-time.
            </p>
          </div>
        </div>

        {/* FILTERS & SEARCH BAR */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {/* Select Date */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Filter by Date (Optional)
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
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
                  placeholder="Search ID, name, type, reference..."
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
                disabled={loading}
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
              Fetching payouts, please wait...
            </p>
          </div>
        ) : reportData.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">
                  Payouts Listing
                </h3>
                <p className="text-xs text-gray-500">
                  Showing {startIndex + 1} - {endIndex} of {totalItems} total
                  entries
                  {selectedDate && ` for ${selectedDate}`}
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

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead className="bg-gray-100 text-gray-700 uppercase text-[10px] tracking-tight font-bold align-bottom">
                  <tr>
                    <th className="px-2 py-2 border-b border-gray-200 whitespace-nowrap">
                      Date
                    </th>
                    <th className="px-2 py-2 border-b border-gray-200 whitespace-nowrap">
                      Worker Name
                    </th>
                    <th className="px-2 py-2 border-b border-gray-200 whitespace-nowrap">
                      Worker ID
                    </th>
                    <th className="px-2 py-2 border-b border-gray-200 whitespace-nowrap">
                      Designation
                    </th>
                    <th className="px-2 py-2 border-b border-gray-200 whitespace-nowrap">
                      State
                    </th>
                    <th className="px-2 py-2 border-b border-gray-200 whitespace-nowrap">
                      City
                    </th>
                    <th className="px-2 py-2 border-b border-gray-200 whitespace-nowrap">
                      Industry
                    </th>
                    <th className="px-2 py-2 border-b border-gray-200 whitespace-nowrap">
                      Payout Type
                    </th>
                    <th className="px-2 py-2 border-b border-gray-200 text-right whitespace-nowrap">
                      Gross Credited
                    </th>
                    <th className="px-2 py-2 border-b border-gray-200 text-right whitespace-nowrap">
                      Wallet Balance
                    </th>
                    <th className="px-2 py-2 border-b border-gray-200 text-center whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-2 py-2 border-b border-gray-200 whitespace-nowrap">
                      Reference ID
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportData.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-blue-50/30 transition-colors text-[11px]"
                    >
                      <td className="px-2 py-2.5 text-gray-600 font-mono text-xs whitespace-nowrap">
                        {row["Date"]}
                      </td>
                      <td className="px-2 py-2.5 font-semibold text-gray-900 whitespace-nowrap">
                        {row["_worker_id"] ? (
                          <button
                            onClick={() => {
                              setSelectedWorkerId(row["_worker_id"]);
                              setIsProfileModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:underline transition-colors focus:outline-none"
                          >
                            {row["Worker Name"]}
                          </button>
                        ) : (
                          row["Worker Name"]
                        )}
                      </td>
                      <td className="px-2 py-2.5 font-semibold text-gray-700 font-mono text-xs whitespace-nowrap">
                        {row["Worker ID"]}
                      </td>
                      <td className="px-2 py-2.5 text-gray-600 whitespace-nowrap">
                        {row["Designation"]}
                      </td>
                      <td className="px-2 py-2.5 text-gray-600 whitespace-nowrap">
                        {row["State"]}
                      </td>
                      <td className="px-2 py-2.5 text-gray-600 whitespace-nowrap">
                        {row["City"]}
                      </td>
                      <td className="px-2 py-2.5 text-gray-600 whitespace-nowrap">
                        {row["Industry"]}
                      </td>
                      <td className="px-2 py-2.5 text-gray-600 whitespace-nowrap font-medium">
                        {row["Payout Type"]}
                      </td>
                      <td
                        className={`px-2 py-2.5 text-right font-bold whitespace-nowrap ${row["Status"] === "Pending" ? "text-yellow-600" : "text-emerald-600"}`}
                      >
                        ₹{row["Gross Credited"].toFixed(2)}
                      </td>
                      <td className="px-2 py-2.5 text-right font-bold text-blue-600 whitespace-nowrap">
                        ₹{row["Wallet Balance"].toFixed(2)}
                      </td>
                      <td className="px-2 py-2.5 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                            row["Status"] === "Completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : row["Status"] === "Failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {row["Status"]}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-gray-600 font-mono text-xs whitespace-nowrap">
                        {row["Reference ID"]}
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
              No payouts found
            </h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mt-1">
              There are no worker payouts recorded matching the selected
              criteria.
            </p>
          </div>
        )}
      </div>

      <WorkerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        workerId={selectedWorkerId}
      />
    </motion.div>
  );
};

export default WorkerPayoutReport;
