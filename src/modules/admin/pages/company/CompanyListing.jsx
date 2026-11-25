"use client";

import { motion } from "framer-motion";
import {
  Edit2,
  Trash2,
  Plus,
  Eye,
  CheckCircle,
  Download,
  Building2,
  Filter,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  XCircle,
  Ban,
  MapPin,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "@/lib/navigation";
import { useState, useEffect, useRef } from "react";
import { containerVariants, itemVariants, tableRowVariants } from "../../../../common/utils/motionVariants";
import { useCompanyListing } from "../../adminhooks/useCompanyListing";
import CompanyViewModal from "../../components/company/CompanyViewModal";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import SortableHeader from "../../../../common/components/SortableHeader";
import DateRangeDropdown from "../../../../common/components/DateRangeDropdown.jsx";
import { useDateRangeFilter } from "../../../../common/hooks/useDateRangeFilter";
import { getIndustriesAPI } from "../../../../api/adminV1/masterdataAPI";
import { getStatesAPI, getCitiesAPI } from "../../../../api/adminV1/geographyAPI";
import { COMPANY_STATUSES } from "../../../../api/adminV1/companyAPI";
import { formatDate, asList } from "../../utils/workerUtils";
import { COMPANY_STATUS_META, companyStatusLabel, statusActions } from "../../utils/companyUtils";
import ActionMenuPortal from "../../../../common/components/ActionMenuPortal";
import { MultiFilter, SelectFilter } from "../../components/worker/ListingFilters";

const STATUS_FILTER_OPTIONS = [{ key: "", label: "All Status" }].concat(
  COMPANY_STATUSES.map((s) => ({ key: s, label: companyStatusLabel(s) })),
);

const STATUS_OPTIONS = [{ key: "", label: "All Companies" }].concat(
  COMPANY_STATUSES.map((s) => ({ key: s, label: `${companyStatusLabel(s)} Companies` })),
);

const GST_OPTIONS = [
  { key: "", label: "GST: All" },
  { key: "true", label: "GST Verified" },
  { key: "false", label: "GST Not Verified" },
];

const ACTION_ICONS = { ACTIVE: CheckCircle, SUSPENDED: Ban, REJECTED: XCircle, PENDING_VERIFICATION: RotateCcw };

const CompanyListing = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  const {
    companies,
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
    toggleSelect,
    toggleSelectAll,
    patchRow,
    refresh,
    handleStatusChange,
    handleDelete,
    handleBulkStatus,
    handleBulkDelete,
    handleExport,
    handleBulkExport,
  } = useCompanyListing();

  const { dateRange, applyPreset, setCustomRange, presets, formatDateForDisplay } = useDateRangeFilter();
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [viewCompanyId, setViewCompanyId] = useState(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);
  const statusRef = useRef(null);
  const bulkActionRef = useRef(null);

  const [industries, setIndustries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    Promise.allSettled([getIndustriesAPI(), getStatesAPI()]).then(([ind, st]) => {
      setIndustries(ind.status === "fulfilled" ? asList(ind.value) : []);
      setStates(st.status === "fulfilled" ? asList(st.value) : []);
    });
  }, []);

  // City options = cities of the selected states; picked cities outside them are dropped.
  const stateKey = filters.stateIds.join(",");
  useEffect(() => {
    let cancelled = false;
    const ids = stateKey ? stateKey.split(",") : [];
    if (ids.length === 0) {
      setCities([]);
      setFilters((prev) => (prev.cityIds.length ? { ...prev, cityIds: [] } : prev));
      return;
    }
    Promise.all(ids.map((id) => getCitiesAPI(id).catch(() => []))).then((lists) => {
      if (cancelled) return;
      const all = lists.flatMap(asList);
      const allowed = new Set(all.map((c) => c.id));
      setCities(all);
      setFilters((prev) =>
        prev.cityIds.every((id) => allowed.has(id))
          ? prev
          : { ...prev, cityIds: prev.cityIds.filter((id) => allowed.has(id)) },
      );
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateKey]);

  useEffect(() => {
    const onDown = (e) => {
      if (statusRef.current && !statusRef.current.contains(e.target)) setShowStatusDropdown(false);
      if (bulkActionRef.current && !bulkActionRef.current.contains(e.target)) setShowBulkDropdown(false);
      if (!e.target.closest(".action-menu-container")) setOpenActionMenuId(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const canView = hasPermission("company", "view");
  const canCreate = hasPermission("company", "create");
  const canEdit = hasPermission("company", "edit");
  const canDelete = hasPermission("company", "delete");
  const canExport = hasPermission("company", "export");
  const canManageStatus = hasPermission("company", "manage_status");

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const handleDateRangeChange = (range) => {
    if (range.preset === "custom") setCustomRange(range.from, range.to);
    else applyPreset(range.preset);
    setFilters((prev) => ({ ...prev, createdFrom: range.from || "", createdTo: range.to || "" }));
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

  if (!permissionsLoading && !canView) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <Building2 className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to view companies.</p>
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

  const industryName = (id) => industries.find((i) => i.id === id)?.name || "—";
  const statusOption = STATUS_OPTIONS.find((o) => o.key === filters.status) || STATUS_OPTIONS[0];
  const hasBulkActions = canManageStatus || canExport || canDelete;

  const BULK_STATUS = [
    { status: "ACTIVE", label: "Approve / Activate", verb: "set to Active", icon: CheckCircle, tone: "hover:bg-green-50 hover:text-green-700" },
    { status: "SUSPENDED", label: "Suspend", verb: "suspended", icon: Ban, tone: "hover:bg-orange-50 hover:text-orange-700" },
    { status: "REJECTED", label: "Reject", verb: "rejected", icon: XCircle, tone: "hover:bg-red-50 hover:text-red-700" },
  ];

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
                  {filters.status ? statusOption.label : "Company List"}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold whitespace-nowrap">
                  <Building2 className="w-3.5 h-3.5" />
                  {totalRecords} Total
                </span>
              </span>
              <ChevronRight
                className={`w-5 h-5 !stroke-[3px] stroke-black transition-transform ${showStatusDropdown ? "rotate-90" : ""}`}
              />
            </button>
            {showStatusDropdown && (
              <div className="absolute left-0 mt-2 w-full sm:w-64 md:w-72 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
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
                    {canManageStatus &&
                      BULK_STATUS.map(({ status, label, verb, icon: Icon, tone }, i) => (
                        <button
                          key={status}
                          onClick={() => {
                            setShowBulkDropdown(false);
                            handleBulkStatus(status, label, verb);
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-gray-700 ${tone} ${i ? "border-t border-gray-100" : ""}`}
                        >
                          <Icon size={16} />
                          {label}
                        </button>
                      ))}
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
                  placeholder="Search name or company code..."
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
                    <span className="hidden sm:inline">Export Excel</span>
                    <span className="sm:hidden">Export</span>
                  </>
                )}
              </button>
            )}
            {canCreate && (
              <button
                onClick={() => navigate("/admin/company/add")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add New Company</span>
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
                width="w-52"
              />
              <SelectFilter
                options={GST_OPTIONS}
                value={filters.gstVerified}
                onChange={(v) => setFilter("gstVerified", v)}
                width="w-44"
              />
              <MultiFilter
                icon={Building2}
                placeholder="Search industry"
                options={industries}
                selected={filters.industryIds}
                onChange={(v) => setFilter("industryIds", v)}
              />
              <MultiFilter
                icon={MapPin}
                placeholder="Search state"
                options={states}
                selected={filters.stateIds}
                onChange={(v) => setFilter("stateIds", v)}
              />
              <MultiFilter
                icon={MapPin}
                placeholder={filters.stateIds.length ? "Search city" : "Select state first"}
                options={cities}
                selected={filters.cityIds}
                onChange={(v) => setFilter("cityIds", v)}
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
                    checked={companies.length > 0 && selectedIds.length === companies.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  />
                </th>
                <SortableHeader label="Company Name" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader label="Company Code" sortKey="companyCode" sortConfig={sortConfig} onSort={handleSort} />
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Industry</th>
                <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader label="Created On" sortKey="createdAt" sortConfig={sortConfig} onSort={handleSort} />
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">
                    <div className="flex flex-col items-center">
                      <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-600">No companies found.</p>
                      {canCreate && (
                        <p className="text-sm mt-1 text-gray-400">
                          Add your first company by clicking "Add New Company" above.
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                companies.map((company, index) => (
                  <motion.tr
                    key={company.id}
                    className="cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setViewCompanyId(company.id)}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(company.id)}
                        onChange={() => toggleSelect(company.id)}
                        className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{company.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{company.companyCode}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{industryName(company.industryId)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${COMPANY_STATUS_META[company.status]?.className || "bg-gray-100 text-gray-700"}`}
                      >
                        {companyStatusLabel(company.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{formatDate(company.createdAt)}</td>
                    <td onClick={(e) => e.stopPropagation()} className="px-6 py-4 cursor-auto">
                      <div className="relative inline-block action-menu-container">
                        <button
                          onClick={() => setOpenActionMenuId(openActionMenuId === company.id ? null : company.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                          title="Actions"
                        >
                          <MoreVertical size={18} />
                        </button>
                        {openActionMenuId === company.id && (
                          <ActionMenuPortal className="w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden text-left">
                            <button
                              onClick={() => {
                                setOpenActionMenuId(null);
                                setViewCompanyId(company.id);
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
                                  navigate(`/admin/company/edit/${company.id}`);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit2 size={16} />
                                Edit Company
                              </button>
                            )}
                            {canManageStatus &&
                              statusActions(company.status).map((action, i) => {
                                const Icon = ACTION_ICONS[action.status] || CheckCircle;
                                return (
                                  <button
                                    key={action.status}
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleStatusChange(company, action);
                                    }}
                                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm ${i === 0 ? "border-t border-gray-100" : ""} ${
                                      action.danger ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"
                                    }`}
                                  >
                                    <Icon size={16} />
                                    {action.label}
                                  </button>
                                );
                              })}
                            {canDelete && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  handleDelete(company);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                              >
                                <Trash2 size={16} />
                                Delete Company
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
      {companies.length > 0 && (
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

      <CompanyViewModal
        companyId={viewCompanyId}
        isOpen={!!viewCompanyId}
        onClose={() => setViewCompanyId(null)}
        onCompanyChanged={(updated) => (updated ? patchRow(updated) : refresh())}
        industries={industries}
      />
    </motion.div>
  );
};

export default CompanyListing;
