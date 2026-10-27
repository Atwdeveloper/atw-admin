"use client";

import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { Navigate, useLocation } from "@/lib/navigation";
import { useAuth } from "../../../common/hooks/useAuth";
import { CHANGE_PASSWORD_PATH } from "../../../api/javaApi";

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Until the password is changed the backend refuses everything else (403
  // MUST_CHANGE_PASSWORD), so keep the admin on the change-password screen.
  if (user?.mustChangePassword && pathname !== CHANGE_PASSWORD_PATH) {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 overflow-hidden">
      <div className="shrink-0">
        <Header toggleSidebar={toggleSidebar} />
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

        <main className="flex-1 overflow-y-auto px-6 py-4 pb-[50px] bg-gray-50 relative">
          {user?.mustChangePassword && (
            <div className="mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-800">
              For security, set a new password before using the admin panel.
            </div>
          )}
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AdminLayout;
