"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import { Save, Briefcase, Receipt, Loader2, Shield } from "lucide-react";
import { useDeductionSettings } from "../../adminhooks/useDeductionSettings";
import Loader from "../../../../common/components/Loader";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import { useNavigate } from "@/lib/navigation";

const DeductionSettings = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const canManage = hasPermission("payroll", "manage_deductions");
  const canView = hasPermission("payroll", "view_deductions") || canManage;

  const {
    employerComponents,
    employeeComponents,
    formValues,
    loading,
    initialLoading,
    handleInputChange,
    handleStatutoryChange,
    saveSettings,
    statutoryRules,
  } = useDeductionSettings();

  if (!permissionsLoading && !canView) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center min-h-[80vh]">
        <div className="bg-white rounded-lg p-8 text-center max-w-md shadow-sm border border-gray-100">
          <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view Global Deduction Settings.
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

  // Helper to get display placeholder based on calculation_type
  const getPlaceholder = (comp) => {
    if (comp.calculation_type === "percentage") return `e.g., ${comp.value}%`;
    if (comp.calculation_type === "fixed") return `e.g., ₹${comp.value}`;
    return "";
  };

  // Render a skeleton loader while data is fetching
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
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
      {/* Header */}
      <motion.div className="mb-8" variants={itemVariants}>
        <h1 className="text-3xl font-bold text-gray-900">
          {canManage
            ? "Global Deduction Settings"
            : "View Global Deduction Settings"}
        </h1>
        <p className="text-gray-600 mt-1">
          {canManage
            ? "Configure employer contributions, employee deductions, and statutory caps"
            : "Detailed view of employer contributions, employee deductions, and statutory caps"}
        </p>
      </motion.div>

      {/* STATUTORY CAPS SECTION (NEW) */}
      <motion.div
        className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6"
        variants={itemVariants}
      >
        <div className="px-6 py-4 border-b bg-indigo-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 rounded-lg">
              <Receipt className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              GLOBAL STATUTORY CAPS (RESETS ALL TEMPLATES)
            </h2>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {statutoryRules.map((rule) => {
              const ruleName = rule.rule_key.replace(/_/g, " ").toUpperCase();
              return (
                <div key={rule.id}>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    {ruleName}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-medium">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={rule.value || ""}
                      onChange={(e) =>
                        handleStatutoryChange(rule.rule_key, e.target.value)
                      }
                      disabled={!canManage}
                      className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold text-gray-800 disabled:opacity-70 disabled:cursor-not-allowed"
                      placeholder="Enter amount"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                    This value acts as the default limit for{" "}
                    {ruleName.includes("PF") ? "Provident Fund" : "ESIC"} across
                    all salary structures.
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN - Employer Contributions */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border overflow-hidden"
          variants={itemVariants}
        >
          <div className="px-6 py-4 border-b bg-blue-50">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                STATUTORY EMPLOYER CONTRIBUTIONS
              </h2>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {employerComponents.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No employer components defined.
              </p>
            ) : (
              employerComponents.map((comp) => (
                <div key={comp.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {comp.name}
                    {comp.depends_on && (
                      <span className="text-xs text-gray-400 ml-1">
                        (on {comp.depends_on})
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formValues[comp.id] || ""}
                    onChange={(e) => handleInputChange(comp.id, e.target.value)}
                    placeholder={getPlaceholder(comp)}
                    disabled={!canManage}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                  {comp.max_limit && (
                    <p className="text-xs text-gray-500 mt-1">
                      Max limit: ₹{comp.max_limit}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* RIGHT COLUMN - Employee Deductions */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border overflow-hidden"
          variants={itemVariants}
        >
          <div className="px-6 py-4 border-b bg-amber-50">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                DEDUCTIONS FROM GROSS SALARY
              </h2>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {employeeComponents.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No employee deductions defined.
              </p>
            ) : (
              employeeComponents.map((comp) => (
                <div key={comp.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {comp.name}
                    {comp.depends_on && (
                      <span className="text-xs text-gray-400 ml-1">
                        (on {comp.depends_on})
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formValues[comp.id] || ""}
                    onChange={(e) => handleInputChange(comp.id, e.target.value)}
                    placeholder={getPlaceholder(comp)}
                    disabled={!canManage}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                  {comp.max_limit && (
                    <p className="text-xs text-gray-500 mt-1">
                      Max limit: ₹{comp.max_limit}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Save Button */}
      {canManage && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={saveSettings}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default DeductionSettings;
