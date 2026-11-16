"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  Edit2,
  Trash2,
  Plus,
  Eye,
  CheckCircle,
  User,
  Download,
  Building2,
  Filter,
  ChevronRight,
  ChevronDown,
  MessageCircle,
  MoreVertical,
  X,
  XCircle,
  ScanFace,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "@/lib/navigation";
import { useState, useEffect, useRef } from "react";
import {
  containerVariants,
  itemVariants,
  tableRowVariants,
} from "../../../../common/utils/motionVariants";
import { useWorkerListing } from "../../adminhooks/useWorkerListing";
import WorkerViewModal from "../../components/worker/ViewWorkerModal";
import WorkerCommentsModal from "../../components/worker/WorkerCommentsModal";
import WorkerFaceScanner, { confirmFaceConsent } from "../../components/worker/WorkerFaceScanner";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import SortableHeader from "../../../../common/components/SortableHeader";
import DateRangeDropdown from "../../../../common/components/DateRangeDropdown.jsx";
import { useDateRangeFilter } from "../../../../common/hooks/useDateRangeFilter";
import {
  getDepartmentsAPI,
  getIndustriesAPI,
  getDesignationsAPI,
} from "../../../../api/adminV1/masterdataAPI";
import { WORKER_STATUSES, KYC_STATUSES } from "../../../../api/adminV1/workerAPI";
import { STATUS_META, KYC_META, statusLabel, kycLabel, formatDate, asList } from "../../utils/workerUtils";

import ActionMenuPortal from "../../../../common/components/ActionMenuPortal";
import { MultiFilter, SelectFilter } from "../../components/worker/ListingFilters";

const STATUS_FILTER_OPTIONS = [{ key: "", label: "All Status" }].concat(
  WORKER_STATUSES.map((s) => ({ key: s, label: statusLabel(s) })),
);

const STATUS_OPTIONS = [{ key: "", label: "All Workers" }].concat(
  WORKER_STATUSES.map((s) => ({ key: s, label: `${statusLabel(s)} Workers` })),
);

