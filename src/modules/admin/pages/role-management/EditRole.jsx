"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Save,
  Check,
  X,
  Lock,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "@/lib/navigation";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import { useRoleForm } from "../../adminhooks/useRoleForm";
import { useState } from "react";
import Loader from "../../../../common/components/Loader";
import useUnsavedChangesWarning from "../../../../common/hooks/useUnsavedChangesWarning"; // Add this import

const EditRole = () => {
  const navigate = useNavigate();
  const {
    formData,
    errors,
    loading,
    isLoading,
    permissionsData,
    selectedPermissions,
    isFormDirty, // Add this
    resetForm, // Add this
    isSystemRole,
    handleInputChange,
    handlePermissionChange,
    handleModuleSelect,
    handleSubmit,
    getSelectedPermissionsForDisplay,
    getSelectedPermissionsCount,
    countModuleSelected,
    isModuleAllSelected,
    isModuleAnySelected,
    handleSelectAll,
  } = useRoleForm(true);

  const [expandedModules, setExpandedModules] = useState({});
  const [showPermissions, setShowPermissions] = useState(true);

  // 🔹 Use the unsaved changes warning hook
  useUnsavedChangesWarning(
    isFormDirty,
    "You have unsaved changes. Are you sure you want to leave? All changes will be lost.",
  );

  const toggleModule = (moduleName) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleName]: !prev[moduleName],
    }));
  };

  // 🔹 Handle cancel button
  const handleCancel = () => {
    // Remove custom confirmation since useUnsavedChangesWarning handles it
    navigate("/admin/roles");
  };

  // 🔹 Handle reset button
  const handleReset = () => {
    resetForm();
    setExpandedModules({});
  };

  const selectedCount = getSelectedPermissionsCount();

  if (isLoading) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex-1 bg-gray-50 p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* 🔹 Unsaved Changes Indicator */}

      {/* Header Section */}
      <motion.div
        className="relative overflow-hidden rounded-2xl  mb-6"
        variants={itemVariants}
        // whileHover={{ scale: 1.01 }}
        // transition={{ duration: 0.3 }}
      >
        {/* CONTENT STRUCTURE */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
          {/* ---------- LEFT: Title + Subtitle ---------- */}
          <div className="space-y-1">
            {/* TITLE ROW */}
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.h1
                className="text-3xl font-bold "
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                Edit Role
              </motion.h1>
            </motion.div>

            {/* SUBTITLE */}
            <motion.div
              className="flex items-center space-x-2 "
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <p className=" text-slate-600 font-medium">
                Modify role details and update permissions
              </p>
            </motion.div>
          </div>

          {/* ---------- RIGHT: Selected Permissions Count ---------- */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">
                  Selected Permissions
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {selectedCount}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {isSystemRole && (
            <div className="col-span-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This is a system role. Its name and permissions are managed by the platform and can't be changed.
            </div>
          )}
          {isFormDirty && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className=" p-4 bg-yellow-50 border border-yellow-200 rounded-lg col-span-full"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-800 font-medium">
                    You have unsaved changes
                  </span>
                </div>
              </div>
            </motion.div>
          )}
          {/* Left Column - Role Information */}
          <motion.div
            className="lg:col-span-2 space-y-8"
            variants={itemVariants}
          >
            {/* Role Information Card */}
            <div className="bg-white rounded-2xl border border-[#DDDDDD] shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  <span className="text-blue-900 bg-blue-100 px-4 py-2 rounded-lg">
                    Edit Role Information
                  </span>
                </h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Editing Mode</span>
                </div>
              </div>

              <div className="space-y-6">
                {/* Role Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role Title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter role title"
                      className={`w-full px-4 py-3 border ${errors.title ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                    {errors.title && (
                      <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
                        <X className="w-4 h-4" />
                        {errors.title}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Describe the role's purpose and responsibilities..."
                      className={`w-full px-4 py-3 border ${errors.description ? "border-red-300" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                    />
                    {errors.description && (
                      <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
                        <X className="w-4 h-4" />
                        {errors.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Permissions Card */}
            <div className="bg-white rounded-2xl border border-[#DDDDDD] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  <span className="text-blue-900 bg-blue-100 px-4 py-2 rounded-lg">
                    Update Permissions
                  </span>
                  {errors.permissions && (
                    <span className="ml-3 text-sm text-red-600 flex items-center gap-1">
                      <X className="w-4 h-4" />
                      {errors.permissions}
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPermissions(!showPermissions)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    {showPermissions ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    {showPermissions ? "Hide" : "Show"} Permissions
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {showPermissions && (
                <div className="p-6">
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {permissionsData.map((module, moduleIndex) => {
                      const moduleSelectedCount = countModuleSelected(module);
                      const isAllSelected = isModuleAllSelected(module);
                      const isAnySelected = isModuleAnySelected(module);
                      const isExpanded =
                        expandedModules[module.module] !== false;

                      return (
                        <motion.div
                          key={module.module}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: moduleIndex * 0.05 }}
                          className="border border-gray-200 rounded-xl overflow-hidden"
                        >
                          {/* Module Header */}
                          <div
                            className={`px-4 py-3 flex items-center justify-between ${isAnySelected ? "bg-blue-50" : "bg-gray-50"}`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={(e) =>
                                  handleModuleSelect(module, e.target.checked)
                                }
                                className="w-4 h-4 text-blue-600 rounded border-gray-300"
                              />
                              <div>
                                <h3 className="font-semibold text-gray-800">
                                  {module.module_label}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {moduleSelectedCount} of{" "}
                                  {module.actions.length} permissions selected
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div
                                className={`px-2 py-1 text-xs font-medium rounded ${isAnySelected ? "bg-blue-100 text-blue-800" : "bg-gray-200 text-gray-700"}`}
                              >
                                {moduleSelectedCount}/{module.actions.length}
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleModule(module.module)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5" />
                                ) : (
                                  <ChevronDown className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Module Actions */}
                          {isExpanded && (
                            <div className="p-4 bg-white">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {module.actions.map((action, actionIndex) => {
                                  const permissionKey = `${module.module}.${action.action}`;
                                  const isSelected =
                                    selectedPermissions[permissionKey];

                                  return (
                                    <label
                                      key={permissionKey}
                                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${isSelected ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) =>
                                          handlePermissionChange(
                                            permissionKey,
                                            e.target.checked,
                                          )
                                        }
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                      />
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-800">
                                          {action.label}
                                        </div>
                                      </div>
                                      {isSelected && (
                                        <Check className="w-4 h-4 text-green-500" />
                                      )}
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {permissionsData.length === 0 && (
                    <div className="text-center py-8">
                      <Lock className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-600">No permissions available</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Please try refreshing the page
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Column - Summary & Actions */}
          <motion.div className="space-y-6" variants={itemVariants}>
            {/* Summary Card */}
            <div className="bg-white rounded-2xl border border-[#DDDDDD] shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                <span className="text-blue-900 bg-blue-100 px-3 py-1 rounded-lg">
                  Summary
                </span>
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Role Title</span>
                  <span className="font-medium text-gray-900 truncate max-w-[200px]">
                    {formData.title || "Not set"}
                  </span>
                </div>

                {/* <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${formData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {formData.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div> */}

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Selected Permissions</span>
                  <span className="font-medium text-gray-900">
                    {selectedCount}
                  </span>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-700">
                        <span className="font-medium">Warning:</span> Changing
                        permissions will affect all users with this role
                        immediately.
                      </div>
                    </div>
                  </div>

                  <h4 className="font-medium text-gray-700 mb-2">
                    Selected Permissions Preview:
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {getSelectedPermissionsForDisplay()
                      .slice(0, 10)
                      .map((permission, index) => (
                        <div
                          key={index}
                          className="text-sm text-gray-600 bg-gray-50 p-2 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <Lock className="w-3 h-3 text-gray-400" />
                            <span className="truncate">{permission}</span>
                          </div>
                        </div>
                      ))}
                    {selectedCount > 10 && (
                      <div className="text-center text-sm text-gray-500">
                        + {selectedCount - 10} more permissions
                      </div>
                    )}
                    {selectedCount === 0 && (
                      <div className="text-center text-sm text-gray-500">
                        No permissions selected
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white rounded-2xl border border-[#DDDDDD] shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                <span className="text-blue-900 bg-blue-100 px-3 py-1 rounded-lg">
                  Actions
                </span>
              </h3>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || isSystemRole}
                  className="w-full flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 text-white py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Updating Role...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Update Role
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-700 py-3 rounded-lg font-medium transition"
                >
                  Reset Changes
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/admin/roles")}
                  className="w-full bg-green-50 hover:bg-green-100 text-green-700 py-3 rounded-lg font-medium transition"
                >
                  View All Roles
                </button>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Editing Tips
              </h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>
                    Permission changes take effect immediately for all assigned
                    users
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Test role changes in a staging environment first</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    Consider creating a new role instead of editing critical
                    ones
                  </span>
                </li>
                {isFormDirty && (
                  <li className="flex items-start gap-2 mt-4 pt-3 border-t border-blue-200">
                    <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-yellow-700">
                      <span className="font-medium">Note:</span> You have
                      unsaved changes. Remember to save your changes before
                      leaving.
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </motion.div>
        </div>
      </form>
    </motion.div>
  );
};

export default EditRole;
