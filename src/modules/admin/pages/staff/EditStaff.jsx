"use client";

// pages/EditStaff.jsx
import { motion } from "framer-motion";

import { useNavigate, useParams } from "@/lib/navigation";
import { containerVariants } from "../../../../common/utils/motionVariants";
import StaffForm from "../../components/staff/StaffForm";

import Loader from "../../../../common/components/Loader";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";

const EditStaff = () => {
  const navigate = useNavigate();
  const { id } = useParams();
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

  if (!hasPermission("admin_staff", "edit")) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-lg p-8 text-center max-w-md shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to edit staff.
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

  // if (error || !staffData) {
  //   return (
  //     <motion.div
  //       className="flex-1 bg-gray-50 p-4"
  //       initial="hidden"
  //       animate="visible"
  //       variants={containerVariants}
  //     >
  //       <div className="text-center p-8">
  //         <div className="text-red-600 text-lg mb-4">
  //           {error || "Staff not found"}
  //         </div>
  //         <button
  //           onClick={() => navigate("/admin/staff/listing")}
  //           className="px-6 py-2.5 bg-blue-900 text-white rounded-lg hover:bg-blue-800 font-medium"
  //         >
  //           Back to Staff List
  //         </button>
  //       </div>
  //     </motion.div>
  //   );
  // }

  return (
    <motion.div
      className="flex-1 bg-gray-50 p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* FORM COMPONENT */}
      <StaffForm mode="edit" staffId={id} />
    </motion.div>
  );
};

export default EditStaff;
