"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Users,
  Key,
  FileText,
  ChevronDown,
  ChevronUp,
  Lock,
  AlertCircle,
  Building,
  Briefcase,
  Settings,
  Bell,
  BarChart,
  Users2,
  Shirt,
  Eye,
  EyeOff,
  CreditCard,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@/lib/navigation";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";

// Helper function to process permissions from the new format
const processPermissions = (permissionsArray) => {
  const grouped = {};
  let totalPermissions = 0;

  if (!permissionsArray || !Array.isArray(permissionsArray)) {
    return { grouped, totalPermissions };
  }

  permissionsArray.forEach((moduleData) => {
    const { module, module_label, actions } = moduleData;

    if (actions && Array.isArray(actions) && actions.length > 0) {
      grouped[module] = {
        label: module_label,
        actions: actions.map((action) => ({
          key: `${module}.${action.action}`,
          action: action.action,
          label: action.label,
        })),
      };
      totalPermissions += actions.length;
    }
  });

  return { grouped, totalPermissions };
};

// Module icons mapping
const getModuleIcon = (module) => {
  const icons = {
    dashboard: <BarChart className="w-4 h-4" />,
    companies: <Building className="w-4 h-4" />,
    workers: <Users className="w-4 h-4" />,
    configuration: <Settings className="w-4 h-4" />,
    settings: <Settings className="w-4 h-4" />,
    notifications: <Bell className="w-4 h-4" />,
    jobs: <Briefcase className="w-4 h-4" />,
    reports: <BarChart className="w-4 h-4" />,
    teams: <Users2 className="w-4 h-4" />,
    staff: <Users className="w-4 h-4" />,
    roles: <Shield className="w-4 h-4" />,
    dress_orders: <Shirt className="w-4 h-4" />,
    payroll: <CreditCard className="w-4 h-4" />,
  };
  return icons[module] || <Lock className="w-4 h-4" />;
};

// Helper to get user initials
const getInitials = (name = "") => {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
};

