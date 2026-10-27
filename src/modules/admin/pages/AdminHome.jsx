"use client";

import { Navigate, useNavigate } from "@/lib/navigation";
import { motion } from "framer-motion";
import { Key, User } from "lucide-react";
import { useAdminPermissions } from "../../../common/hooks/useAdminPermissions";
import { useAuth } from "../../../common/hooks/useAuth";
import Loader from "../../../common/components/Loader";

// /admin/dashboard. There's no dashboard API on the new backend yet, so this
// sends the admin to the first section they can use.
const AdminHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission, loading } = useAdminPermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader />
      </div>
    );
  }

  if (hasPermission("admin_staff", "view")) return <Navigate to="/admin/staff/listing" replace />;
  if (hasPermission("admin_roles", "view")) return <Navigate to="/admin/roles" replace />;

  return (
    <motion.div
      className="flex-1 bg-gray-50 p-4 flex items-center justify-center min-h-[60vh]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center max-w-md">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Welcome{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}
        </h2>
        <p className="text-gray-600 mb-6">
          Your account doesn't have access to any admin sections yet. Ask a super-admin to assign
          you a role.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => navigate("/admin/myprofile")}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <User size={16} /> My Profile
          </button>
          <button
            onClick={() => navigate("/admin/settings/change-password")}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            <Key size={16} /> Change Password
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminHome;
