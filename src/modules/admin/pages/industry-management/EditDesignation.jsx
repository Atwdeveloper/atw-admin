"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams, useSearchParams } from "@/lib/navigation";
import { Save, Image as ImageIcon, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import {
  ICON_TYPES,
  assignDesignationSkillCategoryAPI,
  clearDesignationSkillCategoryAPI,
  getDesignationAPI,
  getSkillCategoriesAPI,
  removeDesignationImageAPI,
  setDesignationStatusAPI,
  updateDesignationAPI,
  uploadDesignationImageAPI,
  validateIcon,
} from "../../../../api/adminV1/masterdataAPI";
import { apiError } from "../../../../api/javaApi";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import Loader from "../../../../common/components/Loader";
import Breadcrumb from "../../../../common/components/Breadcrumb";

const NAME_MAX = 150;

const EditDesignation = () => {
  const { id: industryId, designation_id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const industryName = searchParams.get("name") || "Industry";

  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  const [formData, setFormData] = useState({
    name: "",
    skillCategoryId: "",
    status: "ACTIVE",
    image: null,
  });
  // The designation as last loaded — what "changed" is measured against.
  const [original, setOriginal] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [skillCategories, setSkillCategories] = useState([]);

  const listingPath = `/admin/industries/designations/${industryId}?name=${encodeURIComponent(industryName)}`;
  const canToggleStatus = hasPermission("designation", "toggle_status");

  const loadDesignation = useCallback(async () => {
    try {
      setLoading(true);
      const [designation, categories] = await Promise.all([
        getDesignationAPI(designation_id),
        // Needs skill_category.view; without it only the assigned id is known.
        getSkillCategoriesAPI().catch(() => []),
      ]);
      // Active categories, plus the assigned one even if it's been deactivated
      setSkillCategories(
        (categories || []).filter(
          (c) => c.status === "ACTIVE" || c.id === designation.skillCategoryId,
        ),
      );
      setOriginal(designation);
      setFormData({
        name: designation.name || "",
        skillCategoryId: designation.skillCategoryId || "",
        status: designation.status || "ACTIVE",
        image: null,
      });
      setImagePreview(designation.imageUrl || null);
      setRemoveImage(false);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Failed to load designation",
        text: apiError(error).message,
      });
      navigate(listingPath);
    } finally {
      setLoading(false);
    }
  }, [designation_id, listingPath, navigate]);

  useEffect(() => {
    if (designation_id) loadDesignation();
  }, [designation_id, loadDesignation]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      const file = files[0] || null;
      const iconError = validateIcon(file);
      setErrors((prev) => ({ ...prev, image: iconError || "" }));
      if (iconError) {
        e.target.value = "";
        return;
      }
      setFormData((prev) => ({ ...prev, image: file }));
      setRemoveImage(false);
      setImagePreview(file ? URL.createObjectURL(file) : original?.imageUrl || null);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "name") {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: null }));
    setImagePreview(null);
    setRemoveImage(Boolean(original?.imageUrl));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Designation name is required";
    } else if (formData.name.trim().length > NAME_MAX) {
      newErrors.name = `Designation name must be at most ${NAME_MAX} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Full replace of name + industries; keep every industry it already belongs to.
      const industryIds = (original?.industries || []).map((i) => i.id);
      await updateDesignationAPI(designation_id, {
        name: formData.name.trim(),
        industryIds: industryIds.length ? industryIds : [industryId],
        // Keep the existing primary industry (this page can't change it).
        primaryIndustryId:
          original?.primaryIndustryId ||
          (original?.industries || []).find((i) => i.primary)?.id ||
          industryIds[0] ||
          industryId,
      });
    } catch (error) {
      const { code, message, fieldErrors } = apiError(error, "Failed to update designation");
      const nameError =
        fieldErrors.name || (code === "CONFLICT" ? message : "");
      if (nameError) setErrors((prev) => ({ ...prev, name: nameError }));
      Swal.fire({
        icon: "error",
        title: "Failed to update designation",
        text: nameError || message,
      });
      setSubmitting(false);
      return;
    }

    // Skill category, status and icon each have their own endpoint; only
    // call the ones that actually changed.
    const problems = [];
    const run = async (label, call) => {
      try {
        await call();
      } catch (error) {
        problems.push(`${label}: ${apiError(error).message}`);
      }
    };

    if (formData.skillCategoryId !== (original?.skillCategoryId || "")) {
      await run("Skill category", () =>
        formData.skillCategoryId
          ? assignDesignationSkillCategoryAPI(designation_id, formData.skillCategoryId)
          : clearDesignationSkillCategoryAPI(designation_id),
      );
    }
    if (canToggleStatus && formData.status !== original?.status) {
      await run("Status", () => setDesignationStatusAPI(designation_id, formData.status));
    }
    if (formData.image) {
      await run("Image", () => uploadDesignationImageAPI(designation_id, formData.image));
    } else if (removeImage) {
      await run("Image", () => removeDesignationImageAPI(designation_id));
    }
    setSubmitting(false);

    if (problems.length) {
      await Swal.fire({
        icon: "warning",
        title: "Saved, with some problems",
        html: `The name was saved, but:<br><br>${problems.join("<br>")}`,
      });
      // Stay here, showing what was actually saved.
      loadDesignation();
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Success!",
      text: "Designation updated successfully",
      timer: 1500,
      showConfirmButton: false,
    });
    navigate(listingPath);
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
            onClick={() => navigate(listingPath)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const otherIndustries = (original?.industries || []).filter((i) => i.id !== industryId);

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
            { label: industryName, path: listingPath },
            { label: `Edit : ${original?.name || formData.name}` },
          ]}
        />
      </motion.div>
      <motion.div className="" variants={itemVariants}>
        <div className="flex items-center gap-4 mb-6">
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
              maxLength={NAME_MAX}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter designation name"
              autoFocus
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
            {otherIndustries.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Also part of: {otherIndustries.map((i) => i.name).join(", ")}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="skillCategoryId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Skill Category
            </label>
            <select
              id="skillCategoryId"
              name="skillCategoryId"
              value={formData.skillCategoryId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Not assigned</option>
              {formData.skillCategoryId &&
                !skillCategories.some((c) => c.id === formData.skillCategoryId) && (
                  <option value={formData.skillCategoryId}>Current category</option>
                )}
              {skillCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.status !== "ACTIVE" ? " (inactive)" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Used to look up the minimum wage for this designation.
            </p>
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
                accept={ICON_TYPES.join(",")}
                onChange={handleChange}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {imagePreview && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              )}
            </div>
            {errors.image ? (
              <p className="mt-1 text-sm text-red-600">{errors.image}</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                {removeImage
                  ? "The current image will be removed when you save."
                  : "PNG, JPEG or WEBP, up to 2MB. Leave empty to keep the current image."}
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
                  name="status"
                  value="ACTIVE"
                  checked={formData.status === "ACTIVE"}
                  disabled={!canToggleStatus}
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
                  disabled={!canToggleStatus}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, status: "INACTIVE" }))
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span>Inactive</span>
              </label>
            </div>
            {!canToggleStatus && (
              <p className="text-xs text-gray-400 mt-1">
                You don't have permission to change the status.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(listingPath)}
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
