"use client";

import { useNavigate } from "@/lib/navigation";
import { Building2, Loader2 } from "lucide-react";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import CompanyForm from "../../components/company/CompanyForm";

const AddCompany = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  if (permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!hasPermission("company", "create")) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md shadow-sm">
          <Building2 className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to add a company.</p>
          <button
            onClick={() => navigate("/admin/company/listing")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go Back to Company Listing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 w-full overflow-y-auto">
      <h1 className="text-2xl font-semibold text-slate-800 mb-2">Add New Company</h1>
      <p className="text-sm text-slate-500">
        The company starts as Pending Verification. Its owner gets an invite email to set up their login.
      </p>
      <CompanyForm mode="create" />
    </div>
  );
};

export default AddCompany;