const ViewRoleModal = ({ role, isOpen, onClose }) => {
  const [copiedPermission, setCopiedPermission] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [showPermissions, setShowPermissions] = useState(true);
  const [showUsers, setShowUsers] = useState(true);
  const navigate = useNavigate();
  const { hasPermission } = useAdminPermissions();

  if (!isOpen || !role) return null;

  // Process permissions from the new format
  const { grouped: groupedPermissions, totalPermissions: permissionCount } =
    processPermissions(role.permissions);
  const moduleCount = Object.keys(groupedPermissions).length;

  // Users data
  const assignedUsers = role.users || [];
  const totalUsers = role.total_users || assignedUsers.length;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleModule = (moduleName) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleName]: !prev[moduleName],
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPermission(text);
    setTimeout(() => setCopiedPermission(null), 2000);
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
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center border border-gray-200 shadow-sm">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {role.profile_name || role.title}
                </h2>
                <p className="text-gray-600 mt-1">
                  {role.description || "No description provided"}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  {/* <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      role.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {role.status === "active" ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </span> */}
                  <span className="text-sm text-gray-500 font-mono">
                    ID: {role.id}
                  </span>
                  <span className="text-sm text-gray-500">
                    Users: {totalUsers}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-gray-600 border border-gray-200 hover:border-gray-300 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div
                  className="bg-blue-50 rounded-xl p-4 border border-blue-100"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-blue-600">
                        Assigned Users
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {totalUsers}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-green-50 rounded-xl p-4 border border-green-100"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Key className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-green-600">
                        Total Permissions
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {role.total_permissions || permissionCount}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="bg-purple-50 rounded-xl p-4 border border-purple-100"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-purple-600">Modules</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {moduleCount}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Permissions Section */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Key className="w-5 h-5 text-gray-600" />
                    Assigned Permissions
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      ({role.total_permissions || permissionCount} permissions
                      across {moduleCount} modules)
                    </span>
                  </h3>
                  <button
                    onClick={() => setShowPermissions(!showPermissions)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    {showPermissions ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    {showPermissions ? "Hide" : "Show"}
                  </button>
                </div>

                {showPermissions && (
                  <div className="p-5">
                    {permissionCount === 0 ? (
                      <div className="text-center py-8">
                        <Key className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-600">
                          No permissions assigned to this role
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Users with this role will have no access
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {Object.entries(groupedPermissions).map(
                          ([module, moduleData]) => {
                            const isExpanded =
                              expandedModules[module] !== false;

                            return (
                              <div
                                key={module}
                                className="border border-gray-200 rounded-lg overflow-hidden"
                              >
                                {/* Module Header */}
                                <div
                                  className="px-4 py-3 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition"
                                  onClick={() => toggleModule(module)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white rounded flex items-center justify-center border border-gray-200">
                                      {getModuleIcon(module)}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-gray-800">
                                        {moduleData.label}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {moduleData.actions.length} permission
                                        {moduleData.actions.length !== 1
                                          ? "s"
                                          : ""}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="px-2 py-1 bg-white border border-gray-300 text-xs font-medium rounded">
                                      {moduleData.actions.length} items
                                    </div>
                                    {isExpanded ? (
                                      <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                      <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                  </div>
                                </div>

                                {/* Module Actions */}
                                {isExpanded && (
                                  <div className="bg-white p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {moduleData.actions.map((item, index) => (
                                        <motion.div
                                          key={item.key}
                                          initial={{ opacity: 0, y: 10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: index * 0.05 }}
                                          className="p-2 rounded-lg border border-gray-200 hover:border-blue-300 transition group"
                                        >
                                          <div className="flex items-center  gap-3">
                                            <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center">
                                              <Lock className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <div className="flex-1">
                                              <div className="flex items-center justify-between font-medium text-gray-800 mb-1">
                                                {item.label}
                                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                                  Allowed
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </motion.div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          },
                        )}
                      </div>
                    )}

                    {/* Quick Stats */}
                    {permissionCount > 0 && (
                      <div className="mt-6 pt-5 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Permission Distribution
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(groupedPermissions).map(
                            ([module, moduleData]) => (
                              <div
                                key={module}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg flex items-center gap-2"
                              >
                                {getModuleIcon(module)}
                                <span>{moduleData.label}</span>
                                <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs">
                                  {moduleData.actions.length}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Users Section (NEW) */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    Users with this role
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      ({totalUsers} user{totalUsers !== 1 ? "s" : ""})
                    </span>
                  </h3>

                  <button
                    onClick={() => setShowUsers(!showUsers)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    {showUsers ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    {showUsers ? "Hide" : "Show"}
                  </button>
                </div>

                {showUsers && (
                  <div className="p-5">
                    {assignedUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-600">
                          No users assigned to this role
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {assignedUsers.map((user, idx) => (
                          <div
                            key={user.user_id || idx}
                            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300"
                          >
                            {/* Avatar */}
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                              {getInitials(user.name)}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {user.name || "Unknown"}
                              </p>
                              <p className="text-sm text-gray-500">
                                {user.email || "No email"}
                              </p>
                            </div>

                            {/* Status dot */}
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Summary & Actions */}
            <div className="space-y-6">
              {/* Permission Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  Quick Summary
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-gray-500 mt-1">
                      {role.status === "active"
                        ? "This role is currently active and assigned to users"
                        : "This role is inactive and not assigned to any user"}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-2">
                      Permission Coverage
                    </div>
                    <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(
                            ((role.total_permissions || permissionCount) / 50) *
                              100,
                            100,
                          )}%`,
                        }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`h-full rounded-full ${
                          (role.total_permissions || permissionCount) > 30
                            ? "bg-green-500"
                            : (role.total_permissions || permissionCount) > 15
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                        }`}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>
                        {role.total_permissions || permissionCount} permissions
                      </span>
                      <span>{moduleCount} modules</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-2">
                      Top Modules
                    </div>
                    <div className="space-y-2">
                      {Object.entries(groupedPermissions)
                        .sort(
                          (a, b) => b[1].actions.length - a[1].actions.length,
                        )
                        .slice(0, 3)
                        .map(([module, moduleData]) => (
                          <div
                            key={module}
                            className="flex justify-between items-center"
                          >
                            <div className="flex items-center gap-2">
                              {getModuleIcon(module)}
                              <span className="text-sm text-gray-700">
                                {moduleData.label}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {moduleData.actions.length}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* User Impact */}
              <div className="bg-orange-50 rounded-xl border border-orange-200 p-5">
                <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  User Impact
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-orange-700">
                      Affected Users
                    </span>
                    <span className="font-bold text-orange-900">
                      {totalUsers}
                    </span>
                  </div>

                  <div className="text-sm text-orange-600">
                    Any changes to this role's permissions will immediately
                    affect all {totalUsers} user
                    {totalUsers !== 1 ? "s" : ""} assigned to it.
                  </div>

                  <div className="text-xs text-orange-500 bg-orange-100 p-2 rounded">
                    <div className="font-medium mb-1">Recommendation:</div>
                    Test permission changes in a staging environment before
                    applying to production roles.
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Role ID: {role.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>
                    Created: {formatDate(role.created_at || role.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>
                    Updated: {formatDate(role.updated_at || role.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Viewing role details • {role.total_permissions || permissionCount}{" "}
            permission
            {(role.total_permissions || permissionCount) !== 1
              ? "s"
              : ""} • {totalUsers} user
            {totalUsers !== 1 ? "s" : ""}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Close
            </button>
            {hasPermission("admin_roles", "edit") && (
              <button
                onClick={() => {
                  navigate(`/admin/roles/edit/${role.id}`);
                  onClose();
                  // Navigate to edit
                }}
                className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 font-medium"
              >
                Edit Role
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ViewRoleModal;
