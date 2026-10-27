"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@/lib/navigation";
import {
  Edit2,
  Trash2,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Briefcase,
  ChevronRight,
  ChevronDown,
  X,
  Edit,
  ClipboardList,
  Building2,
  Wrench,
  MoreVertical,
  Image as ImageIcon,
} from "lucide-react";
import {
  containerVariants,
  itemVariants,
  tableRowVariants,
} from "../../../../common/utils/motionVariants";
import { useDesignationListManagement } from "../../adminhooks/useDesignationListManagement";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import Loader from "../../../../common/components/Loader";
import SortableHeader from "../../../../common/components/SortableHeader";

// ====================== VIEW MODAL ======================
const DesignationViewModal = ({ designation, isOpen, onClose, onEdit }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "Not Provided";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderStatus = () => {
    const isActive = Number(designation.status) === 1;
    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
          isActive
            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
            : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
        }`}
      >
        {isActive ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <XCircle className="w-3 h-3" />
        )}
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  const renderIndustries = () => {
    if (!designation.industries || designation.industries.length === 0) {
      return (
        <div className="text-center py-4">
          <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 dark:text-slate-400">
            No industries assigned
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {designation.industries.map((industry) => (
          <span
            key={industry.id}
            className="px-3 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-full text-sm font-medium text-slate-900 dark:text-slate-100"
          >
            {industry.name}
          </span>
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && designation && (
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
            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
          >
            <div className="sticky top-0 bg-white dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    {designation.image_url ? (
                      <img
                        src={designation.image_url}
                        alt={designation.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Briefcase className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {designation.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {renderStatus()}
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

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
                  <ClipboardList className="text-indigo-500" />
                  <span className="ml-2">Designation Information</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Skill Category
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                      {designation.skill_category?.name || "Not assigned"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Created At
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                      {formatDate(designation.created_at)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Last Updated
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                      {formatDate(designation.updated_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
                  <Building2 className="text-purple-500" />
                  <span className="ml-2">Industries</span>
                </h4>
                {renderIndustries()}
              </div>
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
                      onEdit(designation);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
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

const DesignationListing = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  const {
    designations,
    loading,
    page,
    totalPages,
    totalRecords,
    filters,
    setFilters,
    setPage,
    handleSearch,
    handleDelete,
    handleToggleStatus,
    industries,
    selectedIds,
    toggleSelectDesignation,
    toggleSelectAll,
    handleBulkActivate,
    handleBulkDeactivate,
    handleBulkDelete,
    sortConfig,
    handleSort,
  } = useDesignationListManagement();

  const [selectedDesignation, setSelectedDesignation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [industrySearch, setIndustrySearch] = useState("");
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const statusFilterRef = useRef(null);
  const bulkActionRef = useRef(null);
  const industryRef = useRef(null);

  const statusOptions = [
    { key: "all", label: "All Designations" },
    { key: "1", label: "Active" },
    { key: "0", label: "Inactive" },
  ];

  // Sync local status filter with filters.status
  useEffect(() => {
    if (statusFilter === "all") {
      setFilters((prev) => ({ ...prev, status: "" }));
    } else {
      setFilters((prev) => ({ ...prev, status: statusFilter }));
    }
  }, [statusFilter, setFilters]);

  // Trigger search when filters change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.status, filters.industry_ids]);

  const handleClickOutside = useCallback((event) => {
    if (
      statusFilterRef.current &&
      !statusFilterRef.current.contains(event.target)
    ) {
      setShowStatusDropdown(false);
    }
    if (
      bulkActionRef.current &&
      !bulkActionRef.current.contains(event.target)
    ) {
      setShowBulkDropdown(false);
    }
    if (
      industryRef.current &&
      !industryRef.current.contains(event.target)
    ) {
      setShowIndustryDropdown(false);
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

  const openViewModal = (designation) => {
    setSelectedDesignation(designation);
    setIsModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedDesignation(null);
    setIsModalOpen(false);
  };

  const handleClearAll = () => {
    setFilters({ search: "", status: "", industry_ids: [] });
    setStatusFilter("all");
    handleSearch();
  };

  // Multi-select toggle for the Industry filter
  const toggleIndustryFilter = (id) => {
    setFilters((prev) => {
      const current = prev.industry_ids || [];
      const next = current.includes(id)
        ? current.filter((v) => v !== id)
        : [...current, id];
      return { ...prev, industry_ids: next };
    });
  };

  // Label shown on the Industry filter input when it's closed.
  const selectedIndustryLabel = () => {
    const ids = filters.industry_ids || [];
    if (ids.length === 0) return "";
    if (ids.length === 1) {
      const item = industries.find((option) => option.id === ids[0]);
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

  const renderSelectedIndustryTags = () => {
    const ids = filters.industry_ids || [];
    if (ids.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1 mt-1.5">
        {ids.map((id, index) => {
          const item = industries.find((option) => option.id === id);
          const name = item?.name || `#${id}`;
          return (
            <span
              key={`industry-${id}`}
              className={`inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs font-medium border ${TAG_COLORS[index % TAG_COLORS.length]}`}
            >
              {name}
              <button
                type="button"
                onClick={() => toggleIndustryFilter(id)}
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

  const canView = hasPermission("designation", "view");
  const canCreate = hasPermission("designation", "create");
  const canEdit = hasPermission("designation", "edit");
  const canDelete = hasPermission("designation", "delete");
  const canToggleStatus = hasPermission("designation", "toggle_status");
  const canViewSkills = hasPermission("skill", "view");

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
          <Briefcase className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view designations.
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
      {/* Header with status dropdown and search */}
      <motion.div
        className="bg-white p-4 mb-4 rounded-2xl border border-gray-200 shadow-sm"
        variants={itemVariants}
      >
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div ref={statusFilterRef} className="relative w-full md:w-auto">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="flex items-center justify-between gap-4 px-4 py-2 border border-gray-300 rounded-lg bg-white border-none hover:border-none"
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl !font-bold text-gray-800">
                  Designation List
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold whitespace-nowrap">
                  <Briefcase className="w-3.5 h-3.5" />
                  {totalRecords} Total
                </span>
              </span>
              <ChevronRight
                className={`w-5 h-5 stroke-[3px] stroke-black transition-transform ${
                  showStatusDropdown ? "rotate-90" : ""
                }`}
              />
            </button>
            {showStatusDropdown && (
              <div className="absolute z-50 mt-0 ml-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {statusOptions.map((option) => (
                  <div
                    key={option.key}
                    onClick={() => {
                      setStatusFilter(option.key);
                      setShowStatusDropdown(false);
                    }}
                    className={`flex items-center justify-between px-4 py-2 cursor-pointer text-sm hover:bg-gray-100 ${
                      statusFilter === option.key
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    <span>{option.label}</span>
                    {statusFilter === option.key && (
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
                {/* Industry Filter (multi-select) */}
                <div
                  ref={industryRef}
                  className="relative w-full sm:w-48"
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
                          : selectedIndustryLabel()
                      }
                      onChange={(e) => {
                        setIndustrySearch(e.target.value);
                        setShowIndustryDropdown(true);
                      }}
                      onFocus={() => {
                        setIndustrySearch("");
                        setShowIndustryDropdown(true);
                      }}
                      placeholder="All Industries"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                      {industries
                        .filter(
                          (industry) =>
                            !industrySearch ||
                            industry.name
                              .toLowerCase()
                              .includes(industrySearch.toLowerCase()),
                        )
                        .map((industry) => {
                          const checked = (
                            filters.industry_ids || []
                          ).includes(industry.id);
                          return (
                            <div
                              key={industry.id}
                              className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                checked ? "bg-blue-50" : ""
                              }`}
                              onClick={() => toggleIndustryFilter(industry.id)}
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
                          <div className="px-3 py-2 text-gray-500 text-center border-t text-sm">
                            No industries found for "{industrySearch}"
                          </div>
                        )}
                    </div>
                  )}
                  {renderSelectedIndustryTags()}
                </div>

                <input
                  type="text"
                  placeholder="Search by designation name..."
                  value={filters.search || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />

                {(filters.search ||
                  (filters.industry_ids || []).length > 0) && (
                  <button
                    onClick={handleClearAll}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
              </>
            )}

            {canCreate && (
              <button
                onClick={() => navigate("/admin/designations/add")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Designation</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

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
                      designations.length > 0 &&
                      selectedIds.length === designations.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <SortableHeader
                  label="Designation Name"
                  sortKey="name"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Image
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Industries
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Primary Industry
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Skill Category
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
                  <td colSpan="8" className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : designations.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-gray-500">
                    No designations found.
                  </td>
                </tr>
              ) : (
                designations.map((designation, index) => (
                  <motion.tr
                    key={designation.id}
                    className="cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.05 }}
                    onClick={() => openViewModal(designation)}
                  >
                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-4 cursor-auto"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(designation.id)}
                        onChange={() => toggleSelectDesignation(designation.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {designation.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200">
                        {designation.image_url ? (
                          <img
                            src={designation.image_url}
                            alt={designation.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {designation.industries &&
                      designation.industries.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {designation.industries.slice(0, 2).map((industry) => (
                            <span
                              key={industry.id}
                              className="px-2 py-0.5 bg-slate-100 rounded-full text-xs font-medium text-slate-700"
                            >
                              {industry.name}
                            </span>
                          ))}
                          {designation.industries.length > 2 && (
                            <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs font-medium text-slate-700">
                              +{designation.industries.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {designation.primary_industry?.name || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {designation.skill_category?.name || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          Number(designation.status) === 1
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {Number(designation.status) === 1
                          ? "Active"
                          : "Inactive"}
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
                              openActionMenuId === designation.id
                                ? null
                                : designation.id,
                            )
                          }
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                          title="Actions"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openActionMenuId === designation.id && (
                          <div className="absolute right-0 z-20 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden text-left">
                            {canView && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  openViewModal(designation);
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
                                  navigate(
                                    `/admin/designations/edit/${designation.id}`,
                                  );
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit2 size={16} />
                                Edit Designation
                              </button>
                            )}
                            {canViewSkills && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  const industry = designation.industries?.[0];
                                  const params = new URLSearchParams({
                                    designationName: designation.name,
                                    ...(industry && {
                                      industryId: industry.id,
                                      industryName: industry.name,
                                    }),
                                  });
                                  navigate(
                                    `/admin/industries/designations/${designation.id}/skills?${params.toString()}`,
                                  );
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Wrench size={16} />
                                Manage Skills
                              </button>
                            )}
                            {canToggleStatus && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  handleToggleStatus(
                                    designation.id,
                                    designation.status,
                                  );
                                }}
                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm border-t border-gray-100 ${
                                  Number(designation.status) === 1
                                    ? "text-red-600 hover:bg-red-50"
                                    : "text-green-600 hover:bg-green-50"
                                }`}
                              >
                                {Number(designation.status) === 1 ? (
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
                                  handleDelete(designation.id);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                              >
                                <Trash2 size={16} />
                                Delete Designation
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
        <DesignationViewModal
          designation={selectedDesignation}
          isOpen={isModalOpen}
          onClose={closeViewModal}
          onEdit={(designation) =>
            navigate(`/admin/designations/edit/${designation.id}`)
          }
        />
      )}
    </motion.div>
  );
};

export default DesignationListing;
