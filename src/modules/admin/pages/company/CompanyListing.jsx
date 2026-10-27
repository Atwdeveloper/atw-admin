"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Briefcase,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Building,
  Building2,
  Users,
  Filter,
  Download,
  ChevronRight,
  ChevronDown,
  Files,
  FileSpreadsheet,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  X,
} from "lucide-react";
import { useNavigate } from "@/lib/navigation";
import {
  containerVariants,
  itemVariants,
  tableRowVariants,
} from "../../../../common/utils/motionVariants";
import { useCompanyListing } from "../../adminhooks/useCompanyListing";
import CompanyViewModal from "../../components/company/ViewCompanyModal";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import { getCompanyFilterOptionsAPI } from "../../../../api/admin/adminCompanyAPI";

import { useDateRangeFilter } from "../../../../common/hooks/useDateRangeFilter";
import DateRangeDropdown from "../../../../common/components/DateRangeDropdown.jsx";

const CompanyListing = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const {
    companies,
    loading,
    page,
    totalPages,
    setPage,
    filters,
    defaultFilters,
    setFilters,
    totalRecords,
    sortConfig,
    handleSort,
    handleSearch,
    handleDelete,
    handleToggleStatus,
    handleExportDownload,
    handleSaveCommission,
    selectedIds,
    toggleSelectCompany,
    toggleSelectAll,
    handleBulkActivate,
    handleBulkDeactivate,
    handleBulkDelete,
    handleBulkExport,
  } = useCompanyListing();

  const {
    dateRange,
    applyPreset,
    setCustomRange,
    presets,
    formatDateForDisplay,
  } = useDateRangeFilter();
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [industries, setIndustries] = useState([]);
  const [states, setStates] = useState([]);
  // Full city list from the company filter-options endpoint. The dropdown
  // shows all of these when no state is selected, and narrows to just the
  // selected states' cities (via getCityStateId below) once some are picked.
  const [allCities, setAllCities] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showCompanyTypeDropdown, setShowCompanyTypeDropdown] = useState(false);
  const [companyType, setCompanyType] = useState("all");
  const [industrySearch, setIndustrySearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  // Commission modal states
  const [commissionModal, setCommissionModal] = useState(false);
  const [commissionValue, setCommissionValue] = useState("");
  const [commissionType, setCommissionType] = useState("fixed");

  const [agents, setAgents] = useState([]);
  const [rms, setRms] = useState([]);

  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [showRmDropdown, setShowRmDropdown] = useState(false);

  const [agentSearch, setAgentSearch] = useState("");
  const [rmSearch, setRmSearch] = useState("");

  const [showBulkDropdown, setShowBulkDropdown] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  const agentRef = useRef(null);
  const rmRef = useRef(null);
  const industryRef = useRef(null);
  const stateRef = useRef(null);
  const cityRef = useRef(null);
  const companyTypeRef = useRef(null);
  const bulkActionRef = useRef(null);

  const companyTypeOptions = [
    { key: "all", label: "All Companies" },
    { key: "1", label: "Active Companies" },
    { key: "0", label: "Inactive Companies" },
    { key: "incomplete", label: "Incomplete Companies" },
  ];

  // Bundled dropdown data (industries, states, agents, RMs, cities) for the
  // filter panel — one call instead of several separate ones. The City
  // filter is derived from allCities client-side (see visibleCities below)
  // rather than fetched again whenever the State selection changes.
  const fetchFilterOptions = async () => {
    try {
      const res = await getCompanyFilterOptionsAPI();
      const data = res?.data || res || {};
      const statesList = data.states || [];
      setIndustries(data.industries || []);
      setStates(statesList);
      setAgents(data.agents || []);
      setRms(data.rms || data.staff || data.relationship_managers || []);
      setAllCities(data.cities || []);
      return statesList;
    } catch (error) {
      console.error("Failed to fetch company filter options:", error);
      setIndustries([]);
      setStates([]);
      setAgents([]);
      setRms([]);
      setAllCities([]);
      return [];
    }
  };

  // A city's owning state id, tolerant of a few likely field shapes since
  // the exact key returned by the filter-options endpoint isn't confirmed.
  const getCityStateId = (city) =>
    city.state_id ?? city.stateId ?? city.state?.id ?? null;

  // Cities shown in the City filter: every city when no State is selected,
  // narrowed to just the selected states' cities once some are picked.
  const visibleCities =
    filters.state_ids && filters.state_ids.length > 0
      ? allCities.filter((city) =>
          filters.state_ids.includes(getCityStateId(city)),
        )
      : allCities;

  // Generic toggle handler for the multi-select ID filters (industry_ids,
  // state_ids, city_ids, agent_ids, rm_ids).
  const toggleFilterId = (key, id) => {
    setFilters((prev) => {
      const current = prev[key] || [];
      const next = current.includes(id)
        ? current.filter((v) => v !== id)
        : [...current, id];
      return { ...prev, [key]: next };
    });
  };

  // Label shown on a multi-select filter's input when it's closed. Kept to a
  // single name or a count — these inputs are narrow, so a comma-joined list
  // would just get truncated and hide what's actually selected. The full
  // picture is shown as tags directly under each input instead (see
  // renderSelectedTags below).
  const selectedLabel = (list, ids) => {
    if (!ids || ids.length === 0) return "";
    if (ids.length === 1) {
      const item = list.find((option) => option.id === ids[0]);
      return item?.name || "1 selected";
    }
    return `${ids.length} selected`;
  };

  // Distinct colors cycled per tag so adjacent selected values are easy to
  // tell apart at a glance, rather than every tag looking identical.
  const TAG_COLORS = [
    "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
    "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
    "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100",
    "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100",
    "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
    "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
    "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100",
  ];

  // Renders the selected options for one multi-select filter as removable,
  // distinctly-colored tags directly beneath its input.
  const renderSelectedTags = (key, list) => {
    const ids = filters[key] || [];
    if (ids.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1 mt-1.5">
        {ids.map((id, index) => {
          const item = list.find((option) => option.id === id);
          const name = item?.name || `#${id}`;
          return (
            <span
              key={`${key}-${id}`}
              className={`inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs font-medium border ${TAG_COLORS[index % TAG_COLORS.length]}`}
            >
              {name}
              <button
                type="button"
                onClick={() => toggleFilterId(key, id)}
                className="p-0.5 rounded-full"
                title={`Remove ${name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}
      </div>
    );
  };

  const handleDateRangeChange = (range) => {
    if (range.preset === "custom") {
      setCustomRange(range.from, range.to);
    } else {
      applyPreset(range.preset);
    }

    setFilters((prev) => ({
      ...prev,
      dor_from: range.from || "",
      dor_to: range.to || "",
    }));

    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  // Reset all filters
  const handleClear = () => {
    setFilters(defaultFilters);
    setCompanyType("all");
    const allPreset = presets.find((p) => p.id === "all");
    if (allPreset) {
      const range = allPreset.action();
      applyPreset("all");
      setFilters((prev) => ({
        ...prev,
        dor_from: range.from || "",
        dor_to: range.to || "",
      }));
    }
    setPage(1);
  };

  // Handle click outside
  const handleClickOutside = useCallback((event) => {
    if (industryRef.current && !industryRef.current.contains(event.target)) {
      setShowIndustryDropdown(false);
      setIndustrySearch("");
    }
    if (stateRef.current && !stateRef.current.contains(event.target)) {
      setShowStateDropdown(false);
      setStateSearch("");
    }
    if (cityRef.current && !cityRef.current.contains(event.target)) {
      setShowCityDropdown(false);
      setCitySearch("");
    }
    if (agentRef.current && !agentRef.current.contains(event.target)) {
      setShowAgentDropdown(false);
      setAgentSearch("");
    }

    if (rmRef.current && !rmRef.current.contains(event.target)) {
      setShowRmDropdown(false);
      setRmSearch("");
    }
    if (
      companyTypeRef.current &&
      !companyTypeRef.current.contains(event.target)
    ) {
      setShowCompanyTypeDropdown(false);
    }
    if (bulkActionRef.current && !bulkActionRef.current.contains(event.target)) {
      setShowBulkDropdown(false);
    }
  }, []);
  const closeAllDropdowns = () => {
    setShowDateDropdown(false);
    setShowIndustryDropdown(false);
    setShowStateDropdown(false);
    setShowCityDropdown(false);
    setShowAgentDropdown(false);
    setShowRmDropdown(false);
    setShowCompanyTypeDropdown(false);
  };
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  // Close the per-row "more actions" menu on outside click
  useEffect(() => {
    const handleActionMenuOutsideClick = (event) => {
      if (!event.target.closest(".action-menu-container")) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleActionMenuOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleActionMenuOutsideClick);
    };
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Reset the City selection whenever the State selection changes — a
  // previously picked city may no longer belong to the newly selected
  // state(s), and the visible option list (visibleCities) narrows too.
  useEffect(() => {
    setFilters((prev) =>
      prev.city_ids && prev.city_ids.length > 0
        ? { ...prev, city_ids: [] }
        : prev,
    );
  }, [filters.state_ids]);

  const openViewModal = (company) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedCompany(null);
    setIsModalOpen(false);
  };

  const handleExportClick = async () => {
    try {
      setIsExporting(true);
      await handleExportDownload();
    } finally {
      setIsExporting(false);
    }
  };

  // Open commission modal and prefill data
  const openCommissionModal = (company) => {
    setSelectedCompany(company);
    setCommissionValue(company.agent_charge || "");
    setCommissionType(company.agent_charge_type || "fixed");
    setCommissionModal(true);
  };

  // Check permissions
  const canView = hasPermission("companies", "view");
  const canCreate = hasPermission("companies", "create");
  const canDelete = hasPermission("companies", "delete");
  const canExport = hasPermission("companies", "export");
  const jobOpenings = hasPermission("companies", "view_jobs");
  const canToggleStatus = hasPermission("companies", "toggle_status");
  const canViewDocuments = hasPermission("companies", "view_documents");
  const canViewSalarySheets = hasPermission("reports", "salary_sheets");
  const canManageCompanyWorkers = hasPermission(
    "companies",
    "manage_company_workers",
  );
  if (!permissionsLoading && !canView) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <Building2 className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view companies.
          </p>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Sorting is delegated to the API via sort_by / sort_dir query params.
  const tableColumns = [
    { key: "company_name", label: "Company Name", sortable: true },
    { key: "company_code", label: "Company Code", sortable: true },
    { key: "active_jobs_count", label: "Active Jobs", sortable: true },
    { key: "owner_name", label: "Contact Person", sortable: true },
    { key: "industry", label: "Industry", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "actions", label: "Actions", sortable: false },
  ];

  return (
    <motion.div
      className="flex-1 bg-gray-50"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* HEADER WITH FILTER TOGGLE */}
      <motion.div
        className={`bg-white p-4 border border-gray-200 shadow-sm ${
          filtersVisible ? "rounded-t-2xl border-b-0" : "mb-4 rounded-2xl"
        }`}
        variants={itemVariants}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
          <div ref={companyTypeRef} className="relative w-full md:w-auto">
            <button
              onClick={() =>
                setShowCompanyTypeDropdown(!showCompanyTypeDropdown)
              }
              className="flex items-center justify-between gap-4 px-4 py-2 border border-gray-300 rounded-lg bg-white border-none hover:border-none"
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl !font-bold text-gray-800">
                  Company List
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold whitespace-nowrap">
                  <Building2 className="w-3.5 h-3.5" />
                  {totalRecords} Total
                </span>
              </span>
              <ChevronRight
                className={`w-5 h-5 !stroke-[3px] stroke-black transition-transform ${
                  showCompanyTypeDropdown ? "rotate-90" : ""
                }`}
              />
            </button>

            {showCompanyTypeDropdown && (
              <div className="absolute !w-64 z-50 mt-0 ml-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {companyTypeOptions.map((option) => (
                  <div
                    key={option.key}
                    onClick={() => {
                      setCompanyType(option.key);
                      setShowCompanyTypeDropdown(false);
                      setFilters((prev) => ({
                        ...prev,
                        company_type: option.key === "all" ? "" : option.key,
                      }));
                      setTimeout(() => {
                        handleSearch();
                      }, 100);
                    }}
                    className={`flex items-center justify-between px-4 py-2 cursor-pointer text-sm
                      hover:bg-gray-100
                      ${
                        companyType === option.key
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-700"
                      }`}
                  >
                    <span>{option.label}</span>
                    {companyType === option.key && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {selectedIds.length > 0 ? (
              <div ref={bulkActionRef} className="relative w-full sm:w-64">
                <button
                  onClick={() => setShowBulkDropdown(!showBulkDropdown)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                >
                  <span>{selectedIds.length} selected</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showBulkDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showBulkDropdown && (
                  <div className="absolute left-0 z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    <button
                      onClick={() => {
                        setShowBulkDropdown(false);
                        handleBulkActivate();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-gray-700 hover:bg-green-50 hover:text-green-700"
                    >
                      <CheckCircle size={16} />
                      Activate
                    </button>
                    <button
                      onClick={() => {
                        setShowBulkDropdown(false);
                        handleBulkDeactivate();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-gray-700 hover:bg-amber-50 hover:text-amber-700 border-t border-gray-100"
                    >
                      <XCircle size={16} />
                      Deactivate
                    </button>
                    <button
                      onClick={() => {
                        setShowBulkDropdown(false);
                        handleBulkExport();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-gray-700 hover:bg-blue-50 hover:text-blue-700 border-t border-gray-100"
                    >
                      <Download size={16} />
                      Export
                    </button>
                    <button
                      onClick={() => {
                        setShowBulkDropdown(false);
                        handleBulkDelete();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 border-t border-gray-100"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Search by name"
                  value={filters.companyname || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, companyname: e.target.value })
                  }
                  className="w-full sm:w-64 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                {!filtersVisible && filters.companyname && (
                  <button
                    onClick={handleClear}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Clear All
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => setFiltersVisible(!filtersVisible)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition ${
                filtersVisible
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>

            {canExport && selectedIds.length === 0 && (
              <button
                onClick={handleExportClick}
                disabled={isExporting || loading}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition ${
                  isExporting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Export as Excel</span>
                  </>
                )}
              </button>
            )}

            {canCreate && (
              <button
                onClick={() => navigate("/admin/company/add")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add New Company</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* FILTER SECTION */}
      {filtersVisible && (
        <motion.div
          className="bg-white p-4 mb-4 rounded-b-2xl border border-gray-200 shadow-sm"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">
                FILTER BY :
              </div>
              <button
                onClick={handleClear}
                className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-3 items-start">
              <div className="relative w-56">
                <DateRangeDropdown
                  showDateDropdown={showDateDropdown}
                  setShowDateDropdown={setShowDateDropdown}
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                  presets={presets}
                  applyPreset={applyPreset}
                  formatDateForDisplay={formatDateForDisplay}
                />
              </div>

              {/* Industry Filter Dropdown (multi-select) */}
              <div
                ref={industryRef}
                className="relative w-48"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <Briefcase
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={
                      showIndustryDropdown
                        ? industrySearch
                        : selectedLabel(industries, filters.industry_ids)
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      setIndustrySearch(value);

                      closeAllDropdowns();
                      setShowIndustryDropdown(true);
                    }}
                    onFocus={() => {
                      closeAllDropdowns();
                      setIndustrySearch("");
                      setShowIndustryDropdown(true);
                    }}
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search industry"
                  />
                </div>

                {showIndustryDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {industries.length > 0 ? (
                      <>
                        <div
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 text-sm text-blue-600 font-medium"
                          onClick={() => {
                            setFilters({ ...filters, industry_ids: [] });
                          }}
                        >
                          Clear selection
                        </div>
                        {industries
                          .filter(
                            (industry) =>
                              !industrySearch ||
                              industry.name
                                .toLowerCase()
                                .includes(industrySearch.toLowerCase()),
                          )
                          .map((industry) => {
                            const checked = filters.industry_ids.includes(
                              industry.id,
                            );
                            return (
                              <div
                                key={industry.id}
                                className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                  checked ? "bg-blue-50" : ""
                                }`}
                                onClick={() =>
                                  toggleFilterId("industry_ids", industry.id)
                                }
                              >
                                <div className="flex items-center justify-between text-sm">
                                  <span>{industry.name}</span>
                                  {checked && (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        {industrySearch &&
                          industries.filter((industry) =>
                            industry.name
                              .toLowerCase()
                              .includes(industrySearch.toLowerCase()),
                          ).length === 0 && (
                            <div className="px-3 py-2 text-gray-500 text-center border-t border-gray-200 text-sm">
                              No industries found for "{industrySearch}"
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-center text-sm">
                        Loading industries...
                      </div>
                    )}
                  </div>
                )}
                {renderSelectedTags("industry_ids", industries)}
              </div>

              {/* State Filter Dropdown (multi-select) */}
              <div
                ref={stateRef}
                className="relative w-40"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={
                      showStateDropdown
                        ? stateSearch
                        : selectedLabel(states, filters.state_ids)
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      setStateSearch(value);

                      closeAllDropdowns();
                      setShowStateDropdown(true);
                    }}
                    onFocus={() => {
                      closeAllDropdowns();
                      setStateSearch("");
                      setShowStateDropdown(true);
                    }}
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search state"
                  />
                </div>

                {showStateDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {states.length > 0 ? (
                      <>
                        <div
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 text-sm text-blue-600 font-medium"
                          onClick={() => {
                            setFilters({ ...filters, state_ids: [] });
                          }}
                        >
                          Clear selection
                        </div>
                        {states
                          .filter(
                            (state) =>
                              !stateSearch ||
                              state.name
                                .toLowerCase()
                                .includes(stateSearch.toLowerCase()),
                          )
                          .map((state) => {
                            const checked = filters.state_ids.includes(
                              state.id,
                            );
                            return (
                              <div
                                key={state.id}
                                className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                  checked ? "bg-blue-50" : ""
                                }`}
                                onClick={() =>
                                  toggleFilterId("state_ids", state.id)
                                }
                              >
                                <div className="flex items-center justify-between text-sm">
                                  <span>{state.name}</span>
                                  {checked && (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        {stateSearch &&
                          states.filter((state) =>
                            state.name
                              .toLowerCase()
                              .includes(stateSearch.toLowerCase()),
                          ).length === 0 && (
                            <div className="px-3 py-2 text-gray-500 text-center border-t border-gray-200 text-sm">
                              No states found for "{stateSearch}"
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-center text-sm">
                        Loading states...
                      </div>
                    )}
                  </div>
                )}
                {renderSelectedTags("state_ids", states)}
              </div>

              {/* City Filter Dropdown (multi-select) — shows every city until
                  a State is picked, then narrows to the selected states' cities */}
              <div
                ref={cityRef}
                className="relative w-40"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={
                      showCityDropdown
                        ? citySearch
                        : selectedLabel(visibleCities, filters.city_ids)
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      setCitySearch(value);

                      closeAllDropdowns();
                      setShowCityDropdown(true);
                    }}
                    onFocus={() => {
                      closeAllDropdowns();
                      setCitySearch("");
                      setShowCityDropdown(true);
                    }}
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search city"
                  />
                </div>

                {showCityDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {visibleCities.length > 0 ? (
                      <>
                        <div
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 text-sm text-blue-600 font-medium"
                          onClick={() => {
                            setFilters({ ...filters, city_ids: [] });
                          }}
                        >
                          Clear selection
                        </div>
                        {visibleCities
                          .filter(
                            (city) =>
                              !citySearch ||
                              city.name
                                .toLowerCase()
                                .includes(citySearch.toLowerCase()),
                          )
                          .map((city) => {
                            const checked = filters.city_ids.includes(
                              city.id,
                            );
                            return (
                              <div
                                key={city.id}
                                className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                  checked ? "bg-blue-50" : ""
                                }`}
                                onClick={() =>
                                  toggleFilterId("city_ids", city.id)
                                }
                              >
                                <div className="flex items-center justify-between text-sm">
                                  <span>{city.name}</span>
                                  {checked && (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        {citySearch &&
                          visibleCities.filter((city) =>
                            city.name
                              .toLowerCase()
                              .includes(citySearch.toLowerCase()),
                          ).length === 0 && (
                            <div className="px-3 py-2 text-gray-500 text-center border-t border-gray-200 text-sm">
                              No cities found for "{citySearch}"
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-center text-sm">
                        No cities found
                      </div>
                    )}
                  </div>
                )}
                {renderSelectedTags("city_ids", visibleCities)}
              </div>

              {/* Agent Filter Dropdown (multi-select) */}
              <div
                ref={agentRef}
                className="relative w-48"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  placeholder="Search agent"
                  value={
                    showAgentDropdown
                      ? agentSearch
                      : selectedLabel(agents, filters.agent_ids)
                  }
                  onChange={(e) => {
                    setAgentSearch(e.target.value);

                    closeAllDropdowns();
                    setShowAgentDropdown(true);
                  }}
                  onFocus={() => {
                    closeAllDropdowns();
                    setAgentSearch("");
                    setShowAgentDropdown(true);
                  }}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm"
                />

                {showAgentDropdown && (
                  <div className="absolute z-10 w-full bg-white border rounded-lg shadow max-h-60 overflow-y-auto">
                    <div
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-blue-600 font-medium"
                      onClick={() => {
                        setFilters({ ...filters, agent_ids: [] });
                      }}
                    >
                      Clear selection
                    </div>

                    {agents
                      .filter(
                        (a) =>
                          !agentSearch ||
                          a.name
                            ?.toLowerCase()
                            .includes(agentSearch.toLowerCase()),
                      )
                      .map((agent) => {
                        const checked = filters.agent_ids.includes(agent.id);
                        return (
                          <div
                            key={agent.id}
                            className={`px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between ${
                              checked ? "bg-blue-50" : ""
                            }`}
                            onClick={() =>
                              toggleFilterId("agent_ids", agent.id)
                            }
                          >
                            <span>{agent.name}</span>
                            {checked && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
                {renderSelectedTags("agent_ids", agents)}
              </div>

              {/* RM Filter Dropdown (multi-select) */}
              <div
                ref={rmRef}
                className="relative w-48"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  placeholder="Search RM"
                  value={
                    showRmDropdown
                      ? rmSearch
                      : selectedLabel(rms, filters.rm_ids)
                  }
                  onChange={(e) => {
                    setRmSearch(e.target.value);

                    closeAllDropdowns();
                    setShowRmDropdown(true);
                  }}
                  onFocus={() => {
                    closeAllDropdowns();
                    setRmSearch("");
                    setShowRmDropdown(true);
                  }}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm"
                />

                {showRmDropdown && (
                  <div className="absolute z-10 w-full bg-white border rounded-lg shadow max-h-60 overflow-y-auto">
                    <div
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-blue-600 font-medium"
                      onClick={() => {
                        setFilters({ ...filters, rm_ids: [] });
                      }}
                    >
                      Clear selection
                    </div>

                    {rms
                      .filter(
                        (r) =>
                          !rmSearch ||
                          r.name
                            ?.toLowerCase()
                            .includes(rmSearch.toLowerCase()),
                      )
                      .map((rm) => {
                        const checked = filters.rm_ids.includes(rm.id);
                        return (
                          <div
                            key={rm.id}
                            className={`px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between ${
                              checked ? "bg-blue-50" : ""
                            }`}
                            onClick={() => toggleFilterId("rm_ids", rm.id)}
                          >
                            <span>{rm.name}</span>
                            {checked && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
                {renderSelectedTags("rm_ids", rms)}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* MAIN TABLE */}
      <motion.div
        className="bg-white rounded-[22px] border border-[#DDDDDD] shadow-sm overflow-hidden"
        variants={itemVariants}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 text-left w-10">
                  <input
                    type="checkbox"
                    checked={
                      companies.length > 0 &&
                      selectedIds.length === companies.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                {tableColumns.map((col) => (
                  <th
                    key={col.key}
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300"
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
                      >
                        {col.label}
                        {sortConfig.key === col.key ? (
                          sortConfig.direction === "asc" ? (
                            <ArrowUp size={14} />
                          ) : (
                            <ArrowDown size={14} />
                          )
                        ) : (
                          <ArrowUpDown size={14} className="text-gray-400" />
                        )}
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-gray-500">
                    <div className="flex flex-col items-center">
                      <Building className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-600">
                        No companies found.
                      </p>
                      <p className="text-sm mt-1 text-gray-400">
                        Create your first company by clicking "Add New Company"
                        above.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                companies.map((company, index) => (
                  <motion.tr
                    key={`${company.id}-${index}`}
                    className="cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    onClick={() => openViewModal(company)}
                  >
                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-4 cursor-auto"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(company.id)}
                        onChange={() => toggleSelectCompany(company.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 cursor-pointer py-4 text-sm text-gray-900 font-medium">
                      {company.company_name}
                    </td>
                    <td className="px-6 cursor-pointer py-4 text-sm text-gray-700">
                      {company.company_code}
                    </td>
                    <td
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/admin/vacancy-listing", {
                          state: {
                            companyId: company.id,
                            companyName: company.company_name,
                          },
                        });
                      }}
                      className="px-6 py-4 cursor-pointer text-sm text-blue-600 font-medium hover:underline"
                    >
                      {company.active_jobs_count || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {company.company_owner?.owner_name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-medium text-blue-600">
                        {company.industry?.name || "Not specified"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          company.status
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {company.status ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="px-6 py-4 cursor-auto"
                    >
                      <div className="relative inline-block action-menu-container">
                        <button
                          onClick={() =>
                            setOpenActionMenuId(
                              openActionMenuId === company.id
                                ? null
                                : company.id,
                            )
                          }
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                          title="Actions"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openActionMenuId === company.id && (
                          <div className="absolute right-0 z-20 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden text-left">
                            {jobOpenings && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  navigate(
                                    `/admin/company/job-openings/${company.id}/`,
                                    {
                                      state: {
                                        companyName: company.company_name,
                                      },
                                    },
                                  );
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Briefcase size={16} />
                                Job Openings
                              </button>
                            )}
                            {canViewDocuments && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  navigate(
                                    `/admin/company/view-documents/${company.id}/`,
                                    {
                                      state: {
                                        companyName: company.company_name,
                                        company: company,
                                      },
                                    },
                                  );
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Files size={16} />
                                View Documents
                              </button>
                            )}
                            {canManageCompanyWorkers && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  navigate(
                                    `/admin/all-workers/${company.id}`,
                                    {
                                      state: {
                                        companyName: company.company_name,
                                        company: company,
                                      },
                                    },
                                  );
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Users size={16} />
                                All Workers
                              </button>
                            )}
                            {canViewSalarySheets && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  navigate(`/admin/company/salary-sheets`, {
                                    state: {
                                      companyId: company.id,
                                      companyName: company.company_name,
                                    },
                                  });
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <FileSpreadsheet size={16} />
                                Salary Sheets
                              </button>
                            )}
                            {canToggleStatus && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  handleToggleStatus(
                                    company.id,
                                    company.status,
                                  );
                                }}
                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm border-t border-gray-100 ${
                                  company.status
                                    ? "text-red-600 hover:bg-red-50"
                                    : "text-green-600 hover:bg-green-50"
                                }`}
                              >
                                {company.status ? (
                                  <>
                                    <XCircle size={16} />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle size={16} />
                                    Activate
                                  </>
                                )}
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  handleDelete(company.id);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                              >
                                <Trash2 size={16} />
                                Delete Company
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* PAGINATION */}
      {companies.length > 0 && (
        <motion.div className="flex items-center justify-center space-x-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition 
              ${
                page === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-black hover:text-white"
              }`}
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, index) => {
            const p = index + 1;
            if (
              p === 1 ||
              p === totalPages ||
              (p >= page - 1 && p <= page + 1)
            ) {
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border text-sm shadow-sm transition
                    ${
                      page === p
                        ? "bg-black text-white"
                        : "bg-white hover:bg-black hover:text-white"
                    }`}
                >
                  {p}
                </button>
              );
            }
            if (p === page - 3 || p === page + 3) {
              return (
                <span key={p} className="px-2">
                  ...
                </span>
              );
            }
            return null;
          })}

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition 
              ${
                page === totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-black hover:text-white"
              }`}
          >
            Next
          </button>
        </motion.div>
      )}

      {/* COMMISSION MODAL */}
      {commissionModal && selectedCompany && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          onClick={() => setCommissionModal(false)}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800">
                Agent Commission
              </h2>
              <button
                onClick={() => setCommissionModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Agent Details Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                  Agent Details
                </h3>
                {selectedCompany.agent ? (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm border border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Agent Code:</span>
                      <span className="font-medium text-gray-900">
                        {selectedCompany.agent.agent_code || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium text-gray-900">
                        {selectedCompany.agent.agent_name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-900">
                        {selectedCompany.agent.agent_email || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium text-gray-900">
                        {selectedCompany.agent.agent_phone || "N/A"}
                      </span>
                    </div>
                    {/* Agent Location - added */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Agent Location:</span>
                      <span className="font-medium text-gray-900">
                        {selectedCompany.agent.agent_location || "Not provided"}
                      </span>
                    </div>
                    {/* Work Location - added */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Work Location:</span>
                      <span className="font-medium text-gray-900">
                        {selectedCompany.agent.work_location || "Not provided"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
                    No agent assigned to this company.
                  </div>
                )}
              </div>

              {/* Commission Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                  Set Commission
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Commission Amount
                    </label>
                    <input
                      type="number"
                      value={commissionValue}
                      onChange={(e) => setCommissionValue(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter commission value"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Commission Type
                    </label>
                    <select
                      value={commissionType}
                      onChange={(e) => setCommissionType(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="fixed">Fixed (₹)</option>
                      <option value="percentage">Percentage (%)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setCommissionModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleSaveCommission(
                    selectedCompany,
                    commissionValue,
                    commissionType,
                  );
                  setCommissionModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                Save Commission
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* VIEW MODAL */}
      <CompanyViewModal
        company={selectedCompany}
        isOpen={isModalOpen}
        onClose={closeViewModal}
      />
    </motion.div>
  );
};

export default CompanyListing;
