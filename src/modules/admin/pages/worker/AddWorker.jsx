"use client";

import React from "react";
import { useNavigate } from "@/lib/navigation";
import { motion } from "framer-motion";
import { User, Loader2 } from "lucide-react";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import { containerVariants } from "../../../../common/utils/motionVariants";
import WorkerForm from "../../components/worker/WorkerForm";

// Bulk upload is not offered: the Java backend has no bulk worker import yet.
const AddWorker = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  if (permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!hasPermission("workers", "create")) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md shadow-sm">
          <User className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to add a worker.</p>
          <button
            onClick={() => navigate("/admin/worker/listing")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go Back to Worker Listing
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="p-4 w-full overflow-y-auto">
      <h1 className="text-2xl font-semibold text-slate-800 mb-2">Add New Worker</h1>
      <p className="text-sm text-slate-500 mb-2">
        Verify the worker's mobile number and Aadhaar to auto-fill their details, or fill the form in manually.
      </p>
      <WorkerForm mode="create" />
    </motion.div>
  );
};

export default AddWorker;
