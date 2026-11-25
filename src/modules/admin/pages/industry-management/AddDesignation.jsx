"use client";

import { useSearchParams } from "@/lib/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "@/lib/navigation";
import { Save, Image as ImageIcon } from "lucide-react";
import Swal from "sweetalert2";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import {
  ICON_TYPES,
  createDesignationAPI,
  getSkillCategoriesAPI,
  setDesignationStatusAPI,
  uploadDesignationImageAPI,
  validateIcon,
} from "../../../../api/adminV1/masterdataAPI";
import { apiError } from "../../../../api/javaApi";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import Loader from "../../../../common/components/Loader";
import Breadcrumb from "../../../../common/components/Breadcrumb";

const NAME_MAX = 150;

const AddDesignation = () => {
  const { id: industryId } = useParams();
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
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [skillCategories, setSkillCategories] = useState([]);
  const [initLoading, setInitLoading] = useState(true);

  const listingPath = `/admin/industries/designations/${industryId}?name=${encodeURIComponent(industryName)}`;

  useEffect(() => {
    // Needs skill_category.view; without it the select just stays "Not assigned".
    getSkillCategoriesAPI()
      .then((list) => setSkillCategories((list || []).filter((c) => c.status === "ACTIVE")))
      .catch(() => setSkillCategories([]))
      .finally(() => setInitLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      const file = files[0] || null;
      const iconError = validateIcon(file);
      setErrors((prev) => ({ ...prev, image: iconError || "" }));
      setFormData((prev) => ({ ...prev, image: iconError ? null : file }));
      setImagePreview(file && !iconError ? URL.createObjectURL(file) : null);
      if (iconError) e.target.value = "";
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
    let created;
    try {
      created = await createDesignationAPI({
        name: formData.name.trim(),
        industryIds: [industryId],
        primaryIndustryId: industryId,
        skillCategoryId: formData.skillCategoryId || null,
      });
    } catch (error) {
      const { code, message, fieldErrors } = apiError(error, "Failed to add designation");
      const nameError =
        fieldErrors.name || (code === "CONFLICT" ? message : "");
      if (nameError) setErrors((prev) => ({ ...prev, name: nameError }));
      Swal.fire({
        icon: "error",
        title: "Failed to add designation",
        text: nameError || message,
      });
      setSubmitting(false);
      return;
    }

    // Follow-up calls: new designations always start ACTIVE, and the icon is
    // its own upload. The designation exists either way, so report problems
    // and send the admin to its edit page to retry.
    const problems = [];
    if (formData.status === "INACTIVE") {
      try {
        await setDesignationStatusAPI(created.id, "INACTIVE");
      } catch (error) {
        problems.push(`Status: ${apiError(error).message}`);
      }
    }
    if (formData.image) {
      try {
        await uploadDesignationImageAPI(created.id, formData.image);
      } catch (error) {
        problems.push(`Image: ${apiError(error).message}`);
      }
    }
    setSubmitting(false);

    if (problems.length) {
      await Swal.fire({
        icon: "warning",
        title: "Designation added, with some problems",
        html: `${problems.join("<br>")}<br><br>You can fix this from Edit Designation.`,
      });
      navigate(
        `/admin/industries/designations/${industryId}/edit/${created.id}?name=${encodeURIComponent(industryName)}`,
      );
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Success!",
      text: "Designation added successfully",
      timer: 1500,
      showConfirmButton: false,
    });
    navigate(listingPath);
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
            onClick={() => navigate(listingPath)}
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
          { label: "Industries", path: "/admin/industries" },
          { label: industryName, path: listingPath },
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
              {skillCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
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
            </div>
            {errors.image ? (
              <p className="mt-1 text-sm text-red-600">{errors.image}</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">PNG, JPEG or WEBP, up to 2MB.</p>
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
