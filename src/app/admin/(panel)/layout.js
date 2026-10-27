"use client";

import ProtectedRoute from "@/common/components/ProtectedRoute";
import { PermissionProvider } from "@/common/hooks/useAdminPermissions";
import AdminLayout from "@/modules/admin/layout/AdminLayout";

export default function PanelLayout({ children }) {
  return (
    <PermissionProvider>
      <ProtectedRoute allowedRoles={["admin", "admin_staff"]}>
        <AdminLayout>{children}</AdminLayout>
      </ProtectedRoute>
    </PermissionProvider>
  );
}
