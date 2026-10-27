"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  containerVariants,
  itemVariants,
  tableRowVariants,
} from "../../../../common/utils/motionVariants";
import { Edit2, Trash2, Plus, Eye, Calendar, FileText } from "lucide-react";
import { useNavigate } from "@/lib/navigation";
import { useTdsList } from "../../adminhooks/useTdsList";
import ViewTdsModal from "../../components/tds/ViewTdsModal";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";

const TDSListing = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAdminPermissions();
  const [selectedTds, setSelectedTds] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const {
    tdsRules,
    loading,
    pagination,

    handlePageChange,

    handleDelete,

    filters,
    setFilters,
    handleClear,
  } = useTdsList();

  // Check permissions
  // const canView = hasPermission("tds", "view");
  // const canCreate = hasPermission("tds", "create");
  const canEdit = hasPermission("tds", "edit");
  const canDelete = hasPermission("tds", "delete");

  const openViewModal = (rule) => {
    setSelectedTds(rule);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedTds(null);
    setIsViewModalOpen(false);
  };

  const handleAddRule = () => {
    navigate("/admin/tds-settings/add");
  };

  const handleEditRule = (id) => {
    navigate(`/admin/tds/edit/${id}`);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
              <h1 className="text-2xl font-bold text-gray-800">TDS Rules</h1>
              {/* <p className="text-sm text-gray-500 mt-0.5">
                Manage Tax Deducted at Source (TDS) rules for financial years
              </p> */}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by financial year..."
              value={filters.search || ""}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-auto"
            />
            {/* <select
              value={filters.status || "all"}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select> */}
            {(filters.search || filters.status !== "all") && (
              <button
                onClick={handleClear}
                className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            )}
            {/* {canCreate && ( */}
            <button
              onClick={handleAddRule}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add New Rule</span>
              <span className="sm:hidden">Add</span>
            </button>
            {/* )} */}
          </div>
        </div>
      </motion.div>

      {/* TDS Rules Table */}
      <motion.div
        className="bg-white rounded-[22px] border border-[#DDDDDD] shadow-sm overflow-hidden"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Rules List</h2>
          <h2 className="flex items-center gap-1 text-lg font-medium text-gray-800">
            <p>Total Rules :</p> {tdsRules?.length || 0}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  "Financial Year",
                  "Applicable Period",
                  "Status",
                  "Created",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-600"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : tdsRules?.length > 0 ? (
                tdsRules.map((rule, index) => (
                  <motion.tr
                    key={rule.id}
                    className="cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    onClick={() => openViewModal(rule)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {rule.financial_year}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            ID: {rule.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        <div>{formatDate(rule.applicable_from)}</div>
                        <div className="text-xs text-gray-400">to</div>
                        <div>{formatDate(rule.applicable_to)}</div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          rule.is_active === 1
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {rule.is_active === 1 ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {formatDate(rule.created_at)}
                      </div>
                    </td>

                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="px-6 py-4 cursor-auto"
                    >
                      <div className="flex gap-3">
                        <button
                          onClick={() => openViewModal(rule)}
                          className="text-gray-600 hover:text-green-600"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleEditRule(rule.id)}
                            className="text-gray-600 hover:text-blue-600"
                            title="Edit Rule"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}
                        {/* <button
                          onClick={() =>
                            handleToggleActive(rule.id, rule.is_active, rule.financial_year)
                          }
                          className={`px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 ${
                            rule.is_active === 1
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                          title={rule.is_active === 1 ? "Deactivate" : "Activate"}
                        >
                          {rule.is_active === 1 ? (
                            // <Power size={18} /> 
                            <>
                               <XCircle size={16} />  Deactivate
                              </>
                          ) : (
                            // <PowerOff size={18} />
                            <>
                                 <CheckCircle size={16} /> Activate
                              </>
                          )}
                        </button> */}
                        {canDelete && (
                          <button
                            onClick={() =>
                              handleDelete(rule.id, rule.financial_year)
                            }
                            className="text-gray-600 hover:text-red-600"
                            title="Delete Rule"
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
                  <td colSpan="5" className="text-center py-10 text-gray-500">
                    <div className="flex flex-col items-center">
                      <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-600">
                        No TDS rules found.
                      </p>
                      <p className="text-sm mt-1 text-gray-400">
                        Create your first rule by clicking "Add New Rule" above.
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
      {tdsRules?.length > 0 && pagination.totalPages > 1 && (
        <motion.div className="flex items-center justify-center space-x-2 mt-6">
          <button
            disabled={pagination.currentPage === 1}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition 
              ${
                pagination.currentPage === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-black hover:text-white"
              }`}
          >
            Prev
          </button>

          {[...Array(pagination.totalPages)].map((_, index) => {
            const p = index + 1;
            if (
              p === 1 ||
              p === pagination.totalPages ||
              (p >= pagination.currentPage - 1 &&
                p <= pagination.currentPage + 1)
            ) {
              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border text-sm shadow-sm transition
                    ${
                      pagination.currentPage === p
                        ? "bg-black text-white"
                        : "bg-white hover:bg-black hover:text-white"
                    }`}
                >
                  {p}
                </button>
              );
            }
            if (
              p === pagination.currentPage - 3 ||
              p === pagination.currentPage + 3
            ) {
              return (
                <span key={p} className="px-2">
                  ...
                </span>
              );
            }
            return null;
          })}

          <button
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition 
              ${
                pagination.currentPage === pagination.totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-black hover:text-white"
              }`}
          >
            Next
          </button>
        </motion.div>
      )}

      {/* View TDS Modal */}
      <ViewTdsModal
        tdsRule={selectedTds}
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
      />
    </motion.div>
  );
};

export default TDSListing;
