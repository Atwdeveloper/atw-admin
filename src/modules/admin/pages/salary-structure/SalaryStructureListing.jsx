"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  containerVariants,
  itemVariants,
  tableRowVariants,
} from "../../../../common/utils/motionVariants";
import {
  Edit2,
  Trash2,
  Plus,
  Eye,
  Building2,
  Users,
  FileText,
  Calendar,
  IndianRupee,
  Shield,
} from "lucide-react";
import { useNavigate } from "@/lib/navigation";
import { useSalaryStructureListing } from "../../adminhooks/useSalaryStructureListing";
import ViewSalaryStructureModal from "../../components/salary/ViewSalaryStructureModal";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import { useSortableData } from "../../../../common/hooks/useSortableData";
import SortableHeader from "../../../../common/components/SortableHeader";

const SalaryStructureListing = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const {
    structures,
    loading,
    page,
    setPage,
    totalPages,
    filters,
    setFilters,
    handleClear,
    handleDelete,
  } = useSalaryStructureListing();

  const {
    sortedItems: sortedStructures,
    sortConfig,
    requestSort,
  } = useSortableData(structures);

  const hasBaseView = hasPermission("payroll", "view");

  if (!permissionsLoading && !hasBaseView) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center min-h-[80vh]">
        <div className="bg-white rounded-lg p-8 text-center max-w-md shadow-sm border border-gray-100">
          <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view Salary Structures.
          </p>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const canView = hasPermission("payroll", "view_salary_structures");
  const canCreate = hasPermission("payroll", "create_salary_structures");
  const canEdit = hasPermission("payroll", "edit_salary_structures");
  const canDelete = hasPermission("payroll", "delete_salary_structures");

  const openViewModal = (structure) => {
    setSelectedStructure(structure);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedStructure(null);
    setIsViewModalOpen(false);
  };

  const handleAddStructure = () => {
    navigate("/admin/salary-structure/add");
  };

  const handleEditStructure = (id) => {
    navigate(`/admin/salary-structure/edit/${id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "—";
    return `₹${parseFloat(amount).toLocaleString("en-IN")}`;
  };

  const StatusBadge = ({ status }) => {
    const isActive = status === 1;
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
        }`}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  return (
    <motion.div
      className="flex-1 bg-gray-50"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <motion.div
        className="bg-white p-4 border border-gray-200 shadow-sm mb-4 rounded-2xl"
        variants={itemVariants}
      >
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-800">
                Salary Structures
              </h1>
              {/* <p className="text-sm text-gray-500 mt-0.5">
                Manage salary templates for different designations
              </p> */}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by name..."
              value={filters.search || ""}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-auto"
            />
            {filters.search && (
              <button
                onClick={handleClear}
                className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            )}
            {canCreate && (
              <button
                onClick={handleAddStructure}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add New Structure</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Structures Table */}
      <motion.div
        className="bg-white rounded-[22px] border border-[#DDDDDD] shadow-sm overflow-hidden"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Structures List</h2>
          <h2 className="flex items-center gap-1 text-lg font-medium text-gray-800">
            <p>Total Structures :</p> {structures?.length || 0}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortableHeader
                  label="Structure Name"
                  sortKey="name"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Industry"
                  sortKey="industry"
                  accessor={(s) => s.industry?.name || "All Industries"}
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Designation"
                  sortKey="designation"
                  accessor={(s) => s.designation?.name || "All Designations"}
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Gross Amount"
                  sortKey="gross_amount"
                  accessor={(s) => parseFloat(s.gross_amount) || 0}
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Status"
                  sortKey="is_active"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Created"
                  sortKey="created_at"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : sortedStructures?.length > 0 ? (
                sortedStructures.map((structure, index) => (
                  <motion.tr
                    key={structure.id}
                    className="cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    onClick={() =>
                      navigate(
                        `/admin/salary-structure/edit/${structure.id}?readonly=true`,
                      )
                    }
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {structure.name || "Unnamed Structure"}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            ID: {structure.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {structure.industry?.name || "All Industries"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {structure.designation?.name || "All Designations"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(structure.gross_amount)}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={structure.is_active} />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(structure.created_at)}
                      </div>
                    </td>

                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="px-6 py-4 cursor-auto"
                    >
                      <div className="flex gap-3">
                        {canView && (
                          <button
                            onClick={() =>
                              navigate(
                                `/admin/salary-structure/edit/${structure.id}?readonly=true`,
                              )
                            }
                            className="text-gray-600 hover:text-green-600"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => handleEditStructure(structure.id)}
                            className="text-gray-600 hover:text-blue-600"
                            title="Edit Structure"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() =>
                              handleDelete(structure.id, structure.name)
                            }
                            className="text-gray-600 hover:text-red-600"
                            title="Delete Structure"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-500">
                    <div className="flex flex-col items-center">
                      <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-600">
                        No salary structures found.
                      </p>
                      <p className="text-sm mt-1 text-gray-400">
                        Create your first structure by clicking "Add New
                        Structure" above.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination */}
      {structures?.length > 0 && totalPages > 1 && (
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

      {/* View Modal */}
      {canView && (
        <ViewSalaryStructureModal
          structure={selectedStructure}
          isOpen={isViewModalOpen}
          onClose={closeViewModal}
        />
      )}
    </motion.div>
  );
};

export default SalaryStructureListing;
