"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@/lib/navigation";
import { Save, Image as ImageIcon } from "lucide-react";
import Swal from "sweetalert2";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import {
  createDesignationAPI,
  getIndustriesAPI,
  getSkillCategoriesAPI,
  uploadDesignationImageAPI,
  validateIcon,
} from "../../../../api/adminV1/masterdataAPI";
import { apiError } from "../../../../api/javaApi";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import Loader from "../../../../common/components/Loader";
import Breadcrumb from "../../../../common/components/Breadcrumb";

const AddDesignation = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const [formData, setFormData] = useState({
    name: "",
    // One industry per designation; it's sent as both industryIds and primaryIndustryId.
    primary_industry_id: "",
    skill_category_id: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [industries, setIndustries] = useState([]);
  const [skillCategories, setSkillCategories] = useState([]);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    const fetchInit = async () => {
      try {
        setInitLoading(true);
        const [industryList, categoryList] = await Promise.all([
          getIndustriesAPI(),
          getSkillCategoriesAPI(),
        ]);
        // Only active entries can be picked for a new designation
        setIndustries((industryList || []).filter((i) => i.status === "ACTIVE"));
        setSkillCategories((categoryList || []).filter((c) => c.status === "ACTIVE"));
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Failed to load form data",
          text: apiError(error, "Something went wrong").message,
        });
      } finally {
        setInitLoading(false);
      }
    };
    fetchInit();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      const file = files[0] || null;
      const imageError = validateIcon(file);
      setErrors((prev) => ({ ...prev, image: imageError || "" }));
      if (imageError) {
        e.target.value = "";
        return;
      }
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(file ? URL.createObjectURL(file) : null);
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "name") {
      if (value && !/^[a-zA-Z0-9\s&-]+$/.test(value)) {
        setErrors((prev) => ({
          ...prev,
          name: "Special characters are not allowed",
        }));
      } else {
        setErrors((prev) => ({ ...prev, name: "" }));
      }
    }
  };

  const handleIndustryChange = (e) => {
    const primaryIndustryId = e.target.value;
    setFormData((prev) => ({ ...prev, primary_industry_id: primaryIndustryId }));
    setErrors((prev) => ({ ...prev, primary_industry_id: "" }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Designation name is required";
    } else if (formData.name.trim().length > 150) {
      newErrors.name = "Designation name must be at most 150 characters";
    } else if (!/^[a-zA-Z0-9\s&-]+$/.test(formData.name)) {
      newErrors.name = "Special characters are not allowed";
    }

    if (!formData.primary_industry_id) {
      newErrors.primary_industry_id = "Select the primary industry";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    let created;
    try {
      created = await createDesignationAPI({
        name: formData.name.trim(),
        industryIds: [formData.primary_industry_id],
        primaryIndustryId: formData.primary_industry_id,
        skillCategoryId: formData.skill_category_id || null,
      });
    } catch (error) {
      const { code, message, fieldErrors } = apiError(error, "Something went wrong");
      if (code === "CONFLICT") {
        setErrors((prev) => ({ ...prev, name: message }));
      } else if (Object.keys(fieldErrors).length) {
        setErrors((prev) => ({
          ...prev,
          name: fieldErrors.name || prev.name,
          primary_industry_id:
            fieldErrors.primaryIndustryId || fieldErrors.industryIds || prev.primary_industry_id,
        }));
      } else {
        Swal.fire({ icon: "error", title: "Failed to add designation", text: message });
      }
      setSubmitting(false);
      return;
    }

    // The icon is a separate upload; the designation already exists if it fails.
    if (formData.image) {
      try {
        await uploadDesignationImageAPI(created.id, formData.image);
      } catch (error) {
        await Swal.fire({
          icon: "warning",
          title: "Designation added, image not saved",
          text: `${apiError(error, "The image couldn't be uploaded.").message} You can try again from Edit.`,
        });
        navigate(`/admin/designations/edit/${created.id}`);
        return;
      }
    }

    setSubmitting(false);
    Swal.fire({
      icon: "success",
      title: "Success!",
      text: "Designation added successfully",
      timer: 1500,
      showConfirmButton: false,
    });
    navigate("/admin/designations");
  };

  if (permissionsLoading || initLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!hasPermission("designation", "create")) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to add designations.
          </p>
          <button
            onClick={() => navigate("/admin/designations")}
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
      <Breadcrumb
        items={[
          { label: "Designations", path: "/admin/designations" },
          { label: "Add Designation" },
        ]}
      />
      <motion.div className="" variants={itemVariants}>
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Add New Designation
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
              Designation Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={() => validate()}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter designation name"
              maxLength={150}
              autoFocus
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="primary_industry_id"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Primary Industry <span className="text-red-500">*</span>
            </label>
            <select
              id="primary_industry_id"
              name="primary_industry_id"
              value={formData.primary_industry_id}
              onChange={handleIndustryChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.primary_industry_id ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select primary industry</option>
              {industries.map((industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.name}
                </option>
              ))}
            </select>
            {errors.primary_industry_id && (
              <p className="mt-1 text-sm text-red-600">
                {errors.primary_industry_id}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="image"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Designation Image
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    className="w-full h-full object-cover"
                    alt="Designation preview"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleChange}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            {errors.image ? (
              <p className="mt-1 text-sm text-red-600">{errors.image}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">PNG, JPEG or WEBP, up to 2MB</p>
            )}
          </div>

          <div>
            <label
              htmlFor="skill_category_id"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Skill Category
            </label>
            <select
              id="skill_category_id"
              name="skill_category_id"
              value={formData.skill_category_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Not assigned</option>
              {skillCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/designations")}
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
                  Save Designation
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddDesignation;
