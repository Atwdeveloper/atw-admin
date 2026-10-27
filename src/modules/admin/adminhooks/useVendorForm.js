"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  getStatesAPI,
  getCitiesByStateAPI,
  getVendorById,
  createVendor,
  updateVendor,
} from "../../../api/admin/adminVendorAPI";

export const useVendorForm = (mode = "create", vendorId = null) => {
  // Form states
  const [formData, setFormData] = useState({
    // Basic Details
    name: "",
    email: "",
    phone: "",
    address: "",

    // Location Details
    state: "",
    state_id: "",
    city: "",
    city_id: "",
    location: "",
  });

  // UI and API states
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(mode === "edit");
  const [initialData, setInitialData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown states
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);

  // Initialize form data
  useEffect(() => {
    const initializeForm = async () => {
      try {
        // Fetch states for dropdown
        await fetchStates();

        // If edit mode, fetch vendor data
        if (mode === "edit" && vendorId) {
          await fetchVendorData(vendorId);
        }
      } catch (error) {
        console.error("Error initializing form:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load form data. Please refresh the page.",
        });
      } finally {
        setFormLoading(false);
      }
    };

    initializeForm();
  }, [mode, vendorId]);

  // ==================== API FUNCTIONS ====================

  // Fetch states from API
  const fetchStates = async () => {
    try {
      const response = await getStatesAPI();
      const statesData = response.data?.data || response.data || [];
      setStates(statesData);
      setFilteredStates(statesData);
    } catch (error) {
      console.error("Error fetching states:", error);
      // Optional: Set fallback states
      // setStates(fallbackStates);
    }
  };

  // Fetch vendor data for edit mode
  const fetchVendorData = async (id) => {
    try {
      setFormLoading(true);
      const response = await getVendorById(id);
      const vendorData = response.data || {};

      setInitialData(vendorData);

      // Populate form with existing data
      setFormData((prev) => ({
        ...prev,
        name: vendorData.name || "",
        email: vendorData.email || "",
        phone: vendorData.phone || "",
        address: vendorData.address || "",
        state: vendorData.state || "",
        state_id: vendorData.state_id || "",
        city: vendorData.city || "",
        city_id: vendorData.city_id || "",
        location: vendorData.location || "",
      }));

      // If state_id exists, fetch cities for that state
      if (vendorData.state_id) {
        await fetchCitiesByState(vendorData.state_id);
      }
    } catch (error) {
      console.error("Error fetching vendor data:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load vendor details.",
      });
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  // Fetch cities based on state
  const fetchCitiesByState = async (stateId) => {
    if (!stateId) {
      setCities([]);
      setFilteredCities([]);
      return;
    }

    try {
      setLoadingCities(true);
      const response = await getCitiesByStateAPI(stateId);
      const citiesData = response.data?.data || response.data || [];
      setCities(citiesData);
      setFilteredCities(citiesData);
    } catch (error) {
      console.error("Error fetching cities:", error);
      setCities([]);
      setFilteredCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  // ==================== FORM HANDLING ====================

  // Update form data
  const updateFormData = (updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // Handle field change
  const handleFieldChange = (field, value) => {
    if (isSubmitting) return;

    updateFormData({ [field]: value });

    // Clear error for this field if it exists
    if (errors[field]) {
      clearError(field);
    }
  };

  // Handle state selection
  const handleStateSelect = async (state) => {
    if (isSubmitting) return;

    updateFormData({
      state: state.name,
      state_id: state.id,
      city: "",
      city_id: "",
      location: state.name,
    });

    clearError("state_id");
    clearError("city_id");

    // Fetch cities for the selected state
    await fetchCitiesByState(state.id);

    // Update location field
    updateLocationField(state.name, "");
  };

  // Handle state search
  const handleStateSearch = (value) => {
    if (isSubmitting) return;

    updateFormData({
      state: value,
      state_id: "",
      city: "",
      city_id: "",
      location: value,
    });

    filterStates(value);
  };

  // Handle city selection
  const handleCitySelect = (city) => {
    if (isSubmitting) return;

    updateFormData({
      city: city.name,
      city_id: city.id,
      location: `${city.name}, ${formData.state}`,
    });

    clearError("city_id");

    // Update location field
    updateLocationField(formData.state, city.name);
  };

  // Handle city search
  const handleCitySearch = (value) => {
    if (isSubmitting) return;

    updateFormData({
      city: value,
      city_id: "",
      location: value ? `${value}, ${formData.state}` : formData.state,
    });

    filterCities(value);
  };

  // Update location field
  const updateLocationField = (stateName, cityName) => {
    if (stateName && cityName) {
      updateFormData({
        location: `${cityName}, ${stateName}`,
      });
    } else if (stateName) {
      updateFormData({
        location: stateName,
      });
    }
  };

  // ==================== VALIDATION ====================

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.name.trim()) {
      newErrors.name = "Vendor name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Vendor name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (
      formData.phone &&
      !/^[\d\s\-\+\(\)]{10,}$/.test(formData.phone.replace(/\s/g, ""))
    ) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    // State validation
    if (!formData.state_id) {
      newErrors.state_id = "State is required";
    }

    // City validation
    if (!formData.city_id) {
      newErrors.city_id = "City is required";
    }

    return newErrors;
  };

  // Clear specific error
  const clearError = (fieldName) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  // Clear all errors
  const clearAllErrors = () => {
    setErrors({});
  };

  // ==================== FORM SUBMISSION ====================

  // Submit form
  const handleSubmit = async () => {
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return { success: false, errors: validationErrors };
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      // Prepare data for API
      const vendorData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        state_id: formData.state_id,
        city_id: formData.city_id,
        location: formData.location,
      };

      let response;
      if (mode === "edit" && vendorId) {
        response = await updateVendor(vendorId, vendorData);
      } else {
        response = await createVendor(vendorData);
      }

      Swal.fire({
        icon: "success",
        title: `${mode === "edit" ? "Updated!" : "Created!"}`,
        text: `Vendor has been ${mode === "edit" ? "updated" : "created"} successfully.`,
        timer: 2000,
        showConfirmButton: false,
      });

      return response;
    } catch (error) {
      console.error(
        `Error ${mode === "edit" ? "updating" : "creating"} vendor:`,
        error,
      );

      // Handle API validation errors
      if (error.response?.data?.errors) {
        const apiErrors = error.response.data.errors;
        setErrors(apiErrors);

        Swal.fire({
          icon: "error",
          title: "Validation Error",
          text:
            error.response?.data?.message ||
            "Please check the form for errors.",
          timer: 3000,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            error.response?.data?.message ||
            `Failed to ${mode === "edit" ? "update" : "create"} vendor.`,
          timer: 3000,
        });
      }

      return {
        success: false,
        error:
          error.response?.data?.message ||
          `Failed to ${mode === "edit" ? "update" : "create"} vendor.`,
      };
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  // ==================== DROPDOWN FILTERING ====================

  // Filter states based on search
  const filterStates = (searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredStates(states);
    } else {
      const filtered = states.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredStates(filtered);
    }
  };

  // Filter cities based on search
  const filterCities = (searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredCities(cities);
    } else {
      const filtered = cities.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredCities(filtered);
    }
  };

  // ==================== HELPER FUNCTIONS ====================

  // Reset form to initial values
  const resetForm = () => {
    if (mode === "edit" && initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        state: "",
        state_id: "",
        city: "",
        city_id: "",
        location: "",
      });
    }
    clearAllErrors();
  };

  // Check if form is dirty
  const isFormDirty = () => {
    if (mode === "create") {
      const defaultEmptyValues = {
        name: "",
        email: "",
        phone: "",
        address: "",
        state: "",
        state_id: "",
        city: "",
        city_id: "",
        location: "",
      };
      return JSON.stringify(formData) !== JSON.stringify(defaultEmptyValues);
    } else {
      return JSON.stringify(formData) !== JSON.stringify(initialData);
    }
  };

  // ==================== RETURN VALUES ====================

  return {
    // Form State
    formData,
    errors,
    loading,
    formLoading,
    isSubmitting,
    initialData,

    // Dropdown Data
    states,
    cities,
    filteredStates,
    filteredCities,
    loadingCities,

    // Form Actions
    handleFieldChange,
    handleSubmit,
    resetForm,
    validateForm,

    // State/City Actions
    handleStateSelect,
    handleStateSearch,
    handleCitySelect,
    handleCitySearch,
    fetchCitiesByState,

    // Dropdown Filtering
    filterStates,
    filterCities,

    // Error Handling
    clearError,
    clearAllErrors,
    updateFormData,
    updateErrors: setErrors,

    // Utilities
    isFormDirty: isFormDirty(),
    updateLocationField,
    mode,
  };
};
