"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Briefcase,
  Edit2,
  Trash2,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  User,
  Download,
  Building2,
  Filter,
  ChevronRight,
  ChevronDown,
  Files,
  MessageCircle,
  MoreVertical,
  X,
} from "lucide-react";
import { useNavigate } from "@/lib/navigation";
import {
  containerVariants,
  itemVariants,
  tableRowVariants,
} from "../../../../common/utils/motionVariants";
import { useWorkerListing } from "../../adminhooks/useWorkerListing";
import WorkerViewModal from "../../components/worker/ViewWorkerModal";
import WorkerCommentsModal from "../../components/worker/WorkerCommentsModal";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import {
  getWorkerFilterOptionsAPI,
  getWorkerByIdAPI,
} from "../../../../api/admin/adminWorkerAPI";
import { useDateRangeFilter } from "../../../../common/hooks/useDateRangeFilter";
import DateRangeDropdown from "../../../../common/components/DateRangeDropdown.jsx";
import SortableHeader from "../../../../common/components/SortableHeader";

const WorkerListing = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  const {
    workers,
    loading,
    page,
    totalPages,
    setPage,
    filters,
    setFilters,
    defaultFilters,
    totalRecords,
    sortConfig,
    handleSort,
    handleSearch,
    handleClear,
    handleDelete,
    handleToggleStatus,
    handleExportDownload,
    selectedIds,
    toggleSelectWorker,
    toggleSelectAll,
    handleBulkActivate,
    handleBulkDeactivate,
    handleBulkDelete,
    handleBulkExport,
  } = useWorkerListing();

  const {
    dateRange,
    applyPreset,
    setCustomRange,
    presets,
    formatDateForDisplay,
  } = useDateRangeFilter();
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedWorkerForComments, setSelectedWorkerForComments] =
    useState(null);

  const [designations, setDesignations] = useState([]);

  const [industries, setIndustries] = useState([]);
  const [states, setStates] = useState([]);
  // Full city list from the worker filter-options endpoint. The dropdown
  // shows all of these when no state is selected, and narrows to just the
  // selected states' cities (via getCityStateId below) once some are picked.
  const [allCities, setAllCities] = useState([]);
  const [industrySearch, setIndustrySearch] = useState("");
  const [designationSearch, setDesignationSearch] = useState("");

  const [staffList, setStaffList] = useState([]);
  const [staffSearch, setStaffSearch] = useState("");
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const staffRef = useRef(null);

  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showWorkerTypeDropdown, setShowWorkerTypeDropdown] = useState(false);
  const [workerType, setWorkerType] = useState("all");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [agents, setAgents] = useState([]);
  const [agentSearch, setAgentSearch] = useState("");
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);
  const agentRef = useRef(null);
  const bulkActionRef = useRef(null);

  const designationRef = useRef(null);
  const industryRef = useRef(null);
  const workerTypeRef = useRef(null);
  const stateRef = useRef(null);
  const cityRef = useRef(null);

  const workerTypeOptions = [
    { key: "all", label: "All Workers" },
    { key: "1", label: "Active Workers" },
    { key: "0", label: "Inactive Workers" },
    { key: "incomplete", label: "Incomplete Workers" },
  ];

  // Bundled dropdown data (industries, designations, states, cities, agents,
  // RMs) for the filter panel — one call instead of several separate ones.
  // Designations are independent of Industry — both are plain multi-selects.
  const fetchFilterOptions = async () => {
    try {
      const res = await getWorkerFilterOptionsAPI();
      const data = res?.data || res || {};
      setIndustries(data.industries || []);
      setDesignations(data.designations || []);
      setStates(data.states || []);
      setAgents(data.agents || []);
      setStaffList(data.rms || data.staff || data.relationship_managers || []);
      setAllCities(data.cities || []);
    } catch (error) {
      console.error("Failed to fetch worker filter options:", error);
      setIndustries([]);
      setDesignations([]);
      setStates([]);
      setAgents([]);
      setStaffList([]);
      setAllCities([]);
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

  const filteredDesignationsList = designations.filter((d) =>
    d.name.toLowerCase().includes(designationSearch.toLowerCase()),
  );

  const filteredIndustries = industries.filter((i) =>
    i.name.toLowerCase().includes(industrySearch.toLowerCase()),
  );

  // Generic toggle handler for the multi-select ID filters (industry_ids,
  // designation_ids, state_ids, city_ids, agent_ids, rm_ids).
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
  // single name or a count — full detail is shown as tags below the input.
  const selectedLabel = (list, ids) => {
    if (!ids || ids.length === 0) return "";
    if (ids.length === 1) {
      const item = list.find((option) => option.id === ids[0]);
      return item?.name || "1 selected";
    }
    return `${ids.length} selected`;
  };

  // Distinct colors cycled per tag so adjacent selected values are easy to
  // tell apart at a glance.
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
      <div className="flex flex-wrap gap-1 mt-1.5 max-h-16 overflow-y-auto">
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
      registration_date_from: range.from || "",
      registration_date_to: range.to || "",
    }));
    setTimeout(() => handleSearch(), 100);
  };

  const handleClearAll = () => {
    setFilters(defaultFilters);
    const allPreset = presets.find((p) => p.id === "all");
    if (allPreset) applyPreset("all");
    setShowWorkerTypeDropdown(false);
    setWorkerType("all");
    handleSearch();
  };

  const handleClickOutside = useCallback((event) => {
    if (workerTypeRef.current && !workerTypeRef.current.contains(event.target))
      setShowWorkerTypeDropdown(false);
    if (
      designationRef.current &&
      !designationRef.current.contains(event.target)
    ) {
      setShowDesignationDropdown(false);
      setDesignationSearch("");
    }
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
    if (staffRef.current && !staffRef.current.contains(event.target)) {
      setShowStaffDropdown(false);
      setStaffSearch("");
    }
    if (
      bulkActionRef.current &&
      !bulkActionRef.current.contains(event.target)
    ) {
      setShowBulkDropdown(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const openViewModal = async (worker) => {
    // The listing row is a trimmed summary (no `designations`/`skills`
    // arrays, no `date_of_joining`, etc.) — show it immediately so the modal
    // doesn't feel unresponsive, then swap in the full record once it loads.
    setSelectedWorker(worker);
    setIsModalOpen(true);
    try {
      const response = await getWorkerByIdAPI(worker.id);
      const fullWorker = response?.data?.data || response?.data || response;
      if (fullWorker && fullWorker.id) {
        setSelectedWorker(fullWorker);
      }
    } catch (error) {
      console.error("Failed to fetch worker details:", error);
    }
  };

  const closeViewModal = () => {
    setSelectedWorker(null);
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

  // ✅ Comments modal handlers
  const openCommentsModal = (worker) => {
    setSelectedWorkerForComments(worker);
    setIsCommentsModalOpen(true);
  };

  const closeCommentsModal = () => {
    setSelectedWorkerForComments(null);
    setIsCommentsModalOpen(false);
  };
  const closeAllDropdowns = () => {
    setShowDateDropdown(false);
    setShowIndustryDropdown(false);
    setShowStateDropdown(false);
    setShowCityDropdown(false);
    setShowAgentDropdown(false);
    // setShowRmDropdown(false);
    setShowStaffDropdown(false); // 👈 add this
    // setShowCompanyTypeDropdown(false);
  };
  const canView = hasPermission("workers", "view");
  const canCreate = hasPermission("workers", "create");
  const canEdit = hasPermission("workers", "edit");
  const canDelete = hasPermission("workers", "delete");
  const canExport = hasPermission("workers", "export");
  const canToggleStatus = hasPermission("workers", "toggle_status");
  const canViewDocuments = hasPermission("workers", "view_documents");
  const canViewComments = hasPermission("workers", "view_comments");
  const canViewWallet = hasPermission("workers", "view_wallet");

  if (!permissionsLoading && !canView) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <User className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view workers.
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

  return (
    <motion.div
      className="flex-1 bg-gray-50"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* HEADER WITH FILTER TOGGLE */}
      <motion.div
        className={`bg-white p-4 border border-gray-200 shadow-sm ${filtersVisible ? "rounded-t-2xl border-b-0" : "mb-4 rounded-2xl"}`}
        variants={itemVariants}
      >
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
          <div ref={workerTypeRef} className="relative w-full md:w-auto">
            <button
              onClick={() => setShowWorkerTypeDropdown(!showWorkerTypeDropdown)}
              className="flex w-full md:w-auto items-center justify-between gap-4 px-4 py-2 rounded-lg bg-white"
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="text-xl md:text-2xl !font-bold text-gray-800 truncate">
                  Worker List
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold whitespace-nowrap">
                  <User className="w-3.5 h-3.5" />
                  {totalRecords} Total
                </span>
              </span>
              <ChevronRight
                className={`w-5 h-5 !stroke-[3px] stroke-black transition-transform ${showWorkerTypeDropdown ? "rotate-90" : ""}`}
              />
            </button>
            {showWorkerTypeDropdown && (
              <div className="absolute left-0 mt-2 w-full sm:w-56 md:w-64 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {workerTypeOptions.map((option) => (
                  <div
                    key={option.key}
                    onClick={() => {
                      setWorkerType(option.key);
                      setShowWorkerTypeDropdown(false);
                      setFilters((prev) => ({
                        ...prev,
                        worker_type: option.key === "all" ? "" : option.key,
                      }));
                      setTimeout(handleSearch, 100);
                    }}
                    className={`flex items-center justify-between px-4 py-2 cursor-pointer text-sm hover:bg-gray-100 ${workerType === option.key ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"}`}
                  >
                    <span>{option.label}</span>
                    {workerType === option.key && (
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
                    {canToggleStatus && (
                      <>
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
                      </>
                    )}
                    {canExport && (
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
                    )}
                    {canDelete && (
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
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Search by name & code..."
                  value={filters.worker_name || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, worker_name: e.target.value })
                  }
                  className="w-full sm:w-64 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {!filtersVisible && filters.worker_name && (
                  <button
                    onClick={handleClear}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => setFiltersVisible(!filtersVisible)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition ${filtersVisible ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"}`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            {canExport && selectedIds.length === 0 && (
              <button
                onClick={handleExportClick}
                disabled={isExporting || loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${isExporting ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"}`}
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Exporting</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export as Excel</span>
                    <span className="sm:hidden">Export</span>
                  </>
                )}
              </button>
            )}
            {canCreate && (
              <button
                onClick={() => navigate("/admin/worker/add")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add New Worker</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* FILTER SECTION (unchanged) */}
      {filtersVisible && (
        <motion.div
          className="bg-white p-4 mb-4 rounded-b-2xl border border-gray-200 shadow-sm"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          {/* ... keep existing filter UI ... */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">
                FILTER BY :
              </div>
              <button
                onClick={handleClearAll}
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
              {/* Industry Filter (multi-select) */}
              <div
                ref={industryRef}
                className="relative w-48"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <Building2
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
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Search industry"
                  />
                </div>
                {showIndustryDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 text-sm text-blue-600 font-medium"
                      onClick={() => {
                        setFilters({ ...filters, industry_ids: [] });
                      }}
                    >
                      Clear selection
                    </div>
                    {filteredIndustries.map((industry) => {
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
                    {industrySearch && filteredIndustries.length === 0 && (
                      <div className="px-3 py-2 text-gray-500 text-center border-t text-sm">
                        No industries found for "{industrySearch}"
                      </div>
                    )}
                  </div>
                )}
                {renderSelectedTags("industry_ids", industries)}
              </div>
              {/* Designation Filter (multi-select) */}
              <div
                ref={designationRef}
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
                      showDesignationDropdown
                        ? designationSearch
                        : selectedLabel(designations, filters.designation_ids)
                    }
                    onChange={(e) => {
                      setDesignationSearch(e.target.value);
                      setShowDesignationDropdown(true);
                    }}
                    onFocus={() => {
                      setDesignationSearch("");
                      setShowDesignationDropdown(true);
                    }}
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Search designation"
                  />
                </div>
                {showDesignationDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 text-sm text-blue-600 font-medium"
                      onClick={() => {
                        setFilters({ ...filters, designation_ids: [] });
                      }}
                    >
                      Clear selection
                    </div>
                    {filteredDesignationsList.map((designation) => {
                      const checked = filters.designation_ids.includes(
                        designation.id,
                      );
                      return (
                        <div
                          key={designation.id}
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                            checked ? "bg-blue-50" : ""
                          }`}
                          onClick={() =>
                            toggleFilterId("designation_ids", designation.id)
                          }
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span>{designation.name}</span>
                            {checked && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {designationSearch && filteredDesignationsList.length === 0 && (
                      <div className="px-3 py-2 text-gray-500 text-center border-t text-sm">
                        No designations found for "{designationSearch}"
                      </div>
                    )}
                  </div>
                )}
                {renderSelectedTags("designation_ids", designations)}
              </div>
              {/* State Filter */}
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
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Search state"
                  />
                </div>
                {showStateDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                        (s) =>
                          !stateSearch ||
                          s.name
                            .toLowerCase()
                            .includes(stateSearch.toLowerCase()),
                      )
                      .map((state) => {
                        const checked = filters.state_ids.includes(state.id);
                        return (
                          <div
                            key={state.id}
                            className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                              checked ? "bg-blue-50" : ""
                            }`}
                            onClick={() => toggleFilterId("state_ids", state.id)}
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
                      states.filter((s) =>
                        s.name
                          .toLowerCase()
                          .includes(stateSearch.toLowerCase()),
                      ).length === 0 && (
                        <div className="px-3 py-2 text-gray-500 text-center border-t text-sm">
                          No states found for "{stateSearch}"
                        </div>
                      )}
                  </div>
                )}
                {renderSelectedTags("state_ids", states)}
              </div>
              {/* City Filter */}
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
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Search city"
                  />
                </div>
                {showCityDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                        (c) =>
                          !citySearch ||
                          c.name
                            .toLowerCase()
                            .includes(citySearch.toLowerCase()),
                      )
                      .map((city) => {
                        const checked = filters.city_ids.includes(city.id);
                        return (
                          <div
                            key={city.id}
                            className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                              checked ? "bg-blue-50" : ""
                            }`}
                            onClick={() => toggleFilterId("city_ids", city.id)}
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
                      visibleCities.filter((c) =>
                        c.name.toLowerCase().includes(citySearch.toLowerCase()),
                      ).length === 0 && (
                        <div className="px-3 py-2 text-gray-500 text-center border-t text-sm">
                          No cities found for "{citySearch}"
                        </div>
                      )}
                  </div>
                )}
                {renderSelectedTags("city_ids", visibleCities)}
              </div>
              {/* Agent Filter */}
              <div
                ref={agentRef}
                className="relative w-48"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
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
                    placeholder="Search agent"
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                {showAgentDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow max-h-60 overflow-y-auto">
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
                            onClick={() => toggleFilterId("agent_ids", agent.id)}
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
              {/* Staff Filter */}
              <div
                ref={staffRef}
                className="relative w-48"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={
                      showStaffDropdown
                        ? staffSearch
                        : selectedLabel(staffList, filters.rm_ids)
                    }
                    onChange={(e) => {
                      setStaffSearch(e.target.value);

                      closeAllDropdowns();
                      setShowStaffDropdown(true);
                    }}
                    onFocus={() => {
                      closeAllDropdowns();
                      setStaffSearch("");
                      setShowStaffDropdown(true);
                    }}
                    placeholder="Search staff (RM)"
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                {showStaffDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow max-h-60 overflow-y-auto">
                    <div
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-blue-600 font-medium"
                      onClick={() => {
                        setFilters({ ...filters, rm_ids: [] });
                      }}
                    >
                      Clear selection
                    </div>
                    {staffList
                      .filter(
                        (staff) =>
                          !staffSearch ||
                          staff.name
                            ?.toLowerCase()
                            .includes(staffSearch.toLowerCase()),
                      )
                      .map((staff) => {
                        const checked = filters.rm_ids.includes(staff.id);
                        return (
                          <div
                            key={staff.id}
                            className={`px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between ${
                              checked ? "bg-blue-50" : ""
                            }`}
                            onClick={() => toggleFilterId("rm_ids", staff.id)}
                          >
                            <span>
                              {staff.name} ({staff.staff_code})
                            </span>
                            {checked && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
                {renderSelectedTags("rm_ids", staffList)}
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
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={
                      workers.length > 0 &&
                      selectedIds.length === workers.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  />
                </th>
                <SortableHeader
                  label="Worker Name & Code"
                  sortKey="worker_name"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Wallet Balance"
                  sortKey="wallet_balance"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Designation"
                  sortKey="designation"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Work Location
                </th>
                <SortableHeader
                  label="Status"
                  sortKey="status"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-8 text-gray-500"
                  >
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : workers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-10 text-gray-500"
                  >
                    <div className="flex flex-col items-center">
                      <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-600">
                        No workers found.
                      </p>
                      <p className="text-sm mt-1 text-gray-400">
                        Create your first worker by clicking "Add New Worker"
                        above.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                workers.map((worker, index) => (
                  <motion.tr
                    key={`${worker.id}-${index}`}
                    className="cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    onClick={() => openViewModal(worker)}
                  >
                    <td
                      className="px-6 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(worker.id)}
                        onChange={() => toggleSelectWorker(worker.id)}
                        className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {worker.worker_name} - {worker.worker_code || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {canViewWallet ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/worker/wallet/${worker.id}`);
                          }}
                          className="text-amber-600 font-semibold hover:underline"
                        >
                          {worker.wallet_balance || "0.00"}
                        </button>
                      ) : (
                        <span>{worker.wallet_balance || "0.00"}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {(Array.isArray(worker.designations) &&
                      worker.designations.length > 0
                        ? worker.designations.map((d) => d.name).join(", ")
                        : worker.designation) || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {[worker.current_city_name, worker.current_state_name]
                        .filter(Boolean)
                        .join(", ") || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${worker.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {worker.status === "active" ? "Active" : "Inactive"}
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
                              openActionMenuId === worker.id
                                ? null
                                : worker.id,
                            )
                          }
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                          title="Actions"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openActionMenuId === worker.id && (
                          <div className="absolute right-0 z-20 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden text-left">
                            {canView && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  openViewModal(worker);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Eye size={16} />
                                View Details
                              </button>
                            )}
                            {canEdit && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  navigate(`/admin/worker/edit/${worker.id}`);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit2 size={16} />
                                Edit Worker
                              </button>
                            )}
                            {canViewDocuments && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  navigate(
                                    `/admin/worker/view-documents/${worker.id}/`,
                                    {
                                      state: {
                                        workerName: worker.worker_name,
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
                            {canViewComments && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  openCommentsModal(worker);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <MessageCircle size={16} />
                                View Comments
                              </button>
                            )}
                            {canToggleStatus && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  handleToggleStatus(
                                    worker.id,
                                    worker.status,
                                  );
                                }}
                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm border-t border-gray-100 ${
                                  worker.status === "active"
                                    ? "text-red-600 hover:bg-red-50"
                                    : "text-green-600 hover:bg-green-50"
                                }`}
                              >
                                {worker.status === "active" ? (
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
                                  handleDelete(worker.id);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                              >
                                <Trash2 size={16} />
                                Delete Worker
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
      {workers.length > 0 && (
        <motion.div className="flex items-center justify-center space-x-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition ${page === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-black hover:text-white"}`}
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
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border text-sm shadow-sm transition ${page === p ? "bg-black text-white" : "bg-white hover:bg-black hover:text-white"}`}
                >
                  {p}
                </button>
              );
            }
            if (p === page - 3 || p === page + 3)
              return (
                <span key={p} className="px-2">
                  ...
                </span>
              );
            return null;
          })}
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition ${page === totalPages ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-black hover:text-white"}`}
          >
            Next
          </button>
        </motion.div>
      )}

      {/* MODALS */}
      {canView && (
        <WorkerViewModal
          worker={selectedWorker}
          isOpen={isModalOpen}
          onClose={closeViewModal}
          canViewWallet={canViewWallet}
        />
      )}
      {canViewComments && (
        <WorkerCommentsModal
          isOpen={isCommentsModalOpen}
          onClose={closeCommentsModal}
          workerId={selectedWorkerForComments?.id}
          workerName={selectedWorkerForComments?.worker_name}
        />
      )}
    </motion.div>
  );
};

export default WorkerListing;
