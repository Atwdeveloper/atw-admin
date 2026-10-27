"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getCompanyDetailsAPI,
  editCompanyAPI,
  getIndustriesAPI,
  getStatesAPI,
  getCitiesByStateAPI,
  getAgentsListAPI,
  getStaffListAPI,
} from "../../../api/admin/adminCompanyAPI";

export const useEditCompany = (companyId) => {
  const [formData, setFormData] = useState(null);
  const [industriesList, setIndustriesList] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]); // Array for each address
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]); // Array for each address
  const [loadingCities, setLoadingCities] = useState([]); // Array for each address
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [agentsList, setAgentsList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  // Fetch all necessary data
  const fetchAllData = useCallback(async () => {
    if (!companyId) {
      console.error("No company ID provided");
      return;
    }

    try {
      setFormLoading(true);

      // Fetch all data in parallel for better performance
      const [companyRes, industriesRes, statesRes, agentsRes, staffRes] =
        await Promise.all([
          getCompanyDetailsAPI(companyId),
          getIndustriesAPI(),
          getStatesAPI(),
          getAgentsListAPI(),
          getStaffListAPI(),
        ]);

      // setAgentsList(agentsRes.data.data || []);
      setAgentsList(agentsRes.data?.data || agentsRes.data || []);
      setStaffList(staffRes.data?.data || staffRes.data || []);
      const data = companyRes.data.company || companyRes.data;
      setIndustriesList(industriesRes.data || []);

      const statesData = statesRes.data.data || [];
      setStates(statesData);
      setFilteredStates(statesData);

      // Initialize arrays for addresses
      const addressCount = data.addresses?.length || 1;
      setCities(new Array(addressCount).fill([]));
      setFilteredCities(new Array(addressCount).fill([]));
      setLoadingCities(new Array(addressCount).fill(false));

      // Set form data
      const formattedData = {
        company_code: data.company_code || "",
        company_name: data.company_name || "",
        email: data.email || "",
        phone: data.phone || "",
        owner_id: data.company_owner?.id || "",
        agent_code: data.agent?.agent_code || "",
        //  staff_code: data.staff?.staff_code || "",
        staff_code: data.relationship_manager?.staff_code
          ? String(data.relationship_manager.staff_code)
          : "",
        owner_name: data.company_owner?.owner_name || "",
        owner_phone: data.company_owner?.owner_phone || "",
        owner_email: data.company_owner?.owner_email || "",
        gst_number: data.gst_number || "",
        gst_rate:
          data.gst_rate !== undefined && data.gst_rate !== null
            ? String(data.gst_rate)
            : "",
        tin_number: data.tin_number || "",
        pan_number: data.pan_number || "",
        service_charge_type: data.service_charge_type || "fixed",
        service_charge: data.service_charge || "",
        industry_id: data.industry.id, // Make sure it's a string
        industry_name: data.industry.name || "",
        work_type: data.work_type || "",
        addresses: data.addresses?.length
          ? data.addresses.map((addr) => ({
              id: addr.id,
              address: addr.address || "",
              city: addr.city || "",
              city_id: addr.city_id ? String(addr.city_id) : "",
              state: addr.state || "",
              state_id: addr.state_id ? String(addr.state_id) : "",
              zip: addr.zip || "",
              address_type: addr.address_type || "",
            }))
          : [
              {
                id: "",
                address: "",
                city: "",
                city_id: "",
                state: "",
                state_id: "",
                zip: "",
                address_type: "",
              },
            ],
      };

      setFormData(formattedData);

      // Fetch cities for each address with state_id
      if (formattedData.addresses) {
        await Promise.all(
          formattedData.addresses.map(async (addr, index) => {
            if (addr.state_id) {
              await fetchCitiesByState(addr.state_id, index);
            }
          }),
        );
      }

      setFormLoading(false);
    } catch (error) {
      console.error("Error fetching company data:", error);
      setFormLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

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
      newCities[index] = citiesData.map((city) => ({
        ...city,
        id: String(city.id), // Ensure city IDs are strings
      }));
      setCities(newCities);

      const newFilteredCities = [...filteredCities];
      newFilteredCities[index] = newCities[index];
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

  const clearError = (fieldName) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const clearAddressError = (index, field) => {
    const errorKey = `${field}_${index}`;
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[errorKey];
      return newErrors;
    });
  };

  const validate = () => {
    let temp = {};

    // Company Information
    if (!formData.company_name?.trim())
      temp.company_name = "Company name is required";

    if (!formData.email?.trim()) temp.email = "Company email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      temp.email = "Invalid email format";

    if (!formData.phone?.trim()) temp.phone = "Company contact is required";
    else if (!/^\d{10}$/.test(formData.phone))
      temp.phone = "Contact number must be 10 digits";

    // Service Charge Fields
    if (!formData.service_charge_type?.trim())
      temp.service_charge_type = "Service charge type is required";

    if (!formData.service_charge)
      temp.service_charge = "Service charge is required";
    else if (formData.service_charge_type === "percentage") {
      const charge = parseFloat(formData.service_charge);
      if (isNaN(charge) || charge < 0 || charge > 100) {
        temp.service_charge = "Percentage must be between 0 and 100";
      }
    }

    // Contact Person
    if (!formData.owner_name?.trim())
      temp.owner_name = "Contact person name is required";

    if (!formData.owner_phone?.trim())
      temp.owner_phone = "Contact person number is required";
    else if (!/^\d{10}$/.test(formData.owner_phone))
      temp.owner_phone = "Contact number must be 10 digits";

    if (!formData.owner_email?.trim())
      temp.owner_email = "Contact person email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.owner_email))
      temp.owner_email = "Invalid email format";

    // Industry - IMPORTANT: Ensure industry_id is not empty
    if (!formData.industry_id || formData.industry_id === "")
      temp.industry_id = "Industry is required";

    // Tax Information (Optional fields)
    // GST validation (REQUIRED)
    if (!formData.gst_number?.trim()) {
      temp.gst_number = "GST number is required";
    } else if (
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
        formData.gst_number,
      )
    ) {
      temp.gst_number = "Invalid GST format";
    }

    // GST Rate (optional field → validate only if filled)
    if (formData.gst_rate) {
      const rate = parseFloat(formData.gst_rate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        temp.gst_rate = "GST Rate must be between 0 and 100";
      }
    }

    // CIN (optional field → validate only if filled)
    if (formData.tin_number?.trim()) {
      if (
        !/^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(
          formData.tin_number,
        )
      ) {
        temp.tin_number = "Invalid CIN format";
      }
    }

    // TAN (optional field → validate only if filled)
    if (formData.pan_number?.trim()) {
      if (!/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/.test(formData.pan_number)) {
        temp.pan_number = "Invalid TAN format";
      }
    }
    // Address validation - using city_id and state_id
    (formData.addresses || []).forEach((a, i) => {
      if (!a.address?.trim()) temp[`address_${i}`] = "Address is required";
      if (!a.city_id) temp[`city_${i}`] = "City is required";
      if (!a.state_id) temp[`state_${i}`] = "State is required";
      if (!a.zip?.trim()) temp[`zip_${i}`] = "ZIP is required";
      else if (!/^\d{5,6}$/.test(a.zip))
        temp[`zip_${i}`] = "ZIP must be 5-6 digits";
    });
    if (!formData.staff_code)
      temp.staff_code = "Relationship Manager is required";
    // Cross-field validations
    if (
      formData.email &&
      formData.owner_email &&
      formData.email.toLowerCase() === formData.owner_email.toLowerCase()
    ) {
      temp.owner_email = "Owner email must be different from company email";
    }

    // if (
    //   formData.phone &&
    //   formData.owner_phone &&
    //   formData.phone.replace(/\s/g, "") ===
    //     formData.owner_phone.replace(/\s/g, "")
    // ) {
    //   temp.owner_phone = "Owner phone must be different from company phone";
    // }

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const submitEdit = async () => {
    if (!validate()) return false;

    try {
      setLoading(true);
      setErrors({});

      const submitData = {
        company_name: formData.company_name,
        email: formData.email,
        phone: formData.phone,
        owner_id: formData.owner_id,
        owner_name: formData.owner_name,
        owner_phone: formData.owner_phone,
        agent_code: formData.agent_code,
        staff_code: formData.staff_code,
        owner_email: formData.owner_email,
        gst_number: formData.gst_number || "",
        gst_rate: formData.gst_rate || "",
        tin_number: formData.tin_number || "",
        pan_number: formData.pan_number || "",
        service_charge_type: formData.service_charge_type,
        service_charge: formData.service_charge,
        industry_id: formData.industry_id, // Already a string
        work_type: formData.work_type || "",
        addresses: formData.addresses.map((addr) => ({
          id: addr.id,
          address: addr.address,
          city_id: addr.city_id,
          state_id: addr.state_id,
          zip: addr.zip,
          address_type: addr.address_type || "",
        })),
      };

      const res = await editCompanyAPI(companyId, submitData);

      // Check for HTTP status code 200
      if (res.status === 200) {
        setSuccessMsg("Company updated successfully!");
        setLoading(false);

        return {
          success: true,
          message: res.data?.message || "Company updated successfully",
        };
      } else {
        setErrors({ api: res.data?.message || "Failed to update company" });
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error("Edit company failed:", error);
      setLoading(false);

      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 422) {
          const serverErrors = error.response.data.errors || {};

          const formattedErrors = {};

          Object.keys(serverErrors).forEach((key) => {
            formattedErrors[key] = Array.isArray(serverErrors[key])
              ? serverErrors[key][0]
              : serverErrors[key];
          });

          setErrors(formattedErrors);

          return {
            success: false,
            message: Object.values(formattedErrors)[0],
          };
        } else if (error.response.status === 404) {
          setErrors({ api: "Company not found." });
        } else if (error.response.status === 401) {
          setErrors({ api: "Unauthorized access." });
        } else {
          setErrors({
            api:
              error.response.data?.message ||
              `Server error: ${error.response.status}`,
          });
        }
      } else if (error.request) {
        // Network error
        setErrors({ api: "Network error. Please check your connection." });
      } else {
        // Other errors
        setErrors({ api: "Something went wrong. Please try again." });
      }

      return false;
    }
  };

  return {
    formData,
    setFormData,
    industriesList,
    errors,
    loading,
    agentsList,
    setErrors,
    staffList,
    formLoading,
    successMsg,
    submitEdit,
    fetchAllData,
    clearError,
    clearAddressError,
    states,
    cities,
    filteredStates,
    filteredCities,
    loadingCities,
    fetchCitiesByState,
    filterStates,
    filterCities,
  };
};

export default useEditCompany;
