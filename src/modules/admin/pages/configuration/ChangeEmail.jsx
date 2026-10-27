"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Button from "../../components/Button";
import {
  formcontainerVariants,
  formitemVariants,
} from "../../../../common/utils/motionVariants";
import { useAdminProfile } from "../../adminhooks/useAdminProfile";
import { useAuth } from "../../../../common/hooks/useAuth";

const ChangeEmail = () => {
  const { loading, error, handleChangeEmail } = useAdminProfile();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    current_email: "",
    new_email: "",
    confirm_email: "",
  });

  const [errors, setErrors] = useState({});

  // Pre-fill current email
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        current_email: user.email || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    let newErrors = {};

    if (!formData.current_email.trim()) {
      newErrors.current_email = "Current Email is required";
    }

    if (!formData.new_email.trim()) {
      newErrors.new_email = "New Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.new_email)) {
      newErrors.new_email = "Enter a valid email address";
    } else if (formData.new_email === formData.current_email) {
      newErrors.new_email = "New email must be different from current email";
    }

    if (!formData.confirm_email.trim()) {
      newErrors.confirm_email = "Confirm Email is required";
    } else if (formData.confirm_email !== formData.new_email) {
      newErrors.confirm_email = "Emails do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validate()) {
      const success = await handleChangeEmail(formData.new_email);

      if (success) {
        setFormData({
          current_email: user?.email || "",
          new_email: "",
          confirm_email: "",
        });
      }
    }
  };

  return (
    <motion.div
      className="flex min-h-screen bg-gray-50"
      initial="hidden"
      animate="visible"
      variants={formcontainerVariants}
    >
      <main className="w-full py-6 px-4 sm:px-6 md:px-10">
        <motion.h1
          className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 text-center md:text-left"
          variants={formitemVariants}
        >
          Change Email
        </motion.h1>

        {/* CURRENT LOGGED IN INFO */}
        {user && (
          <motion.div
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
            variants={formitemVariants}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-blue-800 text-sm">
                You are currently logged in as: <strong>{user.email}</strong>
              </p>
            </div>
          </motion.div>
        )}

        <motion.div
          className="bg-[#F9FCFF] rounded-3xl border border-[#D7D7D7] p-6 sm:p-10 lg:p-14 mx-auto shadow-sm"
          variants={formitemVariants}
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* CURRENT EMAIL (READ-ONLY) */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
                <label className="md:w-1/6 text-gray-700 font-medium">
                  Current Email :
                </label>
                <div className="md:flex-1">
                  <input
                    type="email"
                    name="current_email"
                    value={formData.current_email}
                    readOnly
                    disabled
                    className="w-full md:flex-1 px-4 py-2 border border-slate-300 bg-gray-50 text-gray-600 rounded-md cursor-not-allowed"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    This is your current registered email address.
                  </p>
                </div>
              </div>
            </div>

            {/* NEW EMAIL */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
                <label className="md:w-1/6 text-gray-700 font-medium">
                  New Email :
                </label>
                <div className="md:flex-1">
                  <input
                    type="text"
                    maxLength={35}
                    name="new_email"
                    value={formData.new_email}
                    onChange={handleChange}
                    placeholder="Enter new email"
                    className={`w-full md:flex-1 px-4 py-2 border ${
                      errors.new_email ? "border-red-500" : "border-slate-300"
                    } rounded-md focus:ring-2 focus:ring-blue-400 outline-none`}
                  />
                  {errors.new_email && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.new_email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* CONFIRM EMAIL */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
                <label className="md:w-1/6 text-gray-700 font-medium">
                  Confirm Email :
                </label>
                <div className="md:flex-1">
                  <input
                    type="text"
                    maxLength={35}
                    name="confirm_email"
                    value={formData.confirm_email}
                    onChange={handleChange}
                    placeholder="Re-enter new email"
                    className={`w-full md:flex-1 px-4 py-2 border ${
                      errors.confirm_email
                        ? "border-red-500"
                        : "border-slate-300"
                    } rounded-md focus:ring-2 focus:ring-blue-400 outline-none`}
                  />
                  {errors.confirm_email && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.confirm_email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* API ERROR */}
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
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Updating..." : "Update Email"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setFormData({
                    current_email: user?.email || "",
                    new_email: "",
                    confirm_email: "",
                  });
                  setErrors({});
                }}
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

export default ChangeEmail;
