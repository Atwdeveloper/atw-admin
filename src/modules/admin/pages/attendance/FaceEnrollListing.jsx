"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Briefcase,
  ScanFace,
  User,
  Building2,
  Filter,
  ChevronRight,
  CheckCircle,
  X,
} from "lucide-react";
import { useNavigate } from "@/lib/navigation";
import Swal from "sweetalert2";
import {
  containerVariants,
  itemVariants,
  tableRowVariants,
} from "../../../../common/utils/motionVariants";
import { useFaceEnrollListing } from "../../adminhooks/useFaceEnrollListing";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import { useDateRangeFilter } from "../../../../common/hooks/useDateRangeFilter";
import DateRangeDropdown from "../../../../common/components/DateRangeDropdown.jsx";
import SortableHeader from "../../../../common/components/SortableHeader";
import FaceScanner from "../../../attendance/FaceScanner";

const STATUS_OPTIONS = [
  { key: "", label: "All Status" },
  { key: "1", label: "Active" },
  { key: "0", label: "Inactive" },
];

const ENROLLMENT_STATUS_OPTIONS = [
  { key: "", label: "All Workers" },
  { key: "enrolled", label: "Enrolled" },
  { key: "not_enrolled", label: "Not Enrolled" },
];

// Distinct colors cycled per tag so adjacent selected values are easy to tell
// apart at a glance — same convention as WorkerListing.jsx.
const TAG_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
  "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
  "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100",
  "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100",
];

