"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@/lib/navigation";
import {
  CheckCircle,
  Edit2,
  Eye,
  MoreVertical,
  Plus,
  Search,
  Shield,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import {
  containerVariants,
  itemVariants,
  tableRowVariants,
} from "../../../../common/utils/motionVariants";
import { useStaffListing } from "../../adminhooks/useStaffListing";
import StaffViewModal from "../../components/staff/ViewStaffModal";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import { useSortableData } from "../../../../common/hooks/useSortableData";
import SortableHeader from "../../../../common/components/SortableHeader";

const statusTabs = [
  { key: "", label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "DISABLED", label: "Disabled" },
];

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Never";

const StaffListing = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  const {
    staffs,
    pageCount,
    roles,
    loading,
    page,
    totalPages,
    totalRecords,
    setPage,
    filters,
    setFilters,
    handleClear,
    handleDelete,
    handleToggleStatus,
    canActOn,
  } = useStaffListing();

  const { sortedItems: sortedStaffs, sortConfig, requestSort } = useSortableData(staffs);

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Close the row action menu on outside click
  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest(".action-menu-container")) setOpenActionMenuId(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const canView = hasPermission("admin_staff", "view");
  const canCreate = hasPermission("admin_staff", "create");
  const canEdit = hasPermission("admin_staff", "edit");
  const canDelete = hasPermission("admin_staff", "delete");
  const canToggleStatus = hasPermission("admin_staff", "toggle_status");

  if (!permissionsLoading && !canView) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <User className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to view staff.</p>
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

  const isFiltering = Boolean(filters.search || filters.status || filters.roleId);

  return (
    <motion.div className="flex-1 bg-gray-50" initial="hidden" animate="visible" variants={containerVariants}>
      {/* HEADER */}
      <motion.div className="bg-white p-4 mb-4 rounded-2xl border border-gray-200 shadow-sm" variants={itemVariants}>
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 pb-1">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilters({ ...filters, status: tab.key })}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${
                  filters.status === tab.key
                    ? "text-blue-700 border-b-2 border-blue-700 bg-blue-50/50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search name, email, username..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {roles.length > 0 && (
              <select
                value={filters.roleId}
                onChange={(e) => setFilters({ ...filters, roleId: e.target.value })}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All roles</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            )}

            {isFiltering && (
              <button
                onClick={handleClear}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            )}

            {canCreate && (
              <button
                onClick={() => navigate("/admin/staff/add")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add New Staff</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>
        {isFiltering && totalPages > 1 && (
          <p className="mt-3 text-xs text-gray-500">
            Search and filters apply to the {pageCount} staff on this page.
          </p>
        )}
      </motion.div>

      {/* TABLE */}
      <motion.div
        className="bg-white rounded-[22px] border border-[#DDDDDD] shadow-sm overflow-hidden"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Staff List</h2>
          <p className="text-lg font-medium text-gray-800">Total Staff : {totalRecords}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortableHeader label="Staff" sortKey="fullName" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader label="Email" sortKey="email" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader label="Phone" sortKey="phone" sortConfig={sortConfig} onSort={requestSort} />
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Roles</th>
                <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader
                  label="Last Login"
                  sortKey="lastLoginAt"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : sortedStaffs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-500">
                    <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-lg font-medium text-gray-600">
                      {isFiltering ? "No staff match your filters." : "No staff found."}
                    </p>
                    {!isFiltering && canCreate && (
                      <p className="text-sm mt-1 text-gray-400">
                        Add your first staff member with "Add New Staff" above.
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                sortedStaffs.map((staffMember, index) => {
                  const actionable = canActOn(staffMember);
                  const active = staffMember.status === "ACTIVE";
                  return (
                    <motion.tr
                      key={staffMember.id}
                      className="cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      variants={tableRowVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedStaff(staffMember)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                            {(staffMember.fullName || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              {staffMember.fullName}
                              {staffMember.superAdmin && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">
                                  SUPER ADMIN
                                </span>
                              )}
                            </p>
                            {staffMember.username && (
                              <p className="text-xs text-gray-500">@{staffMember.username}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{staffMember.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{staffMember.phone || "—"}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(staffMember.roles || []).length === 0 ? (
                            <span className="text-sm text-gray-400">—</span>
                          ) : (
                            staffMember.roles.map((role) => (
                              <span
                                key={role.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700"
                              >
                                <Shield size={11} /> {role.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {formatDateTime(staffMember.lastLoginAt)}
                      </td>
                      <td onClick={(e) => e.stopPropagation()} className="px-6 py-4 cursor-auto">
                        <div className="relative inline-block action-menu-container">
                          <button
                            onClick={() =>
                              setOpenActionMenuId(openActionMenuId === staffMember.id ? null : staffMember.id)
                            }
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                            title="Actions"
                          >
                            <MoreVertical size={18} />
                          </button>

                          {openActionMenuId === staffMember.id && (
                            <div className="absolute right-0 z-20 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden text-left">
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  setSelectedStaff(staffMember);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Eye size={16} /> View Details
                              </button>

                              {canEdit && (
                                <button
                                  onClick={() => navigate(`/admin/staff/edit/${staffMember.id}`)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Edit2 size={16} /> Edit Staff
                                </button>
                              )}

                              {canToggleStatus && actionable && (
                                <button
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleToggleStatus(staffMember);
                                  }}
                                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm border-t border-gray-100 ${
                                    active ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"
                                  }`}
                                >
                                  {active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                  {active ? "Disable" : "Activate"}
                                </button>
                              )}

                              {canDelete && actionable && (
                                <button
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleDelete(staffMember);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                                >
                                  <Trash2 size={16} /> Delete Staff
                                </button>
                              )}

                              {!actionable && (canToggleStatus || canDelete) && (
                                <p className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
                                  {staffMember.superAdmin
                                    ? "Super-admin accounts can't be disabled or deleted."
                                    : "You can't disable or delete your own account."}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <motion.div className="flex items-center justify-center space-x-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition ${
              page === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-black hover:text-white"
            }`}
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
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border text-sm shadow-sm transition ${
                    page === p ? "bg-black text-white" : "bg-white hover:bg-black hover:text-white"
                  }`}
                >
                  {p}
                </button>
              );
            }
            if (p === page - 2 || p === page + 2) {
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

      <StaffViewModal
        staff={selectedStaff}
        isOpen={Boolean(selectedStaff)}
        onClose={() => setSelectedStaff(null)}
      />
    </motion.div>
  );
};

export default StaffListing;
