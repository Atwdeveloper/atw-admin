"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "@/lib/navigation";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import { useEditCompany } from "../../adminhooks/useEditCompany";
import Loader from "../../../../common/components/Loader";
import useUnsavedChangesWarning from "../../../../common/hooks/useUnsavedChangesWarning";
import {
  AlertCircle,
  Search,
  CheckCircle,
  MapPin,
  Building2,
  Shield,
} from "lucide-react";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import Breadcrumb from "../../../../common/components/Breadcrumb";

const EditCompanyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const canEdit = hasPermission("companies", "edit");
  const {
    formData,
    setFormData,
    industriesList,
    agentsList,
    staffList,
    errors,
    setErrors,
    loading,
    formLoading,
    successMsg,
    submitEdit,
    clearError,
    clearAddressError,
    states,
    cities,
    filteredStates,
    filteredCities,
    loadingCities,
    fetchCitiesByState,
    filterStates,
    filterCities,
  } = useEditCompany(id);

  // State to track if we're currently submitting
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState([]);

  // Refs for dropdowns
  const stateRefs = useRef([]);
  const cityRefs = useRef([]);

  // Flag to ensure dropdown arrays are initialized only once when formData first loads
  const dropdownsInitialized = useRef(false);

  // Store initial data ref
  const initialDataRef = React.useRef(null);

  // Initialize dropdown arrays exactly once when formData is first loaded
  useEffect(() => {
    if (formData && !dropdownsInitialized.current) {
      const addressCount = formData.addresses?.length || 0;
      setShowStateDropdown(new Array(addressCount).fill(false));
      setShowCityDropdown(new Array(addressCount).fill(false));
      dropdownsInitialized.current = true;
    }
  }, [formData]);

  // 🔹 Compute if form is dirty - exclude submission state
  const isFormDirty = useMemo(() => {
    if (!formData || isSubmitting) return false;

    // Store initial data when first loaded
    if (initialDataRef.current === null && formData) {
      initialDataRef.current = JSON.parse(JSON.stringify(formData));
    }

    // Compare with initial data if it exists
    if (initialDataRef.current) {
      return (
        JSON.stringify(formData) !== JSON.stringify(initialDataRef.current)
      );
    }

    return false;
  }, [formData, isSubmitting]);

  // 🔹 Use the unsaved changes warning hook - disable when submitting
  useUnsavedChangesWarning(
    isFormDirty && !isSubmitting,
    "You have unsaved changes. Are you sure you want to leave? All changes will be lost.",
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      stateRefs.current.forEach((ref, index) => {
        if (ref && !ref.contains(event.target)) {
          setShowStateDropdown((prev) => {
            const newState = [...prev];
            newState[index] = false;
            return newState;
          });
        }
      });

      cityRefs.current.forEach((ref, index) => {
        if (ref && !ref.contains(event.target)) {
          setShowCityDropdown((prev) => {
            const newState = [...prev];
            newState[index] = false;
            return newState;
          });
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle state search
  const handleStateSearch = (index, value) => {
    if (isSubmitting) return;

    const updated = [...formData.addresses];
    updated[index] = {
      ...updated[index],
      state: value,
      state_id: "",
      city: "",
      city_id: "",
    };
    setFormData((prev) => ({ ...prev, addresses: updated }));

    // Filter states
    filterStates(value);

    // Always open dropdown when typing
    setShowStateDropdown((prev) => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  // Handle city search
  const handleCitySearch = (index, value) => {
    if (isSubmitting) return;

    const updated = [...formData.addresses];
    updated[index] = {
      ...updated[index],
      city: value,
      city_id: "",
    };
    setFormData((prev) => ({ ...prev, addresses: updated }));

    // Filter cities
    filterCities(value, index);

    // Always open dropdown when typing
    if (updated[index].state_id) {
      setShowCityDropdown((prev) => {
        const newState = [...prev];
        newState[index] = true;
        return newState;
      });
    }
  };

  // Handle state selection
  const handleStateSelect = async (index, state) => {
    if (isSubmitting) return;

    const updated = [...formData.addresses];
    updated[index] = {
      ...updated[index],
      state: state.name,
      state_id: state.id,
      city: "",
      city_id: "",
    };
    setFormData((prev) => ({ ...prev, addresses: updated }));

    // Clear errors
    clearAddressError(index, "state");
    clearAddressError(index, "city");

    // Close dropdown
    setShowStateDropdown((prev) => {
      const newState = [...prev];
      newState[index] = false;
      return newState;
    });

    // Fetch cities for the selected state
    await fetchCitiesByState(state.id, index);
  };

  // Handle city selection
  const handleCitySelect = (index, city) => {
    if (isSubmitting) return;

    const updated = [...formData.addresses];
    updated[index] = {
      ...updated[index],
      city: city.name,
      city_id: city.id,
    };
    setFormData((prev) => ({ ...prev, addresses: updated }));

    // Clear error
    clearAddressError(index, "city");

    // Close dropdown
    setShowCityDropdown((prev) => {
      const newState = [...prev];
      newState[index] = false;
      return newState;
    });
  };

  // Handle input focus for state
  const handleStateFocus = (index) => {
    if (isSubmitting) return;

    if (states.length > 0) {
      setShowStateDropdown((prev) => {
        const newState = [...prev];
        newState[index] = true;
        return newState;
      });
    }
  };

  // Handle input focus for city
  const handleCityFocus = (index) => {
    if (isSubmitting) return;

    const item = formData.addresses[index];
    if (item.state_id) {
      setShowCityDropdown((prev) => {
        const newState = [...prev];
        newState[index] = true;
        return newState;
      });
    }
  };

  // Required fields configuration
  const requiredFields = {
    company_name: true,
    email: true,
    phone: true,
    owner_name: true,
    owner_phone: true,
    owner_email: true,
    service_charge_type: true,
    service_charge: true,
    industry_id: true,
  };

  // const handleChange = (name, value) => {
  //   setFormData((prev) => ({ ...prev, [name]: value }));
  //   // Clear error when user starts typing
  //   if (errors[name]) {
  //     clearError(name);
  //   }
  // };
  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "email" || name === "owner_email") {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (value && !emailPattern.test(value)) {
        errors[name] = "Please enter a valid email address";
      } else {
        clearError(name);
      }
    } else if (errors[name]) {
      clearError(name);
    }
  };
  const handleIndustryChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, industry_id: value }));
    clearError("industry_id");
  };

  // const handleServiceChargeTypeChange = (e) => {
  //   setFormData((prev) => ({ ...prev, service_charge_type: e.target.value }));
  //   clearError("service_charge_type");
  // };

  // const handleServiceChargeChange = (e) => {
  //   const value = e.target.value.replace(/\D/g, "");
  //   setFormData((prev) => ({ ...prev, service_charge: value }));
  //   clearError("service_charge");
  // };
  const handleServiceChargeChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");

    if (formData.service_charge_type === "percentage") {
      if (value !== "") {
        const num = parseInt(value, 10);

        if (num > 100) {
          setErrors((prev) => ({
            ...prev,
            service_charge: "Percentage must be between 0 and 100",
          }));
          return;
        }
      }
    }

    setErrors((prev) => ({
      ...prev,
      service_charge: "",
    }));

    setFormData((prev) => ({
      ...prev,
      service_charge: value,
    }));
  };
  const handleServiceChargeTypeChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      service_charge_type: e.target.value,
      service_charge: "",
    }));

    clearError("service_charge_type");
    clearError("service_charge");
  };
  const handleAddressChange = (index, field, value) => {
    const updated = [...formData.addresses];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, addresses: updated }));

    // Clear address error when user starts typing
    const errorKey = `${field}_${index}`;
    if (errors[errorKey]) {
      clearAddressError(index, field);
    }
  };

  const addAddress = () => {
    setFormData((prev) => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        {
          address: "",
          city: "",
          city_id: "",
          state: "",
          state_id: "",
          zip: "",
          address_type: "",
        },
      ],
    }));

    // Initialize dropdown states for new address
    setShowStateDropdown((prev) => [...prev, false]);
    setShowCityDropdown((prev) => [...prev, false]);
  };

  const removeAddress = (index) => {
    setFormData((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index),
    }));

    // Update dropdown arrays
    setShowStateDropdown((prev) => prev.filter((_, i) => i !== index));
    setShowCityDropdown((prev) => prev.filter((_, i) => i !== index));
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   // Set submitting state to true to disable warnings
  //   setIsSubmitting(true);

  //   try {
  //     const ok = await submitEdit();
  //     if (ok) {
  //       // Update initial data ref to current form data
  //       if (formData) {
  //         initialDataRef.current = JSON.parse(JSON.stringify(formData));
  //       }

  //       Swal.fire({
  //         icon: "success",
  //         title: "Company Updated",
  //         text: "Company details updated successfully.",
  //         timer: 1800,
  //         showConfirmButton: false,
  //       });
  //       navigate('/admin/company/listing');
  //     } else {
  //       Swal.fire({
  //         icon: "error",
  //         title: "Failed",
  //         text: errors.api || "Please fix errors and try again.",
  //       });
  //       // If submission failed, reset submitting state
  //       setIsSubmitting(false);
  //     }
  //   } catch (error) {
  //     console.error("Submission error:", error);
  //     setIsSubmitting(false);
  //   }
  // };
  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      const result = await submitEdit();

      if (result.success) {
        // Update initial form snapshot
        if (formData) {
          initialDataRef.current = JSON.parse(JSON.stringify(formData));
        }

        await Swal.fire({
          icon: "success",
          title: "Company Updated",
          text: "Company details updated successfully.",
          timer: 1800,
          showConfirmButton: false,
        });

        navigate("/admin/company/listing");
      } else {
        await Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: result.message || "Please fill all the required fields.",
        });

        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Submission error:", error);

      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong. Please try again.",
      });

      setIsSubmitting(false);
    }
  };
  const handleCancel = () => {
    navigate(-1);
  };

  if (permissionsLoading)
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader />
        </div>
      </div>
    );

  if (!canEdit) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center min-h-[80vh]">
        <div className="bg-white rounded-[22px] p-8 text-center max-w-md shadow-sm border border-gray-100">
          <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to edit company details.
          </p>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (formLoading)
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader />
        </div>
      </div>
    );

  if (!formData) return <p className="p-6">Company not found</p>;

  // Helper function to render label with asterisk for required fields
  const renderLabel = (fieldName, labelText) => (
    <label className="text-sm text-slate-600">
      {labelText}
      {requiredFields[fieldName] && (
        <span className="text-red-500 ml-1">*</span>
      )}
    </label>
  );

  // Helper function to render address label with asterisk
  const renderAddressLabel = (fieldName, labelText) => (
    <label className="text-sm text-slate-600">
      {labelText}
      <span className="text-red-500 ml-1">*</span>
    </label>
  );

  return (
    <div className="flex-1 bg-gray-50">
      {/* 🔹 Unsaved Changes Indicator - hide when submitting */}
      {isFormDirty && !isSubmitting && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="my-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800 font-medium">
                You have unsaved changes
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* 🔹 Submitting indicator */}
      {isSubmitting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="my-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-800 font-medium">Saving changes...</span>
          </div>
        </motion.div>
      )}

      <motion.form
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mt-6 space-y-8"
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <Breadcrumb
          items={[
            { label: "Companies", path: "/admin/company/listing" },
            { label: `Edit ${formData.company_name || "Company"}` },
          ]}
        />
        {/* ------------------ Company Information ------------------ */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Edit Company Details
        </h2>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-[22px] shadow-sm border border-[#DDDDDD]"
        >
          <div className="text-lg bg-[#F9F9F9] rounded-t-[22px] border-b border-[#DDDDDD] px-6 py-4 font-semibold text-slate-700">
            Company Information
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            <div>
              {renderLabel("company_name", "Company Name")}
              <input
                type="text"
                value={formData.company_name}
                maxLength={100}
                onChange={(e) => handleChange("company_name", e.target.value)}
                disabled={isSubmitting}
                autoComplete="off"
                className={`w-full rounded-lg p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.company_name ? "border border-red-500" : "border"
                } ${isSubmitting ? "bg-gray-100" : ""}`}
                placeholder="Enter Company Name"
              />
              {errors.company_name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.company_name}
                </p>
              )}
            </div>

            <div>
              {renderLabel("email", "Company Email")}
              <input
                type="email"
                value={formData.email}
                maxLength={100}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={isSubmitting}
                autoComplete="off"
                className={`w-full rounded-lg p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? "border border-red-500" : "border"
                } ${isSubmitting ? "bg-gray-100" : ""}`}
                placeholder="Enter Company Email"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              {renderLabel("phone", "Contact Number")}
              <input
                type="text"
                maxLength={10}
                value={formData.phone}
                onChange={(e) =>
                  handleChange("phone", e.target.value.replace(/\D/g, ""))
                }
                disabled={isSubmitting}
                autoComplete="off"
                className={`w-full rounded-lg p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? "border border-red-500" : "border"
                } ${isSubmitting ? "bg-gray-100" : ""}`}
                placeholder="Enter Contact Number"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Service Charge Type Field */}
            <div>
              {renderLabel("service_charge_type", "Service Charge Type")}
              <select
                value={formData.service_charge_type}
                onChange={handleServiceChargeTypeChange}
                disabled={isSubmitting}
                autoComplete="off"
                className={`w-full rounded-lg p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.service_charge_type
                    ? "border border-red-500"
                    : "border"
                } ${isSubmitting ? "bg-gray-100" : ""}`}
              >
                <option value="fixed">Fixed</option>
                <option value="percentage">Percentage</option>
              </select>
              {errors.service_charge_type && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.service_charge_type}
                </p>
              )}
            </div>

            {/* Service Charge Field */}
            <div>
              {renderLabel("service_charge", "Service Charge")}
              <input
                type="text"
                maxLength={10}
                value={formData.service_charge}
                onChange={handleServiceChargeChange}
                disabled={isSubmitting}
                autoComplete="off"
                className={`w-full rounded-lg p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.service_charge ? "border border-red-500" : "border"
                } ${isSubmitting ? "bg-gray-100" : ""}`}
                placeholder={
                  formData.service_charge_type === "fixed"
                    ? "Enter amount in ₹"
                    : "Enter percentage %"
                }
              />
              {errors.service_charge && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.service_charge}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {formData.service_charge_type === "fixed"
                  ? "Enter fixed service charge amount"
                  : "Enter service charge percentage"}
              </p>
            </div>
            <div>
              <label className="text-sm text-slate-600">Assign Agent</label>

              <select
                value={formData.agent_code || ""}
                onChange={(e) => handleChange("agent_code", e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-lg p-2 mt-1 border focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Agent</option>

                {agentsList.map((agent) => (
                  <option key={agent.agent_code} value={agent.agent_code}>
                    {agent.name} ({agent.agent_code})
                  </option>
                ))}
              </select>
              {errors.agent_code && (
                <p className="text-red-500 text-sm mt-1">{errors.agent_code}</p>
              )}
            </div>
            <div>
              <label className="text-sm text-slate-600">
                Relationship Manager <span className="text-red-500">*</span>
              </label>

              <select
                value={String(formData.staff_code || "")}
                onChange={(e) => handleChange("staff_code", e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-lg p-2 mt-1 border focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Staff</option>

                {staffList.map((staff) => (
                  <option
                    key={staff.staff_code}
                    value={String(staff.staff_code)}
                  >
                    {staff.name} ({staff.staff_code})
                  </option>
                ))}
              </select>

              {errors.staff_code && (
                <p className="text-red-500 text-sm mt-1">{errors.staff_code}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* ------------------ Contact Person ------------------ */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-[22px] shadow-sm border border-[#DDDDDD]"
        >
          <div className="text-lg bg-[#F9F9F9] rounded-t-[22px] border-b border-[#DDDDDD] px-6 py-4 font-semibold text-slate-700">
            Contact Person
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 px-6 py-4 gap-4">
            <div>
              {renderLabel("owner_name", "Person Name")}
              <input
                type="text"
                value={formData.owner_name}
                maxLength={100}
                onChange={(e) => handleChange("owner_name", e.target.value)}
                disabled={isSubmitting}
                autoComplete="off"
                className={`w-full rounded-lg p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.owner_name ? "border border-red-500" : "border"
                } ${isSubmitting ? "bg-gray-100" : ""}`}
                placeholder="Enter Person Name"
              />
              {errors.owner_name && (
                <p className="text-red-500 text-sm mt-1">{errors.owner_name}</p>
              )}
            </div>

            <div>
              {renderLabel("owner_phone", "Person Number")}
              <input
                type="text"
                maxLength={10}
                value={formData.owner_phone}
                onChange={(e) =>
                  handleChange("owner_phone", e.target.value.replace(/\D/g, ""))
                }
                disabled={isSubmitting}
                autoComplete="off"
                className={`w-full rounded-lg p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.owner_phone ? "border border-red-500" : "border"
                } ${isSubmitting ? "bg-gray-100" : ""}`}
                placeholder="Enter Person Number"
              />
              {errors.owner_phone && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.owner_phone}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              {renderLabel("owner_email", "Email Address")}
              <input
                type="text"
                value={formData.owner_email}
                maxLength={100}
                onChange={(e) => handleChange("owner_email", e.target.value)}
                disabled={isSubmitting}
                autoComplete="off"
                className={`w-full rounded-lg p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.owner_email ? "border border-red-500" : "border"
                } ${isSubmitting ? "bg-gray-100" : ""}`}
                placeholder="Enter Email Address"
              />
              {errors.owner_email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.owner_email}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* ------------------ Business Profile ------------------ */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-[22px] shadow-sm border border-[#DDDDDD]"
        >
          <div className="text-lg bg-[#F9F9F9] rounded-t-[22px] border-b border-[#DDDDDD] px-6 py-4 font-semibold text-slate-700">
            Business Profile
          </div>

          <div className="px-6 pb-4 pt-2">
            <label className="text-sm text-slate-600">Industry</label>
            <select
              value={formData.industry_id}
              onChange={handleIndustryChange}
              disabled={isSubmitting}
              autoComplete="off"
              className={`w-full bg-[#FFFFFF] border border-[#DDDDDD] rounded-[8px] p-2 mt-1 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isSubmitting ? "bg-gray-100" : ""
                        }`}
            >
              <option value="">Select industry</option>
              {industriesList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {errors.industry_id && (
              <p className="text-red-500 text-sm mt-1">{errors.industry_id}</p>
            )}
          </div>
        </motion.div>

        {/* ------------------ Addresses with Dropdowns ------------------ */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-[22px] shadow-sm border border-[#DDDDDD]"
        >
          <div className="flex bg-[#F9F9F9] rounded-t-[22px] border-b border-[#DDDDDD] px-6 py-4 justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-700">
              Working Addresses
            </h2>
            <button
              type="button"
              onClick={addAddress}
              disabled={isSubmitting}
              className={`text-blue-600 font-medium text-sm ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              + Add Address
            </button>
          </div>

          {formData.addresses.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 px-6 py-4 gap-4 border-b last:border-none"
            >
              {index > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className={`text-red-500 text-sm font-medium w-fit mb-2 ${
                      isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={() => !isSubmitting && removeAddress(index)}
                    disabled={isSubmitting}
                  >
                    Remove Address
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  {renderAddressLabel("address", "Address ")}
                  <input
                    type="text"
                    value={item.address}
                    onChange={(e) =>
                      handleAddressChange(index, "address", e.target.value)
                    }
                    disabled={isSubmitting}
                    autoComplete="off"
                    className={`w-full rounded-lg p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`address_${index}`]
                        ? "border border-red-500"
                        : "border"
                    } ${isSubmitting ? "bg-gray-100" : ""}`}
                    placeholder="Enter Address"
                  />
                  {errors[`address_${index}`] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors[`address_${index}`]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-slate-600">
                    Address Type
                  </label>
                  <select
                    value={item.address_type || ""}
                    onChange={(e) =>
                      handleAddressChange(
                        index,
                        "address_type",
                        e.target.value,
                      )
                    }
                    disabled={isSubmitting}
                    autoComplete="off"
                    className={`w-full rounded-lg bg-white p-2 mt-1 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isSubmitting ? "bg-gray-100" : ""
                    }`}
                  >
                    <option value="">Select Address Type</option>
                    <option value="billing">Billing Address</option>
                    <option value="working">Working Address</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* State Dropdown */}
                <div
                  ref={(el) => (stateRefs.current[index] = el)}
                  className="relative"
                >
                  {renderAddressLabel("state", "State / Province")}
                  <div className="relative">
                    <MapPin
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      value={item.state}
                      onChange={(e) => handleStateSearch(index, e.target.value)}
                      onFocus={() => handleStateFocus(index)}
                      disabled={isSubmitting}
                      autoComplete="off"
                      className={`w-full pl-10 pr-10 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`state_${index}`]
                          ? "border-red-500"
                          : "border-gray-300"
                      } ${isSubmitting ? "bg-gray-100" : ""}`}
                      placeholder="Search or select state"
                    />
                    <Search
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                  </div>
                  {errors[`state_${index}`] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors[`state_${index}`]}
                    </p>
                  )}

                  {/* State Dropdown */}
                  {showStateDropdown[index] && !isSubmitting && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredStates.length > 0 ? (
                        filteredStates.map((state) => (
                          <div
                            key={state.id}
                            className="px-4 py-2.5 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => handleStateSelect(index, state)}
                          >
                            <div className="flex items-center justify-between">
                              <span>{state.name}</span>
                              {state.id === item.state_id && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500">
                          {item.state.trim()
                            ? "No matching states found"
                            : "Type to search states"}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* City Dropdown */}
                <div
                  ref={(el) => (cityRefs.current[index] = el)}
                  className="relative"
                >
                  {renderAddressLabel("city", "City")}
                  <div className="relative">
                    <Building2
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      value={item.city}
                      onChange={(e) => handleCitySearch(index, e.target.value)}
                      onFocus={() => handleCityFocus(index)}
                      disabled={isSubmitting || !item.state_id}
                      autoComplete="off"
                      className={`w-full pl-10 pr-10 py-2 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`city_${index}`]
                          ? "border-red-500"
                          : "border-gray-300"
                      } ${
                        !item.state_id || isSubmitting
                          ? "bg-gray-100 cursor-not-allowed"
                          : ""
                      }`}
                      placeholder={
                        !item.state_id
                          ? "Select state first"
                          : "Search or select city"
                      }
                    />
                    {loadingCities[index] ? (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <Search
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                    )}
                  </div>
                  {errors[`city_${index}`] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors[`city_${index}`]}
                    </p>
                  )}
                  {!item.state_id && !isSubmitting && (
                    <p className="text-sm text-gray-500 mt-1">
                      Please select a state first
                    </p>
                  )}

                  {/* City Dropdown */}
                  {showCityDropdown[index] &&
                    item.state_id &&
                    !isSubmitting && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredCities[index]?.length > 0 ? (
                          filteredCities[index].map((city) => (
                            <div
                              key={city.id}
                              className="px-4 py-2.5 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => handleCitySelect(index, city)}
                            >
                              <div className="flex items-center justify-between">
                                <span>{city.name}</span>
                                {city.id === item.city_id && (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500">
                            {item.city.trim()
                              ? "No matching cities found"
                              : "Type to search cities"}
                          </div>
                        )}
                      </div>
                    )}
                </div>

                <div>
                  {renderAddressLabel("zip", "ZIP / Postal Code")}
                  <input
                    type="text"
                    maxLength={6}
                    value={item.zip}
                    onChange={(e) =>
                      handleAddressChange(index, "zip", e.target.value)
                    }
                    disabled={isSubmitting}
                    autoComplete="off"
                    className={`w-full rounded-lg p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`zip_${index}`]
                        ? "border border-red-500"
                        : "border"
                    } ${isSubmitting ? "bg-gray-100" : ""}`}
                    placeholder="Enter ZIP / Postal Code"
                  />
                  {errors[`zip_${index}`] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors[`zip_${index}`]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ------------------ Tax Information ------------------ */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-[22px] shadow-sm border border-[#DDDDDD]"
        >
          <div className="text-lg bg-[#F9F9F9] rounded-t-[22px] border-b border-[#DDDDDD] px-6 py-4 font-semibold text-slate-700">
            Tax Information
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-4">
            <div>
              <label className="text-sm text-slate-600">GST Number</label>
              <span className="text-red-500 ml-1">*</span>
              <input
                type="text"
                maxLength={20}
                value={formData.gst_number}
                onChange={(e) =>
                  handleChange("gst_number", e.target.value.toUpperCase())
                }
                disabled={isSubmitting}
                autoComplete="off"
                className={`w-full rounded-lg p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.gst_number ? "border border-red-500" : "border"
                } ${isSubmitting ? "bg-gray-100" : ""}`}
                placeholder="Enter GST Number"
              />
              {errors.gst_number && (
                <p className="text-red-500 text-sm mt-1">{errors.gst_number}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-slate-600">GST Rate (%)</label>
              <input
                type="text"
                maxLength={6}
                value={formData.gst_rate || ""}
                onChange={(e) =>
                  handleChange("gst_rate", e.target.value.replace(/[^0-9.]/g, ""))
                }
                disabled={isSubmitting}
                autoComplete="off"
                className={`w-full rounded-lg p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.gst_rate ? "border border-red-500" : "border"
                } ${isSubmitting ? "bg-gray-100" : ""}`}
                placeholder="Enter GST Rate"
              />
              {errors.gst_rate && (
                <p className="text-red-500 text-sm mt-1">{errors.gst_rate}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-slate-600">CIN</label>
              <input
                type="text"
                maxLength={21}
                value={formData.tin_number}
                onChange={(e) =>
                  handleChange("tin_number", e.target.value.toUpperCase())
                }
                disabled={isSubmitting}
                autoComplete="off"
                className={`w-full rounded-lg p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 border ${
                  isSubmitting ? "bg-gray-100" : ""
                }`}
                placeholder="Enter CIN"
              />
              {errors.tin_number && (
                <p className="text-red-500 text-sm mt-1">{errors.tin_number}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-slate-600">TAN</label>
              <input
                type="text"
                maxLength={10}
                value={formData.pan_number}
                onChange={(e) =>
                  handleChange("pan_number", e.target.value.toUpperCase())
                }
                disabled={isSubmitting}
                autoComplete="off"
                className={`w-full rounded-lg p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 border ${
                  isSubmitting ? "bg-gray-100" : ""
                }`}
                placeholder="Enter TAN"
              />
              {errors.pan_number && (
                <p className="text-red-500 text-sm mt-1">{errors.pan_number}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* ------------------ Submit Buttons ------------------ */}
        <motion.div variants={itemVariants} className="flex items-center gap-4">
          <div className="flex-1 text-right">
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className={`bg-blue-600 text-white px-6 py-2 rounded-lg shadow ${
                loading || isSubmitting
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:brightness-105"
              }`}
            >
              {isSubmitting ? "Saving..." : "Update Company"}
            </button>
            <button
              type="button"
              className={`border px-6 py-2 rounded-lg text-slate-600 bg-gray-50 ml-3 ${
                isSubmitting
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </motion.div>

        {errors.api && (
          <p className="text-red-500 text-center mt-2">{errors.api}</p>
        )}
        {successMsg && (
          <p className="text-green-600 text-center mt-2">{successMsg}</p>
        )}
      </motion.form>
    </div>
  );
};

export default EditCompanyPage;
