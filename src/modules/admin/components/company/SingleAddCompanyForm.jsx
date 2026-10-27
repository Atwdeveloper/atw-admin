"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Swal from "sweetalert2";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import { useAddCompany } from "../../adminhooks/useAddCompany";
import {
  AlertCircle,
  Search,
  CheckCircle,
  MapPin,
  Building2,
  X,
} from "lucide-react";
import { useNavigate } from "@/lib/navigation";
import useUnsavedChangesWarning from "../../../../common/hooks/useUnsavedChangesWarning";
import Loader from "../../../../common/components/Loader";

const SingleAddCompanyForm = () => {
  const navigate = useNavigate();
  const {
    formData,
    setFormData,
    errors,
    setErrors,
    loading,
    formLoading,

    staffList,
    submitCompany,
    industries,
    agents,
    states,
    filteredStates,
    filteredCities,
    loadingCities,
    fetchCitiesByState,
    filterStates,
    filterCities,
    verifyGstNumber,
  } = useAddCompany();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState([]);
  const phonePattern = /^[6-9]\d{9}$/;

  // ---- GST verification gate: ask for GST first, auto-fill on success, or close to fill manually ----
  const [showGstModal, setShowGstModal] = useState(true);
  const [gstVerifying, setGstVerifying] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);
  const [gstInput, setGstInput] = useState("");
  const [gstError, setGstError] = useState("");

  const handleVerifyGst = async (e) => {
    e.preventDefault();
    const value = gstInput.trim().toUpperCase();
    if (value.length !== 15) {
      setGstError("Enter a valid 15-digit GST number");
      return;
    }
    setGstError("");
    setGstVerifying(true);

    const res = await verifyGstNumber(value);

    setGstVerifying(false);

    if (res?.success) {
      setGstVerified(true);
      // Brief success flash so the tick is visible before the modal closes.
      setTimeout(() => setShowGstModal(false), 600);
    } else {
      setGstVerified(false);
      setGstError(res?.message || "Could not verify this GST number");
    }
  };

  const handleSkipGst = () => setShowGstModal(false);

  // Refs for dropdowns
  const stateRefs = useRef([]);
  const cityRefs = useRef([]);

  // Define initial form data for dirty check
  const initialFormData = useRef({
    company_name: "",
    email: "",
    phone: "",
    gst_number: "",
    gst_rate: "",
    pan_number: "",
    tin_number: "",
    industry_id: "",
    work_type: "",
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    service_charge_type: "",
    service_charge: "",
    addresses: [
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
  });

  useEffect(() => {
    const addressCount = formData.addresses?.length || 1;
    setShowStateDropdown(new Array(addressCount).fill(false));
    setShowCityDropdown(new Array(addressCount).fill(false));
  }, []);

  const isFormDirty = useMemo(() => {
    if (!formData || isSubmitting) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialFormData.current);
  }, [formData, isSubmitting]);

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

  const handleChange = (name, value) => {
    const cinPattern = /^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
    const tanPattern = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let updatedValue = value;

    setFormData((prev) => ({ ...prev, [name]: updatedValue }));

    setErrors((prev) => {
      const newErrors = { ...prev };

      // CIN validation (only if not empty)
      if (name === "tin_number") {
        if (updatedValue && !cinPattern.test(updatedValue)) {
          newErrors.tin_number = "Invalid CIN format";
        } else {
          delete newErrors.tin_number;
        }
      }

      // TAN validation (only if not empty)
      if (name === "pan_number") {
        if (updatedValue && !tanPattern.test(updatedValue)) {
          newErrors.pan_number = "Invalid TAN format";
        } else {
          delete newErrors.pan_number;
        }
      }
      if (name === "email") {
        if (value.length > 5) {
          if (!emailPattern.test(value)) {
            newErrors.email = "Please enter a valid email address";
          } else {
            delete newErrors.email;
          }
        } else {
          delete newErrors.email;
        }
      }
      if (name === "owner_email") {
        if (value.length > 5) {
          if (!emailPattern.test(value)) {
            newErrors.owner_email = "Please enter a valid email address";
          } else {
            delete newErrors.owner_email;
          }
        } else {
          delete newErrors.owner_email;
        }
      }
      // Phone: only digits, max 10
      if (name === "phone") {
        value = value.replace(/[^0-9]/g, "").slice(0, 10);
      }

      return newErrors;
    });
  };

  // const handleServiceChargeTypeChange = (e) => {
  //   setFormData((prev) => ({ ...prev, service_charge_type: e.target.value }));
  //   setErrors((prev) => ({ ...prev, service_charge_type: "" }));
  // };

  // const handleServiceChargeChange = (e) => {
  //   const value = e.target.value.replace(/\D/g, "");
  //   setFormData((prev) => ({ ...prev, service_charge: value }));
  //   setErrors((prev) => ({ ...prev, service_charge: "" }));
  // };
  const handleServiceChargeTypeChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      service_charge_type: e.target.value,
      service_charge: "",
    }));

    setErrors((prev) => ({
      ...prev,
      service_charge_type: "",
      service_charge: "",
    }));
  };
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

    setFormData((prev) => ({
      ...prev,
      service_charge: value,
    }));

    setErrors((prev) => ({
      ...prev,
      service_charge: "",
    }));
  };
  const handleIndustryChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, industry_id: value }));
    setErrors((prev) => ({ ...prev, industry_id: "" }));
  };

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

    // Open dropdown if state is selected
    if (updated[index].state_id) {
      setShowCityDropdown((prev) => {
        const newState = [...prev];
        newState[index] = true;
        return newState;
      });
    }
  };

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

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`state_${index}`];
      delete newErrors[`city_${index}`];
      return newErrors;
    });

    setShowStateDropdown((prev) => {
      const newState = [...prev];
      newState[index] = false;
      return newState;
    });

    await fetchCitiesByState(state.id, index);
  };

  const handleCitySelect = (index, city) => {
    if (isSubmitting) return;

    const updated = [...formData.addresses];
    updated[index] = {
      ...updated[index],
      city: city.name,
      city_id: city.id,
    };
    setFormData((prev) => ({ ...prev, addresses: updated }));

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`city_${index}`];
      return newErrors;
    });

    setShowCityDropdown((prev) => {
      const newState = [...prev];
      newState[index] = false;
      return newState;
    });
  };

  const handleAddressChangeLocal = (index, field, value) => {
    const updated = [...formData.addresses];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, addresses: updated }));
    setErrors((prev) => ({ ...prev, [`${field}_${index}`]: "" }));
  };

  const addAddressLocal = () => {
    const updated = [
      ...formData.addresses,
      {
        address: "",
        city: "",
        city_id: "",
        state: "",
        state_id: "",
        zip: "",
        address_type: "",
      },
    ];
    setFormData((prev) => ({ ...prev, addresses: updated }));
    setErrors((prev) => ({ ...prev, addresses: "" }));

    setShowStateDropdown((prev) => [...prev, false]);
    setShowCityDropdown((prev) => [...prev, false]);
  };

  const removeAddressLocal = (index) => {
    const updated = formData.addresses.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, addresses: updated }));

    setShowStateDropdown((prev) => prev.filter((_, i) => i !== index));
    setShowCityDropdown((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    const cinPattern = /^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
    const tanPattern = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;

    if (formData.tin_number && !cinPattern.test(formData.tin_number)) {
      setErrors((prev) => ({
        ...prev,
        tin_number: "Invalid CIN format",
      }));
      setIsSubmitting(false);
      return;
    }

    if (formData.pan_number && !tanPattern.test(formData.pan_number)) {
      setErrors((prev) => ({
        ...prev,
        pan_number: "Invalid TAN format",
      }));
      setIsSubmitting(false);
      return;
    }

    try {
      const ok = await submitCompany();

      if (ok) {
        initialFormData.current = JSON.parse(JSON.stringify(formData));

        Swal.fire({
          icon: "success",
          title: "Company added",
          text: "New company has been added successfully.",
          timer: 1800,
          showConfirmButton: false,
        });

        navigate("/admin/company/listing");
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: errors.api || "Please fill all the required fields.",
        });

        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/company/listing");
  };

  const gstModal = (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative"
      >
        <button
          type="button"
          onClick={handleSkipGst}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          title="Close and fill manually"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">
            Verify GST Number
          </h2>
          <p className="text-sm text-slate-500 mt-1 mb-5">
            Enter the company's GST number to auto-fill the form below, or
            close this to fill it in manually.
          </p>

          <form onSubmit={handleVerifyGst}>
            <label className="text-sm text-slate-600">GST Number</label>
            <input
              type="text"
              maxLength={15}
              value={gstInput}
              onChange={(e) => {
                setGstInput(e.target.value.toUpperCase());
                if (gstVerified) setGstVerified(false);
              }}
              disabled={gstVerifying || gstVerified}
              autoComplete="off"
              placeholder="Enter 15-digit GST number"
              className={`w-full rounded-lg p-2 mt-1 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                gstError
                  ? "border-red-500"
                  : gstVerified
                    ? "border-green-600"
                    : ""
              } ${gstVerifying || gstVerified ? "bg-gray-100" : ""}`}
            />
            {gstError && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={14} /> {gstError}
              </p>
            )}
            {gstVerified && (
              <div className="mt-2 flex items-center gap-2 bg-green-700 text-white text-sm font-medium px-3 py-2 rounded-lg">
                <CheckCircle size={16} />
                GST Verified Successfully
              </div>
            )}

            <div className="flex items-center gap-3 mt-5">
              <button
                type="submit"
                disabled={gstVerifying || gstVerified}
                className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {gstVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verifying...
                  </>
                ) : gstVerified ? (
                  "Verified"
                ) : (
                  "Verify & Continue"
                )}
              </button>
              <button
                type="button"
                onClick={handleSkipGst}
                disabled={gstVerifying}
                className="px-4 py-2.5 border rounded-lg text-slate-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Fill Manually
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );

  if (formLoading) {
    return (
      <>
        {showGstModal && gstModal}
        <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
          <div className="text-center">
            <Loader />
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      {showGstModal && gstModal}
      {/* Unsaved Changes Indicator */}
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

      {/* Submitting indicator */}
      {isSubmitting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="my-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-800 font-medium">Saving company...</span>
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
        {/* Company Information */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-[22px] shadow-sm border border-[#DDDDDD]"
        >
          <div className="text-lg bg-[#F9F9F9] rounded-t-[22px] border-b border-[#DDDDDD] px-6 py-4 font-semibold text-slate-700">
            Company Information
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            {/* Company Name */}
            <div>
              <label className="text-sm text-slate-600">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={100}
                value={formData.company_name}
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

            {/* Company Email */}
            <div>
              <label className="text-sm text-slate-600">
                Company Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.email}
                maxLength={100}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={isSubmitting}
                autoComplete="off"
                className={`w-full rounded-lg p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? "border border-red-500" : "border"
                } ${isSubmitting ? "bg-gray-100" : ""}`}
                placeholder="Enter Company Email Address"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Company Phone */}
            <div>
              <label className="text-sm text-slate-600">
                Company Contact Number <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                maxLength={10}
                value={formData.phone}
                onChange={(e) =>
                  handleChange(
                    "phone",
                    e.target.value.replace(/\D/g, "").slice(0, 10),
                  )
                }
                disabled={isSubmitting}
                autoComplete="off"
                className={`w-full rounded-lg p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? "border border-red-500" : "border"
                } ${isSubmitting ? "bg-gray-100" : ""}`}
                placeholder="Enter Company Contact Number"
              />

              <AnimatePresence>
                {formData.phone &&
                  !phonePattern.test(formData.phone.replace(/\s/g, "")) && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="text-red-500 text-sm mt-1 flex items-center gap-1"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Invalid number — must be 10 digits and start with 6–9
                    </motion.p>
                  )}
              </AnimatePresence>

              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Service Charge Type */}
            <div>
              <label className="text-sm text-slate-600">
                Service Charge Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.service_charge_type}
                onChange={handleServiceChargeTypeChange}
                disabled={isSubmitting}
                autoComplete="off"
                className={`w-full rounded-lg bg-white p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.service_charge_type
                    ? "border border-red-500"
                    : "border"
                } ${isSubmitting ? "bg-gray-100" : ""}`}
              >
                <option value="">Select Option</option>
                <option value="fixed">Fixed</option>
                <option value="percentage">Percentage</option>
              </select>
              {errors.service_charge_type && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.service_charge_type}
                </p>
              )}
            </div>

            {/* Service Charge */}
            <div>
              <label className="text-sm text-slate-600">
                Service Charge <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.service_charge}
                onChange={handleServiceChargeChange}
                maxLength={10}
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

            {/* Assign Agent */}
            <div>
              <label className="text-sm text-slate-600">Assign Agent</label>

              <select
                value={formData.agent_code}
                onChange={(e) => handleChange("agent_code", e.target.value)}
                disabled={isSubmitting}
                className={`w-full rounded-lg bg-white p-2 mt-1 border ${
                  errors.agent_code ? "border-red-500" : ""
                }`}
              >
                <option value="">Select Agent</option>
                {agents?.map((agent) => (
                  <option key={agent.id} value={agent.agent_code}>
                    {agent.name} ({agent.agent_code})
                  </option>
                ))}
              </select>

              {errors.agent_code && (
                <p className="text-red-500 text-sm mt-1">{errors.agent_code}</p>
              )}
            </div>

            {/* Relationship Manager */}
            <div>
              <label className="text-sm text-slate-600">
                Relationship Manager <span className="text-red-500">*</span>
              </label>

              <select
                value={formData.staff_code}
                onChange={(e) => handleChange("staff_code", e.target.value)}
                disabled={isSubmitting}
                className={`w-full rounded-lg bg-white p-2 mt-1 border ${
                  errors.staff_code ? "border-red-500" : ""
                }`}
              >
                <option value="">Select Staff</option>

                {staffList?.map((staff) => (
                  <option key={staff.id} value={staff.staff_code}>
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

        {/* Contact person */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-[22px] shadow-sm border border-gray-200"
        >
          <div className="text-lg bg-[#F9F9F9] rounded-t-[22px] border-b border-[#DDDDDD] px-6 py-4 font-semibold text-slate-700">
            Contact person <span className="text-red-500">*</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 px-6 py-4 gap-4">
            {/* Contact Person Name */}
            <div>
              <label className="text-sm text-slate-600">
                Contact Person Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.owner_name}
                onChange={(e) => handleChange("owner_name", e.target.value)}
                disabled={isSubmitting}
                maxLength={50}
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

            {/* Contact Person Phone */}
            <div>
              <label className="text-sm text-slate-600">
                Contact Person Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                maxLength={10}
                value={formData.owner_phone}
                onChange={(e) =>
                  handleChange(
                    "owner_phone",
                    e.target.value.replace(/\D/g, "").slice(0, 10),
                  )
                }
                disabled={isSubmitting}
                autoComplete="off"
                className={`w-full rounded-lg p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.owner_phone ? "border border-red-500" : "border"
                } ${isSubmitting ? "bg-gray-100" : ""}`}
                placeholder="Enter Person Number"
              />
              <AnimatePresence>
                {formData.owner_phone &&
                  !phonePattern.test(
                    formData.owner_phone.replace(/\s/g, ""),
                  ) && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="text-red-500 text-sm mt-1 flex items-center gap-1"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Invalid number — must be 10 digits and start with 6–9
                    </motion.p>
                  )}
              </AnimatePresence>
              {errors.owner_phone && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.owner_phone}
                </p>
              )}
            </div>

            {/* Contact Person Email */}
            <div className="md:col-span-2">
              <label className="text-sm text-slate-600">
                Contact Person Email Address{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
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

        {/* Business Profile */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-[22px] shadow-sm border border-gray-200"
        >
          <div className="text-lg bg-[#F9F9F9] rounded-t-[22px] border-b border-[#DDDDDD] px-6 py-4 font-semibold text-slate-700">
            Business Profile <span className="text-red-500">*</span>
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
              {industries?.map((item) => (
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

        {/* Company Addresses */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-[22px] shadow-sm border border-[#DDDDDD]"
        >
          <div className="flex bg-[#F9F9F9] rounded-t-[22px] border-b border-[#DDDDDD] px-6 py-4 justify-between items-center ">
            <h2 className="text-lg font-semibold text-slate-700">
              Work Address
            </h2>
            <button
              type="button"
              className={`text-blue-600 text-sm font-medium ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={addAddressLocal}
              disabled={isSubmitting}
            >
              + Add another address
            </button>
          </div>

          {(formData.addresses || []).map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 px-6 py-4 gap-4 border-b last:border-none"
            >
              {index > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => !isSubmitting && removeAddressLocal(index)}
                    disabled={isSubmitting}
                    className={`text-red-500 text-sm font-medium w-fit mb-2 ${
                      isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    Remove Address
                  </button>
                </div>
              )}

              {/* Address Line + Address Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm text-slate-600">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={item.address}
                    onChange={(e) =>
                      handleAddressChangeLocal(
                        index,
                        "address",
                        e.target.value,
                      )
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
                      handleAddressChangeLocal(
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
                  <label className="text-sm text-slate-600">
                    State / Province <span className="text-red-500">*</span>
                  </label>
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
                  <label className="text-sm text-slate-600">
                    City <span className="text-red-500">*</span>
                  </label>
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

                {/* ZIP Code */}
                <div>
                  <label className="text-sm text-slate-600">
                    ZIP / Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={item.zip}
                    onChange={(e) =>
                      handleAddressChangeLocal(index, "zip", e.target.value)
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

        {/* Tax Information */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-[22px] shadow-sm border border-gray-200"
        >
          <div className="text-lg bg-[#F9F9F9] rounded-t-[22px] border-b border-[#DDDDDD] px-6 py-4 font-semibold text-slate-700">
            Tax Information
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 px-6 py-4 gap-4">
            {/* GST Number */}
            <div>
              <label className="text-sm text-slate-600">
                GST Number <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                maxLength={20}
                value={formData.gst_number}
                onChange={(e) => handleChange("gst_number", e.target.value)}
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

            {/* GST Rate */}
            <div>
              <label className="text-sm text-slate-600">GST Rate (%)</label>

              <input
                type="text"
                maxLength={6}
                value={formData.gst_rate}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, "");
                  handleChange("gst_rate", value);
                }}
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

            {/* CIN */}
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

            {/* TAN */}
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

        {/* Action Buttons */}
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
              {isSubmitting ? "Adding Company..." : "Submit"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className={`border px-6 py-2 rounded-lg text-slate-600 bg-gray-50 ml-3 ${
                isSubmitting
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.form>
    </div>
  );
};

export default SingleAddCompanyForm;
