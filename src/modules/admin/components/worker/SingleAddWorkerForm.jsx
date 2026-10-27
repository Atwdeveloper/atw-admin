"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import { useAddWorker } from "../../adminhooks/useAddWorker";
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
  FileText,
  Award,
  Fingerprint,
  Wallet,
  MapPinned,
} from "lucide-react";
import EditableSalaryTable from "../salary/EditableSalaryTable";
import useUnsavedChangesWarning from "../../../../common/hooks/useUnsavedChangesWarning";
import AadhaarVerifyModal from "./AadhaarVerifyModal";

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
// on an outside click (multi) — the current picks are shown separately below
// via ChipsRow rather than inline in this control.
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

// Separate "selected" section shown below each dropdown once it closes.
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

const SingleAddWorkerForm = () => {
  const {
    formData,
    errors,
    loading,
    formLoading,
    industries,
    designations,
    skills,
    loadingSkills,
    states,
    cities,
    loadingCities,
    agents,
    filterAgents,
    updateFormData,
    designationsLoading,
    clearError,
    filterStates,
    filterCities,
    fetchCitiesByState,
    staffList,
    loadingStaff,
    filterStaffList,
    earningComponents,
    earningValues,
    calculationResults,
    initialSalaryLoading,
    handleEarningValueChange,
    submitForm,
    resetForm,
    verifyBankAccount,
    isBankVerified,
    verifyingBank,
    navigate,
  } = useAddWorker();

  // UI states
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const skillRef = useRef(null);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showRMDropdown, setShowRMDropdown] = useState(false);
  const [shouldWarn, setShouldWarn] = useState(true);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [rmSearch, setRmSearch] = useState("");
  const [agentSearch, setAgentSearch] = useState("");
  const [showAadhaarModal, setShowAadhaarModal] = useState(true);
  // Refs
  const designationRef = useRef(null);
  const industryRef = useRef(null);
  const stateRef = useRef(null);
  const cityRef = useRef(null);
  const rmRef = useRef(null);
  const agentRef = useRef(null);
  const initialEmptyState = useMemo(
    () => ({
      first_name: "",
      middle_name: "",
      last_name: "",
      work_email: "",
      mobile_number: "",
      gender: "",
      work_location: "",
      industry: "",
      industry_id: "",
      designations: [],
      skills: [],
      work_experience: "",
      dress_size: "",
      bonus_frequency: "",
      uan_number: "",
      esic_number: "",
      date_of_birth: "",
      father_name: "",
      pan_number: "",
      aadhar_number: "",
      residential_address: "",
      state: "",
      state_id: "",
      city: "",
      city_id: "",
      zip: "",
      payment_method: "bank",
      account_holder_name: "",
      bank_name: "",
      account_number: "",
      ifsc_code: "",
      staff_code: "",
    }),
    [],
  );

  const isFormDirty = useMemo(() => {
    if (loading) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialEmptyState);
  }, [formData, initialEmptyState, loading]);

  useUnsavedChangesWarning(
    isFormDirty && shouldWarn && !loading,
    "You have unsaved changes. Are you sure you want to leave? All changes will be lost.",
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        designationRef.current &&
        !designationRef.current.contains(event.target)
      )
        setShowDesignationDropdown(false);
      if (industryRef.current && !industryRef.current.contains(event.target))
        setShowIndustryDropdown(false);
      if (stateRef.current && !stateRef.current.contains(event.target))
        setShowStateDropdown(false);
      if (cityRef.current && !cityRef.current.contains(event.target))
        setShowCityDropdown(false);
      if (agentRef.current && !agentRef.current.contains(event.target))
        setShowAgentDropdown(false);
      if (rmRef.current && !rmRef.current.contains(event.target))
        setShowRMDropdown(false);
      if (skillRef.current && !skillRef.current.contains(event.target))
        setShowSkillDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fullName = [
      formData.first_name,
      formData.middle_name,
      formData.last_name,
    ]
      .filter(Boolean)
      .join(" ");
    updateFormData({ account_holder_name: fullName });
  }, [formData.first_name, formData.middle_name, formData.last_name]);
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
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    updateFormData({ [name]: type === "checkbox" ? checked : value });
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

    updateFormData({ mobile_number: formatted });

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
    updateFormData({ uan_number: value });
    clearError("uan_number");
  };

  const handlePANChange = (e) => {
    let value = e.target.value.toUpperCase();
    if (/^[A-Z0-9]*$/.test(value)) {
      updateFormData({ pan_number: value.slice(0, 10) });
      clearError("pan_number");
    }
  };

  const handleAadhaarChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    let formatted = value.slice(0, 12);
    updateFormData({ aadhar_number: formatted });
    clearError("aadhar_number");
  };

  // const handleAccountNumberChange = (e) => {
  //   updateFormData({ account_number: e.target.value });
  //   clearError("account_number");
  // };
  const handleAccountNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 18);

    updateFormData({ account_number: value });
    clearError("account_number");
  };
  const handleIFSCChange = (e) => {
    updateFormData({ ifsc_code: e.target.value });
    clearError("ifsc_code");
  };

  const handleIndustrySelect = (industry) => {
    // Designations (and therefore skills) are scoped to the industry, so
    // switching industry invalidates whatever was picked before — mirrors
    // Edit Worker's behavior.
    updateFormData({
      industry: industry.name,
      industry_id: industry.id,
      designations: [],
      skills: [],
    });
    clearError("industry");
    setShowIndustryDropdown(false);
  };

  const toggleDesignation = (designation) => {
    const selected = formData.designations || [];
    const exists = selected.some((d) => d.id === designation.id);
    // Mirror the worker self-registration UX: ignore the click outright
    // once 3 are selected, rather than only catching it at submit time.
    if (!exists && selected.length >= 3) return;
    updateFormData({
      designations: exists
        ? selected.filter((d) => d.id !== designation.id)
        : [...selected, designation],
      new_designation: "",
    });
    clearError("designation");
  };

  const removeDesignation = (id) => {
    updateFormData({
      designations: (formData.designations || []).filter((d) => d.id !== id),
    });
  };

  const toggleSkill = (skill) => {
    const selected = formData.skills || [];

    const exists = selected.some((s) => s.id === skill.id);

    if (exists) {
      updateFormData({
        skills: selected.filter((s) => s.id !== skill.id),
      });
    } else {
      updateFormData({
        skills: [...selected, skill],
      });
    }
  };
  const removeSkill = (id) => {
    updateFormData({
      skills: formData.skills.filter((s) => s.id !== id),
    });
  };

  const handleRMSearch = (value) => {
    setRmSearch(value);

    updateFormData({
      staff_code: "",
    });

    filterStaffList(value);
    setShowRMDropdown(true);
  };

  const handleRMSelect = (staff) => {
    setRmSearch(staff.name);

    updateFormData({
      staff_code: staff.staff_code,
    });

    clearError("staff_code");
    setShowRMDropdown(false);
  };
  // const handleRMSearch = (value) => {
  //   updateFormData({ staff_code: "" });
  //   filterStaffList(value);
  //   setShowRMDropdown(true);
  // };

  // const handleRMSelect = (staff) => {
  //   updateFormData({ staff_code: staff.staff_code });
  //   clearError("staff_code");
  //   setShowRMDropdown(false);
  // };
  // const handleAgentSearch = (value) => {
  //   updateFormData({ agent_code: "" });
  //   filterAgents(value);
  //   setShowAgentDropdown(true);
  // };

  // const handleAgentSelect = (agent) => {
  //   updateFormData({
  //     agent_code: agent.agent_code,
  //   });

  //   clearError("agent_code");
  //   setShowAgentDropdown(false);
  // };
  const handleAgentSearch = (value) => {
    setAgentSearch(value);

    updateFormData({
      agent_code: "",
    });

    filterAgents(value);
    setShowAgentDropdown(true);
  };

  const handleAgentSelect = (agent) => {
    setAgentSearch(agent.name);

    updateFormData({
      agent_code: agent.agent_code,
    });

    clearError("agent_code");
    setShowAgentDropdown(false);
  };
  const handleStateSearch = (value) => {
    updateFormData({ state: value, state_id: "", city: "", city_id: "" });
    filterStates(value);
    setShowStateDropdown(true);
  };
  const handleStateSelect = async (state) => {
    updateFormData({
      state: state.name,
      state_id: state.id,
      city: "",
      city_id: "",
    });
    clearError("state_id");
    await fetchCitiesByState(state.id);
    setShowStateDropdown(false);
  };
  const handleCitySearch = (value) => {
    updateFormData({ city: value, city_id: "" });
    filterCities(value);
    setShowCityDropdown(true);
  };
  const handleCitySelect = (city) => {
    updateFormData({ city: city.name, city_id: city.id });
    clearError("city_id");
    setShowCityDropdown(false);
  };

  const formatMobileNumber = (digits) => {
    const part1 = digits.slice(0, 3);
    const part2 = digits.slice(3, 7);
    const part3 = digits.slice(7, 10);
    let formatted = part1;
    if (part2) formatted += "-" + part2;
    if (part3) formatted += "-" + part3;
    return formatted;
  };

  const handleAadhaarVerified = async (data) => {
    // `data` may only carry `mobile_number` (admin verified the mobile but
    // skipped Aadhaar) — only touch fields that were actually supplied so we
    // never blank out something the admin already typed.
    const updates = {};
    if (data.mobile_number)
      updates.mobile_number = formatMobileNumber(data.mobile_number);
    if (data.first_name) updates.first_name = data.first_name;
    if (data.last_name) updates.last_name = data.last_name;
    if (data.date_of_birth) updates.date_of_birth = data.date_of_birth;
    if (data.gender) updates.gender = data.gender;
    if (data.father_name) updates.father_name = data.father_name;
    if (data.residential_address)
      updates.residential_address = data.residential_address;
    if (data.zip) updates.zip = data.zip;
    if (data.aadhar_number) updates.aadhar_number = data.aadhar_number;

    updateFormData(updates);
    Object.keys(updates).forEach(clearError);

    const hasAadhaarDetails = Boolean(data.first_name || data.aadhar_number);

    try {
      const stateName = (data.state_name || "").trim().toLowerCase();
      const districtName = (data.district_name || "").trim().toLowerCase();
      if (stateName) {
        const matchedState = states.find(
          (s) => s.name?.trim().toLowerCase() === stateName,
        );
        if (matchedState) {
          updateFormData({
            state: matchedState.name,
            state_id: matchedState.id,
            city: "",
            city_id: "",
          });
          clearError("state_id");
          const cityList = await fetchCitiesByState(matchedState.id);
          if (districtName && Array.isArray(cityList) && cityList.length) {
            const matchedCity = cityList.find(
              (c) => c.name?.trim().toLowerCase() === districtName,
            );
            if (matchedCity) {
              updateFormData({ city: matchedCity.name, city_id: matchedCity.id });
              clearError("city_id");
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to auto-map Aadhaar state/district", error);
    }

    if (hasAadhaarDetails) {
      Swal.fire({
        icon: "success",
        title: "Aadhaar Verified",
        text: "Details have been auto-filled. Please review and fill the remaining fields.",
        timer: 2500,
        showConfirmButton: false,
      });
    }
  };

  const handleResetForm = () => {
    Swal.fire({
      title: "Reset Form?",
      text: "This will clear all entered data. Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, reset",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    }).then((result) => {
      if (result.isConfirmed) {
        resetForm();
        setShouldWarn(true);
      }
    });
  };

  const handleCancel = () => {
    setShouldWarn(true);
    navigate("/admin/worker/listing");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShouldWarn(false);
    try {
      const response = await submitForm(formData);
      if (response.success) {
        Swal.fire({
          icon: "success",
          title: "Worker Added",
          text: "New worker has been added successfully.",
          timer: 1800,
          showConfirmButton: false,
        }).then(() => {
          setShouldWarn(true);
          navigate("/admin/worker/listing");
        });
      }
    } catch (error) {
      setShouldWarn(true);
      if (error.message !== "Validation failed") {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message || "Failed to add worker",
        });
      }
    }
  };

  if (formLoading) {
    return (
      <div className="flex-1 bg-gray-50 p-6 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Item lists + selections for the Industry / Designation / Skill pickers,
  // mapped to the {id, name, image} shape the Thumb/PickerDropdown/ChipsRow
  // trio expects (raw records use image_url / skill_image).
  const industryItems = (industries || []).map((item) => ({
    id: item.id,
    name: item.name,
    image: item.image_url,
  }));
  const designationItems = (designations || []).map((item) => ({
    id: item.id,
    name: item.name,
    image: item.image_url,
  }));
  const skillItems = (skills || []).map((item) => ({
    id: item.id,
    name: item.name,
    image: item.skill_image_url || item.image_url || item.skill_image,
  }));
  const selectedIndustry = industryItems.find(
    (i) => i.id === formData.industry_id,
  );
  const selectedDesignationChips = (formData.designations || []).map((d) => ({
    id: d.id,
    name: d.name,
    image: d.image_url ?? d.image,
  }));
  const selectedSkillChips = (formData.skills || []).map((s) => ({
    id: s.id,
    name: s.name,
    image: s.skill_image_url ?? s.image_url ?? s.skill_image ?? s.image,
  }));

  return (
    <>
      <AadhaarVerifyModal
        isOpen={showAadhaarModal}
        onClose={() => setShowAadhaarModal(false)}
        onVerified={handleAadhaarVerified}
      />

      {isFormDirty && shouldWarn && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="my-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 font-medium">
              You have unsaved changes
            </span>
          </div>
        </motion.div>
      )}

      <div className="flex justify-end mt-4">
        <button
          type="button"
          onClick={() => setShowAadhaarModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100"
        >
          <Fingerprint size={16} />
          Verify via Aadhaar
        </button>
      </div>

      <motion.form
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mt-6 space-y-8"
        onSubmit={handleSubmit}
      >
        {/* Basic Details Card */}
        <motion.div
          variants={itemVariants}
          className="relative bg-white rounded-[22px] shadow-sm border border-[#DDDDDD]"
        >
          <div className="text-lg bg-[#F9F9F9] rounded-t-[22px] border-b border-[#DDDDDD] px-6 py-4 font-semibold text-slate-700">
            Basic Details
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
            {/* First Name */}
            <div>
              <label className="text-sm text-slate-600">
                First Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange}
                  maxLength={35}
                  name="first_name"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${errors.first_name ? "border-red-500" : "border"}`}
                  placeholder="Enter First Name"
                />
              </div>
              {errors.first_name && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {errors.first_name}
                </p>
              )}
            </div>
            {/* Middle Name */}
            <div>
              <label className="text-sm text-slate-600">Middle Name</label>
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
                  placeholder="Enter Middle Name"
                />
              </div>
            </div>
            {/* Last Name */}
            <div>
              <label className="text-sm text-slate-600">
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
                  placeholder="Enter Last Name"
                />
              </div>
              {errors.last_name && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {errors.last_name}
                </p>
              )}
            </div>
            {/* Work Email */}
            <div>
              <label className="text-sm text-slate-600">Personal Email </label>
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
                  placeholder="Enter Personal Email"
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
              <label className="text-sm text-slate-600">
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
                  placeholder="xxx-xxxx-xxx"
                  maxLength={12}
                />
              </div>
              {errors.mobile_number && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {errors.mobile_number}
                </p>
              )}
            </div>
            {/* Gender */}
            <div>
              <label className="text-sm text-slate-600">
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
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              {errors.gender && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {errors.gender}
                </p>
              )}
            </div>
            {/* Dress Size */}
            <div>
              <label className="text-sm text-slate-600">Dress Size</label>
              <div className="grid grid-cols-5 gap-2">
                {["S", "M", "L", "XL", "XXL"].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() =>
                      updateFormData({
                        dress_size: formData.dress_size === size ? "" : size,
                      })
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
              <label className="text-sm text-slate-600">
                Relationship Manager
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  // value={
                  //   staffList.find((s) => s.staff_code === formData.staff_code)
                  //     ?.name || ""
                  // }
                  value={rmSearch}
                  onChange={(e) => handleRMSearch(e.target.value)}
                  onFocus={() => setShowRMDropdown(true)}
                  className="w-full pl-10 pr-10 py-2 rounded-lg border"
                  placeholder="Search reporting manager"
                />
                <Search
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </div>
              {showRMDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {loadingStaff ? (
                    <div className="px-4 py-3 text-gray-500 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Loading staff...
                    </div>
                  ) : staffList.length > 0 ? (
                    staffList.map((staff) => (
                      <div
                        key={staff.id}
                        className="px-4 py-2.5 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleRMSelect(staff)}
                      >
                        <div className="flex items-center justify-between">
                          <span>
                            {staff.name}{" "}
                            {staff.staff_code ? `(${staff.staff_code})` : ""}
                          </span>
                          {formData.staff_code === staff.id && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500">
                      No staff members found
                    </div>
                  )}
                </div>
              )}
            </div>
            <div ref={agentRef} className="relative">
              <label className="text-sm text-slate-600">Agent</label>

              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />

                <input
                  type="text"
                  // value={
                  //   agents.find((a) => a.agent_code === formData.agent_code)
                  //     ?.name || ""
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
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {agents.length > 0 ? (
                    agents.map((agent) => (
                      <div
                        key={agent.id}
                        className="px-4 py-2.5 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                        onClick={() => handleAgentSelect(agent)}
                      >
                        <div className="flex items-center justify-between">
                          <span>
                            {agent.name} ({agent.agent_code})
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500">
                      No agents found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Statutory Details Section */}
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
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    {errors.uan_number}
                  </p>
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
                    maxLength={20}
                    value={formData.esic_number}
                    onChange={handleChange}
                    name="esic_number"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border"
                    placeholder="Enter ESIC Number"
                  />
                </div>
                {errors.esic_number && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    {errors.esic_number}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Professional Details Card (Industry, Designation, Experience) */}
        <motion.div
          variants={itemVariants}
          className="relative bg-white rounded-[22px] shadow-sm border border-[#DDDDDD]"
        >
          <div className="text-lg bg-[#F9F9F9] rounded-t-[22px] border-b px-6 py-4 font-semibold text-slate-700">
            Professional Details
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
            {/* Industry (single-select) */}
            <div className="relative">
              <label className="text-sm text-slate-600">Industry</label>
              <PickerDropdown
                dropdownRef={industryRef}
                open={showIndustryDropdown}
                onToggleOpen={() => setShowIndustryDropdown((o) => !o)}
                placeholder={
                  selectedIndustry ? selectedIndustry.name : "Select industry"
                }
                loading={false}
                items={industryItems}
                isSelected={(item) => formData.industry_id === item.id}
                onPick={(item) => {
                  const raw = industries.find((i) => i.id === item.id) || item;
                  handleIndustrySelect(raw);
                }}
                multi={false}
                error={errors.industry}
              />
              {errors.industry && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {errors.industry}
                </p>
              )}
              <ChipsRow
                items={selectedIndustry ? [selectedIndustry] : []}
                onRemove={() =>
                  updateFormData({ industry: "", industry_id: "" })
                }
              />
            </div>

            {/* Designation (multi-select, capped at 3) */}
            <div className="relative">
              <label className="text-sm text-slate-600">
                Designation <span className="text-red-500">*</span>
              </label>
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
                onPick={(item) => {
                  const raw =
                    designations.find((d) => d.id === item.id) || item;
                  toggleDesignation(raw);
                }}
                multi
                error={errors.designation}
              />
              {errors.designation && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {errors.designation}
                </p>
              )}
              <ChipsRow
                items={selectedDesignationChips}
                onRemove={(item) => removeDesignation(item.id)}
                emptyHint="No designations selected yet."
              />
            </div>

            {/* Experience */}
            <div>
              <label className="text-sm text-slate-600">
                Experience (Years)
              </label>
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
            {/* Skill (multi-select) */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills <span className="text-red-500">*</span>
              </label>
              <PickerDropdown
                dropdownRef={skillRef}
                open={showSkillDropdown}
                onToggleOpen={() => setShowSkillDropdown((o) => !o)}
                placeholder={
                  formData.skills.length > 0
                    ? `${formData.skills.length} skill(s) selected`
                    : "Select Skills"
                }
                loading={loadingSkills}
                items={skillItems}
                isSelected={(item) =>
                  formData.skills.some((s) => s.id === item.id)
                }
                onPick={(item) => {
                  const raw = skills.find((s) => s.id === item.id) || item;
                  toggleSkill(raw);
                }}
                multi
                disabledReason={
                  formData.designations.length === 0
                    ? "Pick a designation first"
                    : undefined
                }
                error={errors.skills}
              />
              <ChipsRow
                items={selectedSkillChips}
                onRemove={(item) => removeSkill(item.id)}
                emptyHint={
                  formData.designations.length > 0
                    ? "No skills selected yet."
                    : undefined
                }
              />
              {errors.skills && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {errors.skills}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Personal Details Card */}
        <motion.div
          variants={itemVariants}
          className="relative bg-white rounded-[22px] shadow-sm border border-[#DDDDDD]"
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
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  {errors.date_of_birth}
                </p>
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
                  value={formData.father_name}
                  onChange={handleChange}
                  name="father_name"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border"
                  placeholder="Father's Name"
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
                  className="w-full pl-10 pr-4 py-2 rounded-lg border"
                  placeholder="ABCDE1234F"
                  maxLength="10"
                />
              </div>
              {errors.pan_number && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  {errors.pan_number}
                </p>
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
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${errors.aadhar_number ? "border-red-500" : ""}`}
                  placeholder="XXXX-XXXX-XXXX"
                  maxLength="14"
                />
              </div>
              {errors.aadhar_number && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  {errors.aadhar_number}
                </p>
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
                  value={formData.residential_address}
                  onChange={handleChange}
                  name="residential_address"
                  rows="3"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border"
                  placeholder="Full address"
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
                    errors.state_id ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Search state"
                />
                <Search
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </div>
              {errors.state_id && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  {errors.state_id}
                </p>
              )}
              {showStateDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg max-h-60 overflow-auto">
                  {states.map((s) => (
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
                    errors.city_id ? "border-red-500" : "border-gray-300"
                  } ${
                    !formData.state_id ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
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
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  {errors.city_id}
                </p>
              )}
              {showCityDropdown && formData.state_id && (
                <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg max-h-60 overflow-auto">
                  {cities.map((c) => (
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
                {" "}
                <MapPinned
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={formData.zip}
                  onChange={(e) =>
                    updateFormData({
                      zip: e.target.value.replace(/\D/g, "").slice(0, 6),
                    })
                  }
                  className="w-full pl-10 pr-4 py-2 rounded-lg border"
                  placeholder="6-digit"
                  maxLength="6"
                />
              </div>
              {errors.zip && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  {errors.zip}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Payment Information Card */}
        <motion.div
          variants={itemVariants}
          className="relative bg-white rounded-[22px] shadow-sm border border-[#DDDDDD]"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6">
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
                {errors.account_holder_name && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    {errors.account_holder_name}
                  </p>
                )}
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
                    maxLength="18"
                    value={formData.account_number}
                    onChange={handleAccountNumberChange}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border"
                    maxLength="18"
                  />
                </div>
                {errors.account_number && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
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
                    className={`whitespace-nowrap text-xs font-medium px-4 py-2.5 rounded-lg transition-colors h-full ${
                      isBankVerified
                        ? "bg-green-100 text-green-700 cursor-default"
                        : "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"
                    }`}
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
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    {errors.ifsc_code}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Salary Structure Card */}
        <motion.div
          variants={itemVariants}
          className="relative bg-white rounded-[22px] shadow-sm border border-[#DDDDDD] overflow-hidden"
        >
          <div className="text-lg bg-[#F9F9F9] border-b px-6 py-4 font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="text-blue-600" size={20} />
              <span>Salary Structure</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-normal text-slate-500">
                Define Custom Structure?
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {formData.define_salary_structure ? (
            <div className="p-0">
              <div className="w-full p-6 bg-white border-b">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <ShieldCheck className="text-blue-600" size={18} />
                    Statutory Compliance
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Toggle PF/ESIC applicability for this specific worker.
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
                              updateFormData({
                                is_pf_applicable: e.target.checked,
                              })
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
                              updateFormData({
                                is_esi_applicable: e.target.checked,
                              })
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
              {formLoading || initialSalaryLoading ? (
                <div className="p-12 flex justify-center">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <EditableSalaryTable
                  earningComponents={earningComponents}
                  earningValues={earningValues}
                  calculationResults={calculationResults}
                  onValueChange={handleEarningValueChange}
                  formErrors={errors}
                />
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase size={28} className="text-blue-600" />
                </div>
                <h4 className="text-slate-800 font-medium mb-2">
                  Default Structure Applied
                </h4>
                <p className="text-slate-500 text-sm">
                  This worker will be assigned the default salary structure
                  mapped to their designation. Enable the toggle above to define
                  a specific structure just for this worker.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex justify-end gap-4">
          <button
            type="button"
            onClick={handleResetForm}
            disabled={loading}
            className="border px-6 py-2 rounded-lg text-slate-600 bg-gray-50 hover:bg-gray-100"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="border px-6 py-2 rounded-lg text-slate-600 bg-gray-50 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:brightness-105 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>{" "}
                Submitting...
              </span>
            ) : (
              "Submit"
            )}
          </button>
        </motion.div>
      </motion.form>
    </>
  );
};

export default SingleAddWorkerForm;
