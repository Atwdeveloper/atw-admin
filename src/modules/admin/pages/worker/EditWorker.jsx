"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "@/lib/navigation";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import { useEditWorker } from "../../adminhooks/useEditWorker";
import Loader from "../../../../common/components/Loader";
import {
  AlertCircle,
  Search,
  CheckCircle,
  ChevronDown,
  X,
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Home,
  MapPin,
  Building2,
  Hash,
  ShieldCheck,
  CreditCard,
  Loader2,
  FileText,
  Award,
  Fingerprint,
  Wallet,
  MapPinned,
} from "lucide-react";
import EditableSalaryTable from "../../components/salary/EditableSalaryTable";
import useUnsavedChangesWarning from "../../../../common/hooks/useUnsavedChangesWarning";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";

// Small round thumbnail with a lettered fallback, reused in dropdown rows and
// selected chips below.
const Thumb = ({ image, name, size = 26 }) => (
  <span
    className="relative shrink-0 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-semibold text-gray-400 ring-1 ring-gray-200"
    style={{ width: size, height: size }}
  >
    {String(name || "?").charAt(0).toUpperCase()}
    {image && (
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    )}
  </span>
);

// Click-to-open picker used for Industry / Designation / Skills: closed by
// default, shows a checklist while open, and closes on selection (single) or
// stays open until an outside click (multi) — current picks are shown
// separately below via ChipsRow rather than inline in this control.
const PickerDropdown = ({
  dropdownRef,
  open,
  onToggleOpen,
  placeholder,
  loading,
  items,
  isSelected,
  onPick,
  multi = true,
  disabledReason,
  error,
}) => (
  <div ref={dropdownRef} className="relative">
    <button
      type="button"
      onClick={() => !disabledReason && onToggleOpen()}
      disabled={!!disabledReason}
      className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg border text-left text-sm transition ${
        disabledReason
          ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
          : error
            ? "border-red-500 bg-white text-gray-700"
            : "bg-white border-gray-300 text-gray-700 hover:border-blue-400"
      }`}
    >
      <span>{disabledReason || placeholder}</span>
      <ChevronDown
        size={16}
        className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
      />
    </button>

    {open && !disabledReason && (
      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
        {items.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-400 text-center">
            Nothing available
          </div>
        ) : (
          items.map((item) => {
            const picked = isSelected(item);
            return (
              <label
                key={item.id}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50/60 cursor-pointer border-b last:border-b-0 border-gray-100"
              >
                <input
                  type={multi ? "checkbox" : "radio"}
                  checked={picked}
                  readOnly
                  onClick={() => onPick(item)}
                  className="shrink-0"
                />
                <Thumb image={item.image} name={item.name} />
                <span className="flex-1 text-sm text-gray-700">
                  {item.name}
                </span>
                {picked && (
                  <CheckCircle size={16} className="text-blue-600 shrink-0" />
                )}
              </label>
            );
          })
        )}
      </div>
    )}
  </div>
);

// Separate "selected" section shown below each dropdown, with a thumbnail,
// the name, and a remove button.
const ChipsRow = ({ items, onRemove, emptyHint }) =>
  items.length === 0 ? (
    emptyHint ? (
      <p className="text-xs text-gray-400 mt-2">{emptyHint}</p>
    ) : null
  ) : (
    <div className="flex flex-wrap gap-2 mt-3">
      {items.map((item) => (
        <span
          key={item.id}
          className="flex items-center gap-2 bg-blue-50 text-blue-700 pl-1.5 pr-2 py-1 rounded-full text-xs font-medium border border-blue-100"
        >
          <Thumb image={item.image} name={item.name} size={20} />
          {item.name}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(item)}
              className="text-blue-400 hover:text-red-500"
            >
              <X size={12} />
            </button>
          )}
        </span>
      ))}
    </div>
  );

const EditWorkerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  const {
    formData,
    setFormData,
    errors,
    loading,
    formLoading,
    industries,
    designations,
    designationsLoading,
    skills,
    loadingSkills,
    states,
    cities,
    loadingCities,
    clearError,
    filterStates,
    filterCities,
    fetchCitiesByState,
    agents,
    filterAgents,
    generateStrongPassword,
    submitEdit,
    resetForm,
    filteredStates,
    filteredCities,
    // RM
    staffList,
    loadingStaff,
    filterStaffList,
    updateFormData,
    // Salary structure states
    earningComponents,
    earningValues,
    calculationResults,
    deductionTemplateLoading,
    initialSalaryLoading,
    handleEarningValueChange,
    verifyBankAccount,
    isBankVerified,
    verifyingBank,
  } = useEditWorker(id);

  // Store initial form data for dirty check
  const [initialFormData, setInitialFormData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showRMDropdown, setShowRMDropdown] = useState(false);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [rmSearch, setRmSearch] = useState("");
  const [agentSearch, setAgentSearch] = useState(""); // Refs
  const designationRef = useRef(null);
  const industryRef = useRef(null);
  const skillRef = useRef(null);
  const stateRef = useRef(null);
  const cityRef = useRef(null);
  const rmRef = useRef(null);
  const agentRef = useRef(null);
  // Set initial form data once when loaded
  useEffect(() => {
    const selectedRM = staffList.find(
      (s) => s.staff_code === formData.staff_code,
    );

    if (selectedRM) {
      setRmSearch(selectedRM.name);
    }
  }, [formData.staff_code, staffList]);

  useEffect(() => {
    const selectedAgent = agents.find(
      (a) => a.agent_code === formData.agent_code,
    );

    if (selectedAgent) {
      setAgentSearch(selectedAgent.name);
    }
  }, [formData.agent_code, agents]);
  useEffect(() => {
    if (
      formData &&
      Object.keys(formData).length > 0 &&
      !initialFormData &&
      !formLoading
    ) {
      setInitialFormData(JSON.parse(JSON.stringify(formData)));
    }
  }, [formData, formLoading, initialFormData]);
  const isFormDirty = useMemo(() => {
    if (!initialFormData || !formData || isSubmitting) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  }, [formData, initialFormData, isSubmitting]);

  useUnsavedChangesWarning(
    isFormDirty && !isSubmitting,
    "You have unsaved changes. Are you sure you want to leave? All changes will be lost.",
  );

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        designationRef.current &&
        !designationRef.current.contains(event.target)
      )
        setShowDesignationDropdown(false);
      if (industryRef.current && !industryRef.current.contains(event.target))
        setShowIndustryDropdown(false);
      if (skillRef.current && !skillRef.current.contains(event.target))
        setShowSkillDropdown(false);
      if (stateRef.current && !stateRef.current.contains(event.target))
        setShowStateDropdown(false);
      if (cityRef.current && !cityRef.current.contains(event.target))
        setShowCityDropdown(false);
      if (rmRef.current && !rmRef.current.contains(event.target))
        setShowRMDropdown(false);
      if (agentRef.current && !agentRef.current.contains(event.target))
        setShowAgentDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-fill account holder name
  useEffect(() => {
    const fullName = [
      formData.first_name,
      formData.middle_name,
      formData.last_name,
    ]
      .filter(Boolean)
      .join(" ");
    setFormData((prev) => ({ ...prev, account_holder_name: fullName }));
  }, [
    formData.first_name,
    formData.middle_name,
    formData.last_name,
    setFormData,
  ]);

  if (permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!hasPermission("workers", "edit")) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md shadow-sm">
          <User className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to edit this worker's profile.
          </p>
          <button
            onClick={() => navigate("/admin/worker/listing")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go Back to Worker Listing
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    clearError(name);
  };

  const handleMobileChange = (e) => {
    let value = e.target.value.replace(/\D/g, "").slice(0, 10);

    const part1 = value.slice(0, 3);
    const part2 = value.slice(3, 7);
    const part3 = value.slice(7, 10);

    let formatted = part1;
    if (part2) formatted += "-" + part2;
    if (part3) formatted += "-" + part3;

    setFormData((prev) => ({
      ...prev,
      mobile_number: formatted,
    }));

    const mobile = value;

    if (mobile.length > 0 && !/^[6-9]/.test(mobile)) {
      errors.mobile_number = "Mobile number must start with 6-9";
    } else if (mobile.length > 0 && mobile.length < 10) {
      errors.mobile_number = "Mobile number must be 10 digits";
    } else {
      clearError("mobile_number");
    }
  };

  const handleUANChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 12);
    setFormData((prev) => ({ ...prev, uan_number: value }));
    clearError("uan_number");
  };

  const handlePANChange = (e) => {
    let value = e.target.value.toUpperCase();
    if (/^[A-Z0-9]*$/.test(value)) {
      setFormData((prev) => ({ ...prev, pan_number: value.slice(0, 10) }));
      clearError("pan_number");
    }
  };

  const handleAadhaarChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    let formatted = value.slice(0, 12);
    setFormData((prev) => ({ ...prev, aadhar_number: formatted }));
    clearError("aadhar_number");
  };

  const handleAccountNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 18);
    setFormData((prev) => ({ ...prev, account_number: value }));
    clearError("account_number");
  };

  const handleIFSCChange = (e) => {
    const value = e.target.value.toUpperCase().slice(0, 11);
    setFormData((prev) => ({ ...prev, ifsc_code: value }));
    clearError("ifsc_code");
  };

  // ------------------ Industry / Designation / Skills (click-to-open) ------------------
  const handleIndustrySelect = (industry) => {
    setFormData((prev) => ({
      ...prev,
      industry: industry.name,
      industry_id: industry.id,
      // Designations (and therefore skills) are scoped to the industry, so
      // switching industry invalidates whatever was picked before.
      designations: [],
      skills: [],
    }));
    clearError("industry_id");
    setShowIndustryDropdown(false);
  };

  // Designation handlers (multi-select, capped at 3 — mirror the hook's
  // submit-time validation by refusing a 4th pick in the UI itself).
  const toggleDesignation = (designation) => {
    setFormData((prev) => {
      const selected = prev.designations || [];
      const exists = selected.some((d) => d.id === designation.id);
      if (!exists && selected.length >= 3) return prev;
      return {
        ...prev,
        designations: exists
          ? selected.filter((d) => d.id !== designation.id)
          : [...selected, designation],
      };
    });
    clearError("designation");
  };
  const removeDesignation = (id) => {
    setFormData((prev) => ({
      ...prev,
      designations: (prev.designations || []).filter((d) => d.id !== id),
    }));
  };

  // Skills handlers (multi-select, no cap)
  const toggleSkill = (skill) => {
    setFormData((prev) => {
      const selected = prev.skills || [];
      const exists = selected.some((s) => s.id === skill.id);
      return {
        ...prev,
        skills: exists
          ? selected.filter((s) => s.id !== skill.id)
          : [...selected, skill],
      };
    });
    clearError("skills");
  };
  const removeSkill = (id) => {
    setFormData((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((s) => s.id !== id),
    }));
  };
  const handleRMSearch = (value) => {
    setRmSearch(value);

    setFormData((prev) => ({
      ...prev,
      staff_code: "",
    }));

    filterStaffList(value);
    setShowRMDropdown(true);
  };

  const handleRMSelect = (staff) => {
    setRmSearch(staff.name);

    setFormData((prev) => ({
      ...prev,
      staff_code: staff.staff_code,
    }));

    clearError("staff_code");
    setShowRMDropdown(false);
  };

  const handleAgentSearch = (value) => {
    setAgentSearch(value);

    setFormData((prev) => ({
      ...prev,
      agent_code: "",
    }));

    filterAgents(value);
    setShowAgentDropdown(true);
  };

  const handleAgentSelect = (agent) => {
    setAgentSearch(agent.name);

    setFormData((prev) => ({
      ...prev,
      agent_code: agent.agent_code,
    }));

    clearError("agent_code");
    setShowAgentDropdown(false);
  };
  // RM handlers
  // const handleRMSearch = (value) => {
  //   setFormData((prev) => ({ ...prev, staff_code: "" }));
  //   filterStaffList(value);
  //   setShowRMDropdown(true);
  // };
  // const handleRMSelect = (staff) => {
  //   setFormData((prev) => ({ ...prev, staff_code: staff.staff_code }));
  //   clearError("staff_code");
  //   setShowRMDropdown(false);
  // };
  // const handleAgentSearch = (value) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     agent_code: "",
  //   }));

  //   filterAgents(value);
  //   setShowAgentDropdown(true);
  // };

  // const handleAgentSelect = (agent) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     agent_code: agent.agent_code,
  //   }));

  //   clearError("agent_code");
  //   setShowAgentDropdown(false);
  // };

  // Residential address handlers
  const handleStateSearch = (value) => {
    setFormData((prev) => ({
      ...prev,
      state: value,
      state_id: "",
      city: "",
      city_id: "",
    }));
    filterStates(value);
    setShowStateDropdown(true);
  };
  const handleStateSelect = async (state) => {
    setFormData((prev) => ({
      ...prev,
      state: state.name,
      state_id: state.id,
      city: "",
      city_id: "",
    }));
    clearError("state_id");
    await fetchCitiesByState(state.id);
    setShowStateDropdown(false);
  };
  const handleCitySearch = (value) => {
    setFormData((prev) => ({ ...prev, city: value, city_id: "" }));
    filterCities(value);
    setShowCityDropdown(true);
  };
  const handleCitySelect = (city) => {
    setFormData((prev) => ({ ...prev, city: city.name, city_id: city.id }));
    clearError("city_id");
    setShowCityDropdown(false);
  };

  const handleGeneratePassword = () => {
    const password = generateStrongPassword();
    setFormData((prev) => ({ ...prev, password, confirm_password: password }));
    clearError("password");
    clearError("confirm_password");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await submitEdit(formData);
      if (response?.success) {
        setInitialFormData(JSON.parse(JSON.stringify(formData)));
        Swal.fire({
          icon: "success",
          title: "Worker Updated",
          text: "Worker details have been updated successfully.",
          timer: 1800,
          showConfirmButton: false,
        }).then(() => navigate("/admin/worker/listing"));
      } else {
        setIsSubmitting(false);
      }
    } catch (error) {
      setIsSubmitting(false);
      if (error.message !== "Validation failed") {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message || "Failed to update worker",
        });
      }
    }
  };

  const handleCancel = () => navigate("/admin/worker/listing");
  const handleReset = () => {
    if (initialFormData)
      setFormData(JSON.parse(JSON.stringify(initialFormData)));
  };

  // Picker item lists (Industry / Designation / Skills), normalized to
  // {id, name, image} for the Thumb/PickerDropdown/ChipsRow components.
  const industryItems = industries.map((ind) => ({
    id: ind.id,
    name: ind.name,
    image: ind.image_url,
  }));
  const designationItems = designations.map((d) => ({
    id: d.id,
    name: d.name,
    image: d.image_url,
  }));
  const skillItems = skills.map((s) => ({
    id: s.id,
    name: s.name,
    image: s.skill_image_url || s.image_url || s.skill_image,
  }));
  const selectedIndustry = industryItems.find(
    (i) => String(i.id) === String(formData.industry_id),
  );

  if (formLoading) {
    return (
      <div className="flex-1 bg-gray-50 p-6 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!formData.id && !loading) {
    return (
      <div className="flex-1 bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Worker not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Edit Worker Profile
        </h1>
        <p className="text-gray-600 mt-2">
          Update worker details and personal information
        </p>
      </div>

      {isFormDirty && !isSubmitting && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 font-medium">
              You have unsaved changes
            </span>
          </div>
        </motion.div>
      )}

      <motion.form
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
        onSubmit={handleSubmit}
      >
        {/* Basic Details Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-[22px] shadow-sm border border-[#DDDDDD]"
        >
          <div className="text-lg bg-[#F9F9F9] rounded-t-[22px] border-b border-[#DDDDDD] px-6 py-4 font-semibold text-slate-700">
            Basic Details
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
            {/* Worker Code (readonly) */}
            <div className="md:col-span-3">
              <label className="text-sm text-slate-600 font-medium">
                Worker Code
              </label>
              <div className="relative mt-2">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={formData.worker_code}
                  readOnly
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Worker Code cannot be changed
              </p>
            </div>
            {/* First Name */}
            <div>
              <label>
                First Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  maxLength={35}
                  value={formData.first_name}
                  onChange={handleChange}
                  name="first_name"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${errors.first_name ? "border-red-500" : "border"}`}
                />
              </div>
              {errors.first_name && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  {errors.first_name}
                </p>
              )}
            </div>
            {/* Middle Name */}
            <div>
              <label>Middle Name</label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  maxLength={35}
                  value={formData.middle_name}
                  onChange={handleChange}
                  name="middle_name"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border"
                />
              </div>
            </div>
            {/* Last Name */}
            <div>
              <label>
                Last Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  maxLength={35}
                  value={formData.last_name}
                  onChange={handleChange}
                  name="last_name"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${errors.last_name ? "border-red-500" : "border"}`}
                />
              </div>
              {errors.last_name && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  {errors.last_name}
                </p>
              )}
            </div>
            {/* Work Email */}
            <div>
              <label>Personal Email</label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  value={formData.work_email}
                  onChange={handleChange}
                  name="work_email"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${errors.work_email || errors.email ? "border-red-500" : "border"}`}
                />
              </div>
              {(errors.work_email || errors.email) && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.work_email || errors.email}
                </p>
              )}
            </div>
            {/* Mobile Number */}
            <div>
              <label>
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  value={formData.mobile_number}
                  onChange={handleMobileChange}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${errors.mobile_number ? "border-red-500" : "border"}`}
                  maxLength={12}
                />
              </div>
              {errors.mobile_number && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  {errors.mobile_number}
                </p>
              )}
            </div>
            {/* Gender */}
            <div>
              <label>
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <select
                  value={formData.gender}
                  onChange={handleChange}
                  name="gender"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${errors.gender ? "border-red-500" : "border"}`}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              {errors.gender && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  {errors.gender}
                </p>
              )}
            </div>
            {/* Dress Size */}
            <div>
              <label>Dress Size</label>
              <div className="grid grid-cols-5 gap-2">
                {["S", "M", "L", "XL", "XXL"].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        dress_size: prev.dress_size === size ? "" : size,
                      }))
                    }
                    className={`py-3 rounded-lg border text-center transition ${formData.dress_size === size ? "bg-blue-100 border-blue-500 text-blue-700 font-semibold" : "border-gray-300 hover:bg-gray-50"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            {/* Reporting Manager (RM) */}
            <div ref={rmRef} className="relative">
              <label>Reporting Manager</label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  // value={
                  //   loadingStaff
                  //     ? "Loading..."
                  //     : staffList.find(
                  //         (s) => s.staff_code === formData.staff_code,
                  //       )?.name ||
                  //       formData.staff_code ||
                  //       ""
                  // }
                  value={rmSearch}
                  onChange={(e) => handleRMSearch(e.target.value)}
                  onFocus={() => setShowRMDropdown(true)}
                  className="w-full pl-10 pr-10 py-2 rounded-lg border"
                  placeholder="Search reporting manager"
                  disabled={loadingStaff}
                />
                <Search
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </div>
              {showRMDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                  {loadingStaff ? (
                    <div className="p-3 text-center">Loading...</div>
                  ) : staffList.length > 0 ? (
                    staffList.map((s) => (
                      <div
                        key={s.id}
                        className="px-4 py-2.5 hover:bg-gray-100 cursor-pointer border-b"
                        onClick={() => handleRMSelect(s)}
                      >
                        <div className="flex justify-between">
                          <span>
                            {s.name} ({s.staff_code})
                          </span>
                          {formData.staff_code === s.staff_code && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3">No staff found</div>
                  )}
                </div>
              )}
            </div>
            <div ref={agentRef} className="relative">
              <label>Agent</label>

              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />

                <input
                  type="text"
                  // value={
                  //   agents.find((a) => a.agent_code === formData.agent_code)
                  //     ?.name ||
                  //   formData.agent_code ||
                  //   ""
                  // }
                  value={agentSearch}
                  onChange={(e) => handleAgentSearch(e.target.value)}
                  onFocus={() => setShowAgentDropdown(true)}
                  className="w-full pl-10 pr-10 py-2 rounded-lg border"
                  placeholder="Search agent"
                />

                <Search
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </div>

              {showAgentDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                  {agents.length > 0 ? (
                    agents.map((agent) => (
                      <div
                        key={agent.id}
                        className="px-4 py-2.5 hover:bg-gray-100 cursor-pointer border-b"
                        onClick={() => handleAgentSelect(agent)}
                      >
                        <div className="flex justify-between">
                          <span>
                            {agent.name} ({agent.agent_code})
                          </span>

                          {formData.agent_code === agent.agent_code && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3">No agents found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Statutory Details */}
          <div className="border-t p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-slate-700">
              <ShieldCheck className="text-orange-500" size={20} />
              Statutory Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label>UAN Number</label>
                <div className="relative">
                  <Hash
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={formData.uan_number}
                    onChange={handleUANChange}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border"
                    placeholder="12-digit UAN"
                    maxLength="12"
                  />
                </div>
                {errors.uan_number && (
                  <p className="text-red-500 text-sm">{errors.uan_number}</p>
                )}
              </div>
              <div>
                <label>ESIC Number</label>
                <div className="relative">
                  <ShieldCheck
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={formData.esic_number}
                    onChange={handleChange}
                    name="esic_number"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border"
                    placeholder="Enter ESIC Number"
                  />
                </div>
                {errors.esic_number && (
                  <p className="text-red-500 text-sm">{errors.esic_number}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Professional Details Card (Industry, Designation, Skills, Experience) */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-[22px] shadow-sm border border-[#DDDDDD]"
        >
          <div className="text-lg bg-[#F9F9F9] rounded-t-[22px] border-b px-6 py-4 font-semibold text-slate-700">
            Professional Details
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
            {/* Industry (single-select) */}
            <div>
              <label>Industry</label>
              <div className="mt-1">
                <PickerDropdown
                  dropdownRef={industryRef}
                  open={showIndustryDropdown}
                  onToggleOpen={() => setShowIndustryDropdown((o) => !o)}
                  placeholder={
                    selectedIndustry
                      ? selectedIndustry.name
                      : "Select industry"
                  }
                  loading={false}
                  items={industryItems}
                  isSelected={(item) =>
                    String(formData.industry_id) === String(item.id)
                  }
                  onPick={(item) => handleIndustrySelect(item)}
                  multi={false}
                  error={errors.industry_id}
                />
              </div>
              {errors.industry_id && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  {errors.industry_id}
                </p>
              )}
            </div>

            {/* Designation (multi-select, capped at 3) */}
            <div>
              <label>
                Designation <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <PickerDropdown
                  dropdownRef={designationRef}
                  open={showDesignationDropdown}
                  onToggleOpen={() => setShowDesignationDropdown((o) => !o)}
                  placeholder={
                    formData.designations.length > 0
                      ? `${formData.designations.length}/3 selected`
                      : "Select up to 3 designations"
                  }
                  loading={designationsLoading}
                  items={designationItems}
                  isSelected={(item) =>
                    formData.designations.some((d) => d.id === item.id)
                  }
                  onPick={(item) => toggleDesignation(item)}
                  multi
                  error={errors.designation}
                />
              </div>
              {errors.designation && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  {errors.designation}
                </p>
              )}
              <ChipsRow
                items={formData.designations}
                onRemove={(item) => removeDesignation(item.id)}
                emptyHint={
                  formData.industry_id
                    ? "No designations selected yet."
                    : undefined
                }
              />
            </div>

            {/* Experience */}
            <div>
              <label>Experience (Years)</label>
              <div className="relative">
                <Award
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="number"
                  value={formData.work_experience}
                  onChange={handleChange}
                  name="work_experience"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border"
                  placeholder="Years"
                  min="0"
                  max="50"
                  step="0.5"
                />
              </div>
            </div>

            {/* Skills (multi-select, scoped to the selected designations) */}
            <div className="md:col-span-3">
              <label>Skills</label>
              <div className="mt-1">
                <PickerDropdown
                  dropdownRef={skillRef}
                  open={showSkillDropdown}
                  onToggleOpen={() => setShowSkillDropdown((o) => !o)}
                  placeholder={
                    formData.skills.length > 0
                      ? `${formData.skills.length} selected`
                      : "Select skills"
                  }
                  loading={loadingSkills}
                  items={skillItems}
                  isSelected={(item) =>
                    (formData.skills || []).some((s) => s.id === item.id)
                  }
                  onPick={(item) => toggleSkill(item)}
                  multi
                  disabledReason={
                    (formData.designations || []).length === 0
                      ? "Select a designation first"
                      : undefined
                  }
                  error={errors.skills}
                />
              </div>
              {errors.skills && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  {errors.skills}
                </p>
              )}
              <ChipsRow
                items={formData.skills}
                onRemove={(item) => removeSkill(item.id)}
                emptyHint={
                  (formData.designations || []).length > 0
                    ? "No skills selected yet."
                    : undefined
                }
              />
            </div>
          </div>
        </motion.div>

        {/* Personal Details Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-[22px] shadow-sm border border-[#DDDDDD] overflow-visible"
        >
          <div className="text-lg bg-[#F9F9F9] rounded-t-[22px] border-b px-6 py-4 font-semibold">
            Personal Details
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            <div>
              <label>Date of Birth</label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  name="date_of_birth"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border"
                />
              </div>
              {errors.date_of_birth && (
                <p className="text-red-500 text-sm">{errors.date_of_birth}</p>
              )}
            </div>
            <div>
              <label>Father's Name</label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  maxLength={35}
                  value={formData.father_name}
                  onChange={handleChange}
                  name="father_name"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border"
                />
              </div>
            </div>
            <div>
              <label>PAN Number</label>
              <div className="relative">
                <FileText
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  value={formData.pan_number}
                  onChange={handlePANChange}
                  maxLength="10"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border"
                />
              </div>
              {errors.pan_number && (
                <p className="text-red-500 text-sm">{errors.pan_number}</p>
              )}
            </div>
            <div>
              <label>
                Aadhaar Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Fingerprint
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  value={formData.aadhar_number}
                  onChange={handleAadhaarChange}
                  maxLength="14"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${errors.aadhar_number ? "border-red-500" : ""}`}
                />
              </div>
              {errors.aadhar_number && (
                <p className="text-red-500 text-sm">{errors.aadhar_number}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label>Residential Address</label>
              <div className="relative">
                <Home
                  className="absolute left-3 top-3 text-gray-400"
                  size={18}
                />
                <textarea
                  value={formData.address}
                  onChange={handleChange}
                  name="address"
                  rows="3"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border"
                ></textarea>
              </div>
            </div>
            <div ref={stateRef} className="relative">
              <label>
                State <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleStateSearch(e.target.value)}
                  onFocus={() => setShowStateDropdown(true)}
                  className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
                    errors.state_id ? "border-red-500" : ""
                  }`}
                />
                <Search
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </div>
              {errors.state_id && (
                <p className="text-red-500 text-sm">{errors.state_id}</p>
              )}
              {showStateDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg max-h-60 overflow-auto">
                  {filteredStates.map((s) => (
                    <div
                      key={s.id}
                      className="px-4 py-2.5 hover:bg-gray-100 cursor-pointer border-b"
                      onClick={() => handleStateSelect(s)}
                    >
                      <div className="flex justify-between">
                        <span>{s.name}</span>
                        {formData.state_id === s.id && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div ref={cityRef} className="relative">
              <label>
                City <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleCitySearch(e.target.value)}
                  onFocus={() => formData.state_id && setShowCityDropdown(true)}
                  disabled={!formData.state_id}
                  className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
                    errors.city_id ? "border-red-500" : ""
                  } ${!formData.state_id ? "bg-gray-100" : ""}`}
                  placeholder={
                    formData.state_id ? "Search city" : "Select state first"
                  }
                />
                {loadingCities ? (
                  <div className="absolute right-3 top-1/2 animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                ) : (
                  <Search
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                )}
              </div>
              {errors.city_id && (
                <p className="text-red-500 text-sm">{errors.city_id}</p>
              )}
              {showCityDropdown && formData.state_id && (
                <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg max-h-60 overflow-auto">
                  {filteredCities.map((c) => (
                    <div
                      key={c.id}
                      className="px-4 py-2.5 hover:bg-gray-100 cursor-pointer border-b"
                      onClick={() => handleCitySelect(c)}
                    >
                      <div className="flex justify-between">
                        <span>{c.name}</span>
                        {formData.city_id === c.id && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label>Pincode</label>
              <div className="relative">
                <MapPinned
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={formData.zip}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      zip: e.target.value.replace(/\D/g, "").slice(0, 6),
                    }))
                  }
                  className="w-full pl-10 pr-4 py-2 rounded-lg border"
                  maxLength="6"
                />
              </div>
              {errors.zip && (
                <p className="text-red-500 text-sm">{errors.zip}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Payment Information Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-[22px] shadow-sm border border-[#DDDDDD]"
        >
          <div className="text-lg bg-[#F9F9F9] rounded-t-[22px] border-b px-6 py-4 font-semibold">
            Payment Information
          </div>
          <div className="p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg w-fit">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">
                  Bank Transfer
                </span>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  Bank Account Details
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label>Account Holder Name</label>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      value={formData.account_holder_name}
                      disabled
                      className="w-full pl-10 pr-4 py-2 rounded-lg border bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <label>Account Number</label>
                  <div className="relative">
                    <CreditCard
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      value={formData.account_number}
                      onChange={handleAccountNumberChange}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border"
                      maxLength="18"
                    />
                  </div>
                  {errors.account_number && (
                    <p className="text-red-500 text-sm">
                      {errors.account_number}
                    </p>
                  )}
                </div>
                <div>
                  <label>IFSC Code</label>
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <Hash
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="text"
                        value={formData.ifsc_code}
                        onChange={handleIFSCChange}
                        maxLength="11"
                        className="w-full pl-10 pr-4 py-2 rounded-lg border uppercase"
                        placeholder="e.g. ICIC0000001"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={verifyBankAccount}
                      disabled={verifyingBank || isBankVerified}
                      className={`whitespace-nowrap text-xs font-medium px-4 py-2.5 rounded-lg transition-colors h-full ${isBankVerified ? "bg-green-100 text-green-700 cursor-default" : "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"}`}
                    >
                      {verifyingBank
                        ? "..."
                        : isBankVerified
                          ? "Verified"
                          : "Verify Account"}
                    </button>
                  </div>
                  {errors.bank_verification && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.bank_verification}
                    </p>
                  )}
                  {errors.ifsc_code && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.ifsc_code}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Salary Structure Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-[22px] shadow-sm border border-[#DDDDDD] overflow-hidden"
        >
          <div className="text-lg bg-[#F9F9F9] border-b border-[#DDDDDD] px-6 py-4 font-semibold text-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="text-blue-600" size={20} />
              Salary Structure
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">
                Define Specific Template
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.define_salary_structure}
                  onChange={(e) =>
                    updateFormData({
                      define_salary_structure: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="p-0">
            {formData.define_salary_structure ? (
              <>
                <div className="w-full p-6 bg-white border-b">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <ShieldCheck className="text-blue-600" size={18} />
                      Statutory Compliance
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Toggle PF/ESIC applicability for this specific worker
                      template.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PF Toggle */}
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800">
                            PF Applicable
                          </h3>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {formData.is_pf_applicable
                              ? `PF deductions will be applied (Upper Cap: ₹${formData.pf_upper_cap})`
                              : "No PF deductions will be applied"}
                          </p>
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.is_pf_applicable}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  is_pf_applicable: e.target.checked,
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                          <span
                            className={`text-[11px] font-bold tracking-widest ${formData.is_pf_applicable ? "text-blue-600" : "text-gray-400"}`}
                          >
                            {formData.is_pf_applicable ? "YES" : "NO"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* ESIC Toggle */}
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800">
                            ESIC Applicable
                          </h3>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {formData.is_esi_applicable
                              ? `ESIC deductions will be applied (Upper Cap: ₹${formData.esi_upper_cap})`
                              : "No ESIC deductions will be applied"}
                          </p>
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.is_esi_applicable}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  is_esi_applicable: e.target.checked,
                                }))
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                          <span
                            className={`text-[11px] font-bold tracking-widest ${formData.is_esi_applicable ? "text-blue-600" : "text-gray-400"}`}
                          >
                            {formData.is_esi_applicable ? "YES" : "NO"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-full">
                  {initialSalaryLoading ? (
                    <div className="p-8 text-center text-slate-500">
                      <Loader2
                        size={32}
                        className="animate-spin mx-auto text-blue-500 mb-2"
                      />
                      <p>Initializing salary structure...</p>
                    </div>
                  ) : (
                    <EditableSalaryTable
                      earningComponents={earningComponents}
                      earningValues={earningValues}
                      calculationResults={calculationResults}
                      onValueChange={handleEarningValueChange}
                      isLoading={deductionTemplateLoading}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center bg-slate-50 w-full">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase size={28} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  Standard Designation Salary
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  This worker will follow the default salary template assigned
                  to their designation.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex justify-end gap-4">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="border px-6 py-2 rounded-lg text-slate-600 bg-gray-50 hover:bg-gray-100"
          >
            Reset Changes
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="border px-6 py-2 rounded-lg text-slate-600 bg-gray-50 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || isSubmitting}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:brightness-105 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>{" "}
                Updating...
              </span>
            ) : (
              "Update Worker"
            )}
          </button>
        </motion.div>
      </motion.form>
    </div>
  );
};

export default EditWorkerPage;
