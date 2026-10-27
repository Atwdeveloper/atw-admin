"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Settings, CheckCircle, Info } from "lucide-react";

const ViewTemplateModal = ({ template, isOpen, onClose }) => {
  if (!isOpen || !template) return null;

  const { template: templateInfo, designations = [], components = [] } = template;

  // Helper to format value with unit
  const formatValue = (value, type) => {
    if (value === null || value === undefined) return "—";
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    if (type === "percentage") return `${numValue}%`;
    if (type === "fixed") return `₹${numValue}`;
    return numValue.toString();
  };

  // Determine if a component is percentage or fixed based on its name (simplified)
  const getValueType = (componentName) => {
    if (componentName.toLowerCase().includes("tax")) return "fixed";
    return "percentage";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {templateInfo?.name || "Template Details"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    ID: {templateInfo?.id}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-200 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Designations Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="text-md font-semibold text-gray-700">
                    Applicable Designations ({designations.length})
                  </h3>
                </div>
                {designations.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {designations.map((name, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">
                    No specific designations assigned (applies globally).
                  </p>
                )}
              </div>

              {/* Components Table */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-5 h-5 text-purple-600" />
                  <h3 className="text-md font-semibold text-gray-700">
                    Deduction Components
                  </h3>
                </div>
                {components.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">
                            Component
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">
                            Default Value
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">
                            Custom Value
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">
                            Final Value
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {components.map((comp, idx) => {
                          const valueType = getValueType(comp.name || "");
                          return (
                            <tr
                              key={idx}
                              className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                            >
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-800">
                                  {comp.name}
                                </div>
                                {/* <div className="text-xs text-gray-500">
                                  ID: {comp.component_id}
                                </div> */}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {formatValue(comp.default_value, valueType)}
                              </td>
                              <td className="px-4 py-3">
                                {comp.custom_value !== null ? (
                                  <span className="text-blue-600 font-medium">
                                    {formatValue(comp.custom_value, valueType)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic">
                                    Not set
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-medium text-gray-900">
                                {formatValue(comp.final_value, valueType)}
                              </td>
                              <td className="px-4 py-3">
                                {comp.is_override ? (
                                  <div className="flex items-center gap-1 text-amber-600">
                                    <Info className="w-4 h-4" />
                                    <span className="text-xs font-medium">
                                      Overridden
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-xs font-medium">
                                      Default
                                    </span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">
                    No components defined for this template.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ViewTemplateModal;