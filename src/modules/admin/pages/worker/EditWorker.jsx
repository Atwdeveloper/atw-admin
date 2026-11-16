"use client";

import React from "react";
import { useParams, useNavigate } from "@/lib/navigation";
import { User, Loader2 } from "lucide-react";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import WorkerForm from "../../components/worker/WorkerForm";

const EditWorkerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  if (permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!hasPermission("workers", "edit")) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md shadow-sm">
          <User className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to edit this worker's profile.</p>
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
    <div className="flex-1 bg-gray-50 p-6">
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Edit Worker Profile</h1>
        <p className="text-gray-600 mt-2">Update worker details and personal information</p>
      </div>
      <WorkerForm mode="edit" workerId={id} />
    </div>
  );
};

export default EditWorkerPage;
