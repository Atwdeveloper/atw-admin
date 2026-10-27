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

const ChangeUsername = () => {
  const { loading, error, handleChangeUsername } = useAdminProfile();
  const { user } = useAuth(); // Get current user from auth context

  const [formData, setFormData] = useState({
    current_username: "",
    new_username: "",
    confirm_username: "",
  });

  const [errors, setErrors] = useState({});

  // Pre-fill current username when component mounts or user data changes
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        current_username: user.username || user.name || "", // Use username or name field
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    let newErrors = {};

    if (!formData.current_username.trim()) {
      newErrors.current_username = "Current Username is required";
    }

    if (!formData.new_username.trim()) {
      newErrors.new_username = "New Username is required";
    } else if (formData.new_username.length < 3) {
      newErrors.new_username = "Username must be at least 3 characters";
    } else if (formData.new_username === formData.current_username) {
      newErrors.new_username =
        "New username must be different from current username";
    }

    if (!formData.confirm_username.trim()) {
      newErrors.confirm_username = "Confirm Username is required";
    } else if (formData.confirm_username !== formData.new_username) {
      newErrors.confirm_username = "Usernames do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validate()) {
      const success = await handleChangeUsername(formData.new_username);

      if (success) {
        // Reset form but keep current username pre-filled
        setFormData({
          current_username: user?.username || user?.name || "", // Keep current username
          new_username: "",
          confirm_username: "",
        });
      }
    }
  };

  // Make current username field read-only
  const handlecurrent_usernameChange = (e) => {};

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
          Change Username
        </motion.h1>

        {/* Current User Info Display */}
        {user && (
          <motion.div
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
            variants={formitemVariants}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-blue-800 text-sm">
                You are currently logged in as:{" "}
                <strong>{user.username || user.name}</strong>
              </p>
            </div>
          </motion.div>
        )}

        <motion.div
          className="bg-[#F9FCFF] rounded-3xl border border-[#D7D7D7] p-6 sm:p-10 lg:p-14 mx-auto shadow-sm"
          variants={formitemVariants}
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* CURRENT USERNAME */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
                <label className="md:w-1/6 text-gray-700 font-medium">
                  Current Username :
                </label>
                <div className="md:flex-1">
                  <input
                    type="text"
                    name="current_username"
                    value={formData.current_username}
                    onChange={handlecurrent_usernameChange} // Use separate handler
                    placeholder="Enter current username"
                    className="w-full md:flex-1 px-4 py-2 border border-slate-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                    readOnly // Make it read-only
                    disabled // Visual disabled state
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Current username (read-only)
                  </p>
                </div>
              </div>
            </div>

            {/* NEW USERNAME */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
                <label className="md:w-1/6 text-gray-700 font-medium">
                  New Username :
                </label>
                <div className="md:flex-1">
                  <input
                    type="text"
                    name="new_username"
                    value={formData.new_username}
                    onChange={handleChange}
                    placeholder="Enter new username"
                    className={`w-full md:flex-1 px-4 py-2 border ${
                      errors.new_username
                        ? "border-red-500"
                        : "border-slate-300"
                    } rounded-md focus:ring-2 focus:ring-blue-400 outline-none`}
                  />
                  {errors.new_username && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.new_username}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* CONFIRM USERNAME */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
                <label className="md:w-1/6 text-gray-700 font-medium">
                  Confirm Username :
                </label>
                <div className="md:flex-1">
                  <input
                    type="text"
                    name="confirm_username"
                    value={formData.confirm_username}
                    onChange={handleChange}
                    placeholder="Re-enter new username"
                    className={`w-full md:flex-1 px-4 py-2 border ${
                      errors.confirm_username
                        ? "border-red-500"
                        : "border-slate-300"
                    } rounded-md focus:ring-2 focus:ring-blue-400 outline-none`}
                  />
                  {errors.confirm_username && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.confirm_username}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message from API */}
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
                {loading ? "Updating..." : "Update Username"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setFormData({
                    current_username: user?.username || user?.name || "",
                    new_username: "",
                    confirm_username: "",
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

export default ChangeUsername;
