"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams, useSearchParams } from "@/lib/navigation";
import { Save, Image as ImageIcon } from "lucide-react";
import Swal from "sweetalert2";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import {
  getDesignationByIdAPI,
  // Old, industry-unaware update endpoint — replaced by updateDesignationByIndustryAPI below.
  // updateDesignationAPI,
  updateDesignationByIndustryAPI,
} from "../../../../api/admin/adminDesignationAPI";
import { getMinimumWageInitAPI } from "../../../../api/admin/adminMinimumWageAPI";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import Loader from "../../../../common/components/Loader";
import Breadcrumb from "../../../../common/components/Breadcrumb";

// Backend validation errors (e.g. an invalid image file) arrive as
// `{ message: "Validation failed.", data: { image: ["..."] } }` — the generic
// `message` alone hides the actual reason, so prefer the first field-specific
// error when one is present.
const extractApiErrorMessage = (payload, fallback = "Something went wrong") => {
  const data = payload?.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const firstKey = Object.keys(data)[0];
    if (firstKey) {
      const value = data[firstKey];
      const firstMessage = Array.isArray(value) ? value[0] : value;
      if (firstMessage) return firstMessage;
    }
  }
  return payload?.message || fallback;
};

const EditDesignation = () => {
  const { id: industryId, designation_id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const industryName = searchParams.get("name") || "Industry";

  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  const [formData, setFormData] = useState({
    name: "",
    skill_category_id: "",
    status: 1,
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [errors, setErrors] = useState({
    name: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [skillCategories, setSkillCategories] = useState([]);

  useEffect(() => {
    const fetchDesignation = async () => {
      try {
        setLoading(true);
        const [initResponse, designationResponse] = await Promise.all([
          getMinimumWageInitAPI(),
          getDesignationByIdAPI(designation_id),
        ]);
        setSkillCategories(initResponse.data?.skill_categories || []);

        // Assuming response structure: { data: { id, name, status, ... } }
        const designation =
          designationResponse.data.data || designationResponse.data; // adjust as needed
        setFormData({
          name: designation.name,
          skill_category_id:
            designation.skill_category_id ??
            designation.skill_category?.id ??
            "",
          status: Number(designation.status ?? 1),
          image: null,
        });

        const currentImage =
          designation.image_url || designation.image || null;
        if (currentImage) {
          setExistingImage(currentImage);
          setImagePreview(currentImage);
        }
      } catch (error) {
        console.error("Error fetching designation:", error);
        Swal.fire({
          icon: "error",
          title: "Failed to load designation",
          text: error.response?.data?.message || "Something went wrong",
        });
        navigate(`/admin/industries/designations/${industryId}`);
      } finally {
        setLoading(false);
      }
    };
    if (designation_id) fetchDesignation();
  }, [designation_id, industryId, navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      const file = files[0] || null;
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(file ? URL.createObjectURL(file) : existingImage);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "name") {
      if (value && !/^[a-zA-Z0-9\s&-]+$/.test(value)) {
        setErrors((prev) => ({
          ...prev,
          name: "Special characters are not allowed",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          name: "",
        }));
      }
    }
  };
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Designation name is required";
    } else if (!/^[a-zA-Z0-9\s&-]+$/.test(formData.name)) {
      newErrors.name = "Special characters are not allowed";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Old call, kept for reference:
      // await updateDesignationAPI(designation_id, formData);
      const payload = new FormData();
      payload.append("name", formData.name);
      if (formData.skill_category_id) {
        payload.append("skill_category_id", formData.skill_category_id);
      }
      payload.append("status", formData.status);
      if (formData.image) {
        payload.append("image", formData.image);
      }
      const response = await updateDesignationByIndustryAPI(
        industryId,
        designation_id,
        payload,
      );

      if (response?.status && response.status !== 200) {
        Swal.fire({
          icon: "error",
          title: "Failed to update designation",
          text: extractApiErrorMessage(response),
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Designation updated successfully",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate(`/admin/industries/designations/${industryId}`);
    } catch (error) {
      console.error("Error updating designation:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to update designation",
        text: extractApiErrorMessage(error.response?.data),
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

  if (!hasPermission("designation", "edit")) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to edit designations.
          </p>
          <button
            onClick={() =>
              navigate(`/admin/industries/designations/${industryId}`)
            }
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
            { label: "All Industries", path: "/admin/industries" },
            {
              label: industryName,
              path: `/admin/industries/designations/${industryId}?name=${encodeURIComponent(
                industryName,
              )}`,
            },
            { label: `Edit : ${formData.name}` },
          ]}
        />
      </motion.div>
      <motion.div className="" variants={itemVariants}>
        <div className="flex items-center gap-4 mb-6">
          {/* <button
            onClick={() => navigate(`/admin/industries/designations/${industryId}`)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button> */}
          <h1 className="text-2xl font-bold text-gray-800">Edit Designation</h1>
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
            <p className="text-xs text-gray-400 mt-1">
              Leave empty to keep the current image.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="1"
                  checked={Number(formData.status) === 1}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, status: 1 }))
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span>Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="0"
                  checked={Number(formData.status) === 0}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, status: 0 }))
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
              onClick={() =>
                navigate(
                  `/admin/industries/designations/${industryId}?name=${encodeURIComponent(
                    industryName,
                  )}`,
                )
              }
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
                  Update Designation
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EditDesignation;
