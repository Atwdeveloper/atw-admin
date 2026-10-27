"use client";

import React from "react";
import { motion } from "framer-motion";
import { useParams, Link } from "@/lib/navigation";
import { Save, Loader2, Plus, Trash2, AlertCircle } from "lucide-react";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import { useTdsForm } from "../../adminhooks/useTdsForm";

const AddEditTds = () => {
  const { id } = useParams();
  const {
    loading,
    initialLoading,
    formData,
    slabs,
    errors,
    handleInputChange,
    addSlab,
    removeSlab,
    handleSlabChange,
    handleSubmit,
    isEditMode,
  } = useTdsForm(id);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading TDS rule data...</span>
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
          {isEditMode ? "Edit TDS Rule" : "Create TDS Rule"}
        </h1>
        <p className="text-gray-600 mt-1">
          Define Tax Deducted at Source (TDS) rule and its income slabs
        </p>
      </motion.div>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border p-6 mb-6"
          variants={itemVariants}
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Financial Year <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="financial_year"
                value={formData.financial_year}
                onChange={handleInputChange}
                placeholder="e.g., 2025-26"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.financial_year ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {errors.financial_year && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.financial_year}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Applicable From <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="applicable_from"
                value={formData.applicable_from}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.applicable_from ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {errors.applicable_from && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.applicable_from}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Applicable To <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="applicable_to"
                value={formData.applicable_to}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.applicable_to ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              {errors.applicable_to && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.applicable_to}
                </p>
              )}
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Active (Enable this TDS rule)
                </span>
              </label>
            </div>
          </div>
        </motion.div>

        {/* TDS Slabs Section */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6"
          variants={itemVariants}
        >
          <div className="px-6 py-4 border-b bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  TDS Slabs
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Define income ranges and corresponding TDS rates
                </p>
              </div>
              <button
                type="button"
                onClick={addSlab}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                Add Slab
              </button>
            </div>
          </div>

          {errors.slabs && (
            <div className="px-6 pt-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{errors.slabs}</span>
              </div>
            </div>
          )}

          <div className="p-6">
            {slabs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                No slabs defined yet. Click "Add Slab" to begin.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Min Income (₹)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Max Income (₹)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Rate (%)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Age Group
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {slabs.map((slab, index) => {
                      const slabError = errors.slabErrors?.[index] || {};
                      return (
                        <tr key={slab.tempId || slab.id || index}>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={slab.min_income}
                              onChange={(e) =>
                                handleSlabChange(
                                  index,
                                  "min_income",
                                  e.target.value,
                                )
                              }
                              className={`w-full px-3 py-1.5 border rounded-lg ${
                                slabError.min_income
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              placeholder="0.00"
                            />
                            {slabError.min_income && (
                              <p className="text-xs text-red-600 mt-1">
                                {slabError.min_income}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={slab.max_income}
                              onChange={(e) =>
                                handleSlabChange(
                                  index,
                                  "max_income",
                                  e.target.value,
                                )
                              }
                              className={`w-full px-3 py-1.5 border rounded-lg ${
                                slabError.max_income
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              placeholder="Leave blank for no upper limit"
                            />
                            {slabError.max_income && (
                              <p className="text-xs text-red-600 mt-1">
                                {slabError.max_income}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={slab.rate}
                              onChange={(e) =>
                                handleSlabChange(index, "rate", e.target.value)
                              }
                              className={`w-full px-3 py-1.5 border rounded-lg ${
                                slabError.rate
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              placeholder="0.00"
                            />
                            {slabError.rate && (
                              <p className="text-xs text-red-600 mt-1">
                                {slabError.rate}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={slab.age_group || "general"}
                              onChange={(e) =>
                                handleSlabChange(
                                  index,
                                  "age_group",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                            >
                              <option value="general">General</option>
                              <option value="senior">Senior Citizen</option>
                              <option value="super_senior">
                                Super Senior Citizen
                              </option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => removeSlab(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Remove Slab"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="mt-8 flex justify-end gap-3"
          variants={itemVariants}
        >
          <Link
            to="/admin/tds"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
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
                {isEditMode ? "Update Rule" : "Create Rule"}
              </>
            )}
          </button>
        </motion.div>
      </form>
    </motion.div>
  );
};

export default AddEditTds;
