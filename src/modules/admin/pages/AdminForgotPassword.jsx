"use client";

import React, { useState } from "react";
import {
  Mail,
  ArrowLeft,
  Key,
  CheckCircle,
  AlertCircle,
  Shield,
} from "lucide-react";
import { useNavigate } from "@/lib/navigation";
import { useAdminForgotPassword } from "../adminhooks/useAdminForgotPassword";

const AdminForgotPassword = () => {
  const { requestPasswordReset, loading, error, success, clearError } =
    useAdminForgotPassword();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");
    clearError();

    if (!email.trim()) {
      setEmailError("Email address is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    await requestPasswordReset(email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-violet-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl">
              <Key className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">
            Admin Password Reset
          </h1>
          <p className="text-gray-600 mt-2">
            Enter your admin email and we'll send you a reset link
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          {!success ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Forgot Password?
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Don't worry, we'll help you reset it
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                      clearError();
                    }}
                    placeholder="admin@example.com"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition ${
                      emailError
                        ? "border-red-500"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  />
                  {emailError && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle size={14} />
                      {emailError}
                    </p>
                  )}
                </div>

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

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-700 hover:via-indigo-700 hover:to-violet-700 hover:shadow-lg"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Sending Reset Link...
                    </div>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Check Your Email
              </h2>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to{" "}
                <span className="font-semibold text-gray-800">{email}</span>
              </p>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  What's Next?
                </h3>
                <ul className="space-y-2 text-sm text-green-700">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>
                      Check your email for the reset link (spam folder too)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Click the link within 30 minutes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Set your new password</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Login with your new credentials</span>
                  </li>
                </ul>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => navigate("/admin/login")}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Admin Portal. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminForgotPassword;
