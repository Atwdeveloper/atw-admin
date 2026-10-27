"use client";

import { useEffect } from "react";
import { useBlocker } from "@/lib/navigation";
import Swal from "sweetalert2";

export default function useUnsavedChangesWarning(isDirty, customMessage = null) {
  // Default message
  const defaultMessage = "You have unsaved changes. Do you want to leave without saving?";
  const message = customMessage || defaultMessage;

  // 🔹 Warn on browser tab close / refresh
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
      return ""; 
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  // 🔹 CORRECTED: Use useBlocker properly
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => {
      // Only block if form is dirty AND we're changing routes
      if (!isDirty) return false;
      
      // Don't block if staying on same pathname
      if (currentLocation.pathname === nextLocation.pathname) return false;
      
      return true;
    }
  );

  // Handle blocked navigation
  useEffect(() => {
    if (blocker.state === "blocked") {
      Swal.fire({
        title: "Unsaved Changes",
        text: message,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Leave Anyway",
        cancelButtonText: "Stay Here",
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        reverseButtons: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then((result) => {
        if (result.isConfirmed) {
          // User confirmed - proceed with navigation
          blocker.proceed();
        } else {
          // User cancelled - reset the blocker
          blocker.reset();
        }
      });
    }
  }, [blocker, message]);

  // Reset blocker when form becomes clean
  useEffect(() => {
    if (!isDirty && blocker.state === "blocked") {
      blocker.reset();
    }
  }, [isDirty, blocker]);
}