"use client";

import { useState, useEffect } from "react";
import {
  getSiteSettingsAPI,
  updateSiteSettingsAPI,
} from "../../../api/admin/adminSiteSettingsAPI";

export const useAdminSiteSettings = () => {
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getSiteSettingsAPI();

      if (response.status === 200) {
        setFormData(response.data);
      } else {
        throw new Error(`Server returned status: ${response.status}`);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to load site settings";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (dataToSave) => {
    if (!dataToSave) {
      throw new Error("No data provided to save");
    }

    setSaving(true);
    setError("");

    try {
      const form = new FormData();

      // Define all possible fields
      const fields = [
        "app_name",
        "app_tagline",
        "support_email",
        "support_phone",
        "office_address",
        "copyright_text",
        "whatsapp_number",
        "gst_rate",
        "pf_rate",
        "esic_rate",
        "min_withdraw_amount",
        "payment_gateway",
        "ivr_number",
        "sms_provider",
        "whatsapp_provider",
        "ivr_provider",
        "facebook_url",
        "twitter_url",
        "instagram_url",
        "linkedin_url",
        "youtube_url",
      ];

      // Append only non-empty fields
      fields.forEach((field) => {
        const value = dataToSave[field];

        // Check if value exists and is not empty
        if (value !== undefined && value !== null && value !== "") {
          form.append(field, value);
        }
      });

      // Append logo only if it's a new File object
      if (dataToSave.logo instanceof File) {
        form.append("site_logo", dataToSave.logo);
      }

      // Debug: Log all form data entries

      let hasEntries = false;
      for (let [key, value] of form.entries()) {
        hasEntries = true;
        if (value instanceof File) {
        }
      }

      if (!hasEntries) {
        throw new Error("No valid data to save");
      }

      const response = await updateSiteSettingsAPI(form);

      if (response.status === 200) {
        return response;
      } else {
        throw new Error(`Server returned status: ${response.status}`);
      }
    } catch (err) {
      console.error("Save error details:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to update settings";
      setError(errorMessage);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    formData,
    setFormData,
    loading,
    saving,
    error,
    saveSettings,
  };
};
