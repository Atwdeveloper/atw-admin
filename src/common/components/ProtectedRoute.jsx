"use client";

import React from "react";
import { Navigate, useLocation } from "@/lib/navigation";
import { useAuth } from "../hooks/useAuth";
import Loader from "./Loader";

// Admin-only now that the admin panel is its own app: anyone who isn't a
// signed-in admin/admin_staff goes to the admin login.
export default function ProtectedRoute({ children, allowedRoles }) {
  const { role, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="">
        <Loader />
      </div>
    );
  }

  if (!isAuthenticated || (allowedRoles && !allowedRoles.includes(role))) {
    return <RedirectToLogin />;
  }

  return children;
}

// Separate component so useLocation (which reads the query string) only runs
// in the browser, never while the page is prerendered.
function RedirectToLogin() {
  const location = useLocation();
  return <Navigate to="/admin/login" state={{ from: location }} replace />;
}
