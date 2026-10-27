"use client";

import { useEffect, useState } from "react";
import {
  addCompanyAPI,
  getIndustriesAPI,
  getStatesAPI,
  getCitiesByStateAPI,
  getAgentsListAPI,
  getStaffListAPI,
  verifyGstNumberAdminAPI,
} from "../../../api/admin/adminCompanyAPI";

export const useAddCompany = () => {
  const [formData, setFormData] = useState({
    company_name: "",
    email: "",
    phone: "",
    gst_number: "",
    gst_rate: "",
    agent_code: "",
    staff_code: "",
    pan_number: "",
    tin_number: "",
    industry_id: "",
    work_type: "",
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    service_charge_type: "",
    service_charge: "",
    addresses: [
      {
        address: "",
        city: "",
        city_id: "",
        state: "",
        state_id: "",
        zip: "",
        address_type: "",
      },
    ],
  });

  const [industries, setIndustries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]); // Array for each address
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]); // Array for each address
  const [loadingCities, setLoadingCities] = useState([]); // Array for each address
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [agents, setAgents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  useEffect(() => {
    const initialize = async () => {
      setFormLoading(true);

      await fetchIndustries();
      await fetchStates();
      await fetchAgents();
      await fetchStaff();
      setFormLoading(false);
    };

    initialize();
  }, []);

  // Initialize cities array based on addresses
  useEffect(() => {
    const addressCount = formData.addresses?.length || 1;
    setCities(new Array(addressCount).fill([]));
    setFilteredCities(new Array(addressCount).fill([]));
    setLoadingCities(new Array(addressCount).fill(false));
  }, []);
  const fetchStaff = async () => {
    try {
      const res = await getStaffListAPI();
      setStaffList(res.data || []);
    } catch (error) {
      console.error("Error fetching staff:", error);
      setStaffList([]);
    }
  };
  const fetchAgents = async () => {
    try {
      const res = await getAgentsListAPI();
      setAgents(res.data || []);
    } catch (error) {
      console.error("Error fetching agents:", error);
      setAgents([]);
    }
  };
  const fetchIndustries = async () => {
    const response = await getIndustriesAPI();
    setIndustries(response.data);
  };

  const fetchStates = async () => {
    try {
      const response = await getStatesAPI();
      const statesData = response.data.data || [];
      setStates(statesData);
      setFilteredStates(statesData);
    } catch (error) {
      console.error("Error fetching states:", error);
      setStates([]);
      setFilteredStates([]);
    }
  };

  // Fetch cities by state for specific address index
  const fetchCitiesByState = async (stateId, index = 0) => {
    if (!stateId) {
      const newCities = [...cities];
      newCities[index] = [];
      setCities(newCities);

      const newFilteredCities = [...filteredCities];
      newFilteredCities[index] = [];
      setFilteredCities(newFilteredCities);
      return;
    }

    try {
      const newLoadingCities = [...loadingCities];
      newLoadingCities[index] = true;
      setLoadingCities(newLoadingCities);

      const response = await getCitiesByStateAPI(stateId);
      const citiesData = response.data.data || [];

      const newCities = [...cities];
      newCities[index] = citiesData;
      setCities(newCities);

      const newFilteredCities = [...filteredCities];
      newFilteredCities[index] = citiesData;
      setFilteredCities(newFilteredCities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      const newCities = [...cities];
      newCities[index] = [];
      setCities(newCities);

      const newFilteredCities = [...filteredCities];
      newFilteredCities[index] = [];
      setFilteredCities(newFilteredCities);
    } finally {
      const newLoadingCities = [...loadingCities];
      newLoadingCities[index] = false;
      setLoadingCities(newLoadingCities);
    }
  };

  // Filter states
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

  // Filter cities for specific address index
  const filterCities = (searchTerm, index = 0) => {
    if (!searchTerm.trim()) {
      const newFilteredCities = [...filteredCities];
      newFilteredCities[index] = cities[index] || [];
      setFilteredCities(newFilteredCities);
    } else {
      const filtered = (cities[index] || []).filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      const newFilteredCities = [...filteredCities];
      newFilteredCities[index] = filtered;
      setFilteredCities(newFilteredCities);
    }
  };

  // Update form data
  const updateFormData = (updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // ---------------------------
  //     GST VERIFICATION
  // ---------------------------
  // Looks up the GST number and pre-fills company name / GST / PAN / email /
  // phone / address into the form, mirroring verifyGstNumber in
  // useCompanyRegister.js (company self-registration flow).
  const verifyGstNumber = async (gstin) => {
    try {
      const res = await verifyGstNumberAdminAPI(gstin);

      // /admin/verify-gst returns the GST record directly (no {success, data}
      // envelope) on success — an explicit failure comes back as
      // {success:false, message} or {error}. Treat "looks like a GST record"
      // as success when no explicit success flag is present.
      const data = res?.data && typeof res.data === "object" ? res.data : res;
      const isSuccess =
        res?.success === true ||
        (res?.success === undefined &&
          !res?.error &&
          Boolean(data?.gst_number || data?.company_name));

      if (!isSuccess) {
        return {
          success: false,
          message: res?.message || res?.error || "Could not verify this GST number",
        };
      }

      if (data.resolved_state_id) {
        await fetchCitiesByState(data.resolved_state_id, 0);
      }

      setFormData((prev) => {
        const firstAddress = { ...prev.addresses[0] };

        if (data.full_address || data.business_address) {
          firstAddress.address = data.full_address || data.business_address;
        }
        if (data.pincode) firstAddress.zip = data.pincode;
        if (data.resolved_state_id) {
          firstAddress.state_id = data.resolved_state_id;
          firstAddress.state = data.state || firstAddress.state;
        }
        if (data.resolved_city_id) {
          firstAddress.city_id = data.resolved_city_id;
          firstAddress.city = data.city || firstAddress.city;
        }

        return {
          ...prev,
          company_name: data.company_name || prev.company_name,
          gst_number: data.gst_number || gstin,
          pan_number: data.pan_number || prev.pan_number,
          email: data.email || prev.email,
          phone: data.company_phone || data.phone || prev.phone,
          addresses: [firstAddress, ...prev.addresses.slice(1)],
        };
      });

      setErrors((prev) => {
        const next = { ...prev };
        [
          "company_name",
          "gst_number",
          "pan_number",
          "email",
          "phone",
          "address_0",
          "zip_0",
          "state_0",
          "city_0",
        ].forEach((key) => delete next[key]);
        return next;
      });

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Could not verify this GST number",
      };
    }
  };

  // Clear specific error
  const clearError = (fieldName) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  // ---------------------------
  //   COMMON VALIDATION HELPERS
  // ---------------------------
  const isEmpty = (v) => !v || !v.toString().trim();

  const validatePattern = (value, pattern, message) => {
    if (isEmpty(value)) return message.required;
    if (!pattern.test(value)) return message.invalid;
    return "";
  };

  // Templates
  const messages = {
    email: { required: "Email is required", invalid: "Enter a valid email" },
    phone: {
      required: "Phone number is required",
      invalid: "Must be a valid 10-digit Indian phone number starting with 6–9",
    },
    service_charge: {
      required: "Service charge is required",
      invalid: "Service charge must be a valid number",
    },
  };

  // Patterns
  const patterns = {
    email: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
    phone: /^[6-9]\d{9}$/,
    service_charge: /^\d+(\.\d{1,2})?$/, // Allow numbers with optional decimal
    name: /^[a-zA-Z\s]{2,}$/,
    companyName: /^[a-zA-Z0-9\s&.,-]{2,}$/,
    address: /^[a-zA-Z0-9\s,.-]{5,}$/,
    city: /^[a-zA-Z\s]{2,}$/,
    state: /^[a-zA-Z\s]{2,}$/,
    zip: /^\d{6}$/,
  };

  // ---------------------------
  //       FIELD VALIDATION
  // ---------------------------
  const validateField = (name, value) => {
    switch (name) {
      case "company_name":
        return validatePattern(value, patterns.companyName, {
          required: "Company Name is required",
          invalid: "Invalid Company Name",
        });

      case "email":
      case "owner_email":
        return validatePattern(value, patterns.email, messages.email);

      case "phone":
      case "owner_phone":
        return validatePattern(
          value.replace(/\s/g, ""),
          patterns.phone,
          messages.phone,
        );

      case "service_charge":
        return validatePattern(value, patterns.service_charge, {
          required: "Service charge is required",
          invalid: "Service charge must be a valid number",
        });

      case "owner_name":
        return validatePattern(value, patterns.name, {
          required: "Owner name is required",
          invalid: "Owner name must contain only letters",
        });
      case "staff_code":
        if (isEmpty(value)) return " Relationship Manager is required";
        return "";
      case "service_charge_type":
        if (isEmpty(value)) return "Service charge type is required";
        if (!["fixed", "percentage"].includes(value))
          return "Invalid service charge type";
        return "";
      case "agent_code":
        // if (isEmpty(value)) return "Agent is required";
        return "";
      case "gst_number":
        if (isEmpty(value)) return "GST number is required";

        const gstRegex =
          /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;

        if (!gstRegex.test(value.toUpperCase())) {
          return "Invalid GST number format (e.g. 22ABCDE1234F1Z5)";
        }

        return "";
      case "gst_rate": {
        if (isEmpty(value)) return "";
        const rate = parseFloat(value);
        if (isNaN(rate) || rate < 0 || rate > 100)
          return "GST Rate must be between 0 and 100";
        return "";
      }
      default:
        return "";
    }
  };

  // ---------------------------
  //     ADDRESS VALIDATION
  // ---------------------------
  const validateAddress = (address, index) => {
    const errors = {};

    const addressFields = [
      {
        key: "address",
        pattern: patterns.address,
        message: "Address must be at least 5 characters",
      },
      { key: "city_id", pattern: /^.+$/, message: "City is required" }, // Changed to city_id
      { key: "state_id", pattern: /^.+$/, message: "State is required" }, // Changed to state_id
      { key: "zip", pattern: patterns.zip, message: "ZIP must be 6 digits" },
    ];

    addressFields.forEach(({ key, pattern, message }) => {
      if (!pattern.test(address[key])) {
        errors[`${key.replace("_id", "")}_${index}`] = message; // Remove _id from error key
      }
    });

    return errors;
  };

  // ---------------------------
  //   REAL-TIME FIELD CHECK
  // ---------------------------
  const validateSingleField = (name, value) => {
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  };

  const validateAddressField = (index, field, value) => {
    const updatedAddress = { ...formData.addresses[index], [field]: value };
    const addressErrors = validateAddress(updatedAddress, index);

    setErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach((key) => {
        if (key.includes(`_${index}`)) delete newErrors[key];
      });
      return { ...newErrors, ...addressErrors };
    });
  };

  // ---------------------------
  //     FULL FORM VALIDATION
  // ---------------------------
  const validate = () => {
    let newErrors = {};

    // Validate simple fields
    Object.keys(formData).forEach((key) => {
      if (["addresses"].includes(key)) return;
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });

    // Industry validation
    if (!formData.industry_id.length) {
      newErrors.industry_id = "Select an industry";
    }

    // Service Charge validation
    if (
      formData.service_charge_type === "percentage" &&
      formData.service_charge
    ) {
      const charge = parseFloat(formData.service_charge);
      if (charge < 0 || charge > 100) {
        newErrors.service_charge = "Percentage must be between 0 and 100";
      }
    }

    // Address validation
    formData.addresses.forEach((addr, idx) => {
      Object.assign(newErrors, validateAddress(addr, idx));
    });

    // Cross-field checks
    if (
      formData.email &&
      formData.owner_email &&
      formData.email.toLowerCase() === formData.owner_email.toLowerCase()
    ) {
      newErrors.owner_email =
        "Owner email must be different from company email";
    }
    if (!formData.owner_phone?.trim()) {
      newErrors.owner_phone = "Owner phone is required";
    }
    // if (
    //   formData.phone &&
    //   formData.owner_phone &&
    //   formData.phone.replace(/\s/g, "") ===
    //     formData.owner_phone.replace(/\s/g, "")
    // ) {
    //   newErrors.owner_phone =
    //     "Owner phone must be different from company phone";
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------------------
  //        SUBMIT HANDLER
  // ---------------------------
  const submitCompany = async () => {
    if (!validate()) return false;

    setLoading(true);
    setSuccessMsg("");
    setErrors({});

    try {
      const submitData = {
        ...formData,
        gst_number: formData.gst_number.toUpperCase(),
        pan_number: formData.pan_number.toUpperCase(),
        phone: formData.phone.replace(/\s/g, ""),
        owner_phone: formData.owner_phone.replace(/\s/g, ""),
        addresses: formData.addresses.map((addr) => ({
          ...addr,
          city_id: addr.city_id,
          state_id: addr.state_id,
        })),
      };

      const data = await addCompanyAPI(submitData);

      if (data.status === 200) {
        setSuccessMsg("Company added successfully!");

        // Reset form
        setFormData({
          company_name: "",
          email: "",
          phone: "",
          gst_number: "",
          gst_rate: "",
          pan_number: "",
          tin_number: "",
          industry_id: "",
          work_type: "",
          owner_name: "",
          owner_email: "",
          owner_phone: "",
          service_charge_type: "fixed",
          service_charge: "",
          addresses: [
            {
              address: "",
              city: "",
              city_id: "",
              state: "",
              state_id: "",
              zip: "",
              address_type: "",
            },
          ],
        });

        return true;
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Something went wrong. Please try again.";

      setErrors({ api: errorMessage });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    loading,
    successMsg,
    staffList,
    industries,
    states,
    cities,
    agents,
    filteredStates,
    filteredCities,
    loadingCities,
    formLoading,
    submitCompany,
    validateSingleField,
    validateAddressField,
    fetchCitiesByState,
    filterStates,
    filterCities,
    updateFormData,
    clearError,
    verifyGstNumber,
  };
};