const WorkerListing = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  const {
    workers,
    loading,
    page,
    setPage,
    totalPages,
    totalRecords,
    filters,
    setFilters,
    sortConfig,
    handleSort,
    handleClear,
    selectedIds,
    toggleSelectWorker,
    toggleSelectAll,
    patchRow,
    refresh,
    handleActivate,
    handleDeactivate,
    handleDelete,
    handleBulkActivate,
    handleBulkDeactivate,
    handleBulkDelete,
    handleExport,
    handleBulkExport,
  } = useWorkerListing();

  const { dateRange, applyPreset, setCustomRange, presets, formatDateForDisplay } = useDateRangeFilter();
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [viewWorkerId, setViewWorkerId] = useState(null);
  const [notesWorker, setNotesWorker] = useState(null);
  const [faceWorker, setFaceWorker] = useState(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);
  const statusRef = useRef(null);
  const bulkActionRef = useRef(null);

  const [departments, setDepartments] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [designations, setDesignations] = useState([]);

  useEffect(() => {
    Promise.allSettled([getDepartmentsAPI(), getIndustriesAPI(), getDesignationsAPI()]).then(
      ([dep, ind, des]) => {
        setDepartments(dep.status === "fulfilled" ? asList(dep.value) : []);
        setIndustries(ind.status === "fulfilled" ? asList(ind.value) : []);
        setDesignations(des.status === "fulfilled" ? asList(des.value) : []);
      },
    );
  }, []);

  useEffect(() => {
    const onDown = (e) => {
      if (statusRef.current && !statusRef.current.contains(e.target)) setShowStatusDropdown(false);
      if (bulkActionRef.current && !bulkActionRef.current.contains(e.target)) setShowBulkDropdown(false);
      if (!e.target.closest(".action-menu-container")) setOpenActionMenuId(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const canView = hasPermission("workers", "view");
  const canCreate = hasPermission("workers", "create");
  const canEdit = hasPermission("workers", "edit");
  const canDelete = hasPermission("workers", "delete");
  const canExport = hasPermission("workers", "export");
  const canToggleStatus = hasPermission("workers", "toggle_status");
  const canViewComments = hasPermission("workers", "view_comments");
  const canEnrollFace = hasPermission("faceauth", "enroll");

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  // Registration date range -> registeredFrom / registeredTo (YYYY-MM-DD).
  const handleDateRangeChange = (range) => {
    if (range.preset === "custom") setCustomRange(range.from, range.to);
    else applyPreset(range.preset);
    setFilters((prev) => ({ ...prev, registeredFrom: range.from || "", registeredTo: range.to || "" }));
  };

  const handleClearAll = () => {
    handleClear();
    applyPreset("all");
  };

  const onExport = async () => {
    setIsExporting(true);
    try {
      await handleExport();
    } finally {
      setIsExporting(false);
    }
  };

  const startFaceEnroll = async (worker) => {
    const name = `${worker.firstName} ${worker.lastName}`;
    if (await confirmFaceConsent(name, !!worker.faceEnrolledAt)) setFaceWorker(worker);
  };

  if (!permissionsLoading && !canView) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <User className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to view workers.</p>
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

  const statusOption = STATUS_OPTIONS.find((o) => o.key === filters.status) || STATUS_OPTIONS[0];
  const kycOptions = KYC_STATUSES.map((s) => ({ id: s, name: kycLabel(s) }));
  const hasBulkActions = canToggleStatus || canExport || canDelete;

  return (
    <motion.div className="flex-1 bg-gray-50" initial="hidden" animate="visible" variants={containerVariants}>
      {/* HEADER */}
      <motion.div
        className={`bg-white p-4 border border-gray-200 shadow-sm ${filtersVisible ? "rounded-t-2xl border-b-0" : "mb-4 rounded-2xl"}`}
        variants={itemVariants}
      >
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
          <div ref={statusRef} className="relative w-full md:w-auto">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="flex w-full md:w-auto items-center justify-between gap-4 px-4 py-2 rounded-lg bg-white"
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="text-xl md:text-2xl !font-bold text-gray-800 truncate">
                  {filters.status ? statusOption.label : "Worker List"}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold whitespace-nowrap">
                  <User className="w-3.5 h-3.5" />
                  {totalRecords} Total
                </span>
              </span>
              <ChevronRight
                className={`w-5 h-5 !stroke-[3px] stroke-black transition-transform ${showStatusDropdown ? "rotate-90" : ""}`}
              />
            </button>
            {showStatusDropdown && (
              <div className="absolute left-0 mt-2 w-full sm:w-56 md:w-64 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {STATUS_OPTIONS.map((option) => (
                  <div
                    key={option.key || "all"}
                    onClick={() => {
                      setFilter("status", option.key);
                      setShowStatusDropdown(false);
                    }}
                    className={`flex items-center justify-between px-4 py-2 cursor-pointer text-sm hover:bg-gray-100 ${filters.status === option.key ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"}`}
                  >
                    <span>{option.label}</span>
                    {filters.status === option.key && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {selectedIds.length > 0 && hasBulkActions ? (
              <div ref={bulkActionRef} className="relative w-full sm:w-64">
                <button
                  onClick={() => setShowBulkDropdown(!showBulkDropdown)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                >
                  <span>{selectedIds.length} selected</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showBulkDropdown ? "rotate-180" : ""}`} />
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
                  placeholder="Search name, code, mobile, email..."
                  value={filters.search}
                  onChange={(e) => setFilter("search", e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {!filtersVisible && filters.search && (
                  <button
                    onClick={() => setFilter("search", "")}
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
                onClick={onExport}
                disabled={isExporting || loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${isExporting ? "bg-gray-400 cursor-not-allowed text-white" : "bg-green-600 hover:bg-green-700 text-white"}`}
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Exporting</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export CSV</span>
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

      {/* FILTERS */}
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
              <SelectFilter
                options={STATUS_FILTER_OPTIONS}
                value={filters.status}
                onChange={(v) => setFilter("status", v)}
              />
              <MultiFilter
                icon={Building2}
                placeholder="Search industry"
                options={industries}
                selected={filters.industryIds}
                onChange={(v) => setFilter("industryIds", v)}
              />
              <MultiFilter
                icon={Briefcase}
                placeholder="Search designation"
                options={designations}
                selected={filters.designationIds}
                onChange={(v) => setFilter("designationIds", v)}
              />
              <MultiFilter
                icon={ShieldCheck}
                placeholder="KYC status"
                options={kycOptions}
                selected={filters.kycStatuses}
                onChange={(v) => setFilter("kycStatuses", v)}
                width="w-44"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* TABLE */}
      <motion.div className="bg-white rounded-[22px] border border-[#DDDDDD] shadow-sm overflow-hidden" variants={itemVariants}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={workers.length > 0 && selectedIds.length === workers.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  />
                </th>
                <SortableHeader label="Worker Name & Code" sortKey="firstName" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader label="Mobile" sortKey="mobileNumber" sortConfig={sortConfig} onSort={handleSort} />
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Designation</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">KYC</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Face</th>
                <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
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
                      <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-600">No workers found.</p>
                      <p className="text-sm mt-1 text-gray-400">
                        Create your first worker by clicking "Add New Worker" above.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                workers.map((worker, index) => (
                  <motion.tr
                    key={worker.id}
                    className="cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setViewWorkerId(worker.id)}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(worker.id)}
                        onChange={() => toggleSelectWorker(worker.id)}
                        className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {worker.firstName} {worker.lastName} - {worker.workerCode}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{worker.mobileNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{worker.primaryDesignationName || "N/A"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${KYC_META[worker.kycStatus]?.className || "bg-gray-100 text-gray-600"}`}
                      >
                        {kycLabel(worker.kycStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {worker.faceEnrolledAt ? (
                        <span className="inline-flex flex-col">
                          <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                            <CheckCircle className="w-4 h-4" /> Enrolled
                          </span>
                          <span className="text-xs text-gray-500">{formatDate(worker.faceEnrolledAt)}</span>
                        </span>
                      ) : (
                        <span className="text-gray-500">Not Enrolled</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_META[worker.status]?.className || "bg-gray-100 text-gray-700"}`}
                      >
                        {statusLabel(worker.status)}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()} className="px-6 py-4 cursor-auto">
                      <div className="relative inline-block action-menu-container">
                        <button
                          onClick={() => setOpenActionMenuId(openActionMenuId === worker.id ? null : worker.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                          title="Actions"
                        >
                          <MoreVertical size={18} />
                        </button>
                        {openActionMenuId === worker.id && (
                          <ActionMenuPortal className="w-52 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden text-left">
                            <button
                              onClick={() => {
                                setOpenActionMenuId(null);
                                setViewWorkerId(worker.id);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Eye size={16} />
                              View Details
                            </button>
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
                            {canViewComments && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  setNotesWorker(worker);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <MessageCircle size={16} />
                                Admin Notes
                              </button>
                            )}
                            {canEnrollFace && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  startFaceEnroll(worker);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <ScanFace size={16} />
                                {worker.faceEnrolledAt ? "Re-enroll Face" : "Enroll Face"}
                              </button>
                            )}
                            {canToggleStatus && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  if (worker.status === "ACTIVE") handleDeactivate(worker);
                                  else handleActivate(worker);
                                }}
                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm border-t border-gray-100 ${
                                  worker.status === "ACTIVE"
                                    ? "text-red-600 hover:bg-red-50"
                                    : "text-green-600 hover:bg-green-50"
                                }`}
                              >
                                {worker.status === "ACTIVE" ? (
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
                                  handleDelete(worker);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                              >
                                <Trash2 size={16} />
                                Delete Worker
                              </button>
                            )}
                          </ActionMenuPortal>
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

      {/* MODALS */}
      <WorkerViewModal
        workerId={viewWorkerId}
        isOpen={!!viewWorkerId}
        onClose={() => setViewWorkerId(null)}
        onWorkerChanged={(updated) => (updated ? patchRow(updated) : refresh())}
        departments={departments}
        industries={industries}
      />
      {canViewComments && (
        <WorkerCommentsModal
          isOpen={!!notesWorker}
          onClose={() => setNotesWorker(null)}
          workerId={notesWorker?.id}
          workerName={notesWorker ? `${notesWorker.firstName} ${notesWorker.lastName}` : ""}
          canAdd={canEdit}
        />
      )}
      {faceWorker && (
        <WorkerFaceScanner
          worker={faceWorker}
          workerName={`${faceWorker.firstName} ${faceWorker.lastName}`}
          reEnroll={!!faceWorker.faceEnrolledAt}
          onClose={() => setFaceWorker(null)}
          onEnrolled={(enrollment) =>
            patchRow({ ...faceWorker, faceEnrollment: enrollment })
          }
        />
      )}
    </motion.div>
  );
};

export default WorkerListing;
