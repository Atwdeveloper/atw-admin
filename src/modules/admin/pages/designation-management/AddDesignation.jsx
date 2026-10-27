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
import { addDesignationAPI } from "../../../../api/admin/adminDesignationAPI";
import { getIndustriesAPI } from "../../../../api/admin/adminCompanyAPI";
import { getSkillCategoriesAPI } from "../../../../api/admin/adminSkillCategoryAPI";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import Loader from "../../../../common/components/Loader";
import Breadcrumb from "../../../../common/components/Breadcrumb";
import MultiSelectDropdown from "../../../../common/components/MultiSelectDropdown";

const AddDesignation = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const [formData, setFormData] = useState({
    name: "",
    industry_ids: [],
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
        const [industriesRes, skillCategoriesRes] = await Promise.all([
          getIndustriesAPI(),
          getSkillCategoriesAPI(),
        ]);

        const industriesArray = Array.isArray(industriesRes.data?.data)
          ? industriesRes.data.data
          : Array.isArray(industriesRes.data)
            ? industriesRes.data
            : [];
        setIndustries(industriesArray);
        setSkillCategories(skillCategoriesRes.data?.data || []);
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
    const { name, value, files } = e.target;

    if (name === "image") {
      const file = files[0] || null;
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

  const handleIndustriesChange = (industryIds) => {
    setFormData((prev) => ({
      ...prev,
      industry_ids: industryIds,
      primary_industry_id: industryIds.includes(prev.primary_industry_id)
        ? prev.primary_industry_id
        : industryIds[0] || "",
    }));
    setErrors((prev) => ({ ...prev, industry_ids: "" }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Designation name is required";
    } else if (!/^[a-zA-Z0-9\s&-]+$/.test(formData.name)) {
      newErrors.name = "Special characters are not allowed";
    }

    if (!formData.industry_ids || formData.industry_ids.length === 0) {
      newErrors.industry_ids = "Select at least one industry";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      formData.industry_ids.forEach((id) =>
        payload.append("industry_ids[]", id),
      );
      if (formData.primary_industry_id) {
        payload.append("primary_industry_id", formData.primary_industry_id);
      }
      if (formData.skill_category_id) {
        payload.append("skill_category_id", formData.skill_category_id);
      }
      if (formData.image) {
        payload.append("image", formData.image);
      }

      const response = await addDesignationAPI(payload);

      if (response?.status && response.status !== 200) {
        Swal.fire({
          icon: "error",
          title: "Failed to add designation",
          text: response.message || "Something went wrong",
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Designation added successfully",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/admin/designations");
    } catch (error) {
      console.error("Error adding designation:", error);

      const validationErrors = error.response?.data?.errors;
      if (error.response?.status === 422 && validationErrors) {
        setErrors((prev) => ({
          ...prev,
          name: validationErrors.name?.[0] || prev.name,
          industry_ids: validationErrors.industry_ids?.[0] || prev.industry_ids,
        }));
        return;
      }

      Swal.fire({
        icon: "error",
        title: "Failed to add designation",
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
              autoFocus
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industries <span className="text-red-500">*</span>
            </label>
            <MultiSelectDropdown
              options={industries}
              selectedIds={formData.industry_ids}
              onChange={handleIndustriesChange}
              placeholder="Select industries"
              error={!!errors.industry_ids}
              showSelectAll
            />
            {errors.industry_ids && (
              <p className="mt-1 text-sm text-red-600">
                {errors.industry_ids}
              </p>
            )}
          </div>

          {formData.industry_ids.length > 0 && (
            <div>
              <label
                htmlFor="primary_industry_id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Primary Industry
              </label>
              <select
                id="primary_industry_id"
                name="primary_industry_id"
                value={formData.primary_industry_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {industries
                  .filter((industry) =>
                    formData.industry_ids.includes(industry.id),
                  )
                  .map((industry) => (
                    <option key={industry.id} value={industry.id}>
                      {industry.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

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
                accept="image/*"
                onChange={handleChange}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
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
