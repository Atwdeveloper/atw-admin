"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "@/lib/navigation";
import { Info, Save } from "lucide-react";
import Swal from "sweetalert2";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import {
  createMinimumWageRateAPI,
  getMinimumWageRateAPI,
} from "../../../../api/adminV1/masterdataAPI";
import { apiError } from "../../../../api/javaApi";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import Loader from "../../../../common/components/Loader";
import Breadcrumb from "../../../../common/components/Breadcrumb";
import { validateRate, todayISO } from "./AddMinimumWage";

// Rates are immutable: this page adds a NEW dated version for the same
// state + skill category, prefilled from the version it was opened from.
const EditMinimumWage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const [source, setSource] = useState(null); // the version this page was opened from
  const [formData, setFormData] = useState({
    minDailyRate: "",
    effectiveFrom: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const rate = await getMinimumWageRateAPI(id);
        setSource(rate);
        setFormData({
          minDailyRate: rate.minDailyRate ?? "",
          effectiveFrom: "",
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Failed to load minimum wage rate",
          text: apiError(error).message,
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

    const rateError = validateRate(formData.minDailyRate);
    if (rateError) newErrors.minDailyRate = rateError;
    if (!formData.effectiveFrom) {
      newErrors.effectiveFrom = "Effective date for the new version is required";
    } else if (formData.effectiveFrom < todayISO()) {
      // A typed-in date can bypass the picker's min, so check here too.
      newErrors.effectiveFrom = "Effective date can't be in the past";
    } else if (formData.effectiveFrom === source?.effectiveFrom && source?.status === "ACTIVE") {
      newErrors.effectiveFrom =
        "This date is taken by the current version. To correct it, deactivate that version first.";
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
        stateId: source.stateId,
        skillCategoryId: source.skillCategoryId,
        minDailyRate: Number(formData.minDailyRate),
        effectiveFrom: formData.effectiveFrom,
      });

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "New minimum wage version added",
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
        title: "Failed to add new version",
        text: message,
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
      <motion.div className="p-4 pb-0">
        <Breadcrumb
          items={[
            { label: "Minimum Wage", path: "/admin/minimum-wage" },
            { label: "New Version" },
          ]}
        />
      </motion.div>
      <motion.div className="" variants={itemVariants}>
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            New Minimum Wage Version
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
        >
          <div className="flex gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>
                Rates can't be edited. Saving adds a <strong>new dated version</strong>; the
                current one ({source?.minDailyRate}/day from {source?.effectiveFrom}) stays in
                the history and still applies to dates before the new one.
              </p>
              <p>
                To correct a wrongly entered rate, deactivate it from the list first, then add
                the right one with the same date.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <input
              type="text"
              value={source?.stateName || "-"}
              disabled
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skill Category
            </label>
            <input
              type="text"
              value={source?.skillCategoryName || "-"}
              disabled
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              A version always keeps the state and skill category. For a different pair, use
              Add Minimum Wage.
            </p>
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
              New Version Effective From <span className="text-red-500">*</span>
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
            {errors.effectiveFrom && (
              <p className="mt-1 text-sm text-red-600">{errors.effectiveFrom}</p>
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
                  Add New Version
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
