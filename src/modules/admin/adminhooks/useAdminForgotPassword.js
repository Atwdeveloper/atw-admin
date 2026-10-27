"use client";

import { useState } from "react";
import { useNavigate } from "@/lib/navigation";
import { toast } from "react-hot-toast";
import {
  forgotPasswordAPI,
  resetPasswordAPI,
  acceptInviteAPI,
} from "../../../api/adminV1/authAPI";
import { apiError } from "../../../api/javaApi";

export const useAdminForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // ==================== FORGOT PASSWORD ====================
  const requestPasswordReset = async (email) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      if (!email.trim()) {
        setError("Email address is required");
        return;
      }
      if (!/\S+@\S+\.\S+/.test(email)) {
        setError("Please enter a valid email address");
        return;
      }

      // Always succeeds — the backend never reveals whether the email exists.
      await forgotPasswordAPI(email.trim());
      setSuccess(true);
      toast.success("If that email belongs to an admin, a reset link is on its way.");
    } catch (err) {
      setError(apiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  // ============ RESET PASSWORD / ACCEPT STAFF INVITE ============
  // Both take the token from the emailed link and set a new password.
  const resetPassword = async (token, newPassword, confirmPassword, mode = "reset") => {
    try {
      setLoading(true);
      setError(null);

      if (!token) return setError("Reset token is required");
      if (!newPassword) return setError("New password is required");
      if (newPassword.length < 8 || newPassword.length > 100) {
        return setError("Password must be 8 to 100 characters");
      }
      if (newPassword !== confirmPassword) {
        return setError("Passwords do not match");
      }

      if (mode === "invite") {
        await acceptInviteAPI(token, newPassword);
        toast.success("Your password is set. You can now log in.");
      } else {
        await resetPasswordAPI(token, newPassword);
        toast.success("Password reset successful. Please log in.");
      }
      navigate("/admin/login", { replace: true });
    } catch (err) {
      const { code, message, fieldErrors } = apiError(err);
      setError(
        fieldErrors.newPassword ||
          fieldErrors.password ||
          (code === "UNAUTHORIZED" || code === "RESOURCE_NOT_FOUND"
            ? "This link is invalid or has expired. Please request a new one."
            : message),
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    requestPasswordReset,
    resetPassword,
    loading,
    error,
    success,
    clearError: () => setError(null),
  };
};
