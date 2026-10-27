"use client";

import React from "react";
import { motion } from "framer-motion";
import { useParams, useSearchParams } from "@/lib/navigation";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import { Save, Loader2 } from "lucide-react";
import { Link } from "@/lib/navigation";
import { useSalaryStructureForm } from "../../adminhooks/useSalaryStructureForm";
import EditableSalaryTable from "../../components/salary/EditableSalaryTable";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";

const EditSalaryStructure = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { hasPermission } = useAdminPermissions();
  const canEdit = hasPermission("payroll", "edit_salary_structures");
  const isReadOnly = !canEdit || searchParams.get("readonly") === "true";

  const {
    loading,
    initialLoading,
    formData,
    industries,
    designations,
    designationsLoading,
    deductionComponents,
    earningComponents,
    earningValues,
    calculationResults,
    handleInputChange,
    handleEarningValueChange,
    handleSubmit,
    isEditMode,
  } = useSalaryStructureForm(id);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">
          Loading salary structure data...
        </span>
      </div>
    );
  }

  return (
    <motion.div
      className="flex-1 bg-gray-50 p-4 md:p-6 min-h-screen"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="mb-6" variants={itemVariants}>
        <h1 className="text-3xl font-bold text-gray-900">
          {isReadOnly ? "View Salary Structure" : "Edit Salary Structure"}
        </h1>
        <p className="text-gray-600 mt-1">
          {isReadOnly
            ? "Detailed view of the components and compliance for this structure."
            : "Update earnings components directly in the table below."}
        </p>
      </motion.div>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border p-6 mb-6"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Structure Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Structure Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                readOnly={isReadOnly}
                placeholder="e.g., Software Engineer Salary"
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isReadOnly
                    ? "bg-gray-100 cursor-not-allowed text-gray-600"
                    : ""
                }`}
                required
              />
            </div>

            {/* Industry Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry <span className="text-red-500">*</span>
              </label>
              <select
                name="industry_id"
                value={formData.industry_id}
                onChange={handleInputChange}
                disabled={isReadOnly}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${
                  isReadOnly
                    ? "bg-gray-100 cursor-not-allowed text-gray-600"
                    : ""
                }`}
                required
              >
                <option value="">Select Industry</option>
                {Array.isArray(industries) &&
                  industries.map((ind) => (
                    <option key={ind.id} value={ind.id}>
                      {ind.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Designation Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Designation <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="designation_id"
                  value={formData.designation_id}
                  onChange={handleInputChange}
                  disabled={
                    !formData.industry_id || designationsLoading || isReadOnly
                  }
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${
                    !formData.industry_id || isReadOnly
                      ? "bg-gray-100 cursor-not-allowed text-gray-600"
                      : ""
                  }`}
                  required
                >
                  <option value="">
                    {!formData.industry_id
                      ? "Select an industry first"
                      : designationsLoading
                        ? "Loading designations..."
                        : "Select Designation"}
                  </option>
                  {Array.isArray(designations) &&
                    designations.map((des) => (
                      <option key={des.id} value={des.id}>
                        {des.name}
                      </option>
                    ))}
                </select>
                {designationsLoading && (
                  <Loader2 className="absolute right-3 top-2 w-5 h-5 animate-spin text-gray-400" />
                )}
              </div>
            </div>

            {/* Max Daily Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Daily Rate
              </label>
              <input
                type="number"
                name="max_daily_rate"
                min="0"
                step="0.01"
                value={formData.max_daily_rate}
                onChange={handleInputChange}
                readOnly={isReadOnly}
                placeholder="e.g., 1200"
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isReadOnly
                    ? "bg-gray-100 cursor-not-allowed text-gray-600"
                    : ""
                }`}
              />
            </div>
          </div>
        </motion.div>

        {/* Statutory Compliance section */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border p-6 mb-6"
          variants={itemVariants}
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Statutory Compliance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    PF Applicable
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {formData.is_pf_applicable
                      ? `PF deductions will be applied (Upper Cap: ₹${formData.pf_upper_cap})`
                      : "No PF deductions will be applied"}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <label
                    className={`relative inline-flex items-center ${isReadOnly ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <input
                      type="checkbox"
                      name="is_pf_applicable"
                      checked={formData.is_pf_applicable}
                      onChange={(e) =>
                        handleInputChange({
                          target: {
                            name: "is_pf_applicable",
                            value: e.target.checked,
                          },
                        })
                      }
                      disabled={isReadOnly}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span
                    className={`text-[11px] font-bold tracking-widest ${formData.is_pf_applicable ? "text-blue-600" : "text-gray-400"}`}
                  >
                    {formData.is_pf_applicable ? "YES" : "NO"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    ESIC Applicable
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {formData.is_esi_applicable
                      ? `ESIC deductions will be applied (Upper Cap: ₹${formData.esi_upper_cap})`
                      : "No ESIC deductions will be applied"}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <label
                    className={`relative inline-flex items-center ${isReadOnly ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <input
                      type="checkbox"
                      name="is_esi_applicable"
                      checked={formData.is_esi_applicable}
                      onChange={(e) =>
                        handleInputChange({
                          target: {
                            name: "is_esi_applicable",
                            value: e.target.checked,
                          },
                        })
                      }
                      disabled={isReadOnly}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span
                    className={`text-[11px] font-bold tracking-widest ${formData.is_esi_applicable ? "text-blue-600" : "text-gray-400"}`}
                  >
                    {formData.is_esi_applicable ? "YES" : "NO"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Unified Editable Table */}
        {formData.designation_id && calculationResults && (
          <EditableSalaryTable
            earningComponents={earningComponents}
            earningValues={earningValues}
            calculationResults={calculationResults}
            onValueChange={handleEarningValueChange}
            readOnly={isReadOnly}
          />
        )}

        {/* Action Buttons */}
        <motion.div
          className="mt-8 flex justify-end gap-3"
          variants={itemVariants}
        >
          <Link
            to="/admin/salary-structure"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            {isReadOnly ? "Back" : "Cancel"}
          </Link>
          {!isReadOnly && (
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Structure
                </>
              )}
            </button>
          )}
        </motion.div>
      </form>
    </motion.div>
  );
};

export default EditSalaryStructure;
