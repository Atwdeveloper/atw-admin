"use client";

import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@/lib/navigation";
import {
  Users,
  Clock,
  UserCheck,
  IndianRupee,
  Eye,
} from "lucide-react";

import Breadcrumb from "../../../../common/components/Breadcrumb";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";

/**
 * TODO: Replace this static data with a real hook, e.g.
 * const { loading, stats, monthlyTrend, recentReferrals } = useReferralDashboard();
 * Keeping it local for now so the UI can be wired up first.
 */
const STATS = [
  {
    label: "Total Referrals",
    value: "1,245",
    icon: Users,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    label: "Pending Referrals",
    value: "342",
    icon: Clock,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
  {
    label: "Approved Referrals",
    value: "856",
    icon: UserCheck,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    label: "Total Commission Earned",
    value: "\u20B94.2L",
    icon: IndianRupee,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
];

const MONTHLY_TREND = [
  { month: "Jan", total: 45, joined: 22 },
  { month: "Feb", total: 58, joined: 30 },
  { month: "Mar", total: 40, joined: 18 },
  { month: "Apr", total: 65, joined: 38 },
  { month: "May", total: 52, joined: 20 },
  { month: "Jun", total: 62, joined: 40 },
];

const RECENT_REFERRALS = [
  {
    id: "REF-001",
    workerName: "Rahul Kumar",
    referrer: "Amit Singh",
    company: "Tech Mahindra",
    status: "approved",
    reward: "\u20B91,500",
    date: "12-Jul-2026",
  },
  {
    id: "REF-002",
    workerName: "Sunita Sharma",
    referrer: "Priya Patel",
    company: "Tata Motors",
    status: "pending",
    reward: "\u20B91,200",
    date: "11-Jul-2026",
  },
  {
    id: "REF-003",
    workerName: "Vikram Yadav",
    referrer: "Agent - Rajesh",
    company: "Reliance Retail",
    status: "joined",
    reward: "\u20B92,000",
    date: "10-Jul-2026",
  },
];

const STATUS_STYLES = {
  approved: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  joined: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
};

const STATUS_LABELS = {
  approved: "Approved",
  pending: "Pending",
  joined: "Joined",
  rejected: "Rejected",
};

// Simple CSS-based bar chart so we don't pull in an extra charting
// dependency just for this. Swap for recharts if it's already used
// elsewhere in the project.
const MonthlyReferralChart = ({ data }) => {
  const maxValue = Math.max(...data.map((d) => d.total), 1);
  const chartHeight = 220;

  return (
    <div>
      <div
        className="flex items-end justify-between gap-6 px-2"
        style={{ height: chartHeight }}
      >
        {data.map((item) => (
          <div
            key={item.month}
            className="flex-1 flex flex-col items-center justify-end h-full"
          >
            <div className="flex items-end gap-1.5 h-full">
              <div
                className="w-6 sm:w-8 rounded-t-md bg-blue-500"
                style={{
                  height: `${(item.total / maxValue) * 100}%`,
                }}
                title={`Total Referrals: ${item.total}`}
              />
              <div
                className="w-6 sm:w-8 rounded-t-md bg-emerald-500"
                style={{
                  height: `${(item.joined / maxValue) * 100}%`,
                }}
                title={`Successfully Joined: ${item.joined}`}
              />
            </div>
            <span className="text-xs text-gray-500 mt-2">{item.month}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-sm text-gray-600">Successfully Joined</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-sm text-gray-600">Total Referrals</span>
        </div>
      </div>
    </div>
  );
};

const ReferralDashboard = () => {
  const navigate = useNavigate();

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
          { label: "Dashboard" },
        ]}
      />

      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Referral Dashboard
        </h1>
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

      {/* Monthly Referral Trend */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Monthly Referral Trend
        </h2>
        <MonthlyReferralChart data={MONTHLY_TREND} />
      </motion.div>

      {/* Recent Referrals */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Recent Referrals
          </h2>
          <button
            onClick={() => navigate("/admin/referrals/manage")}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View All
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Referral ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Worker Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Referrer
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Company
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Reward
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {RECENT_REFERRALS.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-gray-500">
                    No referrals found
                  </td>
                </tr>
              ) : (
                RECENT_REFERRALS.map((ref, index) => (
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
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[ref.status]}`}
                      >
                        {STATUS_LABELS[ref.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {ref.reward}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {ref.date}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate("/admin/referrals/manage")}
                        className="text-gray-400 hover:text-blue-600"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReferralDashboard;