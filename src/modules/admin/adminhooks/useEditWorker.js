"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import {
  getWorkerByIdAPI,
  updateWorkerAPI,
  getDesignationsAPI,
  getAllDesignationsAPI,
  addDesignationAPI,
  getIndustriesAPI,
  getStatesAPI,
  getCitiesByStateAPI,
  getStaffListAPI,
  verifyBankAccountAPI,
  getAgentsAPI,
  getSkillsByDesignation,
} from "../../../api/admin/adminWorkerAPI";
import { getSalaryInitAPI } from "../../../api/admin/adminSalaryStructureAPI";
import { calculateSalaryResults } from "../utils/salaryCalculationUtils";

// Validation patterns
const phonePattern = /^[6-9]\d{9}$/;
const uanPattern = /^\d{12}$/;
const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const useEditWorker = (id) => {
  // Initial form state (no department fields)
  const initialFormData = {
    // Basic Details
    id: "",
    worker_code: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    work_email: "",
    mobile_number: "",
    gender: "",
    work_location: "",
    dress_size: "",

    // Industry & Designation
    industry: "",
    industry_id: "",
    // Multi-select — array of {id, name}, matching Add Worker's convention.
    designations: [],
    skills: [],
    new_designation: "",

    // EPF/ESI/Bonus
    work_experience: "",
    uan_number: "",
    eps_contribution: false,
    esic_number: "",
    is_pf_applicable: true,
    is_esi_applicable: true,
    pf_upper_cap: 15000,
    esi_upper_cap: 21000,
    bonus_frequency: "",

    // Personal Details
    date_of_birth: "",
    father_name: "",
    pan_number: "",
    aadhar_number: "",
    address: "",
    state: "",
    state_id: "",
    city: "",
    city_id: "",
    zip: "",

    // Reporting Manager
    staff_code: "",
    agent_code: "",
    // Payment Information
    payment_method: "bank",
    account_holder_name: "",
    bank_name: "",
    account_number: "",
    confirm_account_number: "",
    ifsc_code: "",

    // Salary Structure
    define_salary_structure: false,
    salary_earnings: [],
  };

  // State management
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [isBankVerified, setIsBankVerified] = useState(false);
  const [verifyingBank, setVerifyingBank] = useState(false);
  const [initialBankDetails, setInitialBankDetails] = useState({
    account_number: "",
    ifsc_code: "",
  });

  // Dropdown data
  const [industries, setIndustries] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  // Skills — scoped to the selected designations, same convention as Add Worker.
  const [skills, setSkills] = useState([]);
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(false);

  // Staff list for RM dropdown
  const [staffList, setStaffList] = useState([]);
  const [filteredStaffList, setFilteredStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Filtered dropdown data
  const [filteredIndustries, setFilteredIndustries] = useState([]);
  const [filteredDesignations, setFilteredDesignations] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);

  // Loading states
  const [loadingCities, setLoadingCities] = useState(false);
  const [designationsLoading, setDesignationsLoading] = useState(false);

  // Salary Structure States
  const [workingDays, setWorkingDays] = useState(26);
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [earningComponents, setEarningComponents] = useState([]);
  const [deductionComponents, setDeductionComponents] = useState([]);
  const [complianceRules, setComplianceRules] = useState([]);
  const [earningValues, setEarningValues] = useState({});
  const [calculationResults, setCalculationResults] = useState(null);
  const [initialSalaryLoading, setInitialSalaryLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  // Fetch residential cities by state
  const fetchCitiesByState = useCallback(async (stateId) => {
    if (!stateId) {
      setCities([]);
      setFilteredCities([]);
      return;
    }
    setLoadingCities(true);
    try {
      const response = await getCitiesByStateAPI(stateId);
      // const citiesData = response.data?.data || [];
      const citiesData = Array.isArray(response?.data)
        ? response.data
        : response?.data?.data || [];
      setCities(citiesData);
      setFilteredCities(citiesData);
    } catch (error) {
      console.error("Failed to fetch cities:", error);
      setCities([]);
      setFilteredCities([]);
    } finally {
      setLoadingCities(false);
    }
  }, []);

  // Update account_holder_name when name fields change
  useEffect(() => {
    const fullName = [
      formData.first_name,
      formData.middle_name,
      formData.last_name,
    ]
      .filter(Boolean)
      .join(" ");

    setFormData((prev) => {
      if (!prev.account_holder_name || prev.account_holder_name.trim() === "") {
        return {
          ...prev,
          account_holder_name: fullName,
        };
      }
      return prev;
    });
  }, [formData.first_name, formData.middle_name, formData.last_name]);

  // Fetch all data on mount
  useEffect(() => {
    const fetchAllData = async () => {
      if (!id) return;
      try {
        setFormLoading(true);

        // Fetch dropdown and salary init data (no departments API)
        // const [indRes, stateRes, staffRes, salaryRes] = await Promise.all([
        //   getIndustriesAPI(),
        //   getStatesAPI(),
        //   getStaffListAPI(),
        //   getSalaryInitAPI(),
        // ]);
        const [indRes, stateRes, staffRes, agentRes, salaryRes] =
          await Promise.all([
            getIndustriesAPI(),
            getStatesAPI(),
            getStaffListAPI(),
            getAgentsAPI(),
            getSalaryInitAPI(),
          ]);
        const indData = Array.isArray(indRes?.data)
          ? indRes.data
          : indRes?.data?.data || [];
        setIndustries(indData);
        setFilteredIndustries(indData);

        // const stateData = stateRes.data?.data || [];
        const stateData = Array.isArray(stateRes?.data)
          ? stateRes.data
          : stateRes?.data?.data || [];
        setStates(stateData);
        setFilteredStates(stateData);

        // Process staff list
        let staffData =
          staffRes?.data?.data || staffRes?.data || staffRes || [];
        if (!Array.isArray(staffData)) staffData = [];
        setStaffList(staffData);
        setFilteredStaffList(staffData);
        let agentData =
          agentRes?.data?.data || agentRes?.data || agentRes || [];

        if (!Array.isArray(agentData)) {
          agentData = [];
        }

        setAgents(agentData);
        setFilteredAgents(agentData);
        // Salary initialization
        const salaryData = salaryRes?.data || {};
        const baselineDays = parseInt(salaryData.baseline_working_days) || 26;
        const stdHours = parseInt(salaryData.standard_hours_per_day) || 8;
        setWorkingDays(baselineDays);
        setHoursPerDay(stdHours);

        setEarningComponents(salaryData.earning_components || []);
        setComplianceRules(salaryData.compliance_rules || []);

        if (salaryData.deduction_components) {
          const mappedDefaults = salaryData.deduction_components.map(
            (comp) => ({
              deduction_component: comp,
              value: parseFloat(comp.value) || 0,
            }),
          );
          setDeductionComponents(mappedDefaults);
        }

        // Fetch worker data
        const workerResponse = await getWorkerByIdAPI(id);
        const workerData = workerResponse.data || workerResponse;

        if (workerData) {
          const transformedData = transformWorkerData(workerData);
          setFormData(transformedData);

          // Initialize salary earning values
          const initialValues = {};
          (workerData.salary_template?.earnings || []).forEach((detail) => {
            initialValues[detail.component_id] = {
              value: detail.value,
              factor: 1,
            };
          });
          setEarningValues(initialValues);
          setInitialSalaryLoading(false);

          if (transformedData.state_id)
            await fetchCitiesByState(transformedData.state_id);

          setInitialBankDetails({
            account_number: transformedData.account_number || "",
            ifsc_code: transformedData.ifsc_code || "",
          });
          setIsBankVerified(!!workerData.is_bank_verified);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message || "Failed to load worker data",
        });
        setErrors({ api: "Failed to load worker data" });
      } finally {
        setFormLoading(false);
      }
    };

    fetchAllData();
  }, [id, fetchCitiesByState]);

  // Filter staff list
  const filterStaffList = (searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredStaffList(staffList);
    } else {
      const filtered = staffList.filter(
        (staff) =>
          staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          staff.staff_code.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredStaffList(filtered);
    }
  };
  const filterAgents = (searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredAgents(agents);
    } else {
      const filtered = agents.filter(
        (agent) =>
          agent.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agent.agent_code?.toLowerCase().includes(searchTerm.toLowerCase()),
      );

      setFilteredAgents(filtered);
    }
  };
  // Fetch designations when industry changes. Industry and designation are
  // independent filters — this only ever repopulates the *available* list
  // (industry-scoped, or the full list when no industry is picked); it never
  // touches the admin's actual `formData.designations` selection, since that
  // isn't gated by industry server-side either.
  useEffect(() => {
    const fetchDesignations = async () => {
      setDesignationsLoading(true);
      try {
        const response = formData.industry_id
          ? await getDesignationsAPI(formData.industry_id, { per_page: 1000 })
          : await getAllDesignationsAPI({ per_page: 1000 });
        let designationsArray = [];
        if (response.data.data && Array.isArray(response.data.data.data)) {
          designationsArray = response.data.data.data;
        } else if (Array.isArray(response.data.data)) {
          designationsArray = response.data.data;
        } else {
          designationsArray = [];
        }
        setDesignations(designationsArray);
        setFilteredDesignations(designationsArray);
      } catch (error) {
        console.error("Failed to fetch designations:", error);
        setDesignations([]);
        setFilteredDesignations([]);
      } finally {
        setDesignationsLoading(false);
      }
    };
    fetchDesignations();
  }, [formData.industry_id]);

  // Skills are scoped per designation, so with multiple designations
  // selected we fetch each in parallel and merge the results (deduped by
  // id) — same pattern as Add Worker.
  useEffect(() => {
    const fetchSkillsForDesignations = async () => {
      const designationIds = (formData.designations || []).map((d) => d.id);
      if (designationIds.length === 0) {
        setSkills([]);
        setFilteredSkills([]);
        return;
      }
      setLoadingSkills(true);
      try {
        const responses = await Promise.all(
          designationIds.map((id) => getSkillsByDesignation(id).catch(() => null)),
        );
        const merged = new Map();
        responses.forEach((response) => {
          if (!response) return;
          let skillsData = [];
          if (response?.data?.data && Array.isArray(response.data.data))
            skillsData = response.data.data;
          else if (response?.data && Array.isArray(response.data))
            skillsData = response.data;
          else if (Array.isArray(response)) skillsData = response;
          skillsData.forEach((s) => merged.set(s.id, s));
        });
        const skillsData = Array.from(merged.values());
        setSkills(skillsData);
        setFilteredSkills(skillsData);
        // Drop any already-picked skill that no longer belongs to the
        // current designation selection.
        const allowed = new Set(skillsData.map((s) => s.id));
        setFormData((prev) => ({
          ...prev,
          skills: (prev.skills || []).filter((s) => allowed.has(s.id)),
        }));
      } catch (error) {
        console.error("Failed to fetch skills:", error);
        setSkills([]);
        setFilteredSkills([]);
      } finally {
        setLoadingSkills(false);
      }
    };
    fetchSkillsForDesignations();
  }, [formData.designations]);

  // Transform API data to form structure (no department)
  const transformWorkerData = (workerData) => {
    const fullName = workerData.worker_name || workerData.name || "";
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts[nameParts.length - 1] || "";
    const middleName =
      nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";

    return {
      id: workerData.id || "",
      worker_code: workerData.worker_code || workerData.employee_code || "",
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      work_email: workerData.email || workerData.work_email || "",
      mobile_number: workerData.phone || workerData.mobile_number || "",
      gender: workerData.gender || "",
      work_location: workerData.work_location || workerData.location || "",
      dress_size: workerData.dress_size || "",
      industry: workerData.industry_name || workerData.industry || "",
      industry_id: workerData.industry_id || "",
      // Accept whichever shape the backend sends: an array of {id, name}
      // under `designations`, or the older single `designation_id`/
      // `designation_name` (or `designation`, an object or a plain string)
      // pair, wrapped into a one-item array so the multi-select still shows it.
      designations: Array.isArray(workerData.designations)
        ? workerData.designations
        : workerData.designation_id
          ? [
              {
                id: workerData.designation_id,
                name:
                  workerData.designation_name ||
                  (typeof workerData.designation === "string"
                    ? workerData.designation
                    : workerData.designation?.name) ||
                  "",
              },
            ]
          : [],
      skills: Array.isArray(workerData.skills) ? workerData.skills : [],
      work_experience: workerData.work_experience || "",
      uan_number: workerData.uan_number || "",
      esic_number: workerData.esic_number || "",
      bonus_frequency: workerData.bonus_frequency || "",
      date_of_birth: workerData.date_of_birth || "",
      father_name: workerData.father_name || "",
      pan_number: workerData.pan_number || "",
      aadhar_number: workerData.aadhar_number || "",
      address: workerData.address || "",
      state: workerData.state_name || workerData.state || "",
      state_id: workerData.state_id || "",
      city: workerData.city_name || workerData.city || "",
      city_id: workerData.city_id || "",
      zip: workerData.zip || "",
      // Reporting Manager
      staff_code: workerData.staff?.staff_code || "",
      agent_code: workerData.agent?.agent_code || workerData.agent_code || "",
      // Payment
      payment_method: workerData.payment_method || "bank",
      account_holder_name: workerData.account_holder_name || "",
      bank_name: workerData.bank_name || "",
      account_number: workerData.account_number || "",
      ifsc_code: workerData.ifsc_code || "",
      bank_accounts: workerData.bank_accounts || [],

      // Salary Structure
      define_salary_structure: !!workerData.salary_template,
      is_pf_applicable: workerData.salary_template
        ? !!workerData.salary_template.is_pf_applicable
        : true,
      is_esi_applicable: workerData.salary_template
        ? !!workerData.salary_template.is_esi_applicable
        : true,
      pf_upper_cap: workerData.salary_template?.pf_upper_cap || 15000,
      esi_upper_cap: workerData.salary_template?.esi_upper_cap || 21000,
    };
  };

  // Update form data
  const updateFormData = (updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // Clear error
  const clearError = (fieldName) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  // Filter functions
  const filterIndustries = (searchTerm) => {
    const filtered = industries.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredIndustries(filtered);
  };

  const filterDesignations = (searchTerm) => {
    if (!Array.isArray(designations)) return;
    const filtered = designations.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredDesignations(filtered);
  };

  const filterStates = (searchTerm) => {
    const filtered = states.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredStates(filtered);
  };

  const filterCities = (searchTerm) => {
    const filtered = cities.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredCities(filtered);
  };

  const filterSkills = (searchTerm) => {
    if (!Array.isArray(skills)) return;
    const filtered = skills.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredSkills(filtered);
  };

  // Salary calculations effects
  useEffect(() => {
    if (!initialSalaryLoading && formData.define_salary_structure) {
      const results = calculateSalaryResults({
        earningComponents,
        earningValues,
        deductionComponents,
        complianceRules,
        isPfApplicable: formData.is_pf_applicable,
        isEsiApplicable: formData.is_esi_applicable,
        pfUpperCap: parseFloat(formData.pf_upper_cap) || 0,
        esiUpperCap: parseFloat(formData.esi_upper_cap) || 0,
        workingDays,
        hoursPerDay,
      });
      setCalculationResults(results);
    }
  }, [
    earningValues,
    deductionComponents,
    initialSalaryLoading,
    formData.define_salary_structure,
    earningComponents,
    complianceRules,
    formData.is_pf_applicable,
    formData.is_esi_applicable,
    formData.pf_upper_cap,
    formData.esi_upper_cap,
    workingDays,
    hoursPerDay,
  ]);

  const handleEarningValueChange = (componentId, value, factor = 1) => {
    setEarningValues((prev) => ({
      ...prev,
      [componentId]: { value, factor },
    }));
  };

  // Add new designation
  const addNewDesignation = async (designationName, industryId) => {
    try {
      const response = await addDesignationAPI({
        name: designationName,
        industry_id: industryId,
      });
      if (response.data) {
        const newDesignation = response.data.data;
        setDesignations((prev) => [...prev, newDesignation]);
        setFilteredDesignations((prev) => [...prev, newDesignation]);
        return newDesignation;
      }
    } catch (error) {
      console.error("Failed to add designation:", error);
      throw error;
    }
  };

  // Generate password
  const generateStrongPassword = () => {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const verifyBankAccount = async () => {
    if (!formData.account_number || !formData.ifsc_code) {
      Swal.fire({
        icon: "warning",
        title: "Missing Details",
        text: "Please enter Account Number and IFSC code first.",
      });
      return;
    }

    setVerifyingBank(true);
    try {
      const response = await verifyBankAccountAPI({
        account_number: formData.account_number,
        ifsc_code: formData.ifsc_code,
        account_holder_name: formData.account_holder_name,
      });

      if (response.success) {
        setIsBankVerified(true);
        setErrors((prev) => ({ ...prev, bank_verification: "" }));
        Swal.fire({
          icon: "success",
          title: "Verified",
          text:
            (response.message || "Account verified successfully!") +
            " Please click 'Update Worker' to save the verification.",
        });
      } else {
        setIsBankVerified(false);
        Swal.fire({
          icon: "error",
          title: "Verification Failed",
          text:
            response.message ||
            "The name provided does not match the bank record.",
        });
      }
    } catch (error) {
      console.error("Bank Verification Error:", error);
      Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text:
          error.response?.data?.message ||
          "Could not verify account. Please check details.",
      });
    } finally {
      setVerifyingBank(false);
    }
  };

  // Reset verification if details change
  useEffect(() => {
    if (
      initialBankDetails.account_number &&
      (formData.account_number !== initialBankDetails.account_number ||
        formData.ifsc_code !== initialBankDetails.ifsc_code)
    ) {
      setIsBankVerified(false);
    }
  }, [formData.account_number, formData.ifsc_code]);

  // Validation (no department fields)
  const validateForm = (data) => {
    const newErrors = {};

    if (!data.first_name) newErrors.first_name = "First name is required";
    if (!data.last_name) newErrors.last_name = "Last name is required";
    // if(!data.work_email) newErrors.work_email = "Personal email is required";
    if (!data.mobile_number)
      newErrors.mobile_number = "Mobile number is required";
    if (!data.gender) newErrors.gender = "Gender is required";
    if (!data.state_id) newErrors.state_id = "State is required";

    if (!data.city_id) newErrors.city_id = "City is required";

    if (!data.aadhar_number?.replace(/\D/g, ""))
      newErrors.aadhar_number = "Aadhaar number is required";
    else if (data.aadhar_number.replace(/\D/g, "").length !== 12)
      newErrors.aadhar_number = "Aadhaar number must be 12 digits";

    if (
      data.mobile_number &&
      !phonePattern.test(data.mobile_number.replace(/\D/g, ""))
    ) {
      newErrors.mobile_number =
        "Mobile number must be 10 digits starting with 6-9";
    }

    if (data.work_email && !/\S+@\S+\.\S+/.test(data.work_email)) {
      newErrors.work_email = "Invalid email format";
    }

    if (data.pan_number && !panPattern.test(data.pan_number)) {
      newErrors.pan_number = "Invalid PAN format (e.g., ABCDE1234F)";
    }

    if (data.uan_number && !uanPattern.test(data.uan_number)) {
      newErrors.uan_number = "UAN must be exactly 12 digits";
    }

    if (data.designations && data.designations.length > 3) {
      newErrors.designation = "You can select up to 3 designations";
    }

    if (data.date_of_birth) {
      const dob = new Date(data.date_of_birth);
      const today = new Date();
      const age =
        today.getFullYear() -
        dob.getFullYear() -
        (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
          ? 1
          : 0);
      if (age < 18) newErrors.date_of_birth = "Age must be at least 18 years";
    }

    return newErrors;
  };

  // Prepare API payload (no department fields)
  const prepareFormDataForAPI = (data) => {
    const apiData = {
      first_name: data.first_name,
      last_name: data.last_name,
      work_email: data.work_email,
      mobile_number: data.mobile_number.replace(/\D/g, ""),
      work_location: data.work_location,
      gender: data.gender,
      dress_size: data.dress_size,
      work_experience: data.work_experience,
      industry_id: data.industry_id || null,
      // The backend wants plain id arrays, not the {id, name} objects the
      // picker UI works with.
      designation_ids: (data.designations || []).map((d) => d.id),
      skills: (data.skills || []).map((s) => s.id),
      middle_name: data.middle_name || "",
      uan_number: data.uan_number || "",
      epf_enabled: !!data.uan_number,
      esic_number: data.esic_number || "",
      esi_enabled: !!data.esic_number,
      bonus_frequency: data.bonus_frequency || "",
      date_of_birth: data.date_of_birth,
      father_name: data.father_name || "",
      pan_number: data.pan_number || "",
      aadhar_number: data.aadhar_number || "",
      address: data.address || "",
      state_id: data.state_id || null,
      city_id: data.city_id || null,
      zip: data.zip || "",
      staff_code: data.staff_code || null,
      agent_code: data.agent_code || null,
      define_salary_structure: data.define_salary_structure,
      payment_method: data.payment_method,
      account_holder_name: data.account_holder_name || "",
      bank_name: data.bank_name || "",
      account_number: data.account_number || "",
      ifsc_code: data.ifsc_code || "",
      is_bank_verified: isBankVerified,

      // Salary Structure payload
      salary_details: data.define_salary_structure
        ? {
            earnings: earningComponents
              .filter((comp) => !comp.is_derived)
              .map((comp) => {
                const input = earningValues[comp.id];
                let value = 0;
                if (typeof input === "object" && input !== null) {
                  const val = parseFloat(input.value) || 0;
                  const factor = Number(input.factor) || 1;
                  if (factor === 1) {
                    value = val;
                  } else if (factor === 1 / 26) {
                    value = val / workingDays;
                  } else if (factor === 1 / 8) {
                    value = val * hoursPerDay;
                  } else {
                    value = val * factor;
                  }
                } else {
                  value = parseFloat(input) || 0;
                }

                return {
                  component_id: comp.id,
                  value: value,
                  priority_order: comp.priority_order,
                };
              }),
            gross_amount: calculationResults?.grossPerDay || 0,
            is_pf_applicable: data.is_pf_applicable,
            is_esi_applicable: data.is_esi_applicable,
            pf_upper_cap: data.pf_upper_cap,
            esi_upper_cap: data.esi_upper_cap,
          }
        : null,
    };

    // Remove empty strings
    const cleanedData = {};
    Object.keys(apiData).forEach((key) => {
      cleanedData[key] = apiData[key] === "" ? null : apiData[key];
    });

    return cleanedData;
  };

  // Submit edit
  const submitEdit = async (formDataToSubmit) => {
    const validationErrors = validateForm(formDataToSubmit);
    // if (Object.keys(validationErrors).length > 0) {
    //   setErrors(validationErrors);
    //   throw new Error("Validation failed");
    // }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      Swal.fire({
        icon: "error",
        title: "Validation Error",
        html: Object.values(validationErrors)
          .map((msg) => `• ${msg}`)
          .join("<br>"),
      });

      throw new Error("Validation failed");
    }
    setLoading(true);
    try {
      const apiData = prepareFormDataForAPI(formDataToSubmit);
      const response = await updateWorkerAPI(id, apiData);
      if (response.status === 200 || response.status === 201) {
        return { success: true, data: response.data };
      } else {
        throw new Error(response.data?.message || "Failed to update worker");
      }
    } catch (error) {
      console.error("Error updating worker:", error);
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        const formattedErrors = {};
        Object.keys(backendErrors).forEach((key) => {
          formattedErrors[key] = Array.isArray(backendErrors[key])
            ? backendErrors[key][0]
            : backendErrors[key];
        });
        // The request field (and therefore the backend's validation error
        // key) is `designation_ids`, but the Designation field's inline
        // error reads `errors.designation` — alias it across.
        if (formattedErrors.designation_ids && !formattedErrors.designation) {
          formattedErrors.designation = formattedErrors.designation_ids;
        }
        setErrors(formattedErrors);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Reset form to original values
  const resetForm = async () => {
    try {
      setFormLoading(true);
      const workerResponse = await getWorkerByIdAPI(id);
      const workerData = workerResponse.data || workerResponse;
      if (workerData) {
        const transformedData = transformWorkerData(workerData);
        setFormData(transformedData);
        setErrors({});
        if (transformedData.state_id)
          await fetchCitiesByState(transformedData.state_id);
        Swal.fire({
          icon: "success",
          title: "Form Reset",
          text: "All changes discarded",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Failed to reset form:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to reset form",
      });
    } finally {
      setFormLoading(false);
    }
  };

  return {
    // States
    formData,
    setFormData,
    errors,
    setErrors,
    loading,
    formLoading,
    industries: filteredIndustries,
    designations: filteredDesignations,
    designationsLoading,
    skills: filteredSkills,
    loadingSkills,
    filterSkills,
    states: filteredStates,
    cities: filteredCities,
    loadingCities,
    // RM
    staffList: filteredStaffList,
    loadingStaff,
    filterStaffList,
    // Functions
    updateFormData,
    clearError,
    filterIndustries,
    filterDesignations,
    filterStates,
    filterCities,
    fetchCitiesByState,
    addNewDesignation,
    generateStrongPassword,
    submitEdit,
    resetForm,
    filteredStates,
    filteredCities,
    agents: filteredAgents,
    filterAgents,
    // Salary structure exports
    earningComponents,
    earningValues,
    calculationResults,
    initialSalaryLoading,
    handleEarningValueChange,
    verifyBankAccount,
    isBankVerified,
    verifyingBank,
  };
};
