"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@/lib/navigation";
import {
  CopyPlus,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Banknote,
  ChevronRight,
  ChevronDown,
  X,
  ClipboardList,
  SearchCheck,
  History,
} from "lucide-react";
import {
  containerVariants,
  itemVariants,
  tableRowVariants,
} from "../../../../common/utils/motionVariants";
import { useMinimumWageManagement } from "../../adminhooks/useMinimumWageManagement";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import Loader from "../../../../common/components/Loader";
import SortableHeader from "../../../../common/components/SortableHeader";
import MultiSelectDropdown from "../../../../common/components/MultiSelectDropdown";
import {
  getEffectiveMinimumWageRateAPI,
  getMinimumWageRateAPI,
  getMinimumWageRatesAPI,
} from "../../../../api/adminV1/masterdataAPI";
import { apiError } from "../../../../api/javaApi";

const formatDate = (dateString) => {
  if (!dateString) return "Not Provided";
  // effectiveFrom is a plain YYYY-MM-DD date — format it without a timezone shift
  const [y, m, d] = String(dateString).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const today = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const selectClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";

// ====================== EFFECTIVE RATE LOOKUP ======================
// Which version actually applied for a state + skill category on a given date.
const EffectiveRateLookup = ({ states, skillCategories }) => {
  const [query, setQuery] = useState({ stateId: "", skillCategoryId: "", asOf: today() });
  const [result, setResult] = useState(null); // { rate } | { message }
  const [checking, setChecking] = useState(false);

  const update = (key, value) => {
    setQuery((prev) => ({ ...prev, [key]: value }));
    setResult(null);
  };

  const check = async () => {
    setChecking(true);
    try {
      const rate = await getEffectiveMinimumWageRateAPI(query);
      setResult({ rate });
    } catch (error) {
      const { code, message } = apiError(error);
      setResult({
        message:
          code === "RESOURCE_NOT_FOUND"
            ? "No rate is configured for this state and skill category on that date."
            : message,
      });
    } finally {
      setChecking(false);
    }
  };

  const ready = query.stateId && query.skillCategoryId && query.asOf;

  return (
    <motion.div
      className="bg-white p-4 mb-4 rounded-2xl border border-gray-200 shadow-sm"
      variants={itemVariants}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 whitespace-nowrap">
          <SearchCheck className="w-4 h-4 text-blue-600" />
          Rate in force on
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          <select
            value={query.stateId}
            onChange={(e) => update("stateId", e.target.value)}
            className={selectClass}
          >
            <option value="">Select state</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={query.skillCategoryId}
            onChange={(e) => update("skillCategoryId", e.target.value)}
            className={selectClass}
          >
            <option value="">Select skill category</option>
            {skillCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={query.asOf}
            onChange={(e) => update("asOf", e.target.value)}
            className={selectClass}
          />
        </div>
        <button
          onClick={check}
          disabled={!ready || checking}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 whitespace-nowrap"
        >
          {checking ? "Checking..." : "Check"}
        </button>
      </div>
      {result && (
        <p className="mt-3 text-sm text-gray-700">
          {result.rate ? (
            <>
              <span className="font-semibold">{result.rate.minDailyRate}/day</span>, effective
              from {formatDate(result.rate.effectiveFrom)}.
            </>
          ) : (
            <span className="text-amber-700">{result.message}</span>
          )}
        </p>
      )}
    </motion.div>
  );
};

// ====================== RATE PHASE ======================
// Minimum wage versions are effective-dated, so an ACTIVE version is shown by
// where it sits in time rather than as "Active":
//   Upcoming - effectiveFrom is after today
//   Current  - the latest ACTIVE version already in force (effectiveFrom <= today)
//   Past     - an older ACTIVE version, replaced by the current one
// An INACTIVE (retracted) version stays "Inactive".
const PHASE_META = {
  CURRENT: { label: "Current", className: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" },
  UPCOMING: { label: "Upcoming", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" },
  PAST: { label: "Past", className: "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300" },
  INACTIVE: { label: "Inactive", className: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" },
};

// { [versionId]: "CURRENT" | "UPCOMING" | "PAST" | "INACTIVE" } for one
// state + skill category. effectiveFrom is YYYY-MM-DD, so strings compare.
const phasesOf = (versions, asOf = today()) => {
  const phases = {};
  const inForce = versions
    .filter((v) => v.status === "ACTIVE" && v.effectiveFrom <= asOf)
    .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1));
  const currentId = inForce[0]?.id;
  versions.forEach((v) => {
    if (v.status !== "ACTIVE") phases[v.id] = "INACTIVE";
    else if (v.effectiveFrom > asOf) phases[v.id] = "UPCOMING";
    else phases[v.id] = v.id === currentId ? "CURRENT" : "PAST";
  });
  return phases;
};

// Phase of a single version when the history isn't loaded (yet): by date only.
const fallbackPhase = (rate) => {
  if (rate.status !== "ACTIVE") return "INACTIVE";
  return rate.effectiveFrom > today() ? "UPCOMING" : "CURRENT";
};

const PhaseBadge = ({ phase }) => {
  const meta = PHASE_META[phase] || PHASE_META.INACTIVE;
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.className}`}>
      {meta.label}
    </span>
  );
};

// Every version for one state + skill category (newest first), from the
// history endpoint filtered to that pair.
const useRateHistory = (rate) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setVersions([]);
    if (!rate?.stateId || !rate?.skillCategoryId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    getMinimumWageRatesAPI({
      stateIds: [rate.stateId],
      skillCategoryIds: [rate.skillCategoryId],
      page: 0,
      size: 100,
      sort: "effectiveFrom,desc",
    })
      .then((res) => !cancelled && setVersions(res?.content || []))
      .catch((err) => !cancelled && setError(apiError(err).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [rate?.stateId, rate?.skillCategoryId]);

  return { versions, loading, error };
};

// ====================== RATE HISTORY ======================
const RateHistory = ({ rate, versions, loading, error, phases }) => (
  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 mt-4">
    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
      <History className="text-amber-500" />
      <span className="ml-2">Rate History</span>
      {loading && (
        <span className="ml-3 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
      )}
    </h4>
    {error ? (
      <p className="text-sm text-red-600">{error}</p>
    ) : !loading && versions.length === 0 ? (
      <p className="text-sm text-slate-500">No versions found.</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-600">
              <th className="py-2 pr-4 font-medium">Effective From</th>
              <th className="py-2 pr-4 font-medium">Min. Daily Rate</th>
              <th className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {versions.map((v) => {
              const viewing = v.id === rate.id;
              return (
                <tr
                  key={v.id}
                  className={`border-b border-slate-100 dark:border-slate-700 ${
                    viewing ? "font-semibold text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <td className="py-2 pr-4 whitespace-nowrap">{formatDate(v.effectiveFrom)}</td>
                  <td className="py-2 pr-4">{v.minDailyRate}</td>
                  <td className="py-2">
                    <PhaseBadge phase={phases[v.id] || fallbackPhase(v)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

// ====================== VIEW MODAL ======================
const MinimumWageViewModal = ({ rate, isOpen, onClose, onEdit, detailsLoading }) => {
  const history = useRateHistory(isOpen ? rate : null);
  const phases = phasesOf(history.versions);
  const phase = rate ? phases[rate.id] || fallbackPhase(rate) : null;

  return (
    <AnimatePresence>
      {isOpen && rate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          >
            <div className="sticky top-0 bg-white dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                    <Banknote className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {rate.stateName} &middot; {rate.skillCategoryName}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        Rate: {rate.minDailyRate}/day
                      </span>
                      <PhaseBadge phase={phase} />
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
                  <ClipboardList className="text-indigo-500" />
                  <span className="ml-2">Rate Information</span>
                  {detailsLoading && (
                    <span className="ml-3 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                  )}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      State
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                      {rate.stateName || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Skill Category
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                      {rate.skillCategoryName || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Minimum Daily Rate
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                      {rate.minDailyRate}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Status
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                      {PHASE_META[phase]?.label}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Effective From
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                      {formatDate(rate.effectiveFrom)}
                    </span>
                  </div>
                </div>
              </div>
              <RateHistory rate={rate} phases={phases} {...history} />
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-slate-800 px-6 py-4 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                >
                  Close
                </button>
                {onEdit && (
                  <button
                    onClick={() => {
                      onClose();
                      onEdit(rate);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <CopyPlus className="w-4 h-4" />
                    New Version
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
// ====================== END MODAL ======================

const MinimumWageListing = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  const {
    rates,
    loading,
    page,
    totalPages,
    totalRecords,
    pageSize,
    filters,
    updateFilter,
    setPage,
    handleClear,
    handleToggleStatus,
    states,
    skillCategories,
    selectedIds,
    toggleSelectRate,
    toggleSelectAll,
    handleBulkActivate,
    handleBulkDeactivate,
    sortConfig,
    handleSort,
  } = useMinimumWageManagement();

  const [selectedRate, setSelectedRate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDetailsLoading, setModalDetailsLoading] = useState(false);
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);
  const bulkActionRef = useRef(null);

  const handleClickOutside = useCallback((event) => {
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

  const openViewModal = async (rate) => {
    setSelectedRate(rate);
    setIsModalOpen(true);
    setModalDetailsLoading(true);
    try {
      // Refresh from the single-rate endpoint in case it changed since the list loaded
      setSelectedRate(await getMinimumWageRateAPI(rate.id));
    } catch {
      // Keep showing the row from the list
    } finally {
      setModalDetailsLoading(false);
    }
  };

  const closeViewModal = () => {
    setSelectedRate(null);
    setIsModalOpen(false);
  };

  const canView = hasPermission("minimum_wage", "view");
  const canCreate = hasPermission("minimum_wage", "create");
  const canToggleStatus = hasPermission("minimum_wage", "toggle_status");

  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <Banknote className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view minimum wage rates.
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
      {/* Header with status dropdown and filters */}
      <motion.div
        className="bg-white p-4 mb-4 rounded-2xl border border-gray-200 shadow-sm"
        variants={itemVariants}
      >
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2">
            <span className="text-2xl !font-bold text-gray-800">
              Minimum Wage
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold whitespace-nowrap">
              <Banknote className="w-3.5 h-3.5" />
              {totalRecords} Total
            </span>
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
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="w-full sm:w-48">
                  <MultiSelectDropdown
                    options={states}
                    selectedIds={filters.stateIds}
                    onChange={(ids) => updateFilter("stateIds", ids)}
                    placeholder="All States"
                  />
                </div>

                <div className="w-full sm:w-48">
                  <MultiSelectDropdown
                    options={skillCategories}
                    selectedIds={filters.skillCategoryIds}
                    onChange={(ids) => updateFilter("skillCategoryIds", ids)}
                    placeholder="All Skill Categories"
                  />
                </div>

                <div className="w-full sm:w-40">
                  <select
                    value={filters.status}
                    onChange={(e) => updateFilter("status", e.target.value)}
                    className={selectClass}
                  >
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                {(filters.stateIds.length > 0 ||
                  filters.skillCategoryIds.length > 0 ||
                  filters.status) && (
                  <button
                    onClick={handleClear}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
              </>
            )}

            {canCreate && (
              <button
                onClick={() => navigate("/admin/minimum-wage/add")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Minimum Wage</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <EffectiveRateLookup states={states} skillCategories={skillCategories} />

      {/* Table */}
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
                      rates.length > 0 && selectedIds.length === rates.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  State
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Skill Category
                </th>
                <SortableHeader
                  label="Min. Daily Rate"
                  sortKey="minDailyRate"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Effective From"
                  sortKey="effectiveFrom"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
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
                  <td colSpan="7" className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : rates.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-500">
                    No minimum wage rates found.
                  </td>
                </tr>
              ) : (
                rates.map((rate, index) => (
                  <motion.tr
                    key={rate.id}
                    className="cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.05 }}
                    onClick={() => openViewModal(rate)}
                  >
                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-4 cursor-auto"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(rate.id)}
                        onChange={() => toggleSelectRate(rate.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {rate.stateName || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {rate.skillCategoryName || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {rate.minDailyRate}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {formatDate(rate.effectiveFrom)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          rate.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {rate.status === "ACTIVE" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="px-6 py-4 cursor-auto"
                    >
                      <div className="flex gap-2 flex-wrap">
                        {canView && (
                          <button
                            onClick={() => openViewModal(rate)}
                            className="text-gray-600 hover:text-blue-600"
                            title="View"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                        {canCreate && (
                          <button
                            onClick={() =>
                              navigate(`/admin/minimum-wage/edit/${rate.id}`)
                            }
                            className="text-gray-600 hover:text-green-600"
                            title="New version (rates can't be edited)"
                          >
                            <CopyPlus size={18} />
                          </button>
                        )}
                        {canToggleStatus && (
                          <button
                            onClick={() =>
                              handleToggleStatus(rate.id, rate.status)
                            }
                            className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${
                              rate.status === "ACTIVE"
                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                            title={
                              rate.status === "ACTIVE" ? "Deactivate" : "Activate"
                            }
                          >
                            {rate.status === "ACTIVE" ? (
                              <>
                                <XCircle size={14} />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle size={14} />
                                Activate
                              </>
                            )}
                          </button>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div className="flex items-center justify-center space-x-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition ${
              page === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-black hover:text-white"
            }`}
          >
            Prev
          </button>
          {[...Array(totalPages)].map((_, idx) => {
            const p = idx + 1;
            if (
              p === 1 ||
              p === totalPages ||
              (p >= page - 1 && p <= page + 1)
            ) {
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border text-sm shadow-sm transition ${
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
            className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition ${
              page === totalPages
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-black hover:text-white"
            }`}
          >
            Next
          </button>
        </motion.div>
      )}

      {/* View Modal */}
      {canView && (
        <MinimumWageViewModal
          rate={selectedRate}
          isOpen={isModalOpen}
          onClose={closeViewModal}
          onEdit={
            canCreate ? (rate) => navigate(`/admin/minimum-wage/edit/${rate.id}`) : null
          }
          detailsLoading={modalDetailsLoading}
        />
      )}
    </motion.div>
  );
};

export default MinimumWageListing;
