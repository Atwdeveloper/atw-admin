"use client";

import { motion } from "framer-motion";
import {
  Download,
  FileText,
  Loader2,
  Upload,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/navigation";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import { toast } from "react-hot-toast";
import * as reportsApi from "../../../../api/admin/adminReportsAPI";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const EsicReports = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const currentDate = new Date();

  const [selectedMonth, setSelectedMonth] = useState(
    (currentDate.getMonth() + 1).toString().padStart(2, "0"),
  );

  const [selectedYear, setSelectedYear] = useState(
    currentDate.getFullYear().toString(),
  );
  // const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth()).toString().padStart(2, "0") === "00" ? "12" : (new Date().getMonth()).toString().padStart(2, "0"));
  // const [selectedYear, setSelectedYear] = useState((new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()).toString());
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [totals, setTotals] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [complianceDocs, setComplianceDocs] = useState([]);
  const [uploading, setUploading] = useState(null);

  const fetchComplianceDocs = async () => {
    try {
      const response = await reportsApi.getComplianceDocuments({
        month: selectedMonth,
        year: selectedYear,
      });
      if (response.success) {
        setComplianceDocs(response.data);
      }
    } catch (error) {
      console.error("Error fetching compliance docs:", error);
    }
  };

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchComplianceDocs();
    }
  }, [selectedMonth, selectedYear]);

  if (permissionsLoading) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-gray-600 animate-pulse font-medium">
          Loading Permissions...
        </div>
      </div>
    );
  }

  if (!hasPermission("reports", "esic_reports")) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view ESIC Reports.
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

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2020 + 1 },
    (_, i) => currentYear - i,
  );
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const handleUpload = async (type, file) => {
    if (!file) return;

    setUploading(type);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    formData.append("month", selectedMonth);
    formData.append("year", selectedYear);

    try {
      const response = await reportsApi.uploadComplianceDocument(formData);
      if (response.success) {
        toast.success(`${type.replace("_", " ")} uploaded successfully`);
        fetchComplianceDocs();
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?"))
      return;

    try {
      const response = await reportsApi.deleteComplianceDocument(id);
      if (response.success) {
        toast.success("Document deleted");
        fetchComplianceDocs();
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    }
  };

  const getDocByType = (type) =>
    complianceDocs.find((doc) => doc.type === type);

  const handleGenerate = async () => {
    if (!selectedMonth || !selectedYear) {
      toast.error("Select month and year");
      return;
    }
    setLoading(true);
    try {
      const params = { month: selectedMonth, year: selectedYear };
      const response = await reportsApi.getESICReportPreview(params);

      if (response.success) {
        setReportData(response.data || []);
        setTotals(response.totals || null);
        toast.success("Generated report preview");
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

  const handleDownload = async () => {
    if (!selectedMonth || !selectedYear) return;

    setDownloading(true);
    try {
      const params = { month: selectedMonth, year: selectedYear };
      const response = await reportsApi.downloadESICReport(params);

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ESIC_Report_${selectedYear}_${selectedMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("ESIC Excel download started");
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  const isValid = selectedMonth && selectedYear;

  return (
    <motion.div
      className="min-h-screen bg-gray-50 p-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="w-full max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ESIC Reports</h1>
            <p className="text-gray-500 text-sm">
              Generate monthly ESIC (ESI) reports
            </p>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Month */}
            <div>
              <label className="text-sm text-gray-600 mb-1 block font-medium">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="">Select Month</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="text-sm text-gray-600 mb-1 block font-medium">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="">Select Year</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="md:col-span-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleGenerate}
                disabled={!isValid || loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-300 disabled:to-indigo-300 text-white rounded-xl font-bold shadow-md shadow-blue-100 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
                Generate Report Preview
              </motion.button>
            </div>
          </div>
        </div>

        {/* COMPLIANCE UPLOADS */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-600" />
            Compliance Uploads (ESIC)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                id: "ESIC_ECR",
                label: "ESIC ECR (PDF/EXCEL)",
                accept: ".pdf,.xlsx,.xls",
              },
              {
                id: "ESIC_CHALLAN",
                label: "ESIC CHALLAN (PDF)",
                accept: ".pdf",
              },
            ].map((docType) => {
              const doc = getDocByType(docType.id);
              return (
                <div
                  key={docType.id}
                  className="p-4 rounded-xl border bg-gray-50 flex flex-col gap-3 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {docType.label}
                    </span>
                    {doc && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </div>

                  {doc ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-gray-600 truncate font-medium">
                        {doc.file_name}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.open(doc.file_url, "_blank")}
                          className="text-[10px] text-blue-600 font-bold hover:underline"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="text-[10px] text-red-600 font-bold hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] text-gray-400">
                        No document uploaded
                      </p>
                      <label
                        className={`cursor-pointer text-xs flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors w-max font-semibold ${!isValid || uploading ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        {uploading === docType.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Upload className="w-3 h-3" />
                        )}
                        Upload File
                        <input
                          type="file"
                          className="hidden"
                          accept={docType.accept}
                          onChange={(e) =>
                            handleUpload(docType.id, e.target.files[0])
                          }
                          disabled={!isValid || !!uploading}
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* REPORT PREVIEW */}
        {reportData.length > 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border overflow-hidden"
          >
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800">ESIC Report Preview</h3>
                <p className="text-xs text-gray-500">
                  Showing generated data for{" "}
                  {months.find((m) => m.value === selectedMonth)?.label}{" "}
                  {selectedYear}
                </p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-semibold shadow-sm shadow-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Download Excel
                </motion.button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-100 text-gray-700 uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-3 border border-gray-200 text-center">
                      Sr No
                    </th>
                    <th className="px-3 py-3 border border-gray-200">
                      IP Number
                    </th>
                    <th className="px-3 py-3 border border-gray-200">
                      IP Name
                    </th>
                    <th className="px-3 py-3 border border-gray-200 text-center">
                      No of Days
                    </th>
                    <th className="px-3 py-3 border border-gray-200 text-right">
                      Total Monthly Wages
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-2 border-x border-gray-100 text-center font-medium text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2 border-x border-gray-100 font-mono text-xs">
                        {row.ip_number}
                      </td>
                      <td className="px-3 py-2 border-x border-gray-100 uppercase">
                        {row.name}
                      </td>
                      <td className="px-3 py-2 border-x border-gray-100 text-center font-medium">
                        {row.days}
                      </td>
                      <td className="px-3 py-2 border-x border-gray-100 text-right font-bold text-emerald-700">
                        ₹{row.wages.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {totals && (
                  <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-300">
                    <tr>
                      <td colSpan="3" className="px-3 py-3 text-right">
                        TOTAL
                      </td>
                      <td className="px-3 py-3 text-center">
                        {totals.days} Days
                      </td>
                      <td className="px-3 py-3 text-right text-emerald-700">
                        ₹{totals.wages.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </motion.div>
        )}

        {/* EMPTY STATE */}
        {!loading && reportData.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No report generated
            </h3>
            <p className="text-gray-500">
              Select month and year then click generate to see preview
            </p>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium animate-pulse">
              Generating report preview, please wait...
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default EsicReports;
