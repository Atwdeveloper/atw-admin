"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@/lib/navigation";
import {
  Edit2,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Layers,
  ChevronRight,
  ChevronDown,
  X,
  Edit,
  ClipboardList,
  Trash2,
} from "lucide-react";
import {
  containerVariants,
  itemVariants,
  tableRowVariants,
} from "../../../../common/utils/motionVariants";
import { useSkillCategoryManagement } from "../../adminhooks/useSkillCategoryManagement";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import Loader from "../../../../common/components/Loader";
import SortableHeader from "../../../../common/components/SortableHeader";

// ====================== VIEW MODAL ======================
const SkillCategoryViewModal = ({ skillCategory, isOpen, onClose, onEdit }) => {
  const renderStatus = () => {
    const isActive = skillCategory.status === "ACTIVE";
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

  return (
    <AnimatePresence>
      {isOpen && skillCategory && (
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
                    <Layers className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {skillCategory.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        Code: {skillCategory.code || "-"}
                      </span>
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

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
                  <ClipboardList className="text-indigo-500" />
                  <span className="ml-2">Skill Category Information</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Name
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                      {skillCategory.name}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Code
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                      {skillCategory.code || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Status
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                      {skillCategory.status === "ACTIVE" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
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
                      onEdit(skillCategory);
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

const SkillCategoryListing = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  const {
    skillCategories,
    loading,
    page,
    pageSize,
    totalPages,
    totalRecords,
    filters,
    setFilters,
    setPage,
    handleClear,
    handleToggleStatus,
    handleDelete,
    selectedIds,
    toggleSelectSkillCategory,
    toggleSelectAll,
    handleBulkActivate,
    handleBulkDeactivate,
    handleBulkDelete,
    sortConfig,
    handleSort,
  } = useSkillCategoryManagement();

  const [selectedSkillCategory, setSelectedSkillCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);
  const statusFilterRef = useRef(null);
  const bulkActionRef = useRef(null);

  const statusOptions = [
    { key: "all", label: "All Skill Categories" },
    { key: "ACTIVE", label: "Active" },
    { key: "INACTIVE", label: "Inactive" },
  ];

  // Sync local status filter with filters.status
  useEffect(() => {
    if (statusFilter === "all") {
      setFilters((prev) => ({ ...prev, status: "" }));
    } else {
      setFilters((prev) => ({ ...prev, status: statusFilter }));
    }
  }, [statusFilter, setFilters]);

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
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const openViewModal = (skillCategory) => {
    setSelectedSkillCategory(skillCategory);
    setIsModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedSkillCategory(null);
    setIsModalOpen(false);
  };

  const handleClearAll = () => {
    setFilters({ search: "", status: "" });
    setStatusFilter("all");
    setFiltersVisible(false);
  };

  const canView = hasPermission("skill_category", "view");
  const canCreate = hasPermission("skill_category", "create");
  const canEdit = hasPermission("skill_category", "edit");
  const canToggleStatus = hasPermission("skill_category", "toggle_status");
  const canDelete = hasPermission("skill_category", "delete");

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
          <Layers className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view skill categories.
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
        className={`bg-white p-4 border border-gray-200 shadow-sm ${
          filtersVisible ? "rounded-t-2xl border-b-0" : "mb-4 rounded-2xl"
        }`}
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
                  Skill Category List
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold whitespace-nowrap">
                  <Layers className="w-3.5 h-3.5" />
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
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 hover:text-red-700 border-t border-gray-100"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    )}
                    {!canToggleStatus && !canDelete && (
                      <p className="px-4 py-2 text-sm text-gray-500">
                        No bulk actions available
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={filters.search || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />

                {!filtersVisible && filters.search && (
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
                onClick={() => navigate("/admin/skill-categories/add")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Skill Category</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Filter Panel (hidden for now) */}
      {filtersVisible && (
        <motion.div
          className="bg-white p-4 mb-4 rounded-b-2xl border border-gray-200 shadow-sm"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              FILTER BY :
            </span>
            <button
              onClick={handleClearAll}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear All
            </button>
          </div>
        </motion.div>
      )}

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
                      skillCategories.length > 0 &&
                      selectedIds.length === skillCategories.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  S.No.
                </th>
                <SortableHeader
                  label="Name"
                  sortKey="name"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Code
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
                  <td colSpan="6" className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : skillCategories.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-500">
                    No skill categories found.
                  </td>
                </tr>
              ) : (
                skillCategories.map((skillCategory, index) => (
                  <motion.tr
                    key={skillCategory.id}
                    className="cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.05 }}
                    onClick={() => openViewModal(skillCategory)}
                  >
                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-4 cursor-auto"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(skillCategory.id)}
                        onChange={() =>
                          toggleSelectSkillCategory(skillCategory.id)
                        }
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {skillCategory.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {skillCategory.code || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          skillCategory.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {skillCategory.status === "ACTIVE"
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>
                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="px-6 py-4 cursor-auto"
                    >
                      <div className="flex gap-2 flex-wrap">
                        {canView && (
                          <button
                            onClick={() => openViewModal(skillCategory)}
                            className="text-gray-600 hover:text-blue-600"
                            title="View"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() =>
                              navigate(
                                `/admin/skill-categories/edit/${skillCategory.id}`,
                              )
                            }
                            className="text-gray-600 hover:text-green-600"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}
                        {canToggleStatus && (
                          <button
                            onClick={() =>
                              handleToggleStatus(
                                skillCategory.id,
                                skillCategory.status,
                              )
                            }
                            className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${
                              skillCategory.status === "ACTIVE"
                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                            title={
                              skillCategory.status === "ACTIVE"
                                ? "Deactivate"
                                : "Activate"
                            }
                          >
                            {skillCategory.status === "ACTIVE" ? (
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
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(skillCategory)}
                            className="text-gray-600 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={18} />
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
        <SkillCategoryViewModal
          skillCategory={selectedSkillCategory}
          isOpen={isModalOpen}
          onClose={closeViewModal}
          onEdit={(skillCategory) =>
            navigate(`/admin/skill-categories/edit/${skillCategory.id}`)
          }
        />
      )}
    </motion.div>
  );
};

export default SkillCategoryListing;
