"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@/lib/navigation";
import { Save } from "lucide-react";
import Swal from "sweetalert2";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import {
  createSkillCategoryAPI,
  setSkillCategoryStatusAPI,
} from "../../../../api/adminV1/masterdataAPI";
import { apiError } from "../../../../api/javaApi";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import Loader from "../../../../common/components/Loader";

const AddSkillCategory = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const canToggleStatus = hasPermission("skill_category", "toggle_status");
  const [formData, setFormData] = useState({
    name: "",
    status: "ACTIVE",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "name") {
      if (value && !/^[a-zA-Z0-9\s-]+$/.test(value)) {
        setErrors((prev) => ({
          ...prev,
          name: "Special characters are not allowed",
        }));
      } else {
        setErrors((prev) => ({ ...prev, name: "" }));
      }
    } else {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Skill category name is required";
    } else if (!/^[a-zA-Z0-9\s-]+$/.test(formData.name)) {
      newErrors.name = "Special characters are not allowed";
    } else if (formData.name.trim().length > 150) {
      newErrors.name = "Name must be at most 150 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = { name: formData.name.trim() };
      const created = await createSkillCategoryAPI(payload);
      // New categories start ACTIVE; status has its own endpoint.
      if (formData.status === "INACTIVE" && canToggleStatus) {
        await setSkillCategoryStatusAPI(created.id, "INACTIVE");
      }

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Skill category added successfully",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/admin/skill-categories");
    } catch (error) {
      const { code, message, fieldErrors } = apiError(error);
      // The only unique user-entered field is the name (code is backend-generated)
      if (code === "CONFLICT") {
        setErrors((prev) => ({ ...prev, name: message }));
        return;
      }
      if (fieldErrors.name) {
        setErrors((prev) => ({ ...prev, name: fieldErrors.name }));
        return;
      }

      Swal.fire({
        icon: "error",
        title: "Failed to add skill category",
        text: message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!hasPermission("skill_category", "create")) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to add skill categories.
          </p>
          <button
            onClick={() => navigate("/admin/skill-categories")}
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
            Add New Skill Category
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
        >
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              maxLength={150}
              value={formData.name}
              onChange={handleChange}
              onBlur={() => validate()}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., Skilled"
              autoFocus
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {canToggleStatus && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="ACTIVE"
                  checked={formData.status === "ACTIVE"}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, status: "ACTIVE" }))
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span>Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="INACTIVE"
                  checked={formData.status === "INACTIVE"}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, status: "INACTIVE" }))
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span>Inactive</span>
              </label>
            </div>
          </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/skill-categories")}
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
                  Save Skill Category
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddSkillCategory;
