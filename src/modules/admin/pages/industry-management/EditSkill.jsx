"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams, useLocation } from "@/lib/navigation";
import { Save, Image as ImageIcon, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import {
  getSkillAPI,
  updateSkillAPI,
  uploadSkillImageAPI,
  removeSkillImageAPI,
  validateIcon,
  ICON_TYPES,
} from "../../../../api/adminV1/masterdataAPI";
import { apiError } from "../../../../api/javaApi";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import Loader from "../../../../common/components/Loader";
import Breadcrumb from "../../../../common/components/Breadcrumb";

const EditSkill = () => {
  const { id: designationId, skillId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  const params = new URLSearchParams(location.search);
  const designationName = params.get("designationName") || "Designation";
  const industryName = params.get("industryName") || "Industry";
  const industryId = params.get("industryId");
  const skillsListPath = `/admin/industries/designations/${designationId}/skills?designationName=${encodeURIComponent(designationName)}&industryId=${industryId || ""}&industryName=${encodeURIComponent(industryName)}`;

  const [formData, setFormData] = useState({
    name: "",
    image: null, // new file, if user picks one
  });
  // The skill's own designation, sent back unchanged (a different id would move the skill)
  const [skillDesignationId, setSkillDesignationId] = useState(designationId);

  // URL used for <img src>. Starts as the existing image from the API.
  const [imagePreview, setImagePreview] = useState(null);
  // Keep the original image url separately so we know if the user replaced it
  const [existingImage, setExistingImage] = useState(null);
  // User asked to remove the saved image (applied on save)
  const [removeImage, setRemoveImage] = useState(false);

  const [errors, setErrors] = useState({ name: "", image: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchSkill = async () => {
      try {
        setLoading(true);
        const skill = await getSkillAPI(skillId);

        setFormData((prev) => ({
          ...prev,
          name: skill.name || "",
        }));
        if (skill.designationId) setSkillDesignationId(skill.designationId);

        // A short-lived signed URL: fine for display, never stored.
        if (skill.imageUrl) {
          setExistingImage(skill.imageUrl);
          setImagePreview(skill.imageUrl);
        }
      } catch (error) {
        await Swal.fire({
          icon: "error",
          title: "Failed to load skill",
          text: apiError(error).message,
        });
        navigate(skillsListPath);
      } finally {
        setLoading(false);
      }
    };
    if (skillId) fetchSkill();
  }, [skillId, designationId, navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      const file = files[0] || null;
      const iconError = validateIcon(file);
      if (iconError) {
        e.target.value = "";
        setErrors((prev) => ({ ...prev, image: iconError }));
        return;
      }

      setFormData((prev) => ({ ...prev, image: file }));

      if (file) {
        setRemoveImage(false);
        setImagePreview(URL.createObjectURL(file));
      } else {
        // fall back to existing image if user clears the file input
        setImagePreview(removeImage ? null : existingImage);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const toggleRemoveImage = () => {
    setImagePreview(removeImage ? existingImage : null);
    setRemoveImage(!removeImage);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Skill name is required";
    } else if (formData.name.trim().length > 150) {
      newErrors.name = "Skill name must be at most 150 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await updateSkillAPI(skillId, {
        name: formData.name.trim(),
        designationId: skillDesignationId,
      });
    } catch (error) {
      const { code, message, fieldErrors } = apiError(error, "Couldn't update the skill");
      if (code === "CONFLICT") {
        setErrors((prev) => ({ ...prev, name: "A skill with this name already exists under this designation" }));
      } else if (fieldErrors.name) {
        setErrors((prev) => ({ ...prev, name: fieldErrors.name }));
      }
      Swal.fire({ icon: "error", title: "Failed to update skill", text: message });
      setSubmitting(false);
      return;
    }

    // Image changes are separate calls once the skill itself is saved.
    try {
      if (formData.image) {
        const updated = await uploadSkillImageAPI(skillId, formData.image);
        setExistingImage(updated?.imageUrl || null);
        setFormData((prev) => ({ ...prev, image: null }));
      } else if (removeImage && existingImage) {
        await removeSkillImageAPI(skillId);
        setExistingImage(null);
        setRemoveImage(false);
      }
    } catch (error) {
      setSubmitting(false);
      Swal.fire({
        icon: "warning",
        title: "Skill saved, image not updated",
        text: `${apiError(error).message} Try the image again.`,
      });
      return;
    }

    setSubmitting(false);
    Swal.fire({
      icon: "success",
      title: "Success!",
      text: "Skill updated successfully",
      timer: 1500,
      showConfirmButton: false,
    });
    navigate(skillsListPath);
  };

  if (permissionsLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!hasPermission("skill", "edit")) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to edit skills.
          </p>
          <button
            onClick={() => navigate(skillsListPath)}
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
      <motion.div variants={itemVariants}>
        <Breadcrumb
          items={[
            { label: "Industries", path: "/admin/industries" },
            {
              label: industryName,
              path: `/admin/industries/designations/${industryId}`,
            },
            {
              label: designationName,
              path: skillsListPath,
            },
            { label: "Edit Skill" },
          ]}
        />
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Edit Skill</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
        >
          <div className="flex flex-col lg:flex-row gap-10">
            {/* LEFT - inputs */}
            <div className="flex-1 space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Skill Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => validate()}
                  maxLength={150}
                  disabled={submitting}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter skill name"
                  autoFocus
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill Image <span className="text-xs font-normal text-gray-500">(PNG, JPEG or WEBP, max 2MB)</span>
                </label>
                <input
                  type="file"
                  name="image"
                  accept={ICON_TYPES.join(",")}
                  onChange={handleChange}
                  disabled={submitting}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                    errors.image ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {removeImage
                    ? "The current image will be removed when you save."
                    : "Leave empty to keep the current image."}
                </p>
                {existingImage && !formData.image && (
                  <button
                    type="button"
                    onClick={toggleRemoveImage}
                    disabled={submitting}
                    className="mt-2 inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    {removeImage ? "Keep current image" : "Remove current image"}
                  </button>
                )}
                {errors.image && (
                  <p className="mt-1 text-sm text-red-600">{errors.image}</p>
                )}
              </div>
            </div>

            {/* RIGHT - preview */}
            <div className="w-full lg:w-64 flex flex-col items-center">
              <h3 className="text-center font-semibold text-gray-700 mb-4">
                Image Preview
              </h3>
              <div className="w-56 rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm">
                <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      className="w-full h-full object-cover"
                      alt="Skill preview"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImageIcon className="w-10 h-10 mx-auto mb-2" />
                      <p className="text-sm">No Image</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-6">
            <button
              type="button"
              onClick={() => navigate(skillsListPath)}
              disabled={submitting}
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
                  Update Skill
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EditSkill;