"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams, useLocation } from "@/lib/navigation";
import { Save, Image as ImageIcon, X } from "lucide-react";
import Swal from "sweetalert2";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import { addSkillAPI } from "../../../../api/admin/adminSkillAPI";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import Loader from "../../../../common/components/Loader";
import Breadcrumb from "../../../../common/components/Breadcrumb";

const AddSkill = () => {
  const { id: designationId } = useParams();
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
    designation_id: designationId,
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);

  const [errors, setErrors] = useState({
    name: "",
    image: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      const file = files[0];

      setFormData((prev) => ({
        ...prev,
        image: file,
      }));

      if (file) {
        setImagePreview(URL.createObjectURL(file));
      } else {
        setImagePreview(null);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Skill name is required";
    }

    if (!formData.image) {
      newErrors.image = "Skill image is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("designation_id", formData.designation_id);
      data.append("image", formData.image);

      await addSkillAPI(data);

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Skill added successfully",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate(skillsListPath);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader />
      </div>
    );
  }

  if (!hasPermission("skill", "create")) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h2 className="text-xl font-semibold">You don't have permission.</h2>
      </div>
    );
  }

  return (
    <motion.div
      className="flex-1 bg-gray-50 p-6"
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
            { label: "Add Skill" },
          ]}
        />
        <h1 className="text-3xl font-bold mb-6">Add New Skill</h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* LEFT SIDE - Inputs */}
            <div className="flex-1 space-y-6">
              <div>
                <label className="block text-lg font-semibold mb-2">
                  Skill Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter Skill Name"
                  className={`w-full h-12 rounded-xl border px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-lg font-semibold mb-2">
                  Skill Image
                </label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleChange}
                  className={`w-full h-12 rounded-xl border px-3 py-2 focus:outline-none ${
                    errors.image ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.image && (
                  <p className="text-red-500 text-sm mt-1">{errors.image}</p>
                )}
              </div>
            </div>

            {/* RIGHT SIDE - Live Preview Card */}
            <div className="w-full lg:w-72 flex flex-col items-center">
              <h3 className="text-center font-semibold text-gray-700 mb-4">
                Live Preview
              </h3>

              <div className="w-64 rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-lg">
                <div className="h-44 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      className="w-full h-full object-cover"
                      alt="Preview"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                      <p>No Image</p>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h2 className="font-bold text-lg text-center truncate">
                    {formData.name || "Skill Name"}
                  </h2>
                  <p className="text-center text-gray-500 text-sm mt-1">
                    Skill Preview
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Form Actions (Buttons) */}
          <div className="flex justify-end gap-4 mt-10 border-t pt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 transition duration-200"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition duration-200 disabled:bg-blue-400"
            >
              <Save className="w-4 h-4" />
              {submitting ? "Saving..." : "Save Skill"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddSkill;