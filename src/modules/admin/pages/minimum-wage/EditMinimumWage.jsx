"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "@/lib/navigation";
import { Save } from "lucide-react";
import Swal from "sweetalert2";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import {
  getMinimumWageByIdAPI,
  updateMinimumWageAPI,
} from "../../../../api/admin/adminMinimumWageAPI";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import Loader from "../../../../common/components/Loader";
import Breadcrumb from "../../../../common/components/Breadcrumb";

const EditMinimumWage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const [formData, setFormData] = useState({
    min_daily_rate: "",
  });
  const [readOnlyInfo, setReadOnlyInfo] = useState({
    stateName: "",
    skillCategoryName: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const rateResponse = await getMinimumWageByIdAPI(id);

        const rate = rateResponse.data;
        setFormData({
          min_daily_rate: rate.min_daily_rate ?? "",
        });
        setReadOnlyInfo({
          stateName: rate.state?.name || "-",
          skillCategoryName: rate.skill_category?.name || "-",
        });
      } catch (error) {
        console.error("Error fetching minimum wage rate:", error);
        Swal.fire({
          icon: "error",
          title: "Failed to load minimum wage rate",
          text: error.response?.data?.message || "Something went wrong",
        });
        navigate("/admin/minimum-wage");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};

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
      const response = await updateMinimumWageAPI(id, {
        min_daily_rate: formData.min_daily_rate,
      });

      if (response?.status && response.status !== 200) {
        Swal.fire({
          icon: "error",
          title: "Failed to update minimum wage rate",
          text: response.message || "Something went wrong",
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Minimum wage rate updated successfully",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/admin/minimum-wage");
    } catch (error) {
      console.error("Error updating minimum wage rate:", error);

      const validationErrors = error.response?.data?.errors;
      if (error.response?.status === 422 && validationErrors) {
        setErrors((prev) => ({
          ...prev,
          min_daily_rate:
            validationErrors.min_daily_rate?.[0] || prev.min_daily_rate,
        }));
        return;
      }

      Swal.fire({
        icon: "error",
        title: "Failed to update minimum wage rate",
        text: error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (permissionsLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!hasPermission("minimum_wage", "edit")) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to edit minimum wage rates.
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
      <motion.div className="p-4 pb-0">
        <Breadcrumb
          items={[
            { label: "Minimum Wage", path: "/admin/minimum-wage" },
            { label: "Edit Rate" },
          ]}
        />
      </motion.div>
      <motion.div className="" variants={itemVariants}>
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Edit Minimum Wage Rate
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <input
              type="text"
              value={readOnlyInfo.stateName}
              disabled
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              State and skill category can't be changed after creation. Delete
              and re-add the rate if they need to change.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skill Category
            </label>
            <input
              type="text"
              value={readOnlyInfo.skillCategoryName}
              disabled
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
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
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Rate
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EditMinimumWage;
