"use client";

// modules/admin/pages/SalaryManagement.jsx
import { motion } from "framer-motion";
import {
  Edit2,
  Trash2,
  Plus,
  Eye,
  Users,
  User,
  Hash,
  Calendar,
  ArrowLeft,
  Sparkles,
  Heart,
  Zap,
  CheckCircle,
  IndianRupee,
  Percent,
  Calculator,
  Settings,
  FileText,
  Shield,
  Award,
  Home,
  Car,
} from "lucide-react";
import { useNavigate } from "@/lib/navigation";
import { useState } from "react";
import {
  containerVariants,
  itemVariants,
  tableRowVariants,
  sparkleVariants,
  heartVariants,
  zapVariants,
} from "../../../../common/utils/motionVariants";
import SalaryConfigModal from "../../components/salary/SalaryConfigModal";
import { useSalaryManagement } from "../../adminhooks/useSalaryManagement";

const SalaryManagement = () => {
  const navigate = useNavigate();

  const {
    salaryConfigs,
    loading,
    page,
    totalItems,
    totalPages,
    filters,
    setPage,
    setFilters,
    handleSearch,
    handleClear,
    handleDeleteConfig,
    fetchSalaryConfigs,
  } = useSalaryManagement({ autoFetch: true });

  const [selectedConfig, setSelectedConfig] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("config"); // 'config' or 'employee'

  const openViewModal = (config) => {
    setSelectedConfig(config);
    setIsModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedConfig(null);
    setIsModalOpen(false);
  };

  // Function to get config type icon
  const getConfigTypeIcon = (type) => {
    switch (type) {
      case "basic":
        return <Percent className="w-4 h-4 text-blue-600" />;
      case "hra":
        return <Home className="w-4 h-4 text-green-600" />;
      case "conveyance":
        return <Car className="w-4 h-4 text-orange-600" />;
      case "bonus":
        return <Award className="w-4 h-4 text-purple-600" />;
      case "pf":
        return <Shield className="w-4 h-4 text-red-600" />;
      case "esi":
        return <Shield className="w-4 h-4 text-indigo-600" />;
      default:
        return <Settings className="w-4 h-4 text-gray-600" />;
    }
  };

  // Function to get config type color
  const getConfigTypeColor = (type) => {
    switch (type) {
      case "basic":
        return "bg-blue-100 text-blue-800";
      case "hra":
        return "bg-green-100 text-green-800";
      case "conveyance":
        return "bg-orange-100 text-orange-800";
      case "bonus":
        return "bg-purple-100 text-purple-800";
      case "pf":
        return "bg-red-100 text-red-800";
      case "esi":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to format value based on type
  const formatConfigValue = (type, value) => {
    switch (type) {
      case "basic":
      case "hra":
      case "bonus":
      case "pf_employer":
      case "pf_admin":
      case "esi_employer":
        return `${value}%`;
      case "conveyance":
      case "min_wage":
        return `₹${parseInt(value).toLocaleString()}`;
      case "pf_wage_cap":
      case "esi_wage_limit":
        return value ? `₹${parseInt(value).toLocaleString()}` : "No Limit";
      default:
        return value;
    }
  };

  return (
    <motion.div
      className="flex-1 bg-gray-50 p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* HERO SECTION */}
      <motion.div
        className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-gray-200 mb-8"
        variants={itemVariants}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.3 }}
      >
        {/* Floating Icons */}
        <motion.div
          className="absolute top-4 right-8 text-yellow-400"
          variants={sparkleVariants}
          animate="animate"
        >
          <Sparkles className="w-6 h-6" />
        </motion.div>
        <motion.div
          className="absolute top-12 right-20 text-red-400"
          variants={heartVariants}
          animate="animate"
        >
          <Heart className="w-4 h-4" />
        </motion.div>
        <motion.div
          className="absolute bottom-8 right-12 text-orange-400"
          variants={zapVariants}
          animate="animate"
        >
          <Zap className="w-5 h-5" />
        </motion.div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
          {/* LEFT: Title + Subtitle */}
          <div className="space-y-3">
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.button
                onClick={() => navigate("/admin/dashboard")}
                className="w-10 h-10 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 hover:bg-white/80 transition"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </motion.button>

              <motion.h1
                className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                Salary Management
              </motion.h1>
            </motion.div>

            <motion.div
              className="flex items-center space-x-2 pl-12"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Calculator className="w-5 h-5 text-blue-500" />
              <p className="text-lg text-slate-600 font-medium">
                Configure and manage salary structures and rules
              </p>
            </motion.div>

            {/* Toggle View Mode */}
            <motion.div
              className="flex items-center gap-4 pl-12 mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="inline-flex bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-white/30">
                <button
                  onClick={() => setViewMode("config")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    viewMode === "config"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Salary Config
                  </div>
                </button>
                <button
                  onClick={() => setViewMode("employee")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    viewMode === "employee"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Employee Salary
                  </div>
                </button>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Add Button */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto"
          >
            <button
              onClick={() => navigate("/admin/salary/config/add")}
              className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-5 py-3 rounded-lg shadow-lg font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Add New Rule
            </button>
            <button
              onClick={() => navigate("/admin/salary/bulk-assign")}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-lg shadow border border-gray-200 font-medium transition"
            >
              <Users className="w-4 h-4" />
              Bulk Assign
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* CONFIGURATION VIEW */}
      {viewMode === "config" && (
        <>
          {/* SEARCH FILTER CARD */}
          <motion.div
            className="bg-white rounded-[22px] border border-[#DDDDDD] shadow-sm p-6 mb-8"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold text-gray-800">
                  <span className="text-blue-900 bg-blue-100 px-4 py-2 rounded-lg">
                    Search Salary Rules
                  </span>
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {/* Config Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rule Type
                </label>
                <div className="relative">
                  <Settings
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <select
                    value={filters.config_type}
                    onChange={(e) =>
                      setFilters({ ...filters, config_type: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 appearance-none bg-white"
                  >
                    <option value="">All Types</option>
                    <option value="basic">Basic Salary</option>
                    <option value="hra">HRA</option>
                    <option value="conveyance">Conveyance</option>
                    <option value="bonus">Statutory Bonus</option>
                    <option value="pf">PF Rules</option>
                    <option value="esi">ESI Rules</option>
                  </select>
                </div>
              </div>

              {/* Config Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rule Name
                </label>
                <div className="relative">
                  <FileText
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Enter rule name"
                    value={filters.config_name}
                    onChange={(e) =>
                      setFilters({ ...filters, config_name: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="relative">
                  <CheckCircle
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 appearance-none bg-white"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-end gap-4">
                <button
                  onClick={() => {
                    handleClear();
                    fetchSalaryConfigs();
                  }}
                  className="px-8 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    handleSearch();
                    fetchSalaryConfigs();
                  }}
                  className="px-8 py-2.5 bg-blue-900 text-white rounded-lg hover:bg-amber-800 font-medium"
                >
                  Search
                </button>
              </div>
            </div>
          </motion.div>

          {/* TABLE */}
          <motion.div
            className="bg-white rounded-[22px] border border-[#DDDDDD] shadow-sm overflow-hidden"
            variants={itemVariants}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-800">
                Salary Configuration Rules
              </h2>
              <div className="text-sm text-gray-500">
                Total: {salaryConfigs.length} rules
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {[
                      "Rule ID",
                      "Rule Type",
                      "Rule Name",
                      "Value",
                      "Effective From",
                      "Status",
                      "Actions",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-6 py-4 text-left text-sm font-semibold text-gray-600"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="text-center py-6 text-gray-500"
                      >
                        <div className="flex justify-center">
                          <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      </td>
                    </tr>
                  ) : salaryConfigs.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="text-center py-8 text-gray-500"
                      >
                        <Calculator className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-lg">No salary rules found.</p>
                        <p className="text-sm mt-1">
                          Create your first rule by clicking "Add New Rule"
                          above.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    salaryConfigs.map((config, index) => (
                      <motion.tr
                        key={config.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.1 }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-amber-600" />
                            <span className="font-mono font-semibold text-gray-800">
                              {config.config_code ||
                                `SAL-${config.id.toString().padStart(5, "0")}`}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`p-2 rounded-lg ${getConfigTypeColor(config.config_type)}`}
                            >
                              {getConfigTypeIcon(config.config_type)}
                            </div>
                            <span className="font-medium capitalize">
                              {config.config_type === "pf_employer"
                                ? "PF (Employer)"
                                : config.config_type === "esi_employer"
                                  ? "ESI (Employer)"
                                  : config.config_type.replace("_", " ")}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {config.config_name}
                          </div>
                          {config.description && (
                            <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {config.description}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-bold text-lg text-gray-900">
                            {formatConfigValue(
                              config.config_type,
                              config.value,
                            )}
                          </div>
                          {config.min_value && config.max_value && (
                            <div className="text-xs text-gray-500 mt-1">
                              Range:{" "}
                              {formatConfigValue(
                                config.config_type,
                                config.min_value,
                              )}{" "}
                              -{" "}
                              {formatConfigValue(
                                config.config_type,
                                config.max_value,
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">
                              {new Date(
                                config.effective_from,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          {config.effective_to && (
                            <div className="text-xs text-gray-500 mt-1">
                              To:{" "}
                              {new Date(
                                config.effective_to,
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
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
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {/* View */}
                            <button
                              onClick={() => openViewModal(config)}
                              className="p-2 text-gray-600 hover:text-amber-600 bg-gray-100 hover:bg-amber-50 rounded-lg transition"
                              title="View Rule Details"
                            >
                              <Eye size={16} />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() =>
                                navigate(
                                  `/admin/salary/config/edit/${config.id}`,
                                )
                              }
                              className="p-2 text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Rule"
                            >
                              <Edit2 size={16} />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteConfig(config.id)}
                              className="p-2 text-gray-600 hover:text-red-600 bg-gray-100 hover:bg-red-50 rounded-lg transition"
                              title="Delete Rule"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* PAGINATION */}
          {salaryConfigs.length > 0 && (
            <motion.div className="flex items-center justify-center space-x-2 mt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition 
                  ${page === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-black hover:text-white"}`}
              >
                Prev
              </button>

              {[...Array(totalPages)].map((_, index) => {
                const p = index + 1;
                if (
                  p === 1 ||
                  p === totalPages ||
                  (p >= page - 2 && p <= page + 2)
                ) {
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl border text-sm shadow-sm transition
                        ${page === p ? "bg-amber-900 text-white" : "bg-white hover:bg-amber-900 hover:text-white"}`}
                    >
                      {p}
                    </button>
                  );
                }
                if (p === page - 3 || p === page + 3) {
                  return (
                    <span key={p} className="px-2">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition 
                  ${page === totalPages ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-black hover:text-white"}`}
              >
                Next
              </button>
            </motion.div>
          )}

          {/* STATS SUMMARY */}
          <motion.div
            className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4"
            variants={itemVariants}
          >
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Rules</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalItems}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Rules</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {salaryConfigs.filter((c) => c.status === "active").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">% Rules</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {
                      salaryConfigs.filter((c) =>
                        [
                          "basic",
                          "hra",
                          "bonus",
                          "pf_employer",
                          "esi_employer",
                        ].includes(c.config_type),
                      ).length
                    }
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Percent className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Amount Rules</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {
                      salaryConfigs.filter((c) =>
                        ["conveyance", "min_wage"].includes(c.config_type),
                      ).length
                    }
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <IndianRupee className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* EMPLOYEE SALARY VIEW */}
      {viewMode === "employee" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Employee Salary Setup
                </h3>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-gray-600 mb-4">
                Assign salary structures to individual employees
              </p>
              <button
                onClick={() => navigate("/admin/salary/employee-setup")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
              >
                Manage Employee Salary
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Bulk Salary Assignment
                </h3>
                <Users className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-gray-600 mb-4">
                Assign salary rules to multiple employees at once
              </p>
              <button
                onClick={() => navigate("/admin/salary/bulk-assign")}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium"
              >
                Bulk Assign
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Salary Preview & Reports
                </h3>
                <FileText className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-gray-600 mb-4">
                Generate salary previews and compliance reports
              </p>
              <button
                onClick={() => navigate("/admin/salary/reports")}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium"
              >
                View Reports
              </button>
            </div>
          </div>

          {/* Recent Employee Salary Updates */}
          <motion.div
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
            variants={itemVariants}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                Recent Employee Salary Updates
              </h3>
              <button
                onClick={() => navigate("/admin/salary/employee-history")}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      CTC
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      Basic
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      HRA
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      Effective Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Placeholder for employee salary data */}
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Rajesh Kumar</div>
                          <div className="text-sm text-gray-500">WK-0042</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">₹25,000</td>
                    <td className="px-4 py-3">₹12,500</td>
                    <td className="px-4 py-3">₹6,250</td>
                    <td className="px-4 py-3 text-sm">01 Apr 2025</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Active
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* VIEW MODAL */}
      <SalaryConfigModal
        config={selectedConfig}
        isOpen={isModalOpen}
        onClose={closeViewModal}
      />
    </motion.div>
  );
};

export default SalaryManagement;
