"use client";

// modules/admin/components/reports/ReportModal.jsx
import { motion } from "framer-motion";
import {
  X,
  FileText,
  Download,
  Building,
  Users,
  DollarSign,
  Target,
  TrendingUp,
  Briefcase,
  AlertCircle,
} from "lucide-react";

const ReportModal = ({ report, filters, isOpen, onClose, onDownload }) => {
  if (!isOpen || !report) return null;

  const getReportIcon = () => {
    switch (report.type) {
      case "company":
        return report.id === 1 ? Target : DollarSign;
      case "job":
        return Briefcase;
      case "registration":
        return report.subType === "worker" ? Users : Building;
      case "turnover":
        return TrendingUp;
      default:
        return FileText;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFilterSummary = () => {
    const activeFilters = [];

    // Check each filter and add if it has a value
    if (filters.company) {
      const companyName =
        filters.company === "1"
          ? "Tech Solutions Inc."
          : filters.company === "2"
            ? "Global Manufacturing Ltd."
            : filters.company === "3"
              ? "BuildRight Constructions"
              : filters.company === "4"
                ? "Healthcare Services Pvt Ltd"
                : filters.company === "5"
                  ? "Retail Masters Corporation"
                  : filters.company;
      activeFilters.push({ key: "Company", value: companyName });
    }

    if (filters.designation) {
      const designationName =
        filters.designation === "1"
          ? "Software Engineer"
          : filters.designation === "2"
            ? "Project Manager"
            : filters.designation === "3"
              ? "Data Analyst"
              : filters.designation === "4"
                ? "Sales Executive"
                : filters.designation === "5"
                  ? "HR Manager"
                  : filters.designation === "6"
                    ? "Site Supervisor"
                    : filters.designation === "7"
                      ? "Quality Analyst"
                      : filters.designation === "8"
                        ? "Marketing Specialist"
                        : filters.designation;
      activeFilters.push({ key: "Designation", value: designationName });
    }

    if (filters.startDate) {
      activeFilters.push({
        key: "Start Date",
        value: formatDate(filters.startDate),
      });
    }

    if (filters.endDate) {
      activeFilters.push({
        key: "End Date",
        value: formatDate(filters.endDate),
      });
    }

    if (filters.state) {
      const stateName =
        filters.state === "1"
          ? "Maharashtra"
          : filters.state === "2"
            ? "Delhi"
            : filters.state === "3"
              ? "Karnataka"
              : filters.state === "4"
                ? "Tamil Nadu"
                : filters.state === "5"
                  ? "Gujarat"
                  : filters.state;
      activeFilters.push({ key: "State", value: stateName });
    }

    if (filters.district) {
      const districtName =
        filters.district === "1"
          ? "Mumbai"
          : filters.district === "2"
            ? "Pune"
            : filters.district === "3"
              ? "Nagpur"
              : filters.district === "4"
                ? "Thane"
                : filters.district === "5"
                  ? "New Delhi"
                  : filters.district === "6"
                    ? "South Delhi"
                    : filters.district === "7"
                      ? "East Delhi"
                      : filters.district === "8"
                        ? "Bangalore"
                        : filters.district === "9"
                          ? "Mysore"
                          : filters.district === "10"
                            ? "Hubli"
                            : filters.district === "11"
                              ? "Chennai"
                              : filters.district === "12"
                                ? "Coimbatore"
                                : filters.district === "13"
                                  ? "Madurai"
                                  : filters.district === "14"
                                    ? "Ahmedabad"
                                    : filters.district === "15"
                                      ? "Surat"
                                      : filters.district === "16"
                                        ? "Vadodara"
                                        : filters.district;
      activeFilters.push({ key: "District", value: districtName });
    }

    if (filters.industry) {
      const industryName =
        filters.industry === "1"
          ? "Information Technology"
          : filters.industry === "2"
            ? "Manufacturing"
            : filters.industry === "3"
              ? "Construction"
              : filters.industry === "4"
                ? "Healthcare"
                : filters.industry === "5"
                  ? "Retail"
                  : filters.industry === "6"
                    ? "Education"
                    : filters.industry === "7"
                      ? "Banking & Finance"
                      : filters.industry;
      activeFilters.push({ key: "Industry", value: industryName });
    }

    if (filters.registrationType) {
      activeFilters.push({
        key: "Registration Type",
        value:
          filters.registrationType === "self"
            ? "Self Registered"
            : "Staff Assisted",
      });
    }

    if (filters.workType) {
      activeFilters.push({
        key: "Work Type",
        value:
          filters.workType.charAt(0).toUpperCase() + filters.workType.slice(1),
      });
    }

    return activeFilters;
  };

  const getReportTypeLabel = () => {
    switch (report.type) {
      case "company":
        return report.id === 1 ? "Job Vacancy" : "Earnings";
      case "job":
        return "Job Analysis";
      case "registration":
        return report.subType === "worker"
          ? "Worker Registration"
          : "Company Registration";
      case "turnover":
        return "Turnover Analysis";
      default:
        return "Report";
    }
  };

  const Icon = getReportIcon();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Icon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {report.title}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {getReportTypeLabel()}
                  </span>
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                    Demo Data
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Demo Data Notice */}
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">
                  Demo Mode Active
                </h4>
                <p className="text-sm text-yellow-600">
                  This is a demonstration using dummy data. In production, this
                  would connect to real APIs and databases.
                </p>
              </div>
            </div>
          </div>

          {/* Report Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Report Details
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">{report.description}</p>
            </div>
          </div>

          {/* Fields Included */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Fields Included
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {report.fields?.map((field, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{field}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Applied Filters */}
          {getFilterSummary().length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Applied Filters
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {getFilterSummary().map((filter, index) => (
                    <div
                      key={index}
                      className="bg-white p-3 rounded-lg border border-gray-200"
                    >
                      <p className="text-xs text-gray-500 uppercase font-medium mb-1">
                        {filter.key}
                      </p>
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {filter.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Download Info */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Download className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 mb-1">
                  Ready to Download
                </h4>
                <p className="text-sm text-green-600 mb-2">
                  This will generate an Excel file with demo data based on the
                  report type.
                </p>
                <div className="text-xs text-green-500 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Excel Format (CSV)
                  </span>
                  <span>•</span>
                  <span>All report fields included</span>
                  <span>•</span>
                  <span>Generated from dummy data</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              <span className="font-medium">{getReportTypeLabel()}</span> •
              Generated on {new Date().toLocaleDateString()}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={() => onDownload(report)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                Download Demo Excel
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReportModal;
