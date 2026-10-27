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
  addMinimumWageAPI,
  getMinimumWageInitAPI,
} from "../../../../api/admin/adminMinimumWageAPI";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import Loader from "../../../../common/components/Loader";

const AddMinimumWage = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const [formData, setFormData] = useState({
    state_id: "",
    skill_category_id: "",
    min_daily_rate: "",
    is_active: 1,
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
        const response = await getMinimumWageInitAPI();
        setStates(response.data?.states || []);
        setSkillCategories(response.data?.skill_categories || []);
      } catch (error) {
        console.error("Error fetching form data:", error);
        Swal.fire({
          icon: "error",
          title: "Failed to load form data",
          text: error.response?.data?.message || "Something went wrong",
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

    if (!formData.state_id) {
      newErrors.state_id = "State is required";
    }
    if (!formData.skill_category_id) {
      newErrors.skill_category_id = "Skill category is required";
    }
    if (!formData.min_daily_rate) {
      newErrors.min_daily_rate = "Minimum daily rate is required";
    } else if (
      isNaN(formData.min_daily_rate) ||
      Number(formData.min_daily_rate) <= 0
    ) {
      newErrors.min_daily_rate = "Enter a valid positive rate";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await addMinimumWageAPI({
        state_id: formData.state_id,
        skill_category_id: formData.skill_category_id,
        min_daily_rate: formData.min_daily_rate,
        is_active: formData.is_active,
      });

      if (response?.status && response.status !== 200) {
        Swal.fire({
          icon: "error",
          title: "Failed to add minimum wage rate",
          text: response.message || "Something went wrong",
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Minimum wage rate added successfully",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/admin/minimum-wage");
    } catch (error) {
      console.error("Error adding minimum wage rate:", error);

      const validationErrors = error.response?.data?.errors;
      if (error.response?.status === 422 && validationErrors) {
        setErrors((prev) => ({
          ...prev,
          state_id: validationErrors.state_id?.[0] || prev.state_id,
          skill_category_id:
            validationErrors.skill_category_id?.[0] || prev.skill_category_id,
          min_daily_rate:
            validationErrors.min_daily_rate?.[0] || prev.min_daily_rate,
        }));
        return;
      }

      Swal.fire({
        icon: "error",
        title: "Failed to add minimum wage rate",
        text: error.response?.data?.message || "Something went wrong",
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
              htmlFor="state_id"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              State <span className="text-red-500">*</span>
            </label>
            <select
              id="state_id"
              name="state_id"
              value={formData.state_id}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.state_id ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select state</option>
              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
            {errors.state_id && (
              <p className="mt-1 text-sm text-red-600">{errors.state_id}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="skill_category_id"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Skill Category <span className="text-red-500">*</span>
            </label>
            <select
              id="skill_category_id"
              name="skill_category_id"
              value={formData.skill_category_id}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.skill_category_id ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select skill category</option>
              {skillCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.skill_category_id && (
              <p className="mt-1 text-sm text-red-600">
                {errors.skill_category_id}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="min_daily_rate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Minimum Daily Rate (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="min_daily_rate"
              name="min_daily_rate"
              min="0"
              step="0.01"
              value={formData.min_daily_rate}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.min_daily_rate ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter minimum daily rate"
            />
            {errors.min_daily_rate && (
              <p className="mt-1 text-sm text-red-600">
                {errors.min_daily_rate}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="is_active"
                  value="1"
                  checked={Number(formData.is_active) === 1}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, is_active: 1 }))
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span>Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="is_active"
                  value="0"
                  checked={Number(formData.is_active) === 0}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, is_active: 0 }))
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span>Inactive</span>
              </label>
            </div>
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
