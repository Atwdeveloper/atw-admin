"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "@/lib/navigation";
import { motion } from "framer-motion";
import {
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
  AlertCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import { useProfileForm } from "../../adminhooks/UseProfileForm";
import Loader from "../../../../common/components/Loader";

const EditProfile = () => {
  const navigate = useNavigate();

  const {
    loading,
    formLoading,
    formData,
    states,
    cities,
    loadingCities,
    fetchCitiesByState,
    handleSubmit,
    validateField,
    updateFormData,
  } = useProfileForm();

  const [localFormData, setLocalFormData] = useState({});
  const [localErrors, setLocalErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  useEffect(() => {
    if (formData) {
      setLocalFormData(formData);
    }
  }, [formData]);

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    if (error) {
      setLocalErrors((prev) => ({ ...prev, [name]: error }));
    } else if (localErrors[name]) {
      setLocalErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    let processedValue = value;
    if (name === "pan_number") {
      processedValue = value.toUpperCase();
    }

    if (name === "phone" && value.length > 10) return;
    if (name === "aadhar_number" && value.length > 12) return;
    if (name === "pincode" && value.length > 6) return;

    setLocalFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    if (localErrors[name] && touchedFields[name]) {
      setLocalErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }

    updateFormData({ [name]: processedValue });

    if (touchedFields[name]) {
      const error = validateField(name, processedValue);
      if (error) {
        setLocalErrors((prev) => ({ ...prev, [name]: error }));
      }
    }

    if (name === "state_id") {
      const selectedState = states.find(
        (state) => state.id === parseInt(value),
      );
      const updatedData = {
        state: selectedState?.name || "",
        state_id: value,
        city: "",
        city_id: "",
      };
      setLocalFormData((prev) => ({ ...prev, ...updatedData }));
      updateFormData(updatedData);
      if (localErrors.city_id) {
        setLocalErrors((prev) => ({ ...prev, city_id: "" }));
      }
      if (value) {
        fetchCitiesByState(value);
      }
    }

    if (name === "city_id") {
      const selectedCity = cities.find((city) => city.id === parseInt(value));
      const updatedData = {
        city: selectedCity?.name || "",
        city_id: value,
      };
      setLocalFormData((prev) => ({ ...prev, ...updatedData }));
      updateFormData(updatedData);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const allFields = Object.keys(localFormData);
    const touched = {};
    allFields.forEach((field) => {
      touched[field] = true;
    });
    setTouchedFields(touched);

    const validationErrors = {};
    allFields.forEach((field) => {
      if (field !== "state" && field !== "city" && !field.includes("_id")) {
        const error = validateField(field, localFormData[field]);
        if (error) {
          validationErrors[field] = error;
        }
      }
    });

    if (localFormData.city_id && !localFormData.state_id) {
      validationErrors.state_id = "Please select a state first";
    }

    if (Object.keys(validationErrors).length > 0) {
      setLocalErrors(validationErrors);
      const firstErrorField = Object.keys(validationErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus();
      }
      Swal.fire({
        title: "Validation Error",
        html:
          "Please fix the errors in the form.<br>First error: " +
          validationErrors[firstErrorField],
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      const response = await handleSubmit(localFormData);
      if (response?.data?.status === 200) {
        Swal.fire({
          title: "Success!",
          text: "Profile updated successfully.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          navigate("/admin/myprofile");
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: error.response?.data?.message || "Failed to update profile.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  if (formLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const getInputClassName = (fieldName) => {
    return `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
      localErrors[fieldName] ? "border-red-500" : "border-gray-300"
    }`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Edit Profile
          </h1>
          <p className="text-gray-600 mt-1">Update your personal information</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <form onSubmit={handleFormSubmit} noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-500" />
                    Full Name <span className="text-red-500 ml-1">*</span>
                  </div>
                </label>
                <input
                  type="text"
                  name="name"
                  value={localFormData.name || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClassName("name")}
                  placeholder="Enter your full name"
                />
                {localErrors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {localErrors.name}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-500" />
                    Email Address <span className="text-red-500 ml-1">*</span>
                  </div>
                </label>
                <input
                  type="email"
                  name="email"
                  value={localFormData.email || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClassName("email")}
                  placeholder="Enter your email"
                />
                {localErrors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {localErrors.email}
                  </p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-500" />
                    Phone Number <span className="text-red-500 ml-1">*</span>
                  </div>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={localFormData.phone || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClassName("phone")}
                  placeholder="Enter 10-digit phone number"
                  maxLength="10"
                />
                {localErrors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {localErrors.phone}
                  </p>
                )}
              </div>

              {/* Gender Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  value={localFormData.gender || "male"}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Date of Birth Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    Date of Birth
                  </div>
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={localFormData.date_of_birth || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  max={new Date().toISOString().split("T")[0]}
                  className={getInputClassName("date_of_birth")}
                />
                {localErrors.date_of_birth && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {localErrors.date_of_birth}
                  </p>
                )}
              </div>

              {/* Address Field */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-500" />
                    Address <span className="text-red-500 ml-1">*</span>
                  </div>
                </label>
                <textarea
                  name="address"
                  value={localFormData.address || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  rows="3"
                  className={getInputClassName("address")}
                  placeholder="Enter your address"
                />
                {localErrors.address && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {localErrors.address}
                  </p>
                )}
              </div>

              {/* State Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-gray-500" />
                    State
                  </div>
                </label>
                <select
                  name="state_id"
                  value={localFormData.state_id || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClassName("state_id")}
                >
                  <option value="">Select State</option>
                  {states.map((state) => (
                    <option key={state.id} value={state.id}>
                      {state.name}
                    </option>
                  ))}
                </select>
                {localErrors.state_id && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {localErrors.state_id}
                  </p>
                )}
              </div>

              {/* City Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <select
                  name="city_id"
                  value={localFormData.city_id || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loadingCities || !localFormData.state_id}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                    loadingCities ? "bg-gray-50" : "bg-white"
                  } ${localErrors.city_id ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="">Select City</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
                {loadingCities && (
                  <p className="mt-1 text-sm text-gray-500">
                    Loading cities...
                  </p>
                )}
                {localErrors.city_id && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {localErrors.city_id}
                  </p>
                )}
              </div>

              {/* Pincode Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={localFormData.pincode || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength="6"
                  className={getInputClassName("pincode")}
                  placeholder="Enter 6-digit pincode"
                />
                {localErrors.pincode && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {localErrors.pincode}
                  </p>
                )}
              </div>

              {/* Aadhar Number Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aadhar Number
                </label>
                <input
                  type="text"
                  name="aadhar_number"
                  value={localFormData.aadhar_number || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength="12"
                  className={getInputClassName("aadhar_number")}
                  placeholder="Enter 12-digit Aadhar number"
                />
                {localErrors.aadhar_number && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {localErrors.aadhar_number}
                  </p>
                )}
              </div>

              {/* PAN Number Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PAN Number
                </label>
                <input
                  type="text"
                  name="pan_number"
                  value={localFormData.pan_number || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClassName("pan_number")}
                  placeholder="Enter PAN number (e.g., ABCDE1234F)"
                  style={{ textTransform: "uppercase" }}
                />
                {localErrors.pan_number && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {localErrors.pan_number}
                  </p>
                )}
              </div>
            </div>

            {/* Validation Summary */}
            {/* {Object.keys(localErrors).length > 0 && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                  <AlertCircle size={18} />
                  Please fix the following errors:
                </h4>
                <ul className="list-disc pl-5 text-sm text-red-700">
                  {Object.entries(localErrors).map(([field, error]) => (
                    <li key={field}>{error}</li>
                  ))}
                </ul>
              </div>
            )} */}

            {/* Submit Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600">
                    Fields marked with <span className="text-red-500">*</span>{" "}
                    are required
                  </p>
                  {/* <p className="text-xs text-gray-500 mt-1">
                    {Object.keys(localErrors).length > 0 
                      ? `${Object.keys(localErrors).length} validation error(s) need to be fixed`
                      : "All validations passed"}
                  </p> */}
                </div>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => navigate("/admin/myprofile")}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    // disabled={loading || Object.keys(localErrors).length > 0}
                    disabled={
                      loading ||
                      Object.values(localErrors).some(
                        (error) => error && error.trim() !== "",
                      )
                    }
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        Save All Changes
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default EditProfile;
