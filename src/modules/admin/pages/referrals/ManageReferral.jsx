"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Building2,
  FileText,
  Wallet,
  Download,
  Search,
  Filter,
  Clock,
  CheckCircle,
  IndianRupee,
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import Breadcrumb from "../../../../common/components/Breadcrumb";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";

const TABS = [
  { id: "worker", label: "Worker Referrals", icon: Users },
  { id: "agent", label: "Agent Referrals", icon: Building2 },
  { id: "commission", label: "Company Commission", icon: FileText },
  { id: "rules", label: "Referral Rules", icon: FileText },
  { id: "payouts", label: "Payout Approvals", icon: Wallet },
  { id: "reports", label: "Reports & Exports", icon: Download },
];

/**
 * TODO: Replace with a real hook, e.g.
 * const { loading, stats, referrals, pagination } = useManageReferrals(activeTab, page, search);
 */
const STATS = [
  {
    label: "Total Referrals",
    value: "856",
    icon: Users,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    label: "Pending",
    value: "124",
    icon: Clock,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
  {
    label: "Joined",
    value: "650",
    icon: CheckCircle,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    label: "Reward Paid",
    value: "\u20B93.2L",
    icon: IndianRupee,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
];

const WORKER_REFERRALS = [
  {
    id: "WR-101",
    workerName: "Rahul Kumar",
    referrer: "Amit Singh",
    company: "Tech Mahindra",
    mobile: "+91 9876543210",
    date: "12-Jul-2026",
    reward: "\u20B91,500",
    status: "joined",
  },
  {
    id: "WR-102",
    workerName: "Sunita Sharma",
    referrer: "Priya Patel",
    company: "Tata Motors",
    mobile: "+91 8765432109",
    date: "11-Jul-2026",
    reward: "\u20B91,200",
    status: "pending",
  },
];

const STATUS_STYLES = {
  joined: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const STATUS_LABELS = {
  joined: "Joined",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const ComingSoonPanel = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
      <FileText className="w-6 h-6 text-gray-400" />
    </div>
    <p className="text-gray-600 font-medium">{label}</p>
    <p className="text-sm text-gray-400 mt-1">
      This section hasn't been wired up yet.
    </p>
  </div>
);

const ManageReferral = () => {
  const [activeTab, setActiveTab] = useState("worker");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredReferrals = useMemo(() => {
    if (!search.trim()) return WORKER_REFERRALS;
    const q = search.trim().toLowerCase();
    return WORKER_REFERRALS.filter(
      (r) =>
        r.workerName.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q),
    );
  }, [search]);

  const totalEntries = filteredReferrals.length;
  const startIndex = totalEntries === 0 ? 0 : 1;

  return (
    <motion.div
      className="flex-1 bg-gray-50 p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Breadcrumb
        items={[
          { label: "Referrals", path: "/admin/referrals/dashboard" },
          { label: "Manage Referral" },
        ]}
      />

      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Referrals</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure rules, track commissions, and approve payouts.
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2 mb-6 overflow-x-auto"
      >
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6"
      >
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.iconBg}`}
              >
                <Icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </motion.div>

      {activeTab !== "worker" ? (
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl border border-gray-200 shadow-sm"
        >
          <ComingSoonPanel
            label={TABS.find((t) => t.id === activeTab)?.label}
          />
        </motion.div>
      ) : (
        <>
          {/* Search + Filter */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-3 mb-4"
          >
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name, ID, or company..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Filter size={16} />
              Filter
            </button>
          </motion.div>

          {/* Table */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Referral ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Worker Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Referrer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Company
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Mobile
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Reward
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReferrals.length === 0 ? (
                    <tr>
                      <td
                        colSpan="9"
                        className="text-center py-10 text-gray-500"
                      >
                        No referrals found
                      </td>
                    </tr>
                  ) : (
                    filteredReferrals.map((ref, index) => (
                      <motion.tr
                        key={ref.id}
                        className="border-b border-gray-200 hover:bg-gray-50 last:border-none"
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                          {ref.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {ref.workerName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {ref.referrer}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {ref.company}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {ref.mobile}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {ref.date}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">
                          {ref.reward}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[ref.status]}`}
                          >
                            {STATUS_LABELS[ref.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              className="text-gray-400 hover:text-blue-600"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className="text-gray-400 hover:text-blue-600"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                {totalEntries === 0
                  ? "No entries found"
                  : `Showing ${startIndex} to ${totalEntries} of ${totalEntries} entries`}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft size={14} />
                  Prev
                </button>
                <span className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white font-medium">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default ManageReferral;