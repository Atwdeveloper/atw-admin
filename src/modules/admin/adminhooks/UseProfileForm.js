"use client";

import { useState, useEffect } from "react";
import {
  getProfileAPI,
  updateProfileAPI,
  getStatesAPI,
  getCitiesAPI,
} from "../../../api/admin/adminProfileAPI";
import Swal from "sweetalert2";

export const useProfileForm = () => {
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [initialData, setInitialData] = useState({});
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Initial form state (no username, no bank, no UAN/PF/ESIC)
  const initialFormState = {
    name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "male",
    address: "",
    state: "",
    state_id: "",
    city: "",
    city_id: "",
    pincode: "",
    aadhar_number: "",
    pan_number: "",
  };

  useEffect(() => {
    const initializeData = async () => {
      setFormLoading(true);
      try {
        // 1. Fetch profile
        let profileData = {};
        try {
          const profileResponse = await getProfileAPI();
          if (profileResponse?.data?.status === 200) {
            profileData = profileResponse.data.data || {};
          } else {
            throw new Error("Profile API failed");
          }
        } catch (profileError) {
          console.error("Error fetching profile:", profileError);
          Swal.fire({
            title: "Error!",
            text: "Failed to load profile data. Please try again.",
            icon: "error",
            confirmButtonText: "OK",
          });
          setFormLoading(false);
          return;
        }

        // 2. Fetch states (no dummy fallback)
        let statesData = [];
        try {
          const statesRes = await getStatesAPI();
          if (
            statesRes?.data?.status === 200 &&
            Array.isArray(statesRes.data.data)
          ) {
            statesData = statesRes.data.data;
          } else {
            throw new Error("Invalid states response");
          }
        } catch (statesError) {
          console.error("Failed to fetch states:", statesError);
          Swal.fire({
            title: "Warning",
            text: "Could not load states. Please refresh the page.",
            icon: "warning",
            confirmButtonText: "OK",
          });
        }
        setStates(statesData);

        // 3. Populate form
        const formattedData = {
          ...initialFormState,
          ...profileData,
          state: profileData.state || "",
          state_id: profileData.state_id || "",
          city: profileData.city || "",
          city_id: profileData.city_id || "",
        };
        setFormData(formattedData);
        setInitialData(formattedData);

        // 4. Fetch cities if state is preselected
        if (profileData.state_id) {
          await fetchCitiesByState(profileData.state_id);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        Swal.fire({
          title: "Error",
          text: "An unexpected error occurred.",
          icon: "error",
          confirmButtonText: "OK",
        });
      } finally {
        setFormLoading(false);
      }
    };

    initializeData();
  }, []);

  const updateFormData = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const updateErrors = (errorData) => {
    setErrors((prev) => ({ ...prev, ...errorData }));
  };

  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const fetchCitiesByState = async (stateId) => {
    if (!stateId) {
      setCities([]);
      return;
    }
    setLoadingCities(true);
    try {
      const response = await getCitiesAPI(stateId);
      if (response?.data?.status === 200 && Array.isArray(response.data.data)) {
        setCities(response.data.data);
      } else {
        setCities([]);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  // ========== VALIDATIONS ==========
  const validateName = (name) => {
    if (!name?.trim()) return "Name is required";
    return "";
  };

  const validateEmail = (email) => {
    if (!email?.trim()) return "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(email))
      return "Please enter a valid email address";
    if (email.length > 100) return "Email cannot exceed 100 characters";
    return "";
  };

  const validatePhone = (phone) => {
    if (!phone?.trim()) return "Phone number is required";
    if (!/^\d{10}$/.test(phone))
      return "Phone number must be exactly 10 digits";
    if (!/^[6-9]\d{9}$/.test(phone)) return "Phone number must start with 6-9";
    return "";
  };

  const validateDateOfBirth = (dob) => {
    if (!dob) return "";
    const today = new Date();
    const birthDate = new Date(dob);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (birthDate > today) return "Date of birth cannot be in the future";
    if (age < 18 || (age === 18 && monthDiff < 0))
      return "You must be at least 18 years old";
    if (age > 100) return "Please enter a valid date of birth";
    return "";
  };

  const validateAddress = (address) => {
    if (!address?.trim()) return "Address is required";
    if (address.length < 5) return "Address must be at least 5 characters";
    return "";
  };

  const validatePincode = (pincode) => {
    if (!pincode?.toString().trim()) {
      return "Pincode is required";
    }

    if (!/^\d{6}$/.test(pincode)) {
      return "Pincode must be exactly 6 digits";
    }

    return "";
  };
  const validateAadhar = (aadhar) => {
    if (!aadhar) return "";
    if (!/^\d{12}$/.test(aadhar)) return "Aadhar must be exactly 12 digits";
    if (/^(\d)\1{11}$/.test(aadhar))
      return "Aadhar number cannot be all same digits";
    return "";
  };

  const validatePAN = (pan) => {
    if (!pan) return "";
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan))
      return "Invalid PAN format (e.g., ABCDE1234F)";
    return "";
  };

  const validateField = (name, value) => {
    switch (name) {
      case "name":
        return validateName(value);
      case "email":
        return validateEmail(value);
      case "phone":
        return validatePhone(value);
      case "date_of_birth":
        return validateDateOfBirth(value);
      case "address":
        return validateAddress(value);
      case "pincode":
        return validatePincode(value);
      case "aadhar_number":
        return validateAadhar(value);
      case "pan_number":
        return validatePAN(value);
      default:
        return "";
    }
  };

  const validateForm = (data) => {
    const newErrors = {};
    newErrors.name = validateName(data.name);
    newErrors.email = validateEmail(data.email);
    newErrors.phone = validatePhone(data.phone);
    newErrors.date_of_birth = validateDateOfBirth(data.date_of_birth);
    newErrors.address = validateAddress(data.address);
    newErrors.pincode = validatePincode(data.pincode);
    newErrors.aadhar_number = validateAadhar(data.aadhar_number);
    newErrors.pan_number = validatePAN(data.pan_number);

    Object.keys(newErrors).forEach((key) => {
      if (!newErrors[key]) delete newErrors[key];
    });
    return newErrors;
  };

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      const validationErrors = validateForm(data);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        throw new Error("Form validation failed");
      }
      const response = await updateProfileAPI(data);
      return response;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    formLoading,
    initialData,
    formData,
    errors,
    states,
    cities,
    loadingCities,
    fetchCitiesByState,
    handleSubmit,
    validateForm,
    validateField,
    updateFormData,
    updateErrors,
    clearError,
  };
};
