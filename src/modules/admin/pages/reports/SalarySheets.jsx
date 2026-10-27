"use client";

import { motion } from "framer-motion";
import {
  Download,
  FileSpreadsheet,
  Loader2,
  Building,
  AlertCircle,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "@/lib/navigation";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import { toast } from "react-hot-toast";
import * as reportsApi from "../../../../api/admin/adminReportsAPI";
import Swal from "sweetalert2";
import Breadcrumb from "../../../../common/components/Breadcrumb";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const SalarySheets = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  const companyId = location.state?.companyId;
  const companyName = location.state?.companyName;

  const [salarySheets, setSalarySheets] = useState([]);
  const [sheetsLoading, setSheetsLoading] = useState(false);

  const getCurrentMonthStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  // Date/Month range filters (stored in YYYY-MM format)
  const [fromMonth, setFromMonth] = useState(getCurrentMonthStr());
  const [toMonth, setToMonth] = useState(getCurrentMonthStr());

  const getStartOfMonthDate = (monthStr) => {
    if (!monthStr) return "";
    return `${monthStr}-01`;
  };

  const getEndOfMonthDate = (monthStr) => {
    if (!monthStr) return "";
    const [year, month] = monthStr.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return `${monthStr}-${String(lastDay).padStart(2, "0")}`;
  };

  // Fetch available sheets for selected company
  const fetchSalarySheets = useCallback(async () => {
    if (!companyId) return;

    try {
      setSheetsLoading(true);
      const params = {
        company_id: companyId,
        from_date: getStartOfMonthDate(fromMonth),
        to_date: getEndOfMonthDate(toMonth),
      };

      const res = await reportsApi.getSalarySheetsAPI(params);
      if (res?.success && Array.isArray(res.data)) {
        setSalarySheets(res.data);
      } else {
        toast.error(res?.message || "Failed to fetch salary sheets");
      }
    } catch (error) {
      console.error("Failed to fetch salary sheets:", error);
      toast.error("Failed to load available salary sheets");
    } finally {
      setSheetsLoading(false);
    }
  }, [companyId, fromMonth, toMonth]);

  useEffect(() => {
    if (companyId) {
      fetchSalarySheets();
    }
  }, [companyId, fetchSalarySheets]);

  const handleDownload = async (sheet) => {
    if (!companyId) return;

    Swal.fire({
      title: "Generating Report...",
      text: "Please wait while we prepare the salary sheet.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await reportsApi.exportSalarySheetAPI({
        company_id: companyId,
        year: sheet.year,
        month: sheet.month,
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fileName = `SalarySheet_${sheet.label.replace(/\s+/g, "_")}.xlsx`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      Swal.close();
      toast.success(`Salary sheet for ${sheet.label} downloaded successfully`);
    } catch (error) {
      console.error("Error downloading salary sheet:", error);
      Swal.fire({
        icon: "error",
        title: "Download Failed",
        text: "Failed to download salary sheet. Please try again.",
      });
    }
  };

  if (permissionsLoading) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center min-h-[500px]">
        <div className="text-gray-600 animate-pulse font-medium">
          Loading Permissions...
        </div>
      </div>
    );
  }

  if (!hasPermission("reports", "salary_sheets")) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center min-h-[500px]">
        <div className="bg-white rounded-lg p-8 text-center max-w-md shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view Salary Sheets.
          </p>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="flex-1 bg-gray-50 p-6 flex flex-col items-center justify-center min-h-[500px]">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-md shadow-sm">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-4">
            <Building className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            No Company Selected
          </h2>
          <p className="text-gray-500 mb-6 text-sm">
            Please select a company from the Company Listing page to view and
            manage its salary sheets.
          </p>
          <button
            onClick={() => navigate("/admin/company/listing")}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Company Listing
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50 p-6 w-full"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="w-full max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <Breadcrumb
          items={[
            { label: "Company Listing", path: "/admin/company/listing" },
            { label: companyName || "Company" },
            { label: "Salary Sheets" },
          ]}
        />

        {/* Back Button */}
        <motion.div variants={itemVariants} className="mt-4">
          <button
            onClick={() => navigate("/admin/company/listing")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition text-sm font-semibold mb-4"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
            Back to Companies
          </button>
        </motion.div>

        {/* Header */}
        <motion.div variants={itemVariants} className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Salary Sheets</h1>
          <p className="text-gray-500 text-sm">
            Available monthly salary sheets for{" "}
            <span className="font-semibold text-gray-700">{companyName}</span>
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                From Month
              </label>
              <input
                type="month"
                value={fromMonth}
                onChange={(e) => setFromMonth(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-800 font-medium"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                To Month
              </label>
              <input
                type="month"
                value={toMonth}
                onChange={(e) => setToMonth(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-800 font-medium"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFromMonth("");
                  setToMonth("");
                }}
                disabled={!fromMonth && !toMonth}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition duration-150 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Range
              </button>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div variants={itemVariants}>
          {sheetsLoading ? (
            <div className="bg-white rounded-xl border border-gray-200/80 p-12 flex flex-col items-center justify-center min-h-[300px]">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <span className="text-gray-600 font-medium animate-pulse">
                Fetching available salary sheets...
              </span>
            </div>
          ) : salarySheets.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200/80 p-12 flex flex-col items-center justify-center text-center min-h-[350px]">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">
                No Salary Sheets Found
              </h3>
              <p className="text-gray-500 max-w-sm text-sm">
                There are no calculated salary sheets available for this company
                in the specified date range.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200/80 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-4 px-6">Month / Year</th>
                      <th className="py-4 px-6">Document Type</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-700">
                    {salarySheets.map((sheet) => (
                      <tr
                        key={sheet.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-4 px-6 flex items-center gap-3">
                          <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <FileSpreadsheet className="w-5 h-5" />
                          </div>
                          <span className="font-semibold text-gray-900">
                            {sheet.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-500">
                          Salary Calculation Sheet
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 capitalize">
                            {sheet.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDownload(sheet)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-100 transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download Excel
                          </motion.button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SalarySheets;