const FaceEnrollListing = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const canView = hasPermission("face_enroll", "view");
  const canEnroll = hasPermission("face_enroll", "enroll");

  const {
    workers,
    loading,
    page,
    totalPages,
    totalRecords,
    setPage,
    filters,
    setFilters,
    defaultFilters,
    sortConfig,
    handleSort,
    handleSearch,
    filterOptions,
    enrollWorker,
  } = useFaceEnrollListing();

  const {
    dateRange,
    applyPreset,
    setCustomRange,
    presets,
    formatDateForDisplay,
  } = useDateRangeFilter();

  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showEnrollmentDropdown, setShowEnrollmentDropdown] = useState(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);

  const [industrySearch, setIndustrySearch] = useState("");
  const [designationSearch, setDesignationSearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [agentSearch, setAgentSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");

  const statusRef = useRef(null);
  const enrollmentRef = useRef(null);
  const industryRef = useRef(null);
  const designationRef = useRef(null);
  const stateRef = useRef(null);
  const cityRef = useRef(null);
  const agentRef = useRef(null);
  const staffRef = useRef(null);

  // The worker currently being enrolled — drives the FaceScanner overlay.
  const [enrollingWorker, setEnrollingWorker] = useState(null);

  const getCityStateId = (city) =>
    city.state_id ?? city.stateId ?? city.state?.id ?? null;

  const visibleCities =
    filters.state_ids && filters.state_ids.length > 0
      ? filterOptions.cities.filter((city) =>
          filters.state_ids.includes(getCityStateId(city)),
        )
      : filterOptions.cities;

  // Reset the City selection whenever the State selection changes — a
  // previously picked city may no longer belong to the newly selected
  // state(s).
  useEffect(() => {
    setFilters((prev) =>
      prev.city_ids && prev.city_ids.length > 0
        ? { ...prev, city_ids: [] }
        : prev,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.state_ids]);

  const toggleFilterId = (key, id) => {
    setFilters((prev) => {
      const current = prev[key] || [];
      const next = current.includes(id)
        ? current.filter((v) => v !== id)
        : [...current, id];
      return { ...prev, [key]: next };
    });
  };

  const selectedLabel = (list, ids) => {
    if (!ids || ids.length === 0) return "";
    if (ids.length === 1) {
      const item = list.find((option) => option.id === ids[0]);
      return item?.name || "1 selected";
    }
    return `${ids.length} selected`;
  };

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

  const closeAllDropdowns = () => {
    setShowStatusDropdown(false);
    setShowEnrollmentDropdown(false);
    setShowIndustryDropdown(false);
    setShowDesignationDropdown(false);
    setShowStateDropdown(false);
    setShowCityDropdown(false);
    setShowAgentDropdown(false);
    setShowStaffDropdown(false);
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
    handleSearch();
  };

  const handleClickOutside = useCallback((event) => {
    if (statusRef.current && !statusRef.current.contains(event.target))
      setShowStatusDropdown(false);
    if (
      enrollmentRef.current &&
      !enrollmentRef.current.contains(event.target)
    )
      setShowEnrollmentDropdown(false);
    if (industryRef.current && !industryRef.current.contains(event.target)) {
      setShowIndustryDropdown(false);
      setIndustrySearch("");
    }
    if (
      designationRef.current &&
      !designationRef.current.contains(event.target)
    ) {
      setShowDesignationDropdown(false);
      setDesignationSearch("");
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
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const filteredIndustries = filterOptions.industries.filter((i) =>
    i.name.toLowerCase().includes(industrySearch.toLowerCase()),
  );
  const filteredDesignations = filterOptions.designations.filter((d) =>
    d.name.toLowerCase().includes(designationSearch.toLowerCase()),
  );
  const filteredStates = filterOptions.states.filter(
    (s) => !stateSearch || s.name.toLowerCase().includes(stateSearch.toLowerCase()),
  );
  const filteredCities = visibleCities.filter(
    (c) => !citySearch || c.name.toLowerCase().includes(citySearch.toLowerCase()),
  );
  const filteredAgents = filterOptions.agents.filter(
    (a) => !agentSearch || a.name?.toLowerCase().includes(agentSearch.toLowerCase()),
  );
  const filteredStaff = filterOptions.rms.filter(
    (s) => !staffSearch || s.name?.toLowerCase().includes(staffSearch.toLowerCase()),
  );

  const statusLabel =
    STATUS_OPTIONS.find((o) => o.key === filters.status)?.label || "All Status";
  const enrollmentLabel =
    ENROLLMENT_STATUS_OPTIONS.find((o) => o.key === filters.enrollment_status)
      ?.label || "All Workers";

  // The camera overlay doesn't navigate to a new route (it's rendered
  // in-place over this listing), so it never pushes a history entry of its
  // own — pressing the device/browser Back button while it's open would
  // otherwise fall through to whatever page was open *before* this listing,
  // skipping straight past it instead of just closing the scanner. Push a
  // dummy entry when it opens so Back has something of ours to consume, and
  // treat that as "close the scanner, stay on the listing".
  const closingViaPopStateRef = useRef(false);

  const openEnrollModal = (worker) => {
    window.history.pushState({ faceEnrollModal: true }, "");
    setEnrollingWorker(worker);
  };
  // Explicit close (X button, Cancel, or after a successful enroll) also
  // consumes the dummy history entry pushed above, so Back afterwards
  // behaves normally instead of needing an extra press.
  const closeEnrollModal = () => {
    setEnrollingWorker(null);
    if (!closingViaPopStateRef.current && window.history.state?.faceEnrollModal) {
      window.history.back();
    }
  };

  useEffect(() => {
    if (!enrollingWorker) return;
    const handlePopState = () => {
      closingViaPopStateRef.current = true;
      setEnrollingWorker(null);
      closingViaPopStateRef.current = false;
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [enrollingWorker]);

  // Same contract WorkerFaceRegistration.jsx's handleCapture uses: pipe the
  // enroll response through resolveEnrollResult and return
  // { success, message, retryable } so FaceScanner can render its own
  // inline retry UI on failure without tearing the camera down.
  const handleCapture = async (blob) => {
    if (!enrollingWorker) {
      return { success: false, message: "No worker selected.", retryable: false };
    }

    const resolved = await enrollWorker(enrollingWorker.id, blob);

    if (resolved.success) {
      closeEnrollModal();
      Swal.fire({
        icon: "success",
        title: resolved.wasUpdate ? "Face updated" : "Face enrolled",
        text:
          resolved.message ||
          (resolved.wasUpdate
            ? "Worker face updated successfully."
            : "Worker face enrolled successfully."),
        timer: 2200,
        showConfirmButton: false,
      });
      return { success: true };
    }

    return {
      success: false,
      message:
        resolved.serverMessage ||
        resolved.issues?.map((issue) => issue.message).join(" ") ||
        resolved.message,
      retryable: resolved.retryable,
    };
  };

  if (!permissionsLoading && !canView) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <ScanFace className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view face enrollment.
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
      {/* HEADER */}
      <motion.div
        className={`bg-white p-4 border border-gray-200 shadow-sm ${filtersVisible ? "rounded-t-2xl border-b-0" : "mb-4 rounded-2xl"}`}
        variants={itemVariants}
      >
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl md:text-2xl !font-bold text-gray-800 truncate">
              Face Enroll
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold whitespace-nowrap">
              <ScanFace className="w-3.5 h-3.5" />
              {totalRecords} Workers
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by name & code..."
              value={filters.worker_name || ""}
              onChange={(e) =>
                setFilters({ ...filters, worker_name: e.target.value })
              }
              className="w-full sm:w-64 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={() => setFiltersVisible(!filtersVisible)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition ${filtersVisible ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"}`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
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
              <div className="text-sm font-medium text-gray-700">FILTER BY :</div>
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

              {/* Status Filter */}
              <div
                ref={statusRef}
                className="relative w-40"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    closeAllDropdowns();
                    setShowStatusDropdown((prev) => !prev);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <span>{statusLabel}</span>
                  <ChevronRight
                    className={`w-4 h-4 text-gray-400 transition-transform ${showStatusDropdown ? "rotate-90" : ""}`}
                  />
                </button>
                {showStatusDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                    {STATUS_OPTIONS.map((option) => (
                      <div
                        key={option.key}
                        onClick={() => {
                          setFilters({ ...filters, status: option.key });
                          setShowStatusDropdown(false);
                          setTimeout(handleSearch, 100);
                        }}
                        className={`flex items-center justify-between px-3 py-2 cursor-pointer text-sm hover:bg-gray-100 ${filters.status === option.key ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"}`}
                      >
                        <span>{option.label}</span>
                        {filters.status === option.key && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enrollment Status Filter */}
              <div
                ref={enrollmentRef}
                className="relative w-40"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    closeAllDropdowns();
                    setShowEnrollmentDropdown((prev) => !prev);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <span>{enrollmentLabel}</span>
                  <ChevronRight
                    className={`w-4 h-4 text-gray-400 transition-transform ${showEnrollmentDropdown ? "rotate-90" : ""}`}
                  />
                </button>
                {showEnrollmentDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                    {ENROLLMENT_STATUS_OPTIONS.map((option) => (
                      <div
                        key={option.key}
                        onClick={() => {
                          setFilters({ ...filters, enrollment_status: option.key });
                          setShowEnrollmentDropdown(false);
                          setTimeout(handleSearch, 100);
                        }}
                        className={`flex items-center justify-between px-3 py-2 cursor-pointer text-sm hover:bg-gray-100 ${filters.enrollment_status === option.key ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"}`}
                      >
                        <span>{option.label}</span>
                        {filters.enrollment_status === option.key && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
                        : selectedLabel(filterOptions.industries, filters.industry_ids)
                    }
                    onChange={(e) => {
                      setIndustrySearch(e.target.value);
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
                      onClick={() => setFilters({ ...filters, industry_ids: [] })}
                    >
                      Clear selection
                    </div>
                    {filteredIndustries.map((industry) => {
                      const checked = filters.industry_ids.includes(industry.id);
                      return (
                        <div
                          key={industry.id}
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${checked ? "bg-blue-50" : ""}`}
                          onClick={() => toggleFilterId("industry_ids", industry.id)}
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span>{industry.name}</span>
                            {checked && <CheckCircle className="w-4 h-4 text-green-600" />}
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
                {renderSelectedTags("industry_ids", filterOptions.industries)}
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
                        : selectedLabel(filterOptions.designations, filters.designation_ids)
                    }
                    onChange={(e) => {
                      setDesignationSearch(e.target.value);
                      closeAllDropdowns();
                      setShowDesignationDropdown(true);
                    }}
                    onFocus={() => {
                      closeAllDropdowns();
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
                      onClick={() => setFilters({ ...filters, designation_ids: [] })}
                    >
                      Clear selection
                    </div>
                    {filteredDesignations.map((designation) => {
                      const checked = filters.designation_ids.includes(designation.id);
                      return (
                        <div
                          key={designation.id}
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${checked ? "bg-blue-50" : ""}`}
                          onClick={() => toggleFilterId("designation_ids", designation.id)}
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span>{designation.name}</span>
                            {checked && <CheckCircle className="w-4 h-4 text-green-600" />}
                          </div>
                        </div>
                      );
                    })}
                    {designationSearch && filteredDesignations.length === 0 && (
                      <div className="px-3 py-2 text-gray-500 text-center border-t text-sm">
                        No designations found for "{designationSearch}"
                      </div>
                    )}
                  </div>
                )}
                {renderSelectedTags("designation_ids", filterOptions.designations)}
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
                        : selectedLabel(filterOptions.states, filters.state_ids)
                    }
                    onChange={(e) => {
                      setStateSearch(e.target.value);
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
                      onClick={() => setFilters({ ...filters, state_ids: [] })}
                    >
                      Clear selection
                    </div>
                    {filteredStates.map((state) => {
                      const checked = filters.state_ids.includes(state.id);
                      return (
                        <div
                          key={state.id}
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${checked ? "bg-blue-50" : ""}`}
                          onClick={() => toggleFilterId("state_ids", state.id)}
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span>{state.name}</span>
                            {checked && <CheckCircle className="w-4 h-4 text-green-600" />}
                          </div>
                        </div>
                      );
                    })}
                    {stateSearch && filteredStates.length === 0 && (
                      <div className="px-3 py-2 text-gray-500 text-center border-t text-sm">
                        No states found for "{stateSearch}"
                      </div>
                    )}
                  </div>
                )}
                {renderSelectedTags("state_ids", filterOptions.states)}
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
                      setCitySearch(e.target.value);
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
                      onClick={() => setFilters({ ...filters, city_ids: [] })}
                    >
                      Clear selection
                    </div>
                    {filteredCities.map((city) => {
                      const checked = filters.city_ids.includes(city.id);
                      return (
                        <div
                          key={city.id}
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${checked ? "bg-blue-50" : ""}`}
                          onClick={() => toggleFilterId("city_ids", city.id)}
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span>{city.name}</span>
                            {checked && <CheckCircle className="w-4 h-4 text-green-600" />}
                          </div>
                        </div>
                      );
                    })}
                    {citySearch && filteredCities.length === 0 && (
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
                        : selectedLabel(filterOptions.agents, filters.agent_ids)
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
                      onClick={() => setFilters({ ...filters, agent_ids: [] })}
                    >
                      Clear selection
                    </div>
                    {filteredAgents.map((agent) => {
                      const checked = filters.agent_ids.includes(agent.id);
                      return (
                        <div
                          key={agent.id}
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between ${checked ? "bg-blue-50" : ""}`}
                          onClick={() => toggleFilterId("agent_ids", agent.id)}
                        >
                          <span>{agent.name}</span>
                          {checked && <CheckCircle className="w-4 h-4 text-green-600" />}
                        </div>
                      );
                    })}
                  </div>
                )}
                {renderSelectedTags("agent_ids", filterOptions.agents)}
              </div>

              {/* Staff (RM) Filter */}
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
                        : selectedLabel(filterOptions.rms, filters.rm_ids)
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
                      onClick={() => setFilters({ ...filters, rm_ids: [] })}
                    >
                      Clear selection
                    </div>
                    {filteredStaff.map((staff) => {
                      const checked = filters.rm_ids.includes(staff.id);
                      return (
                        <div
                          key={staff.id}
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between ${checked ? "bg-blue-50" : ""}`}
                          onClick={() => toggleFilterId("rm_ids", staff.id)}
                        >
                          <span>{staff.name}</span>
                          {checked && <CheckCircle className="w-4 h-4 text-green-600" />}
                        </div>
                      );
                    })}
                  </div>
                )}
                {renderSelectedTags("rm_ids", filterOptions.rms)}
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
                <SortableHeader
                  label="Worker Name & Code"
                  sortKey="worker_name"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Designation"
                  sortKey="designation"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Work Location"
                  sortKey="work_location"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="State"
                  sortKey="state"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Status
                </th>
                <SortableHeader
                  label="Registration Date"
                  sortKey="created_at"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Face Enrollment"
                  sortKey="enrolled_at"
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
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : workers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500">
                    <div className="flex flex-col items-center">
                      <ScanFace className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-600">
                        No workers found.
                      </p>
                      <p className="text-sm mt-1 text-gray-400">
                        Try adjusting your filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                workers.map((worker, index) => (
                  <motion.tr
                    key={worker.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {worker.worker_name} - {worker.worker_code || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {(Array.isArray(worker.designations) &&
                      worker.designations.length > 0
                        ? worker.designations.map((d) => d.name).join(", ")
                        : worker.designation) || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {worker.work_location || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {worker.current_state_name || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${worker.status === "active" || worker.status === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {worker.status === "active" || worker.status === 1
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {worker.date_of_registration
                        ? new Date(worker.date_of_registration).toLocaleDateString(
                            "en-IN",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {worker.is_enrolled ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex w-fit items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Enrolled
                          </span>
                          {worker.enrolled_at && (
                            <span className="text-xs text-gray-400">
                              {new Date(worker.enrolled_at).toLocaleDateString(
                                "en-IN",
                                { day: "2-digit", month: "short", year: "numeric" },
                              )}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Not Enrolled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {canEnroll ? (
                        <button
                          onClick={() => openEnrollModal(worker)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition ${worker.is_enrolled ? "bg-gray-700 hover:bg-gray-800" : "bg-blue-600 hover:bg-blue-700"}`}
                        >
                          <ScanFace className="w-4 h-4" />
                          {worker.is_enrolled ? "Update Face" : "Enroll Face"}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">
                          No permission
                        </span>
                      )}
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
            if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
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

      {/* ENROLL FACE MODAL */}
      {enrollingWorker && (
        <FaceScanner
          onCapture={handleCapture}
          onClose={closeEnrollModal}
          labels={{
            submitting: enrollingWorker.is_enrolled
              ? `Updating ${enrollingWorker.worker_name}'s face…`
              : `Enrolling ${enrollingWorker.worker_name}'s face…`,
            success: enrollingWorker.is_enrolled
              ? "Face updated ✓"
              : "Face enrolled ✓",
            failure: "We couldn't enroll that photo. Please try again.",
          }}
        />
      )}
    </motion.div>
  );
};

export default FaceEnrollListing;
