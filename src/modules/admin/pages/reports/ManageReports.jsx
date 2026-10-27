"use client";

import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  ArrowLeft,
  Sparkles,
  Heart,
  Zap,
  BarChart3,
  Building,
  Briefcase,
  DollarSign,
  Users,
  FileText,
  Calendar,
  CheckCircle,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@/lib/navigation";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import {
  sparkleVariants,
  heartVariants,
  zapVariants,
} from "../../../../common/utils/motionVariants";
import ReportModal from "../../components/reports/ReportModal";
import { useReports } from "../../../../modules/admin/adminhooks/useReports";
import { toast } from "react-hot-toast";

// Local variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const ManageReports = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const [activeReport, setActiveReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const {
    previewData,
    loading,
    downloading,
    page,
    filters,
    totalPages,
    totalItems,
    dropdownOptions,
    setPage,
    handleSearch,
    handleClear: hookHandleClear,
    handleFilterChange,
    downloadReport,
    fetchReportData,
  } = useReports({ autoFetch: true });

  if (permissionsLoading) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-gray-600 animate-pulse font-medium">
          Loading Permissions...
        </div>
      </div>
    );
  }

  const hasAnyDashboardReportPermission =
    hasPermission("reports", "job_vacancy_report") ||
    hasPermission("reports", "earnings_report") ||
    hasPermission("reports", "worker_registration_report") ||
    hasPermission("reports", "company_registration_report");

  if (!hasAnyDashboardReportPermission) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view any dashboard reports.
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

  const reportTypes = [
    {
      id: 1,
      title: "Job Vacancy & Fulfill Report",
      type: "company",
      icon: Briefcase,
      description:
        "Daily reports on open job vacancies and fulfilled positions per company",
      fields: [
        "Company Name",
        "Vacancy Name",
        "Industry",
        "Job Start Date",
        "Job End Date",
        "Workers Required",
        "Workers Hired",
      ],
      filterHierarchy: ["company", "industry", "date_range"],
      requiresDateRange: true,
      requiredPermission: "job_vacancy_report",
    },
    {
      id: 2,
      title: "Earnings by Designations",
      type: "company",
      icon: DollarSign,
      description:
        "Generate earnings reports filtered by company and designation",
      fields: [
        "Company Name",
        "Designation",
        "Total Earnings",
        "Average Earnings",
        "Number of Workers",
      ],
      filterHierarchy: ["state", "city", "industry", "company", "designation"],
      requiresDateRange: false,
      requiredPermission: "earnings_report",
    },
    {
      id: 4,
      title: "Worker Registration Reports",
      type: "registration",
      icon: Users,
      description:
        "Worker registrations filtered by state, city, industry, designation, worker, and date range",
      fields: [
        "Name",
        "State",
        "District",
        "Industry",
        "Registered By",
        "Created Date",
      ],
      filterHierarchy: [
        "state",
        "city",
        "industry",
        "designation",
        "worker",
        "date_range",
      ],
      requiresDateRange: true,
      requiredPermission: "worker_registration_report",
    },
    {
      id: 5,
      title: "Company Registration Reports",
      type: "registration",
      icon: Building,
      description: "Company registrations by state, city, and date range",
      fields: [
        "Name",
        "State",
        "District",
        "Industry",
        "Registered By",
        "Created Date",
      ],
      filterHierarchy: ["state", "city", "date_range"],
      requiresDateRange: true,
      requiredPermission: "company_registration_report",
    },
  ];

  const visibleReportTypes = reportTypes.filter(
    (report) =>
      !report.requiredPermission ||
      hasPermission("reports", report.requiredPermission),
  );

  const openReportView = (report) => {
    if (report.path) {
      navigate(report.path);
      return;
    }
    setActiveReport(report);
    hookHandleClear();
    setPage(1);
    setIsInitialLoad(false);
    setIsModalOpen(false);

    if (report.type === "wallet") {
      handleFilterChange("startDate", new Date().toISOString().split("T")[0]);
    }

    setTimeout(() => {
      handleSearch(report.id);
    }, 0);
  };

  const renderPageNumbers = () => {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (page > 3) {
        pages.push("...");
      }

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const closeReportView = () => {
    setActiveReport(null);
    setIsModalOpen(false);
  };

  // const openPreviewModal = (report) => {
  //   setActiveReport(report);
  //   setIsModalOpen(true);
  // };

  const closePreviewModal = () => setIsModalOpen(false);

  const handleGenerateClick = () => {
    if (activeReport) {
      handleSearch(activeReport.id);
    }
  };

  const handleClear = () => {
    hookHandleClear();
    setPage(1);
  };

  const handleTryAgain = () => {
    const resetFilters = {
      company: "",
      designation: "",
      industry: "",
      startDate: "",
      endDate: "",
      state: "",
      district: "",
      city: "",
      worker: "",
      registrationType: "",
      workType: "",
    };

    handleClear();

    if (activeReport) {
      fetchReportData(activeReport.id, resetFilters, 1);
    }
  };

  const handleDownload = async (report) => {
    if (!activeReport) return;
    if (previewData && previewData.length > 0) {
      await downloadReport(report.id);
    } else {
      toast.error(
        "No data available to download. Please generate a report first.",
      );
    }
  };

  const handleFilterChangeWithDummy = (key, value) => {
    handleFilterChange(key, value);
    setPage(1);
  };

  // RENDER FILTERS
  const renderReportFilters = () => {
    if (!activeReport) return null;

    const options = {
      companies: dropdownOptions.companies || [],
      states: dropdownOptions.states || [],
      districts: dropdownOptions.districts || [],
      industries: dropdownOptions.industries || [],
      designations: dropdownOptions.designations || [],
      designationsByCompany: dropdownOptions.designationsByCompany || [],
      cities: dropdownOptions.cities || [],
      workers: dropdownOptions.workers || [],
    };

    switch (activeReport.type) {
      case "company":
        return (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeReport.id === 2 && (
                <>
                  {/* State */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <select
                      value={filters.state || ""}
                      onChange={(e) =>
                        handleFilterChangeWithDummy("state", e.target.value)
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select State</option>
                      {options.states.map((state) => (
                        <option key={state.id} value={state.id}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <select
                      value={filters.city || ""}
                      onChange={(e) =>
                        handleFilterChangeWithDummy("city", e.target.value)
                      }
                      disabled={!filters.state}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Select City</option>
                      {options.cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Industry */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry
                    </label>
                    <select
                      value={filters.industry || ""}
                      onChange={(e) =>
                        handleFilterChangeWithDummy("industry", e.target.value)
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Industry</option>
                      {options.industries.map((industry) => (
                        <option key={industry.id} value={industry.id}>
                          {industry.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <select
                  value={filters.company}
                  onChange={(e) =>
                    handleFilterChangeWithDummy("company", e.target.value)
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Company</option>
                  {options.companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Industry (for Job Vacancy) or Designation (for Earnings) */}
              {activeReport.id === 1 ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <select
                    value={filters.industry}
                    onChange={(e) =>
                      handleFilterChangeWithDummy("industry", e.target.value)
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Industry</option>
                    {options.industries.map((industry) => (
                      <option key={industry.id} value={industry.id}>
                        {industry.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designation
                  </label>
                  <select
                    value={filters.designation}
                    onChange={(e) =>
                      handleFilterChangeWithDummy("designation", e.target.value)
                    }
                    disabled={!filters.company}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Select Designation</option>
                    {options.designationsByCompany.map((des) => (
                      <option key={des.id} value={des.id}>
                        {des.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date range only for Job Vacancy (ID 1) */}
              {activeReport.requiresDateRange && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) =>
                          handleFilterChangeWithDummy(
                            "startDate",
                            e.target.value,
                          )
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) =>
                          handleFilterChangeWithDummy("endDate", e.target.value)
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-4 mt-4">
              <button
                onClick={handleTryAgain}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Clear
              </button>
              <button
                onClick={handleGenerateClick}
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    View Report
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case "registration":
        if (activeReport.id === 4) {
          // Worker Registration Report
          return (
            <div className="space-y-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <select
                    value={filters.state}
                    onChange={(e) =>
                      handleFilterChangeWithDummy("state", e.target.value)
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select State</option>
                    {options.states.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <select
                    value={filters.city}
                    onChange={(e) =>
                      handleFilterChangeWithDummy("city", e.target.value)
                    }
                    disabled={!filters.state}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Select City</option>
                    {options.cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <select
                    value={filters.industry}
                    onChange={(e) =>
                      handleFilterChangeWithDummy("industry", e.target.value)
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Industry</option>
                    {options.industries.map((industry) => (
                      <option key={industry.id} value={industry.id}>
                        {industry.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Designation (depends on industry) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designation
                  </label>
                  <select
                    value={filters.designation}
                    onChange={(e) =>
                      handleFilterChangeWithDummy("designation", e.target.value)
                    }
                    disabled={!filters.industry}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Select Designation</option>
                    {options.designations.map((des) => (
                      <option key={des.id} value={des.id}>
                        {des.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Worker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Worker
                  </label>
                  <select
                    value={filters.worker}
                    onChange={(e) =>
                      handleFilterChangeWithDummy("worker", e.target.value)
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Worker</option>
                    {options.workers.map((worker) => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) =>
                        handleFilterChangeWithDummy("startDate", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) =>
                        handleFilterChangeWithDummy("endDate", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-4">
                <button
                  onClick={handleClear}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Clear
                </button>
                <button
                  onClick={handleGenerateClick}
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      View Report
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        }

        if (activeReport.id === 5) {
          // Company Registration Report
          return (
            <div className="space-y-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <select
                    value={filters.state}
                    onChange={(e) =>
                      handleFilterChangeWithDummy("state", e.target.value)
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select State</option>
                    {options.states.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <select
                    value={filters.city}
                    onChange={(e) =>
                      handleFilterChangeWithDummy("city", e.target.value)
                    }
                    disabled={!filters.state}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Select City</option>
                    {options.cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) =>
                        handleFilterChangeWithDummy("startDate", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) =>
                        handleFilterChangeWithDummy("endDate", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-4">
                <button
                  onClick={handleClear}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Clear
                </button>
                <button
                  onClick={handleGenerateClick}
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      View Report
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        }

        return null;

      case "wallet":
        return (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Select Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      handleFilterChangeWithDummy("startDate", e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-4">
              <button
                onClick={handleClear}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Clear
              </button>
              <button
                onClick={handleGenerateClick}
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    View Report
                  </>
                )}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // RENDER PREVIEW TABLE
  const renderPreviewTable = () => {
    const hasData = previewData && previewData.length > 0;

    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report data...</p>
        </div>
      );
    }

    if (!hasData) {
      return (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-600 mb-2">No records found</p>
          <p className="text-sm text-gray-500 mb-6">
            No data matches the selected filters. Try changing your search
            criteria.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleTryAgain}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <Search className="w-5 h-5" /> Try Again
            </button>
          </div>
        </div>
      );
    }

    const currentPageData = previewData;

    return (
      <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700 text-sm font-medium">
              <Eye className="w-4 h-4" />
              Preview Table - Page {page} of {totalPages}
            </div>
            <div className="text-xs text-gray-500">{activeReport?.title}</div>
          </div>
        </div>
        <div className="max-h-[500px] overflow-auto">
          <table className="min-w-full divide-y divide-gray-200 border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                {activeReport?.fields?.map((field) => (
                  <th
                    key={field}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border border-gray-300"
                  >
                    {field}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPageData.map((row, index) => (
                <tr
                  key={index}
                  className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                >
                  {activeReport?.fields?.map((field) => (
                    <td
                      key={field}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-300"
                    >
                      {row[field] || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      className="flex-1 bg-gray-50 p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* HERO SECTION */}
      <motion.div
        className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-gray-200 mb-8"
        variants={itemVariants}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="absolute top-4 right-8 text-yellow-400"
          variants={sparkleVariants}
          animate="animate"
        >
          <Sparkles className="w-6 h-6" />
        </motion.div>
        <motion.div
          className="absolute top-12 right-20 text-red-400"
          variants={heartVariants}
          animate="animate"
        >
          <Heart className="w-4 h-4" />
        </motion.div>
        <motion.div
          className="absolute bottom-8 right-12 text-orange-400"
          variants={zapVariants}
          animate="animate"
        >
          <Zap className="w-5 h-5" />
        </motion.div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
          <div className="space-y-3">
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.h1
                className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                Reports
              </motion.h1>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* MAIN CONTENT */}
      {!activeReport ? (
        <motion.div
          key="reports-list"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {visibleReportTypes.length > 0 ? (
            visibleReportTypes.map((report, index) => (
              <motion.div
                key={report.id}
                variants={itemVariants}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-blue-50">
                    <report.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                    {report.type.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {report.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {report.description}
                </p>
                <div className="flex items-center justify-between mt-6">
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Filter className="w-3 h-3" />{" "}
                    {report.filterHierarchy.length} filter levels
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openReportView(report)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                    >
                      <Filter className="w-4 h-4" /> Generate Report
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                No reports available
              </h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mt-1">
                You do not have permission to view any of the dashboard reports.
              </p>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Back button & header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={closeReportView}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              <ArrowLeft className="w-5 h-5" /> Back to Reports
            </button>
            <div className="flex items-center gap-3">
              {activeReport.type !== "wallet" && (
                <button
                  onClick={() => handleDownload(activeReport)}
                  disabled={
                    downloading || !previewData || previewData.length === 0
                  }
                  className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" /> Download Excel
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Report header card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {activeReport.title}
                </h2>
                <p className="text-gray-600">{activeReport.description}</p>
              </div>
              {previewData && previewData.length > 0 && (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {totalItems} records found
                  </span>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4"></div>
              {renderReportFilters()}
            </div>
          </div>

          {/* Preview table */}
          <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b-2 border-gray-300 bg-gradient-to-r from-blue-50 to-gray-50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-800">
                    Report Preview
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                    {loading
                      ? "Loading..."
                      : previewData && previewData.length > 0
                        ? `Page ${page} of ${totalPages}`
                        : "No data available"}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {activeReport?.title} - Report data will appear here
              </div>
            </div>
            <div className="p-6 min-h-[400px] bg-gradient-to-b from-white to-gray-50">
              {renderPreviewTable()}
            </div>

            {previewData && previewData.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {page} of {totalPages} • Total Records {totalItems}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (page > 1) {
                          const newPage = page - 1;
                          setPage(newPage);
                          handleSearch(activeReport.id, newPage);
                        }
                      }}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>

                    {renderPageNumbers().map((item, index) =>
                      item === "..." ? (
                        <span key={index} className="px-2 text-gray-500">
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => {
                            setPage(item);
                            handleSearch(activeReport.id, item);
                          }}
                          className={`px-3 py-2 rounded-lg border ${
                            page === item
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {item}
                        </button>
                      ),
                    )}

                    <button
                      onClick={() => {
                        if (page < totalPages) {
                          const newPage = page + 1;
                          setPage(newPage);
                          handleSearch(activeReport.id, newPage);
                        }
                      }}
                      disabled={page >= totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ReportModal
        report={activeReport}
        filters={filters}
        isOpen={isModalOpen}
        onClose={closePreviewModal}
        onDownload={() => handleDownload(activeReport)}
        loading={loading}
        downloading={downloading}
        previewData={previewData}
      />
    </motion.div>
  );
};

export default ManageReports;
