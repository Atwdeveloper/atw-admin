"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import {
  Globe,
  Mail,
  Link,
  Save,
  Upload,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  XCircle,
} from "lucide-react";
import { useAdminSiteSettings } from "../../adminhooks/useAdminSiteSettings";
import { useAuth } from "../../../../common/hooks/useAuth";
import Swal from "sweetalert2";
import Loader from "../../../../common/components/Loader";

export default function SiteSettings() {
  const { formData, setFormData, loading, saving, error, saveSettings } =
    useAdminSiteSettings();
  const { refreshSettings } = useAuth();
  const [formErrors, setFormErrors] = useState({});

  const socialIcons = {
    facebook_url: Facebook,
    twitter_url: Twitter,
    instagram_url: Instagram,
    linkedin_url: Linkedin,
    youtube_url: Youtube,
  };

  if (loading || !formData) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          {/* <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order data...</p> */}
          <Loader />
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSocialChange = (platform, value) => {
    setFormData((prev) => ({
      ...prev,
      [platform]: value,
    }));

    // Clear social link error when user starts typing
    if (formErrors[platform]) {
      setFormErrors((prev) => ({ ...prev, [platform]: "" }));
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/svg+xml",
      ];
      if (!validTypes.includes(file.type)) {
        setFormErrors((prev) => ({
          ...prev,
          logo: "Please upload a valid image (JPEG, PNG, GIF, SVG)",
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors((prev) => ({
          ...prev,
          logo: "Image size should be less than 5MB",
        }));
        return;
      }

      setFormData((prev) => ({ ...prev, logo: file }));
      setFormErrors((prev) => ({ ...prev, logo: "" }));
    }
  };

  const validateForm = () => {
    let errors = {};
    let isValid = true;

    // Site Name Validation
    if (!formData.app_name?.trim()) {
      errors.app_name = "Site name is required";
      isValid = false;
    } else if (formData.app_name.trim().length < 3) {
      errors.app_name = "Site name must be at least 3 characters";
      isValid = false;
    }

    // Site Description Validation
    if (!formData.app_tagline?.trim()) {
      errors.app_tagline = "Site description is required";
      isValid = false;
    } else if (formData.app_tagline.trim().length < 10) {
      errors.app_tagline = "Description should be minimum 10 characters";
      isValid = false;
    } else if (formData.app_tagline.trim().length > 200) {
      errors.app_tagline = "Description should not exceed 200 characters";
      isValid = false;
    }

    // Email Validation
    if (!formData.support_email?.trim()) {
      errors.support_email = "Email is required";
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(formData.support_email)) {
      errors.support_email = "Enter a valid email address";
      isValid = false;
    }

    // Phone Validation
    if (!formData.support_phone?.trim()) {
      errors.support_phone = "Phone number is required";
      isValid = false;
    } else if (
      !/^[\+]?[1-9][\d]{0,15}$/.test(
        formData.support_phone.replace(/[\s\-\(\)]/g, ""),
      )
    ) {
      errors.support_phone = "Enter a valid phone number";
      isValid = false;
    }

    // Address Validation
    if (!formData.office_address?.trim()) {
      errors.office_address = "Contact address is required";
      isValid = false;
    } else if (formData.office_address.trim().length < 10) {
      errors.office_address = "Address should be at least 10 characters";
      isValid = false;
    }

    // Social Links Validation
    const socialPlatforms = [
      "facebook_url",
      "twitter_url",
      "instagram_url",
      "linkedin_url",
      "youtube_url",
    ];

    socialPlatforms.forEach((platform) => {
      const url = formData[platform];

      if (url && url.trim().length > 0) {
        // Allows: http(s)://, www., domain, and paths
        const urlRegex =
          /^(https?:\/\/)?(www\.)?[\w\-]+(\.[a-zA-Z]{2,63})+(\/[\w\-./?%&=]*)?$/;

        if (!urlRegex.test(url)) {
          errors[platform] = `Enter a valid ${platform.replace(
            "_url",
            "",
          )} URL`;
          isValid = false;
        }
      }
    });

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fix the highlighted fields before saving.",
        background: "#ffffff",
        color: "#333333",
      });
      return;
    }

    try {
      // Prepare the data to send
      const dataToSave = {
        // Basic info
        app_name: formData.app_name || "",
        app_tagline: formData.app_tagline || "",

        // Contact info
        support_email: formData.support_email || "",
        support_phone: formData.support_phone || "",
        office_address: formData.office_address || "",

        // Logo - only include if it's a new File object
        logo: formData.logo instanceof File ? formData.logo : undefined,
        ivr_number: formData.ivr_number || "",
        // Social media
        facebook_url: formData.facebook_url || "",
        twitter_url: formData.twitter_url || "",
        instagram_url: formData.instagram_url || "",
        linkedin_url: formData.linkedin_url || "",
        youtube_url: formData.youtube_url || "",

        // Additional settings
        copyright_text: formData.copyright_text || "",
        whatsapp_number: formData.whatsapp_number || "",
        gst_rate: formData.gst_rate || "",
        pf_rate: formData.pf_rate || "",
        esic_rate: formData.esic_rate || "",
        min_withdraw_amount: formData.min_withdraw_amount || "",
        payment_gateway: formData.payment_gateway || "",
        sms_provider: formData.sms_provider || "",
        whatsapp_provider: formData.whatsapp_provider || "",
        ivr_provider: formData.ivr_provider || "",
      };

      const result = await saveSettings(dataToSave);

      if (result && result.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: result.data?.message || "Site settings updated successfully!",
          timer: 3000,
          showConfirmButton: false,
          background: "#ffffff",
          color: "#333333",
        });

        // Re-fetch settings (site_logo_url etc.) so the navbar and anywhere
        // else that reads them update immediately, without a full reload.
        refreshSettings();
      } else {
        throw new Error(
          "Save operation completed but no success response received",
        );
      }
    } catch (err) {
      console.error("Submit error:", err);

      let errorMessage = "Failed to save site settings. Please try again.";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message && err.message !== "Failed to update settings") {
        errorMessage = err.message;
      } else if (error) {
        errorMessage = error;
      }

      Swal.fire({
        icon: "error",
        title: "Save Failed",
        html: `
          <div class="text-left">
            <p class="mb-2">${errorMessage}</p>
            <p class="text-sm text-gray-600">Please check your inputs and try again.</p>
          </div>
        `,
        background: "#ffffff",
        color: "#333333",
        confirmButtonText: "OK",
        confirmButtonColor: "#3085d6",
      });
    }
  };

  const handleCancel = () => {
    Swal.fire({
      title: "Discard Changes?",
      text: "Are you sure you want to discard all changes?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, discard changes",
      cancelButtonText: "Cancel",
      background: "#ffffff",
      color: "#333333",
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.reload();
      }
    });
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="px-6 py-6 md:px-8"
    >
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8">
        Site Settings
      </h1>

      {/* {error && !saving && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
        >
          <p className="text-red-600 text-sm">{error}</p>
        </motion.div>
      )} */}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* ... (rest of your form JSX remains exactly the same) ... */}
        {/* GENERAL SETTINGS */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-md border p-6"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" />
            General Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Site Name */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Site Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="app_name"
                value={formData.app_name || ""}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 outline-none transition-colors ${
                  formErrors.app_name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter site name"
              />
              {formErrors.app_name && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <XCircle size={14} />
                  {formErrors.app_name}
                </p>
              )}
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Site Logo
              </label>
              <div className="flex items-center gap-3">
                {formData.logo ? (
                  <img
                    src={URL.createObjectURL(formData.logo)}
                    alt="Preview"
                    className="w-14 h-14 rounded-md border object-contain p-1"
                  />
                ) : formData.site_logo_url ? (
                  <img
                    src={formData.site_logo_url}
                    alt="Site Logo"
                    className="w-14 h-14 rounded-md border object-contain p-1"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-md border bg-slate-100 flex items-center justify-center text-gray-400">
                    <Upload size={20} />
                  </div>
                )}
                <label className="cursor-pointer flex items-center gap-2 bg-slate-50 border border-gray-300 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors">
                  <Upload size={16} />
                  Upload Logo
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                </label>
              </div>
              {formErrors.logo && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <XCircle size={14} />
                  {formErrors.logo}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Supported formats: JPEG, PNG, GIF, SVG | Max size: 5MB
              </p>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Site Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                name="app_tagline"
                value={formData.app_tagline || ""}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 outline-none transition-colors ${
                  formErrors.app_tagline ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter site description"
              ></textarea>
              {formErrors.app_tagline && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <XCircle size={14} />
                  {formErrors.app_tagline}
                </p>
              )}
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Description length</span>
                <span
                  className={
                    formData.app_tagline?.length > 200 ? "text-red-500" : ""
                  }
                >
                  {formData.app_tagline?.length || 0}/200
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CONTACT INFORMATION */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-md border p-6"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-500" />
            Contact Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Contact Email <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="support_email"
                value={formData.support_email || ""}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 outline-none transition-colors ${
                  formErrors.support_email
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Enter contact email"
              />
              {formErrors.support_email && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <XCircle size={14} />
                  {formErrors.support_email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="support_phone"
                maxLength={13}
                value={formData.support_phone || ""}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 outline-none transition-colors ${
                  formErrors.support_phone
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Enter contact phone"
              />
              {formErrors.support_phone && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <XCircle size={14} />
                  {formErrors.support_phone}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                WhatsApp Number
              </label>
              <input
                type="text"
                name="whatsapp_number"
                value={formData.whatsapp_number || ""}
                onChange={handleInputChange}
                maxLength={13}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-400 outline-none transition-colors ${
                  formErrors.whatsapp_number
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Enter WhatsApp number"
              />
              {formErrors.whatsapp_number && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <XCircle size={14} />
                  {formErrors.whatsapp_number}
                </p>
              )}
            </div>

            {/* IVR Number */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                IVR Number
              </label>
              <input
                type="text"
                name="ivr_number"
                value={formData.ivr_number || ""}
                onChange={handleInputChange}
                maxLength={13}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-purple-400 outline-none transition-colors ${
                  formErrors.ivr_number ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter IVR number"
              />
              {formErrors.ivr_number && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <XCircle size={14} />
                  {formErrors.ivr_number}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Contact Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="office_address"
                value={formData.office_address || ""}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 outline-none transition-colors ${
                  formErrors.office_address
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Enter office address"
              />
              {formErrors.office_address && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <XCircle size={14} />
                  {formErrors.office_address}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* SOCIAL LINKS */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-md border p-6"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Link className="w-5 h-5 text-blue-500" />
            Social Media Links
          </h2>

          <div className="space-y-4">
            {Object.entries(socialIcons).map(([platform, Icon]) => (
              <div
                key={platform}
                className="flex flex-col gap-2 border-b pb-4 last:border-b-0"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center">
                    <Icon size={18} className="text-gray-600" />
                  </div>
                  <input
                    type="text"
                    name={platform}
                    value={formData[platform] || ""}
                    onChange={(e) =>
                      handleSocialChange(platform, e.target.value)
                    }
                    className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 outline-none transition-colors ${
                      formErrors[platform]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder={`Enter ${platform.replace("_url", "")} URL`}
                  />
                </div>
                {formErrors[platform] && (
                  <p className="text-red-500 text-sm ml-12 flex items-center gap-1">
                    <XCircle size={14} />
                    {formErrors[platform]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* BUTTONS */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row justify-end gap-4 pt-6"
        >
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors min-w-[160px]"
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </div>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </motion.div>
      </form>
    </motion.div>
  );
}
