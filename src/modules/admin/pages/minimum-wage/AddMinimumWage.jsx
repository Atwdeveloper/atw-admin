"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@/lib/navigation";
import { Save } from "lucide-react";
import Swal from "sweetalert2";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import {
  createMinimumWageRateAPI,
  getSkillCategoriesAPI,
} from "../../../../api/adminV1/masterdataAPI";
import { getStatesAPI } from "../../../../api/adminV1/geographyAPI";
import { apiError } from "../../../../api/javaApi";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import Loader from "../../../../common/components/Loader";

// > 0, up to 8 integer digits and 2 decimals (backend limit)
export const RATE_PATTERN = /^\d{1,8}(\.\d{1,2})?$/;

export const validateRate = (value) => {
  if (!String(value).trim()) return "Minimum daily rate is required";
  if (!RATE_PATTERN.test(String(value).trim()) || Number(value) <= 0)
    return "Enter a positive rate with at most 8 digits and 2 decimals";
  return "";
};

// Today as YYYY-MM-DD in the browser's local time (toISOString would use UTC).
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const AddMinimumWage = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const [formData, setFormData] = useState({
    stateId: "",
    skillCategoryId: "",
    minDailyRate: "",
    effectiveFrom: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [states, setStates] = useState([]);
  const [skillCategories, setSkillCategories] = useState([]);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    const fetchInit = async () => {
      try {
        setInitLoading(true);
        const [stateList, categoryList] = await Promise.all([
          getStatesAPI(),
          getSkillCategoriesAPI(),
        ]);
        setStates(stateList || []);
        // Only active categories are offered for new rates
        setSkillCategories((categoryList || []).filter((c) => c.status === "ACTIVE"));
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Failed to load form data",
          text: apiError(error).message,
        });
      } finally {
        setInitLoading(false);
      }
    };
    fetchInit();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.stateId) {
      newErrors.stateId = "State is required";
    }
    if (!formData.skillCategoryId) {
      newErrors.skillCategoryId = "Skill category is required";
    }
    const rateError = validateRate(formData.minDailyRate);
    if (rateError) newErrors.minDailyRate = rateError;
    if (!formData.effectiveFrom) {
      newErrors.effectiveFrom = "Effective date is required";
    } else if (formData.effectiveFrom < todayISO()) {
      // A typed-in date can bypass the picker's min, so check here too.
      newErrors.effectiveFrom = "Effective date can't be in the past";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await createMinimumWageRateAPI({
        stateId: formData.stateId,
        skillCategoryId: formData.skillCategoryId,
        minDailyRate: Number(formData.minDailyRate),
        effectiveFrom: formData.effectiveFrom,
      });

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Minimum wage rate added successfully",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/admin/minimum-wage");
    } catch (error) {
      const { code, message, fieldErrors } = apiError(error);
      if (code === "CONFLICT") {
        // An active rate already exists for this state/category/date
        setErrors((prev) => ({ ...prev, effectiveFrom: message }));
        return;
      }
      if (Object.keys(fieldErrors).length) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
        return;
      }

      Swal.fire({
        icon: "error",
        title: "Failed to add minimum wage rate",
        text: message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (permissionsLoading || initLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!hasPermission("minimum_wage", "create")) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to add minimum wage rates.
          </p>
          <button
            onClick={() => navigate("/admin/minimum-wage")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex-1 bg-gray-50 p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="" variants={itemVariants}>
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Add Minimum Wage Rate
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
        >
          <div>
            <label
              htmlFor="stateId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              State <span className="text-red-500">*</span>
            </label>
            <select
              id="stateId"
              name="stateId"
              value={formData.stateId}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.stateId ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select state</option>
              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
            {errors.stateId && (
              <p className="mt-1 text-sm text-red-600">{errors.stateId}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="skillCategoryId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Skill Category <span className="text-red-500">*</span>
            </label>
            <select
              id="skillCategoryId"
              name="skillCategoryId"
              value={formData.skillCategoryId}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.skillCategoryId ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select skill category</option>
              {skillCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.skillCategoryId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.skillCategoryId}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="minDailyRate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Minimum Daily Rate (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="minDailyRate"
              name="minDailyRate"
              min="0"
              step="0.01"
              value={formData.minDailyRate}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.minDailyRate ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter minimum daily rate"
            />
            {errors.minDailyRate && (
              <p className="mt-1 text-sm text-red-600">
                {errors.minDailyRate}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="effectiveFrom"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Effective From <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="effectiveFrom"
              name="effectiveFrom"
              value={formData.effectiveFrom}
              min={todayISO()}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.effectiveFrom ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.effectiveFrom ? (
              <p className="mt-1 text-sm text-red-600">{errors.effectiveFrom}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                The date this rate takes effect, as per the government notification.
                Rates can't be edited later — a change is added as a new dated version.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/minimum-wage")}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Rate
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddMinimumWage;
