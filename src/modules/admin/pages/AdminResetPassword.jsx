"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "@/lib/navigation";
import {
  Key,
  Lock,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useAdminForgotPassword } from "../adminhooks/useAdminForgotPassword";
import { toast } from "react-hot-toast";

// Same screen for a password-reset link (/admin/reset-password?token=...) and a
// new staff member's invite link (/admin/accept-invite?token=...).
const COPY = {
  reset: {
    invalidTitle: "Invalid Reset Link",
    invalidText: "This password reset link is no longer valid. Please request a new one.",
    title: "Create New Admin Password",
    subtitle: "Please create a new secure password for your admin account",
    cardTitle: "Reset Password",
    button: "Reset Password",
    busy: "Resetting Password...",
  },
  invite: {
    invalidTitle: "Invalid Invite Link",
    invalidText: "This invite link is no longer valid. Ask your administrator to send a new invite.",
    title: "Welcome to Anytime Work",
    subtitle: "Set a password to activate your admin account",
    cardTitle: "Set Your Password",
    button: "Set Password",
    busy: "Setting Password...",
  },
};

const AdminResetPassword = ({ mode = "reset" }) => {
  const copy = COPY[mode];
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword, loading, error, clearError } =
    useAdminForgotPassword();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState("");
  const [isValidToken, setIsValidToken] = useState(true);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tokenFromUrl = searchParams.get("token");

    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setIsValidToken(false);
      toast.error("The link is missing its token");
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      toast.error("Password must contain uppercase, lowercase and numbers");
      return;
    }

    await resetPassword(token, newPassword, confirmPassword, mode);
  };

  // ---------- Invalid token view ----------
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-violet-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-red-600 to-pink-600 rounded-xl">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">
              {copy.invalidTitle}
            </h1>
            <p className="text-gray-600 mt-2">
              The password reset link is invalid or has expired
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-3">
                Reset Link Error
              </h2>
              <p className="text-gray-600 mb-6">
                {copy.invalidText}
              </p>

              <div className="space-y-3">
                {mode === "reset" && (
                <button
                  onClick={() => navigate("/admin/forgot-password")}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
                >
                  Request New Reset Link
                </button>
                )}
                <button
                  onClick={() => navigate("/admin/login")}
                  className="w-full py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>

          <div className="text-center mt-6 text-gray-500 text-sm">
            <p>
              © {new Date().getFullYear()} Admin Portal. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Reset form view ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-violet-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl">
              <Key className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">
            {copy.title}
          </h1>
          <p className="text-gray-600 mt-2">
            {copy.subtitle}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {copy.cardTitle}
              </h2>
              <p className="text-gray-600 text-sm">
                Enter your new password below
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Lock className="w-4 h-4" />
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    clearError();
                  }}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 hover:border-gray-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {/* Password strength indicators */}
              <div className="text-xs text-gray-500 space-y-1 mt-2">
                <p className="flex items-center gap-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${newPassword.length >= 8 ? "bg-green-500" : "bg-gray-300"}`}
                  ></span>
                  At least 8 characters
                </p>
                <p className="flex items-center gap-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${/(?=.*[a-z])/.test(newPassword) ? "bg-green-500" : "bg-gray-300"}`}
                  ></span>
                  At least one lowercase letter
                </p>
                <p className="flex items-center gap-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${/(?=.*[A-Z])/.test(newPassword) ? "bg-green-500" : "bg-gray-300"}`}
                  ></span>
                  At least one uppercase letter
                </p>
                <p className="flex items-center gap-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${/(?=.*\d)/.test(newPassword) ? "bg-green-500" : "bg-gray-300"}`}
                  ></span>
                  At least one number
                </p>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Lock className="w-4 h-4" />
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearError();
                  }}
                  placeholder="Confirm new password"
                  className={`w-full px-4 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition ${
                    confirmPassword && newPassword !== confirmPassword
                      ? "border-red-500"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle size={14} />
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Error display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-700 text-sm font-medium">
                      Reset Failed
                    </p>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={
                loading ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword
              }
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                loading ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-600 via-teal-600 to-emerald-600 hover:from-green-700 hover:via-teal-700 hover:to-emerald-700 hover:shadow-lg"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  {copy.busy}
                </div>
              ) : (
                copy.button
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate("/admin/login")}
              className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </div>
        </div>

        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Admin Portal. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminResetPassword;
