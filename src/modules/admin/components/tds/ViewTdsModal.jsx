"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Info } from "lucide-react";

const ViewTdsModal = ({ tdsRule, isOpen, onClose }) => {
  if (!isOpen || !tdsRule) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl w-full max-w-md shadow-xl"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-5 border-b">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                TDS Rule Details
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Financial Year</p>
                  <p className="font-medium text-gray-900">
                    {tdsRule.financial_year}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      tdsRule.is_active === 1
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {tdsRule.is_active === 1 ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Applicable From</p>
                <p className="text-gray-900 font-medium">
                  {formatDate(tdsRule.applicable_from)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Applicable To</p>
                <p className="text-gray-900 font-medium">
                  {formatDate(tdsRule.applicable_to)}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                To manage TDS slabs for this rule, go to the rule details page.
              </p>
            </div>
          </div>

          <div className="p-5 border-t flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ViewTdsModal;
