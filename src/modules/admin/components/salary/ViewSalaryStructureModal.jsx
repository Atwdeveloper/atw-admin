"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Users, Calendar, IndianRupee, Info } from "lucide-react";

const ViewSalaryStructureModal = ({ structure, isOpen, onClose }) => {
  if (!isOpen || !structure) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "—";
    return `₹${parseFloat(amount).toLocaleString("en-IN")}`;
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
            className="bg-white rounded-2xl w-full max-w-md shadow-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {structure.name || "Salary Structure"}
                  </h2>
                  <p className="text-xs text-gray-500">ID: {structure.id}</p>
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
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Building2 className="w-4 h-4" />
                    <span className="text-xs font-medium">Industry</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">
                    {structure.industry?.name || "All Industries"}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-medium">Designation</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">
                    {structure.designation?.name || "All Designations"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <IndianRupee className="w-4 h-4" />
                  <span className="text-xs font-medium">Gross Amount</span>
                </div>
                <p className="text-lg font-bold text-gray-800">
                  {formatCurrency(structure.gross_amount)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium">Created</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {formatDate(structure.created_at)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium">Updated</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {formatDate(structure.updated_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Status:</span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    structure.is_active === 1
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {structure.is_active === 1 ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                  To view or edit earnings components, please open the edit
                  page.
                </p>
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

export default ViewSalaryStructureModal;
