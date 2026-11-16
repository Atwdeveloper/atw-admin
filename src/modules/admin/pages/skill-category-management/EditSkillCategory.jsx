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
  getSkillCategoryAPI,
  setSkillCategoryStatusAPI,
  updateSkillCategoryAPI,
} from "../../../../api/adminV1/masterdataAPI";
import { apiError } from "../../../../api/javaApi";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import Loader from "../../../../common/components/Loader";
import Breadcrumb from "../../../../common/components/Breadcrumb";

const EditSkillCategory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const canToggleStatus = hasPermission("skill_category", "toggle_status");
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    status: "ACTIVE",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  // Status is saved through its own endpoint, only when it actually changed
  const [savedStatus, setSavedStatus] = useState("ACTIVE");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchSkillCategory = async () => {
      try {
        setLoading(true);
        const skillCategory = await getSkillCategoryAPI(id);
        const loaded = {
          name: skillCategory.name || "",
          code: skillCategory.code || "",
          status: skillCategory.status || "ACTIVE",
        };
        setFormData(loaded);
        setSavedStatus(loaded.status);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Failed to load skill category",
          text: apiError(error).message,
        });
        navigate("/admin/skill-categories");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchSkillCategory();
  }, [id, navigate]);

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
      await updateSkillCategoryAPI(id, payload);
      // Status has its own endpoint — only call it when it changed.
      if (formData.status !== savedStatus && canToggleStatus) {
        await setSkillCategoryStatusAPI(id, formData.status);
      }

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Skill category updated successfully",
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
        title: "Failed to update skill category",
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

  if (!hasPermission("skill_category", "edit")) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to edit skill categories.
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
      <motion.div className="p-4 pb-0">
        <Breadcrumb
          items={[
            { label: "Skill Categories", path: "/admin/skill-categories" },
            { label: formData.name || "Skill Category" },
          ]}
        />
      </motion.div>
      <motion.div className="" variants={itemVariants}>
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Edit Skill Category
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

          {formData.code && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code
              </label>
              <input
                type="text"
                value={formData.code}
                readOnly
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                Generated automatically and can&apos;t be changed.
              </p>
            </div>
          )}

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
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Skill Category
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EditSkillCategory;
