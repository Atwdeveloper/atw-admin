"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "@/lib/navigation";
import {
  Edit2,
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
  Image as ImageIcon,
  Trash2,
} from "lucide-react";

import {
  containerVariants,
  itemVariants,
  tableRowVariants,
} from "../../../../common/utils/motionVariants";
import Breadcrumb from "../../../../common/components/Breadcrumb";
import { useDesignationManagement } from "../../adminhooks/useDesignationManagement";
import { getDesignationAPI } from "../../../../api/adminV1/masterdataAPI";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import Loader from "../../../../common/components/Loader";
import SortableHeader from "../../../../common/components/SortableHeader";
import MasterdataThumb from "../../../../common/components/MasterdataThumb";
import { useLocation } from "@/lib/navigation";
// View Modal for Designation (updated)
import { Wrench } from "lucide-react";

const DesignationViewModal = ({ designation, isOpen, onClose, onEdit }) => {
  const renderStatus = () => {
    const isActive = designation.status === "ACTIVE";
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
            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                    {designation.imageUrl ? (
                      <img
                        src={designation.imageUrl}
                        alt={designation.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Briefcase className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {designation.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {renderStatus()}
                      {designation.industries?.length > 0 && (
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {designation.industries.length > 1 ? "Industries" : "Industry"}:{" "}
                          {designation.industries.map((i) => i.name).join(", ")}
                        </span>
                      )}
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                <Card
                  title="Designation Information"
                  icon={<ClipboardList className="text-indigo-500" />}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem
                      label="Designation Name"
                      value={designation.name}
                    />
                    <DetailItem
                      label="Status"
                      value={
                        <span
                          className={`inline-flex items-center gap-2 ${
                            designation.status === "ACTIVE"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {designation.status === "ACTIVE" ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          {designation.status === "ACTIVE"
                            ? "Active"
                            : "Inactive"}
                        </span>
                      }
                    />
                    <DetailItem
                      label="Industries"
                      value={
                        designation.industries?.length
                          ? designation.industries.map((i) => i.name).join(", ")
                          : "—"
                      }
                    />
                    <DetailItem
                      label="Skill Category"
                      value={designation.skillCategoryId ? "Assigned" : "Not assigned"}
                    />
                  </div>
                </Card>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-800 px-6 py-4 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div></div>
                <div className="flex space-x-3">
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

                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Reusable card and detail item (could be moved to common)
const Card = ({ title, icon, children }) => (
  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
      {icon}
      <span className="ml-2">{title}</span>
    </h4>
    {children}
  </div>
);

const DetailItem = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
    <span className="text-slate-900 dark:text-slate-100 font-medium">
      {value}
    </span>
  </div>
);

const DesignationByIndustry = () => {
  const { id: industryId } = useParams(); // industry ID from route
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  const {
    designations,
    industry,
    loading,
    loadError,
    page,
    totalPages,
    totalRecords,
    filters,
    setFilters,
    setPage,
    sortConfig,
    handleSort,
    handleClear,
    handleToggleStatus,
    handleDelete,
    selectedIds,
    toggleSelectDesignation,
    toggleSelectAll,
    handleBulkActivate,
    handleBulkDeactivate,
    handleBulkDelete,
  } = useDesignationManagement(industryId);

  // The server already returns one filtered/sorted page
  const pageDesignations = designations;
  const pageIds = pageDesignations.map((d) => d.id);

  const [selectedDesignation, setSelectedDesignation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  // Status dropdown is driven straight from the hook's filter
  const statusFilter = filters.status || "all";
  const setStatusFilter = (key) =>
    setFilters((prev) => ({ ...prev, status: key === "all" ? "" : key }));
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);
  const statusFilterRef = useRef(null);
  const bulkActionRef = useRef(null);
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const industryName = industry?.name || params.get("name") || "Industry";

  const statusOptions = [
    { key: "all", label: "All Designations" },
    { key: "ACTIVE", label: "Active" },
    { key: "INACTIVE", label: "Inactive" },
  ];

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

  // The list never carries imageUrl — fetch the single designation for it.
  const openViewModal = (designation) => {
    setSelectedDesignation(designation);
    setIsModalOpen(true);
    getDesignationAPI(designation.id)
      .then((full) =>
        setSelectedDesignation((current) =>
          current?.id === full.id ? full : current,
        ),
      )
      .catch(() => {});
  };

  const closeViewModal = () => {
    setSelectedDesignation(null);
    setIsModalOpen(false);
  };

  const handleClearAll = () => {
    handleClear();
    setFiltersVisible(false);
  };

  // Clear button next to search only clears the search text (keeps the status filter)
  const handleClearSearch = () =>
    setFilters((prev) => ({ ...prev, search: "" }));

  const canView = hasPermission("designation", "view"); // adjust permission key as needed
  const canCreate = hasPermission("designation", "create");
  const canEdit = hasPermission("designation", "edit");
  const canToggleStatus = hasPermission("designation", "toggle_status");
  const canDelete = hasPermission("designation", "delete");
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
            onClick={() => navigate("/admin/industries")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Industries
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
      {/* Header with back button, status dropdown, search */}
      <motion.div className="p-4 pb-0">
        <Breadcrumb
          items={[
            { label: "Industries", path: "/admin/industries" },
            {
              label: industryName || "Industry",
              path: `/admin/industries/designations/${industryId}`,
            },
            { label: "Designations" },
          ]}
        />
      </motion.div>
      <motion.div
        className={`bg-white p-4 border border-gray-200 shadow-sm ${
          filtersVisible ? "rounded-t-2xl border-b-0" : "mb-4 rounded-2xl"
        }`}
        variants={itemVariants}
      >
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="flex items-center gap-4">
            {/* <button
              onClick={() => navigate("/admin/industries")}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Back to Industries"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button> */}
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
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-gray-700 hover:bg-red-50 hover:text-red-700 border-t border-gray-100"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    )}
                    {!canToggleStatus && !canDelete && (
                      <p className="px-4 py-2 text-sm text-gray-500">No bulk actions available</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Search by designation name..."
                  value={filters.search || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />

                {!filtersVisible && filters.search && (
                  <button
                    onClick={handleClearSearch}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
              </>
            )}

            {canCreate && (
              <button
                onClick={() =>
                  navigate(
                    `/admin/industries/designations/${industryId}/add?name=${encodeURIComponent(industryName)}`,
                  )
                }
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

      {/* Filter Panel (optional) */}
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
          {/* Additional filters if needed */}
        </motion.div>
      )}

      {/* Table - removed Description column */}
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
                      pageIds.length > 0 &&
                      selectedIds.length === pageIds.length
                    }
                    onChange={() => toggleSelectAll(pageIds)}
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
                  <td colSpan="5" className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-red-600">
                    {loadError}
                  </td>
                </tr>
              ) : pageDesignations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-500">
                    No designations found.
                  </td>
                </tr>
              ) : (
                pageDesignations.map((designation, index) => (
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
                      <MasterdataThumb kind="designations" id={designation.id} fetcher={getDesignationAPI} alt={designation.name} />
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          designation.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {designation.status === "ACTIVE"
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>
                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="px-6 py-4 cursor-auto"
                    >
                      <div className="flex gap-3 flex-wrap">
                        {canView && (
                          <button
                            onClick={() => openViewModal(designation)}
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
                                `/admin/industries/designations/${industryId}/edit/${designation.id}?name=${encodeURIComponent(
                                  industryName,
                                )}`,
                              )
                            }
                            className="text-gray-600 hover:text-green-600"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}
                        {canViewSkills && (
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/industries/designations/${designation.id}/skills?designationName=${encodeURIComponent(designation.name)}&industryId=${industryId}&industryName=${encodeURIComponent(industryName)}`,
                            )
                          }
                          className="text-gray-600 hover:text-purple-600"
                          title="Manage Skills"
                        >
                          <Wrench size={18} />
                        </button>
                        )}
                        {canToggleStatus && (
                          <button
                            onClick={() =>
                              handleToggleStatus(
                                designation.id,
                                designation.status,
                              )
                            }
                            className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${
                              designation.status === "ACTIVE"
                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                            title={
                              designation.status === "ACTIVE"
                                ? "Deactivate"
                                : "Activate"
                            }
                          >
                            {designation.status === "ACTIVE" ? (
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
                            onClick={() =>
                              handleDelete(designation.id, designation.name)
                            }
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
        <DesignationViewModal
          designation={selectedDesignation}
          isOpen={isModalOpen}
          onClose={closeViewModal}
          onEdit={(designation) =>
            navigate(
              `/admin/industries/designations/${industryId}/edit/${designation.id}?name=${encodeURIComponent(
                industryName,
              )}`,
            )
          }
        />
      )}
    </motion.div>
  );
};

export default DesignationByIndustry;
