"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@/lib/navigation";
import {
  Briefcase,
  Save,
  AlertCircle,
  Users,
  Clock,
  Coffee,
  Utensils,
  FileText,
  IndianRupee,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import { useCompanyVacancyForm } from "../../adminhooks/useAdminVacancyForm";
import Swal from "sweetalert2";
import Loader from "../../../../common/components/Loader";
import useUnsavedChangesWarning from "../../../../common/hooks/useUnsavedChangesWarning";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
const getAdjustedDay = (day) => (day === 0 ? 6 : day - 1);
const isToday = (year, month, day) => {
  const today = new Date();
  return (
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day
  );
};

const VacancyForm = ({ mode = "create", vacancyId = null }) => {
  const navigate = useNavigate();
  const {
    loading,
    formLoading,
    formData,
    errors,
    companies,
    companiesLoading,
    designations,
    designationsLoading,
    skills,
    skillsLoading,
    handleSubmit,
    validateForm,
    updateFormData,
    updateErrors,
    clearError,
  } = useCompanyVacancyForm(mode, vacancyId);

  const [localData, setLocalData] = useState({
    rate_type: "",
    company_id: "",
    designation_id: "",
    skills: [],
    number_of_workers: "",
    shift_start: "",
    shift_end: "",
    base_rate: "",
    salary_amount: "",
    break_type: "",
    break_duration_minutes: "",
    meals: "",
    notes_to_workers: "",
    schedule_mode: "dates",
    selected_dates: [],
    weekdays: [],
    start_date: "",
    end_date: "",
  });

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);

  // Sync local state with hook state
  useEffect(() => {
    if (formData) {
      setLocalData({
        rate_type: formData.rate_type || "",
        company_id: formData.company_id || "",
        designation_id: formData.designation_id || "",
        skills: formData.skills || [],
        number_of_workers: formData.number_of_workers || "",
        shift_start: formData.shift_start || "",
        shift_end: formData.shift_end || "",
        base_rate: formData.base_rate || "",
        salary_amount: formData.salary_amount || "",
        break_type: formData.break_type || "",
        break_duration_minutes: formData.break_duration_minutes || "",
        meals: formData.meals || "",
        notes_to_workers: formData.notes_to_workers || "",
        schedule_mode: formData.schedule_mode || "dates",
        selected_dates: formData.selected_dates || [],
        weekdays: formData.weekdays || [],
        start_date: formData.start_date || "",
        end_date: formData.end_date || "",
      });
    }
  }, [formData]);

  const isFormDirty =
    JSON.stringify(localData) !==
    JSON.stringify({
      rate_type: formData.rate_type || "",
      company_id: formData.company_id || "",
      designation_id: formData.designation_id || "",
      skills: formData.skills || [],
      number_of_workers: formData.number_of_workers || "",
      shift_start: formData.shift_start || "",
      shift_end: formData.shift_end || "",
      base_rate: formData.base_rate || "",
      salary_amount: formData.salary_amount || "",
      break_type: formData.break_type || "",
      break_duration_minutes: formData.break_duration_minutes || "",
      meals: formData.meals || "",
      notes_to_workers: formData.notes_to_workers || "",
      schedule_mode: formData.schedule_mode || "dates",
      selected_dates: formData.selected_dates || [],
      weekdays: formData.weekdays || [],
      start_date: formData.start_date || "",
      end_date: formData.end_date || "",
    });

  useUnsavedChangesWarning(
    isFormDirty,
    "You have unsaved changes. Are you sure you want to leave?",
  );

  const handleInputChange = (field, value) => {
    let updates = { [field]: value };

    if (field === "rate_type") {
      if (value === "salary") {
        updates.base_rate = "";
        updates.schedule_mode = "salary";
        updates.selected_dates = [];
        updates.weekdays = [];
        updates.end_date = "";
      } else {
        updates.salary_amount = "";
      }
    }

    if (field === "break_type" && value !== "unpaid") {
      updates.break_duration_minutes = "";
    }

    if (field === "company_id") {
      updates.designation_id = "";
      updates.skills = [];
      clearError("designation_id");
      clearError("skills");
    }

    setLocalData((prev) => ({ ...prev, ...updates }));
    updateFormData(updates);
    clearError(field);
  };

  const handleWeekdayToggle = (dayValue) => {
    const current = localData.weekdays;
    const updated = current.includes(dayValue)
      ? current.filter((d) => d !== dayValue)
      : [...current, dayValue];
    setLocalData((prev) => ({ ...prev, weekdays: updated }));
    updateFormData({ weekdays: updated });
    clearError("weekdays");
  };

  const handleDateToggle = (dateString) => {
    const current = localData.selected_dates;
    const updated = current.includes(dateString)
      ? current.filter((d) => d !== dateString)
      : [...current, dateString];
    setLocalData((prev) => ({ ...prev, selected_dates: updated }));
    updateFormData({ selected_dates: updated });
    clearError("selected_dates");
  };

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const adjustedFirstDay = getAdjustedDay(firstDay);

    const days = [];

    // Empty spaces before month starts
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="p-2 text-center text-gray-300" />,
      );
    }

    // Today's date
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    // Calendar days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentYear, currentMonth, d);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(d).padStart(2, "0");

      const dateString = `${year}-${month}-${day}`;

      const isSelected = localData.selected_dates.includes(dateString);

      const today = isToday(currentYear, currentMonth, d);

      // Prevent previous date selection
      const currentDate = new Date(year, currentMonth, d);
      currentDate.setHours(0, 0, 0, 0);

      const isPastDate = currentDate < todayDate;

      days.push(
        <div
          key={dateString}
          className="flex w-full items-center justify-center"
        >
          <button
            type="button"
            disabled={isPastDate}
            onClick={() => {
              if (!isPastDate) {
                handleDateToggle(dateString);
              }
            }}
            className={`
            w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all

            ${
              isPastDate
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : isSelected
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                  : today
                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                    : "hover:bg-gray-100 text-gray-700 hover:border-gray-300"
            }

            ${
              !isSelected &&
              !today &&
              !isPastDate &&
              "border border-transparent"
            }
          `}
          >
            {d}
          </button>
        </div>,
      );
    }

    return days;
  };

  const toggleSkill = (skillId) => {
    const selected = localData.skills || [];

    const updated = selected.includes(skillId)
      ? selected.filter((id) => id !== skillId)
      : [...selected, skillId];

    handleInputChange("skills", updated);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm(localData);
    if (Object.keys(validationErrors).length > 0) {
      updateErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0];
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: firstError,
      });
      return;
    }

    try {
      const response = await handleSubmit(localData);
      if (response?.success === true || [200, 201].includes(response?.status)) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text:
            mode === "edit"
              ? "Vacancy updated successfully"
              : "Vacancy created successfully",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          navigate("/admin/vacancy-listing");
        });
      } else if (response?.data?.errors) {
        const apiErrors = response.data.errors;
        const formattedErrors = {};
        // Object.keys(apiErrors).forEach((key) => {
        //   formattedErrors[key] = Array.isArray(apiErrors[key])
        //     ? apiErrors[key][0]
        //     : apiErrors[key];
        // });
        Object.keys(apiErrors).forEach((key) => {
        const mappedKey = key === "skill_ids" ? "skills" : key;
        formattedErrors[mappedKey] = Array.isArray(apiErrors[key])
          ? apiErrors[key][0]
          : apiErrors[key];
      });
        updateErrors(formattedErrors);
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          html: Object.values(formattedErrors)
            .map((err) => `<div>• ${err}</div>`)
            .join(""),
        });
      }
    } catch (error) {
      console.error("Form submission error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.message ||
          `Failed to ${mode === "edit" ? "update" : "create"} vacancy.`,
      });
    }
  };

  const handleCancel = () => {
    navigate("/admin/vacancy-listing");
  };

  if (formLoading) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const isSalary = localData.rate_type === "salary";

  return (
    <motion.div
      className="flex-1 bg-gray-50"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {isFormDirty && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 font-medium">
              You have unsaved changes
            </span>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleFormSubmit}>
        <div className="space-y-6">
          {/* Basic Details Card */}
          <motion.div
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Job Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Job Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={localData.rate_type}
                  onChange={(e) =>
                    handleInputChange("rate_type", e.target.value)
                  }
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.rate_type ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select Job Type</option>
                  <option value="salary">Salary (Monthly)</option>
                  <option value="daily">Daily</option>
                  <option value="hourly">Per Hour</option>
                  <option value="pcs">Per Pcs</option>
                  <option value="gram">Per Gram</option>
                  <option value="kg">Per KG</option>
                </select>
                {errors.rate_type && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.rate_type}
                  </p>
                )}
              </div>

              {/* Company Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Building2
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />

                  <select
                    value={localData.company_id}
                    onChange={(e) =>
                      handleInputChange("company_id", e.target.value)
                    }
                    disabled={companiesLoading || mode === "edit"}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.company_id ? "border-red-500" : "border-gray-300"
                    } ${
                      companiesLoading || mode === "edit"
                        ? "bg-gray-100 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <option value="">
                      {companiesLoading
                        ? "Loading companies..."
                        : "Select Company"}
                    </option>

                    {companies.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.company_name}
                      </option>
                    ))}
                  </select>
                </div>

                {errors.company_id && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.company_id}
                  </p>
                )}

                {mode === "edit" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Company cannot be changed after vacancy creation.
                  </p>
                )}
              </div>

              {/* Designation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Designation <span className="text-red-500">*</span>
                </label>
                <select
                  value={localData.designation_id}
                  onChange={(e) =>
                    handleInputChange("designation_id", e.target.value)
                  }
                  disabled={!localData.company_id || designationsLoading}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.designation_id ? "border-red-500" : "border-gray-300"
                  } ${!localData.company_id ? "bg-gray-100 cursor-not-allowed" : ""}`}
                >
                  <option value="">
                    {!localData.company_id
                      ? "Select company first"
                      : designationsLoading
                        ? "Loading..."
                        : "Select Designation"}
                  </option>
                  {designations.map((des) => (
                    <option key={des.id} value={des.id}>
                      {des.name}
                    </option>
                  ))}
                </select>
                {errors.designation_id && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.designation_id}
                  </p>
                )}
              </div>

              {/* Skill */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills <span className="text-red-500">*</span>
                </label>

                <div className="relative">

                  <button
                    type="button"
                    disabled={!localData.designation_id}
                    onClick={() => setShowSkillsDropdown(!showSkillsDropdown)}
                    className={`w-full border rounded-lg px-4 py-3 text-left flex justify-between items-center
                    ${!localData.designation_id
                        ? "bg-gray-100 cursor-not-allowed"
                        : "bg-white"
                      }`}
                  >
                    <span>
                        {!localData.designation_id
                      ? "Select designation first"
                      : skillsLoading
                        ? "Loading..."
                        : "Select Skills"}
                    </span>

                    <span>{showSkillsDropdown ? "▲" : "▼"}</span>
                  </button>

                  {showSkillsDropdown && (
                    <div className="absolute z-50 mt-2 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">

                      {skillsLoading ? (
                        <div className="p-3 text-gray-500">
                          Loading...
                        </div>
                      ) : (
                        skills.map((skill) => (
                          <label
                            key={skill.id}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={localData.skills?.includes(skill.id)}
                              onChange={() => toggleSkill(skill.id)}
                            />

                            {skill.name}
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Skills */}

                <div className="flex flex-wrap gap-2 mt-3">
                  {skills
                    .filter((skill) => localData.skills?.includes(skill.id))
                    .map((skill) => (
                      <span
                        key={skill.id}
                        className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                      >
                        {skill.name}

                        <button
                          type="button"
                          onClick={() => toggleSkill(skill.id)}
                          className="text-red-500 font-bold"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                </div>

                {errors.skills && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                     <AlertCircle size={14} /> {errors.skills}
                  </p>
                )}
              </div>

              {/* Number of Workers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Workers <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Users
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="number"
                    min="1"
                    value={localData.number_of_workers}
                    onChange={(e) =>
                      handleInputChange("number_of_workers", e.target.value)
                    }
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.number_of_workers
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="e.g., 5"
                  />
                </div>
                {errors.number_of_workers && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.number_of_workers}
                  </p>
                )}
              </div>

              {/* Shift Start */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shift Start Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="time"
                    value={localData.shift_start}
                    onChange={(e) =>
                      handleInputChange("shift_start", e.target.value)
                    }
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.shift_start ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                </div>
                {errors.shift_start && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.shift_start}
                  </p>
                )}
              </div>

              {/* Shift End */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shift End Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="time"
                    value={localData.shift_end}
                    onChange={(e) =>
                      handleInputChange("shift_end", e.target.value)
                    }
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.shift_end ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                </div>
                {errors.shift_end && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.shift_end}
                  </p>
                )}
              </div>

              {/* Rate Field */}
              {isSalary ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Salary (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <IndianRupee
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={localData.salary_amount}
                      onChange={(e) =>
                        handleInputChange("salary_amount", e.target.value)
                      }
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.salary_amount
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter monthly salary"
                    />
                  </div>
                  {errors.salary_amount && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.salary_amount}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Rate (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <IndianRupee
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={localData.base_rate}
                      onChange={(e) =>
                        handleInputChange("base_rate", e.target.value)
                      }
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.base_rate ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder={
                        {
                          hourly: "Enter rate hourly ",
                          daily: "Enter daily rate",
                          kg: "Enter rate per kg",
                          gram: "Enter rate per gram",
                          pcs: "Enter rate per pcs",
                          salary: "Enter monthly salary",
                        }[localData.rate_type] || "Enter rate"
                      }
                    />
                  </div>
                  {errors.base_rate && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.base_rate}
                    </p>
                  )}
                </div>
              )}

              {/* Breaks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Breaks
                </label>
                <div className="relative">
                  <Coffee
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <select
                    value={localData.break_type}
                    onChange={(e) =>
                      handleInputChange("break_type", e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="none">Not Applicable</option>
                  </select>
                </div>
              </div>

              {/* Break Duration */}
              {localData.break_type === "unpaid" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Break Duration (minutes){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={localData.break_duration_minutes}
                    onChange={(e) =>
                      handleInputChange(
                        "break_duration_minutes",
                        e.target.value,
                      )
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.break_duration_minutes
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="e.g., 30"
                  />
                  {errors.break_duration_minutes && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.break_duration_minutes}
                    </p>
                  )}
                </div>
              )}

              {/* Meals */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meals
                </label>
                <div className="relative">
                  <Utensils
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <select
                    value={localData.meals}
                    onChange={(e) => handleInputChange("meals", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="provided">Provided</option>
                    <option value="not_provided">Not Provided</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes to Workers
                </label>
                <div className="relative">
                  <FileText
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <textarea
                    value={localData.notes_to_workers}
                    onChange={(e) =>
                      handleInputChange("notes_to_workers", e.target.value)
                    }
                    rows="3"
                    className="w-full min-h-14 pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Any additional instructions for workers..."
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Schedule Card */}
          <motion.div
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Schedule</h2>
            </div>

            {isSalary ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={localData.start_date}
                    onChange={(e) =>
                      handleInputChange("start_date", e.target.value)
                    }
                    className={`w-full md:w-1/2 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.start_date ? "border-red-500" : "border-gray-300"
                    }`}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  {errors.start_date && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.start_date}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Mode Selection */}
                <div className="flex space-x-4 mb-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="schedule_mode"
                      value="dates"
                      checked={localData.schedule_mode === "dates"}
                      onChange={(e) =>
                        handleInputChange("schedule_mode", e.target.value)
                      }
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Specific Dates
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="schedule_mode"
                      value="weekly"
                      checked={localData.schedule_mode === "weekly"}
                      onChange={(e) =>
                        handleInputChange("schedule_mode", e.target.value)
                      }
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Weekly Recurring
                    </span>
                  </label>
                </div>

                {/* Dates Mode */}
                {localData.schedule_mode === "dates" && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                      <div className="flex items-center justify-between mb-4">
                        <button
                          type="button"
                          onClick={goToPrevMonth}
                          className="p-2 hover:bg-gray-100 rounded-full transition"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {new Date(currentYear, currentMonth).toLocaleString(
                            "default",
                            { month: "long", year: "numeric" },
                          )}
                        </h3>
                        <button
                          type="button"
                          onClick={goToNextMonth}
                          className="p-2 hover:bg-gray-100 rounded-full transition"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {weekdays.map((day) => (
                          <div
                            key={day}
                            className="text-center text-sm font-medium text-gray-500"
                          >
                            {day}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {renderCalendarDays()}
                      </div>
                    </div>
                    {localData.selected_dates.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 mb-2">
                          Selected Dates ({localData.selected_dates.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {localData.selected_dates.sort().map((date) => (
                            <span
                              key={date}
                              className="px-3 py-1 bg-white text-blue-700 rounded-full text-xs shadow-sm border border-blue-200"
                            >
                              {new Date(date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {errors.selected_dates && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> {errors.selected_dates}
                      </p>
                    )}
                  </div>
                )}

                {/* Weekly Mode */}
                {localData.schedule_mode === "weekly" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Weekdays <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-4">
                        {[
                          { value: 1, label: "Monday" },
                          { value: 2, label: "Tuesday" },
                          { value: 3, label: "Wednesday" },
                          { value: 4, label: "Thursday" },
                          { value: 5, label: "Friday" },
                          { value: 6, label: "Saturday" },
                          { value: 7, label: "Sunday" },
                        ].map((day) => (
                          <label
                            key={day.value}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              checked={localData.weekdays.includes(day.value)}
                              onChange={() => handleWeekdayToggle(day.value)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm text-gray-700">
                              {day.label}
                            </span>
                          </label>
                        ))}
                      </div>
                      {errors.weekdays && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle size={14} /> {errors.weekdays}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date (optional)
                        </label>
                        {/* <input
                          type="date"
                          value={localData.start_date}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) =>
                            handleInputChange("start_date", e.target.value)
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        /> */}
                        <input
                          type="date"
                          value={localData.start_date}
                          min={new Date().toISOString().split("T")[0]}
                          disabled={
                            mode === "edit" &&
                            localData.start_date &&
                            localData.start_date <
                              new Date().toISOString().split("T")[0]
                          }
                          onChange={(e) =>
                            handleInputChange("start_date", e.target.value)
                          }
                          className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            mode === "edit" &&
                            localData.start_date &&
                            localData.start_date <
                              new Date().toISOString().split("T")[0]
                              ? "bg-gray-100 cursor-not-allowed"
                              : ""
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date (optional)
                        </label>
                        <input
                          type="date"
                          value={localData.end_date}
                          // min={
                          //   localData.start_date ||
                          //   new Date().toISOString().split("T")[0]
                          // }
                          min={
                            localData.start_date &&
                            localData.start_date >
                              new Date().toISOString().split("T")[0]
                              ? localData.start_date
                              : new Date().toISOString().split("T")[0]
                          }
                          onChange={(e) =>
                            handleInputChange("end_date", e.target.value)
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="flex justify-end space-x-4"
            variants={itemVariants}
          >
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 text-white rounded-lg font-medium transition flex items-center gap-2 ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-900 hover:bg-blue-800"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {mode === "edit" ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save size={18} />
                  {mode === "edit" ? "Update Vacancy" : "Create Vacancy"}
                </>
              )}
            </button>
          </motion.div>
        </div>
      </form>
    </motion.div>
  );
};

export default VacancyForm;
