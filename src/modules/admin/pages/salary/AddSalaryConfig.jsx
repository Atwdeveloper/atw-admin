"use client";

// modules/admin/pages/AddSalaryConfig.jsx
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "@/lib/navigation";
import {
  ArrowLeft,
  Save,
  Calculator,
  RotateCcw,
  AlertCircle,
  Percent,
  IndianRupee,
  Calendar,
  Info,
  ChevronDown,
  Shield,
  Award,
  Home,
  Car,
  Settings,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import { useSalaryManagement } from "../../adminhooks/useSalaryManagement";
import { useFormDirtyTracker } from "../../../../common/utils/formUtils";

const AddSalaryConfig = () => {
  const navigate = useNavigate();
  const { handleAddConfig, loading } = useSalaryManagement({
    autoFetch: false,
  });

  // Config types based on project requirements
  const configTypes = [
    {
      id: "basic",
      label: "Basic Salary %",
      icon: Percent,
      description: "Percentage of CTC for Basic Salary",
    },
    {
      id: "hra",
      label: "HRA %",
      icon: Home,
      description: "Percentage of Basic for House Rent Allowance",
    },
    {
      id: "conveyance",
      label: "Conveyance Allowance",
      icon: Car,
      description: "Fixed conveyance allowance amount",
    },
    {
      id: "bonus",
      label: "Statutory Bonus %",
      icon: Award,
      description: "Percentage for statutory bonus calculation",
    },
    {
      id: "pf_employer",
      label: "PF Employer %",
      icon: Shield,
      description: "Employer PF contribution percentage",
    },
    {
      id: "pf_admin",
      label: "PF Admin Charges %",
      icon: Shield,
      description: "PF administrative charges percentage",
    },
    {
      id: "esi_employer",
      label: "ESI Employer %",
      icon: Shield,
      description: "Employer ESI contribution percentage",
    },
    {
      id: "min_wage",
      label: "Minimum Wage",
      icon: IndianRupee,
      description: "Minimum wage for statutory calculations",
    },
    {
      id: "pf_wage_cap",
      label: "PF Wage Cap",
      icon: IndianRupee,
      description: "Maximum wage for PF calculation",
    },
    {
      id: "esi_wage_limit",
      label: "ESI Wage Limit",
      icon: IndianRupee,
      description: "Maximum wage for ESI eligibility",
    },
  ];

  const initialFormData = {
    config_type: "",
    config_name: "",
    description: "",
    value: "",
    min_value: "",
    max_value: "",
    effective_from: new Date().toISOString().split("T")[0],
    effective_to: "",
    status: "draft",
    is_editable: true,
    applies_to: "all", // 'all', 'specific', 'excluded'
    apply_ids: [], // Specific employee/department IDs
  };

  const { isDirty, checkDirty, resetDirty, markAsClean } =
    useFormDirtyTracker(initialFormData);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [showConfigTypeDropdown, setShowConfigTypeDropdown] = useState(false);
  const [filteredConfigTypes, setFilteredConfigTypes] = useState(configTypes);
  const [configSearch, setConfigSearch] = useState("");

  // Check if form is dirty
  useEffect(() => {
    checkDirty(formData);
  }, [formData, checkDirty]);

  // Filter config types based on search
  useEffect(() => {
    if (configSearch.trim() === "") {
      setFilteredConfigTypes(configTypes);
    } else {
      const filtered = configTypes.filter(
        (type) =>
          type.label.toLowerCase().includes(configSearch.toLowerCase()) ||
          type.description.toLowerCase().includes(configSearch.toLowerCase()),
      );
      setFilteredConfigTypes(filtered);
    }
  }, [configSearch]);

  // Handle browser refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Get selected config type details
  const getSelectedConfigType = () => {
    return configTypes.find((type) => type.id === formData.config_type);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.config_type)
      newErrors.config_type = "Please select a configuration type";
    if (!formData.config_name?.trim())
      newErrors.config_name = "Configuration name is required";
    if (!formData.value) newErrors.value = "Value is required";

    // Type-specific validations
    const selectedType = getSelectedConfigType();
    if (selectedType) {
      if (
        selectedType.id.includes("percent") ||
        selectedType.id.includes("%")
      ) {
        const val = parseFloat(formData.value);
        if (isNaN(val) || val < 0 || val > 100) {
          newErrors.value = "Percentage must be between 0 and 100";
        }
      }

      if (
        selectedType.id.includes("wage") ||
        selectedType.id === "conveyance" ||
        selectedType.id === "min_wage"
      ) {
        const val = parseFloat(formData.value);
        if (isNaN(val) || val < 0) {
          newErrors.value = "Amount must be a positive number";
        }
      }
    }

    if (!formData.effective_from)
      newErrors.effective_from = "Effective date is required";

    return newErrors;
  };

  // Safe navigation
  const safeNavigate = useCallback(
    async (path) => {
      if (!isDirty) {
        navigate(path);
        return;
      }

      const result = await Swal.fire({
        title: "Unsaved Changes",
        html: `
        <div class="text-left">
          <p class="mb-4 text-gray-700">You have unsaved changes. What would you like to do?</p>
        </div>
      `,
        icon: "question",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "Save & Leave",
        denyButtonText: "Discard & Leave",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#3B82F6",
        denyButtonColor: "#EF4444",
        cancelButtonColor: "#6B7280",
      });

      if (result.isConfirmed) {
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          Swal.fire({
            title: "Validation Error",
            text: "Please fix the form errors before saving",
            icon: "error",
            confirmButtonColor: "#3B82F6",
          });
          return;
        }

        const saveResult = await handleAddConfig(formData);
        if (saveResult.success) {
          markAsClean(formData);
          navigate(path);
        }
      } else if (result.isDenied) {
        navigate(path);
      }
    },
    [isDirty, formData, handleAddConfig, markAsClean, navigate],
  );

  // Handle back button
  const handleBackButton = useCallback(() => {
    safeNavigate("/admin/salary");
  }, [safeNavigate]);

  // Handle config type selection
  const handleConfigTypeSelect = (type) => {
    setFormData({
      ...formData,
      config_type: type.id,
      config_name: type.label,
      // Set default values based on type
      value: getDefaultValue(type.id),
      min_value: getDefaultMinValue(type.id),
      max_value: getDefaultMaxValue(type.id),
    });
    setShowConfigTypeDropdown(false);
    setConfigSearch(type.label);
    setErrors({ ...errors, config_type: "" });
  };

  // Get default value based on config type
  const getDefaultValue = (typeId) => {
    switch (typeId) {
      case "basic":
        return "50";
      case "hra":
        return "50";
      case "conveyance":
        return "1600";
      case "bonus":
        return "8.33";
      case "pf_employer":
        return "12";
      case "pf_admin":
        return "0.50";
      case "esi_employer":
        return "3.25";
      case "min_wage":
        return "12000";
      case "pf_wage_cap":
        return "15000";
      case "esi_wage_limit":
        return "21000";
      default:
        return "";
    }
  };

  // Get default min value
  const getDefaultMinValue = (typeId) => {
    switch (typeId) {
      case "bonus":
        return "8.33";
      default:
        return "";
    }
  };

  // Get default max value
  const getDefaultMaxValue = (typeId) => {
    switch (typeId) {
      case "bonus":
        return "20";
      default:
        return "";
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? e.target.checked : value,
    });
    setErrors({ ...errors, [name]: "" });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const result = await handleAddConfig(formData);

    if (result.success) {
      markAsClean(formData);
      navigate("/admin/salary");
    }
  };

  // Handle reset form
  const handleReset = () => {
    setFormData(initialFormData);
    setConfigSearch("");
    setErrors({});
    setShowConfigTypeDropdown(false);
    resetDirty();
  };

  // Get value placeholder based on type
  const getValuePlaceholder = () => {
    const selected = getSelectedConfigType();
    if (!selected) return "Enter value";

    if (selected.id.includes("percent") || selected.id.includes("%")) {
      return "Enter percentage (e.g., 50)";
    }
    if (
      selected.id.includes("wage") ||
      selected.id === "conveyance" ||
      selected.id === "min_wage"
    ) {
      return "Enter amount in ₹ (e.g., 1600)";
    }
    return "Enter value";
  };

  // Get value prefix/suffix
  const getValueAffix = () => {
    const selected = getSelectedConfigType();
    if (!selected) return null;

    if (selected.id.includes("percent") || selected.id.includes("%")) {
      return <span className="text-gray-500">%</span>;
    }
    if (
      selected.id.includes("wage") ||
      selected.id === "conveyance" ||
      selected.id === "min_wage"
    ) {
      return <span className="text-gray-500">₹</span>;
    }
    return null;
  };

  return (
    <motion.div
      className="flex-1 bg-gray-50 p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* HEADER */}
      <motion.div
        className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-gray-200 mb-8"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={handleBackButton}
              className="w-10 h-10 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 hover:bg-white/80 transition"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Add Salary Configuration
              </h1>
              <p className="text-gray-600 mt-1">
                Define new salary rules and policies
              </p>
              {isDirty && (
                <div className="flex items-center gap-2 mt-2 text-amber-600 text-sm animate-pulse">
                  <AlertCircle className="w-4 h-4" />
                  <span>You have unsaved changes</span>
                </div>
              )}
            </div>
          </div>

          <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center">
            <Calculator className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </motion.div>

      {/* FORM */}
      <motion.div
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
        variants={itemVariants}
      >
        <form onSubmit={handleSubmit}>
          {/* CONFIGURATION TYPE SELECTION */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Configuration Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div
                className="flex items-center justify-between p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition"
                onClick={() =>
                  setShowConfigTypeDropdown(!showConfigTypeDropdown)
                }
              >
                <div className="flex items-center gap-3">
                  {formData.config_type ? (
                    <>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {(() => {
                          const Icon =
                            configTypes.find(
                              (t) => t.id === formData.config_type,
                            )?.icon || Settings;
                          return <Icon className="w-5 h-5 text-blue-600" />;
                        })()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {formData.config_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {
                            configTypes.find(
                              (t) => t.id === formData.config_type,
                            )?.description
                          }
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500">
                      Select a configuration type...
                    </div>
                  )}
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${showConfigTypeDropdown ? "rotate-180" : ""}`}
                />
              </div>

              {showConfigTypeDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                  <div className="p-3 border-b">
                    <input
                      type="text"
                      value={configSearch}
                      onChange={(e) => setConfigSearch(e.target.value)}
                      placeholder="Search configuration types..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredConfigTypes.map((type) => (
                      <div
                        key={type.id}
                        onClick={() => handleConfigTypeSelect(type)}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition hover:bg-blue-50 ${
                          formData.config_type === type.id
                            ? "bg-blue-50 border-l-4 border-l-blue-500"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              formData.config_type === type.id
                                ? "bg-blue-100"
                                : "bg-gray-100"
                            }`}
                          >
                            <type.icon
                              className={`w-5 h-5 ${
                                formData.config_type === type.id
                                  ? "text-blue-600"
                                  : "text-gray-600"
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <div
                              className={`font-medium ${
                                formData.config_type === type.id
                                  ? "text-blue-700"
                                  : "text-gray-900"
                              }`}
                            >
                              {type.label}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {type.description}
                            </div>
                          </div>
                          {formData.config_type === type.id && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {errors.config_type && (
              <p className="text-red-500 text-sm mt-1">{errors.config_type}</p>
            )}
          </div>

          {/* CONFIGURATION DETAILS */}
          {formData.config_type && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Configuration Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Configuration Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="config_name"
                    value={formData.config_name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.config_name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter configuration name"
                  />
                  {errors.config_name && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.config_name}
                    </p>
                  )}
                </div>

                {/* Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="value"
                      value={formData.value}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.value ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder={getValuePlaceholder()}
                    />
                    {getValueAffix() && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {getValueAffix()}
                      </div>
                    )}
                  </div>
                  {errors.value && (
                    <p className="text-red-500 text-sm mt-1">{errors.value}</p>
                  )}
                </div>
              </div>

              {/* MIN/MAX VALUES (For Bonus) */}
              {formData.config_type === "bonus" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Value
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="min_value"
                        value={formData.min_value}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Minimum percentage"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        %
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Value
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="max_value"
                        value={formData.max_value}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Maximum percentage"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        %
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* EFFECTIVE DATES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Effective From <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      name="effective_from"
                      value={formData.effective_from}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.effective_from
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                  </div>
                  {errors.effective_from && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.effective_from}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Effective To (Optional)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      name="effective_to"
                      value={formData.effective_to}
                      onChange={handleInputChange}
                      min={formData.effective_from}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Describe this configuration rule..."
                />
                <div className="flex justify-end text-sm text-gray-500 mt-2">
                  <span>{formData.description.length}/500</span>
                </div>
              </div>

              {/* ADDITIONAL SETTINGS */}
              <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Additional Settings
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_editable"
                      name="is_editable"
                      checked={formData.is_editable}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="is_editable"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Allow editing of this rule
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value="draft"
                          checked={formData.status === "draft"}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-700">Draft</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value="active"
                          checked={formData.status === "active"}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-700">Active</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value="inactive"
                          checked={formData.status === "inactive"}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-700">Inactive</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Form
            </button>
            <button
              type="submit"
              disabled={loading || !formData.config_type}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Rule...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Create Rule
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* INFO CARD */}
      {formData.config_type && (
        <motion.div
          className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          variants={itemVariants}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Configuration Details
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-700 font-medium">Type</div>
                <div className="flex items-center gap-2 mt-1">
                  {(() => {
                    const Icon = getSelectedConfigType()?.icon || Settings;
                    return <Icon className="w-4 h-4" />;
                  })()}
                  <span className="font-medium">
                    {getSelectedConfigType()?.label}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-green-700 font-medium">
                  Current Value
                </div>
                <div className="text-lg font-bold text-green-800 mt-1">
                  {getValueAffix() === "%"
                    ? `${formData.value}%`
                    : `₹${parseInt(formData.value || 0).toLocaleString()}`}
                </div>
              </div>
            </div>

            {/* Rule Explanation based on type */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-sm font-medium text-amber-800 mb-2">
                How this rule works:
              </div>
              <ul className="text-sm text-amber-700 space-y-1">
                {formData.config_type === "basic" && (
                  <>
                    <li>• Basic Salary = CTC × {formData.value}%</li>
                    <li>
                      • Example: If CTC is ₹25,000, Basic = ₹
                      {25000 * (parseFloat(formData.value) / 100)}
                    </li>
                  </>
                )}
                {formData.config_type === "hra" && (
                  <>
                    <li>• HRA = Basic Salary × {formData.value}%</li>
                    <li>
                      • Example: If Basic is ₹12,500, HRA = ₹
                      {12500 * (parseFloat(formData.value) / 100)}
                    </li>
                  </>
                )}
                {formData.config_type === "conveyance" && (
                  <>
                    <li>
                      • Fixed allowance of ₹
                      {parseInt(formData.value || 0).toLocaleString()} per month
                    </li>
                    <li>
                      • Tax exempt up to ₹1,600/month as per Indian tax laws
                    </li>
                  </>
                )}
                {formData.config_type === "bonus" && (
                  <>
                    <li>
                      • Statutory Bonus = {formData.value}% of (Minimum Wage or
                      Basic+DA, whichever is higher)
                    </li>
                    <li>
                      • Range: {formData.min_value || "8.33"}% to{" "}
                      {formData.max_value || "20"}%
                    </li>
                  </>
                )}
                {formData.config_type === "pf_employer" && (
                  <>
                    <li>
                      • Employer PF Contribution = PF Wages × {formData.value}%
                    </li>
                    <li>• Employee also contributes {formData.value}%</li>
                  </>
                )}
                {formData.config_type === "esi_employer" && (
                  <>
                    <li>
                      • Employer ESI Contribution = ESI Wages × {formData.value}
                      %
                    </li>
                    <li>• Employee contributes 0.75%</li>
                    <li>• Applies only if gross salary ≤ ₹21,000/month</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AddSalaryConfig;
