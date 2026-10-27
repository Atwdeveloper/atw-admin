"use client";

import { motion } from "framer-motion";
import { useNavigate } from "@/lib/navigation";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";

import useAdminDashboard from "../../adminhooks/useAdminDashboard";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import { Shield } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const { data, loading, error } = useAdminDashboard();

  const canView = hasPermission("dashboard", "view");

  if (!permissionsLoading && !canView) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center min-h-[80vh]">
        <div className="bg-white rounded-lg p-8 text-center max-w-md shadow-sm border border-gray-100">
          <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to view the Dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (loading || permissionsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  const {
    stats,
    statusBreakdown,
    dressOrdersByStatus,
    vacanciesByStatus,
    recent,
  } = data || {};

  // ✅ ROUTE MAP (fixed agent issue)
  const routeMap = {
    workers: "/admin/worker/listing",
    jobs: "/admin/vacancy-listing",
    companies: "/admin/company/listing",
    agents: "/admin/agent/listing",
    vendors: "/admin/vendor/listing",
    staff: "/admin/staff/listing",
  };

  const renderFlatStatusCard = (title, dataObj) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>

      <div className="grid grid-cols-2 gap-4">
        {Object.entries(dataObj).map(([key, value]) => {
          const status = key.toLowerCase();

          const bgClass =
            status === "pending"
              ? "bg-yellow-100 border border-yellow-300 cursor-pointer hover:shadow-md"
              : status === "processing"
                ? "bg-orange-100 border border-orange-300"
                : status === "delivered"
                  ? "bg-green-100 border border-green-300"
                  : status === "active"
                    ? "bg-green-100 border border-green-300"
                    : status === "inactive"
                      ? "bg-red-200 border border-red-300"
                      : status === "expired"
                        ? "bg-red-100 border border-red-300"
                        : "bg-gray-50";

          return (
            <div
              key={key}
              onClick={() => {
                if (status === "pending") {
                  navigate("/admin/dress-orders");
                }
              }}
              className={`text-center p-3 rounded-xl transition-all ${bgClass}`}
            >
              <div className="text-2xl font-bold text-gray-800">{value}</div>

              <div className="text-sm text-gray-500 capitalize">{key}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const StatusBreakdownGrid = () => {
    if (!statusBreakdown) return null;

    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Status Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Object.entries(statusBreakdown).map(([entity, counts]) => {
            const route = routeMap[entity.toLowerCase()];
            return (
              <div
                key={entity}
                onClick={() => route && navigate(route)}
                className={`bg-gray-50 rounded-xl p-4 
                ${route ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
              `}
              >
                <div className="text-md font-semibold text-gray-700 capitalize mb-3">
                  {entity}
                </div>
                <div className="flex justify-between gap-2">
                  <div className="text-center flex-1">
                    <div className="text-xl font-bold text-green-600">
                      {counts.active || 0}
                    </div>
                    <div className="text-xs text-gray-500">Active</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-xl font-bold text-red-600">
                      {counts.inactive || 0}
                    </div>
                    <div className="text-xs text-gray-500">Inactive</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gray-50 w-full sm:px-6 md:px-8 py-0 md:py-4"
    >
      <motion.div
        variants={itemVariants}
        className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8"
      >
        Dashboard
      </motion.div>

      {/* ✅ STATS */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8"
      >
        {stats?.map((card, index) => {
          const key = card.title
            ?.toLowerCase()
            .replace("number of ", "")
            .replace(/\s+/g, "_");

          const route = routeMap[key];

          return (
            <div
              key={index}
              onClick={() => route && navigate(route)}
              className={`${card.bg} rounded-2xl p-4 sm:p-6 shadow-sm border ${card.border} w-full
                ${route ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-800 text-sm font-medium mb-2">
                    {card.title}
                  </p>
                  <p className={`text-3xl sm:text-4xl font-bold ${card.color}`}>
                    {card.value}
                  </p>
                </div>
                <img src={card.img} className="w-12 h-12 sm:w-14 sm:h-14" />
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* STATUS */}
      <motion.div variants={itemVariants} className="mb-8">
        <StatusBreakdownGrid />
      </motion.div>

      {/* OTHER CARDS */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
      >
        {dressOrdersByStatus &&
          renderFlatStatusCard("Dress Orders", dressOrdersByStatus)}
        {vacanciesByStatus &&
          renderFlatStatusCard("Vacancies", vacanciesByStatus)}
      </motion.div>

      {/* ✅ RECENT TABLES WITH VIEW ALL */}
      <motion.div variants={itemVariants} className="space-y-8">
        {recent?.agents?.length > 0 && (
          <RecentTable
            title="Recent Agents"
            data={recent.agents}
            columns={["agent_code", "name", "email", "created_at"]}
            route="/admin/agent/listing"
          />
        )}

        {recent?.companies?.length > 0 && (
          <RecentTable
            title="Recent Companies"
            data={recent.companies}
            columns={["company_code", "name", "email", "created_at"]}
            route="/admin/company/listing"
          />
        )}

        {recent?.staff?.length > 0 && (
          <RecentTable
            title="Recent Staff"
            data={recent.staff}
            columns={["name", "email", "created_at"]}
            route="/admin/staff/listing"
          />
        )}

        {recent?.workers?.length > 0 && (
          <RecentTable
            title="Recent Workers"
            data={recent.workers}
            columns={["worker_code", "name", "email", "created_at"]}
            route="/admin/worker/listing"
          />
        )}
      </motion.div>

      {/* <motion.div variants={itemVariants} className="mt-8">
        <JobList jobs={[]} />
      </motion.div> */}
    </motion.div>
  );
};

const RecentTable = ({ title, data, columns, route }) => {
  const navigate = useNavigate();

  if (!data?.length) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>

        {route && (
          <button
            onClick={() => navigate(route)}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            View All →
          </button>
        )}
      </div>

      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="px-6 py-4 text-left text-sm font-semibold text-gray-600"
              >
                {col.replace("_", " ")}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((item, idx) => (
            <tr key={idx}>
              {columns.map((col) => (
                <td key={col} className="px-6 py-4 text-sm text-gray-600">
                  {item[col]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
