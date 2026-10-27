"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Button from "../../components/Button";
import {
  formcontainerVariants,
  formitemVariants,
} from "../../../../common/utils/motionVariants";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { useAdminProfile } from "../../adminhooks/useAdminProfile";

const ChangePassword = () => {
  const { loading, error, handleChangePassword } = useAdminProfile();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });

    // Validate password requirements in real-time for new password
    if (name === "newPassword") {
      setPasswordRequirements({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      });
    }
  };

  const validate = () => {
    let newErrors = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(
        formData.newPassword,
      )
    ) {
      newErrors.newPassword = "Password does not meet requirements";
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Check if new password is same as current
    if (
      formData.newPassword &&
      formData.currentPassword &&
      formData.newPassword === formData.currentPassword
    ) {
      newErrors.newPassword =
        "New password must be different from current password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validate()) {
      const success = await handleChangePassword(
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword,
      );

      if (success) {
        // Reset form on success
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordRequirements({
          length: false,
          uppercase: false,
          lowercase: false,
          number: false,
          special: false,
        });
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setErrors({});
    setPasswordRequirements({
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    });
  };

  const PasswordRequirement = ({ met, text }) => (
    <div className="flex items-center gap-2">
      {met ? (
        <CheckCircle size={16} className="text-green-500" />
      ) : (
        <XCircle size={16} className="text-gray-400" />
      )}
      <span className={`text-sm ${met ? "text-green-600" : "text-gray-500"}`}>
        {text}
      </span>
    </div>
  );

  return (
    <motion.div
      variants={formcontainerVariants}
      initial="hidden"
      animate="visible"
      className="flex min-h-screen bg-gray-50"
    >
      <main className="w-full py-6 px-4 sm:px-6 md:px-10">
        <motion.h1
          className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 text-center md:text-left"
          variants={formitemVariants}
        >
          Change Password
        </motion.h1>

        <motion.div
          className="bg-[#F9FCFF] rounded-3xl border border-[#D7D7D7] p-6 sm:p-10 lg:p-14 mx-auto shadow-sm "
          variants={formitemVariants}
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* CURRENT PASSWORD */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
                <label className="md:w-1/6 text-gray-700 font-medium">
                  Current Password :
                </label>

                <div className="relative w-full md:flex-1">
                  <input
                    name="currentPassword"
                    type={show.current ? "text" : "password"}
                    placeholder="Enter current password"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 outline-none pr-12 ${
                      errors.currentPassword
                        ? "border-red-500"
                        : "border-slate-300"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShow((prev) => ({ ...prev, current: !prev.current }))
                    }
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {show.current ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>

                  {errors.currentPassword && (
                    <p className="text-red-500 text-sm mt-1 ml-1">
                      {errors.currentPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* NEW PASSWORD */}
            <div>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-6">
                <label className="md:w-1/6 text-gray-700 font-medium pt-2">
                  New Password :
                </label>

                <div className="w-full md:flex-1">
                  <div className="relative">
                    <input
                      name="newPassword"
                      type={show.new ? "text" : "password"}
                      placeholder="Enter new password"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 outline-none pr-12 ${
                        errors.newPassword
                          ? "border-red-500"
                          : "border-slate-300"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShow((prev) => ({ ...prev, new: !prev.new }))
                      }
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {show.new ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {errors.newPassword && (
                    <p className="text-red-500 text-sm mt-1 ml-1">
                      {errors.newPassword}
                    </p>
                  )}

                  {/* Password Requirements */}
                  {formData.newPassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Password must contain:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <PasswordRequirement
                          met={passwordRequirements.length}
                          text="At least 8 characters"
                        />
                        <PasswordRequirement
                          met={passwordRequirements.uppercase}
                          text="One uppercase letter"
                        />
                        <PasswordRequirement
                          met={passwordRequirements.lowercase}
                          text="One lowercase letter"
                        />
                        <PasswordRequirement
                          met={passwordRequirements.number}
                          text="One number"
                        />
                        <PasswordRequirement
                          met={passwordRequirements.special}
                          text="One special character"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
                <label className="md:w-1/6 text-gray-700 font-medium">
                  Confirm Password :
                </label>

                <div className=" w-full md:flex-1">
                  <div className="relative">
                    <input
                      name="confirmPassword"
                      type={show.confirm ? "text" : "password"}
                      placeholder="Re-enter new password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 outline-none pr-12 ${
                        errors.confirmPassword
                          ? "border-red-500"
                          : "border-slate-300"
                      } ${
                        formData.confirmPassword &&
                        formData.newPassword === formData.confirmPassword
                          ? "border-green-500"
                          : ""
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShow((prev) => ({ ...prev, confirm: !prev.confirm }))
                      }
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {show.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1 ml-1">
                      {errors.confirmPassword}
                    </p>
                  )}

                  {/* Password match indicator */}
                  {formData.confirmPassword && formData.newPassword && (
                    <p
                      className={`text-sm mt-1 ml-1 ${
                        formData.newPassword === formData.confirmPassword
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formData.newPassword === formData.confirmPassword
                        ? "✓ Passwords match"
                        : "✗ Passwords do not match"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* API Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <p className="text-red-600 text-sm">{error}</p>
              </motion.div>
            )}

            {/* BUTTONS */}
            <div className="flex flex-col sm:flex-row justify-center sm:justify-end gap-4 pt-6">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </div>
                ) : (
                  "Update Password"
                )}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </motion.div>
      </main>
    </motion.div>
  );
};

export default ChangePassword;
