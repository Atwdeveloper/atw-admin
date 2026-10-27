"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  getAgentAPI,
  createAgentAPI,
  updateAgentAPI,
  getStatesAPI,
  getCitiesByStateAPI,
} from "../../../api/admin/adminAgentAPI";

export const useAgentForm = (mode = "create", agentId = null) => {
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [initialData, setInitialData] = useState(null);

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [currentCities, setCurrentCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "",
    date_of_birth: "",
    date_of_joining: "",
    father_name: "",
    work_location: "",
    work_experience: "",
    pan_number: "",
    aadhar_number: "",
    agent_location: "",
    state_id: "",
    city_id: "",
    zip: "",
    current_state_id: "",
    current_state: "",
    current_city_id: "",
    current_city: "",
    payment_method: "bank",
    account_holder_name: "",
    account_number: "",
    confirm_account_number: "",
    ifsc_code: "",
    account_type: "",
    dress_size: "",
    status: 1,
    agent_charge: "",
    agent_charge_type: "",
    worker_charge: "",
    worker_charge_type: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const initializeForm = async () => {
      try {
        setFormLoading(true);
        await fetchDropdownData();
        if (mode === "edit" && agentId) await fetchAgentData();
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load form data.",
        });
      } finally {
        setFormLoading(false);
      }
    };
    initializeForm();
  }, [mode, agentId]);

  const fetchDropdownData = async () => {
    try {
      const [statesRes] = await Promise.all([getStatesAPI()]);

      setStates(statesRes.data.data || []);
    } catch (error) {
      console.error("Error fetching dropdowns:", error);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };

  const fetchAgentData = async () => {
    try {
      const response = await getAgentAPI(agentId);
      const agent = response.data.data;
      setInitialData(agent);
      setFormData({
        first_name: agent.first_name || "",
        middle_name: agent.middle_name || "",
        last_name: agent.last_name || "",
        email: agent.email || "",
        phone: agent.phone || "",
        gender: agent.gender || "",
        date_of_birth: formatDateForInput(agent.date_of_birth),
        date_of_joining: formatDateForInput(agent.date_of_joining),
        father_name: agent.father_name || "",
        work_location: agent.work_location || "",
        work_experience: agent.work_experience || "",
        pan_number: agent.pan_number || "",
        aadhar_number: agent.aadhar_number || "",
        agent_location: agent.agent_location || "",
        zip: agent.zip || "",
        state_id: agent.state_id || "",
        state: agent.state_name || "",

        city_id: agent.city_id || "",
        city: agent.city_name || "",

        current_state_id: agent.current_state_id || "",
        current_state: agent.current_state_name || "",

        current_city_id: agent.current_city_id || "",
        current_city: agent.current_city_name || "",
        payment_method: agent.payment_method || "bank",
        account_holder_name: agent.account_holder_name || "",
        account_number: agent.account_number || "",
        confirm_account_number: agent.account_number || "",
        ifsc_code: agent.ifsc_code || "",
        account_type: agent.account_type || "",
        dress_size: agent.dress_size || "",
        agent_charge: agent.agent_charge || "",
        agent_charge_type: agent.agent_charge_type || "",
        worker_charge: agent.worker_charge || "",
        worker_charge_type: agent.worker_charge_type || "",
        status: agent.status === 1 ? 1 : 0,
      });
      if (agent.state_id)
        await fetchCitiesByState(agent.state_id, "residential");
      if (agent.current_state_id)
        await fetchCitiesByState(agent.current_state_id, "current");
    } catch (error) {
      console.error("Error fetching agent:", error);
      throw error;
    }
  };

  const fetchCitiesByState = async (stateId, type = "residential") => {
    if (!stateId) {
      if (type === "residential") setCities([]);
      else setCurrentCities([]);
      return;
    }
    try {
      setLoadingCities(true);
      const response = await getCitiesByStateAPI(stateId);
      const citiesData = response.data.data || [];
      if (type === "residential") setCities(citiesData);
      else setCurrentCities(citiesData);
    } catch (error) {
      console.error(error);
      if (type === "residential") setCities([]);
      else setCurrentCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  // Handlers
  const handleStateChange = async (stateId, stateName) => {
    setFormData((prev) => ({
      ...prev,
      state_id: stateId,
      state: stateName,
      city_id: "",
      city: "",
    }));
    await fetchCitiesByState(stateId, "residential");
  };

  const handleCityChange = (cityId, cityName) => {
    setFormData((prev) => ({ ...prev, city_id: cityId, city: cityName }));
  };

  const handleCurrentStateChange = async (stateId, stateName) => {
    setFormData((prev) => ({
      ...prev,
      current_state_id: stateId,
      current_state: stateName,
      current_city_id: "",
      current_city: "",
    }));
    await fetchCitiesByState(stateId, "current");
  };

  const handleCurrentCityChange = (cityId, cityName) => {
    setFormData((prev) => ({
      ...prev,
      current_city_id: cityId,
      current_city: cityName,
    }));
  };

  const validateForm = (data) => {
    const newErrors = {};
    if (!data.first_name?.trim())
      newErrors.first_name = "First name is required";
    if (!data.last_name?.trim()) newErrors.last_name = "Last name is required";
    if (!data.email?.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(data.email))
      newErrors.email = "Invalid email";
    if (!data.phone?.trim()) newErrors.phone = "Phone is required";
    else if (!/^[6-9]\d{9}$/.test(data.phone.replace(/\D/g, "")))
      newErrors.phone = "Phone must be 10 digits starting with 6-9";
    if (!data.state_id) newErrors.state_id = "State is required";
    if (!data.city_id) newErrors.city_id = "City is required";
    if (data.payment_method === "bank") {
      if (!data.account_number)
        newErrors.account_number = "Account number is required";
      if (data.account_number !== data.confirm_account_number)
        newErrors.confirm_account_number = "Account numbers do not match";
      if (!data.ifsc_code) {
        newErrors.ifsc_code = "IFSC code is required";
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.ifsc_code)) {
        newErrors.ifsc_code = "IFSC must be in format like SBIN0001234";
      }
      if (!data.account_type)
        newErrors.account_type = "Account type is required";
    }
    if (data.agent_charge && isNaN(data.agent_charge))
      newErrors.agent_charge = "Agent charge must be number";
    if (data.worker_charge && isNaN(data.worker_charge))
      newErrors.worker_charge = "Worker charge must be number";
    if (
      data.aadhar_number &&
      data.aadhar_number.replace(/\D/g, "").length !== 12
    )
      newErrors.aadhar_number = "Aadhaar must be 12 digits";
    if (data.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(data.pan_number))
      newErrors.pan_number = "Invalid PAN format";
    return newErrors;
  };

  const handleSubmit = async (formDataToSubmit) => {
    const validationErrors = validateForm(formDataToSubmit);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErrorField = Object.keys(validationErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element)
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      throw new Error("Validation failed");
    }

    setErrors({});

    try {
      setLoading(true);
      const apiData = {
        ...formDataToSubmit,
        phone: formDataToSubmit.phone.replace(/\D/g, ""),
        aadhar_number: formDataToSubmit.aadhar_number?.replace(/\D/g, ""),
        status: formDataToSubmit.status,
      };
      let response;
      if (mode === "edit") {
        response = await updateAgentAPI(agentId, apiData);
      } else {
        response = await createAgentAPI(apiData);
      }
      setInitialData(response.data.data);
      setFormData((prev) => ({ ...prev, ...response.data.data }));
      return response.data;
    } catch (error) {
      if (error.response?.data?.errors) {
        const apiErrors = error.response.data.errors;
        const formatted = {};
        Object.keys(apiErrors).forEach((key) => {
          formatted[key] = Array.isArray(apiErrors[key])
            ? apiErrors[key][0]
            : apiErrors[key];
        });
        setErrors(formatted);
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          html: Object.values(formatted)
            .map((err) => `<div>• ${err}</div>`)
            .join(""),
        });
      } else if (error.message !== "Validation failed") {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error?.message || "Something went wrong",
        });
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (updates) =>
    setFormData((prev) => ({ ...prev, ...updates }));
  const clearError = (field) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  return {
    loading,
    formLoading,
    initialData,
    formData,
    errors,
    states,
    cities,
    currentCities,
    loadingCities,
    handleStateChange,
    handleCityChange,
    handleCurrentStateChange,
    handleCurrentCityChange,
    handleSubmit,
    validateForm,
    updateFormData,
    clearError,
  };
};
