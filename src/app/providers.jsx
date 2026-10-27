"use client";

import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/common/context/AuthContext";
import { ThemeProvider } from "@/common/hooks/ThemeContext";

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <Toaster position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  );
}
