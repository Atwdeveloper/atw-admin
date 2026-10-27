"use client";

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
  getIndustryByIdAPI,
  updateIndustryAPI,
} from "../../../../api/admin/adminIndustryAPI";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import Loader from "../../../../common/components/Loader";
import Breadcrumb from "../../../../common/components/Breadcrumb";

const EditIndustry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const [formData, setFormData] = useState({
    name: "",
    // code: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchIndustry = async () => {
      try {
        setLoading(true);
        const response = await getIndustryByIdAPI(id);
        const industry = response.data; // adjust according to actual response structure
        setFormData({
          name: industry.name,
          // code: industry.code,
          image: null,
        });

        const currentImage = industry.image_url || industry.image || null;
        if (currentImage) {
          setExistingImage(currentImage);
          setImagePreview(currentImage);
        }
      } catch (error) {
        console.error("Error fetching industry:", error);
        Swal.fire({
          icon: "error",
          title: "Failed to load industry",
          text: error.response?.data?.message || "Something went wrong",
        });
        navigate("/admin/industries");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchIndustry();
  }, [id, navigate]);

  // const handleChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({ ...prev, [name]: value }));
  // };

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
      if (value && !/^[a-zA-Z0-9\s]+$/.test(value)) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, code } = formData;
    if (!name.trim()) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Industry name is required",
      });
      return;
    }
    // if (!code.trim()) {
    //   Swal.fire({
    //     icon: "error",
    //     title: "Validation Error",
    //     text: "Industry code is required",
    //   });
    //   return;
    // }
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      if (formData.image) {
        payload.append("image", formData.image);
      }
      await updateIndustryAPI(id, payload);
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Industry updated successfully",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/admin/industries");
    } catch (error) {
      console.error("Error updating industry:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to update industry",
        text: error.response?.data?.message || "Something went wrong",
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

  if (!hasPermission("industry", "edit")) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to edit industries.
          </p>
          <button
            onClick={() => navigate("/admin/industries")}
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
            { label: "Industries", path: "/admin/industries" },
            { label: formData.name || "Industry" },
          ]}
        />
      </motion.div>
      <motion.div className="" variants={itemVariants}>
        <div className="flex items-center gap-4 mb-6">
          {/* <button
            onClick={() => navigate("/admin/industries")}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button> */}
          <h1 className="text-2xl font-bold text-gray-800">Edit Industry</h1>
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
              Industry Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter industry name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Industry Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Enter industry code"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div> */}

          <div>
            <label
              htmlFor="image"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Industry Image
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    className="w-full h-full object-cover"
                    alt="Industry preview"
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

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/industries")}
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
                  Update Industry
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EditIndustry;
