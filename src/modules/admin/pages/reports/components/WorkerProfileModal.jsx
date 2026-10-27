"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, MapPin, Briefcase, Tag } from "lucide-react";
import { fetchWorkerWalletProfile } from "../../../../../api/admin/adminReportsAPI";

const WorkerProfileModal = ({ isOpen, onClose, workerId }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && workerId) {
      setLoading(true);
      setError(null);
      fetchWorkerWalletProfile(workerId)
        .then((data) => {
          setProfileData(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch worker profile", err);
          setError("Failed to load worker profile data.");
          setLoading(false);
        });
    }
  }, [isOpen, workerId]);

  if (!isOpen) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const Card = ({
    label,
    value,
    valueColor = "text-gray-800",
    bgVariant = "bg-white",
  }) => (
    <div
      className={`${bgVariant} p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="text-[9px] font-bold text-gray-500 tracking-wider uppercase mb-1">
        {label}
      </div>
      <div className={`font-bold text-[14px] ${valueColor}`}>{value}</div>
    </div>
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-gray-50 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-200">
            <div>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                Worker Profile:{" "}
                {profileData ? (
                  <span className="text-blue-600">
                    {profileData.worker_name} ({profileData.worker_id})
                  </span>
                ) : (
                  "..."
                )}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                <p className="text-gray-500 text-sm font-medium animate-pulse">
                  Loading profile data...
                </p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-48 text-red-600 bg-red-50 rounded-xl border border-red-100 text-sm font-medium">
                {error}
              </div>
            ) : profileData ? (
              <div className="space-y-5">
                {/* Meta Banner */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1">
                  <div className="flex items-center text-[13px]">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                    <span className="text-gray-500 font-semibold mr-1.5">
                      Location:
                    </span>
                    <span className="font-medium text-gray-800">
                      {profileData.state_city}
                    </span>
                  </div>
                  <div className="flex items-center text-[13px]">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                    <span className="text-gray-500 font-semibold mr-1.5">
                      Industry:
                    </span>
                    <span className="font-medium text-gray-800">
                      {profileData.industry}
                    </span>
                  </div>
                  <div className="flex items-center text-[13px]">
                    <Tag className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                    <span className="text-gray-500 font-semibold mr-1.5">
                      Designation:
                    </span>
                    <span className="font-medium text-gray-800">
                      {profileData.designation}
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card
                    label="WALLET BALANCE"
                    value={formatCurrency(profileData.wallet_balance)}
                    valueColor="text-blue-600"
                    bgVariant="bg-blue-50/30"
                  />
                  <Card
                    label="TOTAL CREDITS"
                    value={formatCurrency(profileData.total_credits)}
                    valueColor="text-emerald-600"
                    bgVariant="bg-emerald-50/30"
                  />
                  <Card
                    label="TOTAL DEBITS"
                    value={formatCurrency(profileData.total_debits)}
                    valueColor="text-rose-600"
                    bgVariant="bg-rose-50/30"
                  />
                  <Card
                    label="WITHDRAWALS"
                    value={formatCurrency(profileData.withdrawals)}
                  />
                  <Card
                    label="DEDUCTIONS"
                    value={formatCurrency(profileData.deductions)}
                  />
                  <Card
                    label="PAYOUTS"
                    value={`${profileData.payouts_count} records`}
                  />
                </div>

                {/* Recent Payout History */}
                <div>
                  <h3 className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-2 pl-1">
                    RECENT PAYOUT HISTORY
                  </h3>
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-gray-50 text-gray-500 text-[9px] font-bold uppercase tracking-wider border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2">DATE</th>
                          <th className="px-3 py-2">PAYOUT TYPE</th>
                          <th className="px-3 py-2">GROSS</th>
                          <th className="px-3 py-2 text-right">NET</th>
                          <th className="px-3 py-2 text-center">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {profileData.recent_payouts.length > 0 ? (
                          profileData.recent_payouts.map((p, i) => (
                            <tr
                              key={i}
                              className="hover:bg-blue-50/30 transition-colors"
                            >
                              <td className="px-3 py-2 font-mono text-[10px] text-gray-500">
                                {p.date}
                              </td>
                              <td className="px-3 py-2 font-medium text-gray-800">
                                {p.payout_type}
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {formatCurrency(p.gross)}
                              </td>
                              <td className="px-3 py-2 font-bold text-gray-900 text-right">
                                {formatCurrency(p.net)}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    p.status === "Completed"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : p.status === "Failed"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="5"
                              className="px-3 py-6 text-center text-gray-500"
                            >
                              No recent payouts found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Ledger Entries */}
                <div>
                  <h3 className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-2 pl-1">
                    RECENT WALLET ENTRIES
                  </h3>
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-gray-50 text-gray-500 text-[9px] font-bold uppercase tracking-wider border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2">DATE</th>
                          <th className="px-3 py-2">SIDE</th>
                          <th className="px-3 py-2">TYPE</th>
                          <th className="px-3 py-2 text-right">AMOUNT</th>
                          <th className="px-3 py-2">PARTICULARS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {profileData.recent_ledger.length > 0 ? (
                          profileData.recent_ledger.map((l, i) => (
                            <tr
                              key={i}
                              className="hover:bg-blue-50/30 transition-colors"
                            >
                              <td className="px-3 py-2 font-mono text-[10px] text-gray-500">
                                {l.date}
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    l.side === "Credit"
                                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                      : "bg-rose-50 text-rose-600 border border-rose-100"
                                  }`}
                                >
                                  {l.side}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-medium text-gray-800">
                                {l.type}
                              </td>
                              <td
                                className={`px-3 py-2 font-bold text-right ${
                                  l.side === "Credit"
                                    ? "text-emerald-600"
                                    : "text-rose-600"
                                }`}
                              >
                                {l.side === "Credit" ? "+" : "-"}
                                {formatCurrency(l.amount)}
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {l.particulars}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="5"
                              className="px-3 py-6 text-center text-gray-500"
                            >
                              No recent entries found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WorkerProfileModal;
