"use client";

// pages/AddStaff.jsx
import { motion } from "framer-motion";

import { useNavigate } from "@/lib/navigation";
import { containerVariants } from "../../../../common/utils/motionVariants";
import StaffForm from "../../components/staff/StaffForm";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import Loader from "../../../../common/components/Loader";

const AddStaff = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  if (permissionsLoading) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader />
        </div>
      </div>
    );
  }

  if (!hasPermission("admin_staff", "create")) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-lg p-8 text-center max-w-md shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to add staff.
          </p>
          <button
            onClick={() => navigate("/admin/staff/listing")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex-1 bg-gray-50 p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* FORM COMPONENT */}
      <StaffForm mode="create" />
    </motion.div>
  );
};

export default AddStaff;
