"use client";

// modules/admin/components/salary/SalaryConfigModal.jsx
import { motion } from "framer-motion";
import {
  X,
  Calendar,
  Percent,
  IndianRupee,
  AlertCircle,
  Users,
  Building,
} from "lucide-react";

const SalaryConfigModal = ({ config, isOpen, onClose }) => {
  if (!isOpen || !config) return null;

  const getConfigTypeIcon = (type) => {
    switch (type) {
      case "basic":
        return <Percent className="w-5 h-5 text-blue-600" />;
      case "hra":
        return <Percent className="w-5 h-5 text-green-600" />;
      case "conveyance":
        return <IndianRupee className="w-5 h-5 text-orange-600" />;
      case "bonus":
        return <Percent className="w-5 h-5 text-purple-600" />;
      case "pf_employer":
        return <Percent className="w-5 h-5 text-red-600" />;
      case "esi_employer":
        return <Percent className="w-5 h-5 text-indigo-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatValue = (type, value) => {
    if (
      [
        "basic",
        "hra",
        "bonus",
        "pf_employer",
        "esi_employer",
        "pf_admin",
      ].includes(type)
    ) {
      return `${value}%`;
    }
    if (
      ["conveyance", "min_wage", "pf_wage_cap", "esi_wage_limit"].includes(type)
    ) {
      return `₹${parseInt(value).toLocaleString()}`;
    }
    return value;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {getConfigTypeIcon(config.config_type)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {config.config_name}
              </h3>
              <p className="text-sm text-gray-500">{config.config_code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Config Details */}
          <div className="space-y-6">
            {/* Type and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Type</div>
                <div className="font-medium capitalize">
                  {config.config_type.replace("_", " ")}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Status</div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      config.status === "active"
                        ? "bg-green-100 text-green-800"
                        : config.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {config.status.charAt(0).toUpperCase() +
                      config.status.slice(1)}
                  </span>
                  {config.is_editable && (
                    <span className="text-xs text-blue-600">(Editable)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Value Display */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <div className="text-sm text-blue-600 font-medium mb-2">
                Configured Value
              </div>
              <div className="text-3xl font-bold text-blue-800">
                {formatValue(config.config_type, config.value)}
              </div>
              {config.min_value && config.max_value && (
                <div className="text-sm text-blue-600 mt-2">
                  Range: {formatValue(config.config_type, config.min_value)} -{" "}
                  {formatValue(config.config_type, config.max_value)}
                </div>
              )}
            </div>

            {/* Effective Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  Effective From
                </div>
                <div className="font-medium">
                  {new Date(config.effective_from).toLocaleDateString()}
                </div>
              </div>
              {config.effective_to && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    Effective To
                  </div>
                  <div className="font-medium">
                    {new Date(config.effective_to).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {config.description && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-2">Description</div>
                <p className="text-gray-700">{config.description}</p>
              </div>
            )}

            {/* Applicability */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-3">Applicability</div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    Applies to: All Employees
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    Can be overridden per employee:{" "}
                    {config.is_editable ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>

            {/* Rule Explanation */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                <AlertCircle className="w-4 h-4" />
                How this rule works:
              </div>
              <ul className="text-sm text-amber-700 space-y-1">
                {config.config_type === "basic" && (
                  <li>• Basic Salary = CTC × {config.value}%</li>
                )}
                {config.config_type === "hra" && (
                  <li>• HRA = Basic Salary × {config.value}%</li>
                )}
                {config.config_type === "conveyance" && (
                  <li>
                    • Fixed allowance of ₹
                    {parseInt(config.value).toLocaleString()} per month
                  </li>
                )}
                {config.config_type === "bonus" && (
                  <>
                    <li>
                      • Statutory Bonus = {config.value}% of (Minimum Wage or
                      Basic+DA, whichever is higher)
                    </li>
                    {config.min_value && config.max_value && (
                      <li>
                        • Allowed range: {config.min_value}% to{" "}
                        {config.max_value}%
                      </li>
                    )}
                  </>
                )}
                {config.config_type === "pf_employer" && (
                  <li>
                    • Employer PF Contribution = PF Wages × {config.value}% (PF
                    Wage Cap: ₹15,000)
                  </li>
                )}
                {config.config_type === "esi_employer" && (
                  <li>
                    • Employer ESI Contribution = ESI Wages × {config.value}%
                    (Applicable if gross ≤ ₹21,000)
                  </li>
                )}
              </ul>
            </div>

            {/* Audit Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-3">
                Audit Information
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Created By</div>
                  <div className="font-medium">Admin User</div>
                </div>
                <div>
                  <div className="text-gray-500">Created On</div>
                  <div className="font-medium">
                    {new Date(config.created_at).toLocaleDateString()} at{" "}
                    {new Date(config.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                {config.updated_at && (
                  <>
                    <div>
                      <div className="text-gray-500">Last Updated By</div>
                      <div className="font-medium">Admin User</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Last Updated</div>
                      <div className="font-medium">
                        {new Date(config.updated_at).toLocaleDateString()} at{" "}
                        {new Date(config.updated_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SalaryConfigModal;
