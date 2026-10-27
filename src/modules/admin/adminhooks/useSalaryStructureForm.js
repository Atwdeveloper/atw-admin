"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "@/lib/navigation";
import {
  getSalaryInitAPI,
  getSalaryStructureDetailsAPI,
  createSalaryStructureAPI,
  updateSalaryStructureAPI,
  getIndustriesAPI,
  getDesignationsByIndustryAPI,
} from "../../../api/admin/adminSalaryStructureAPI";
import Swal from "sweetalert2";
import { calculateSalaryResults } from "../utils/salaryCalculationUtils";

export const useSalaryStructureForm = (structureId = null) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = !!structureId;
  const isFirstLoad = useRef(true);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    industry_id: "",
    designation_id: "",
    pf_upper_cap: "",
    esi_upper_cap: "",
    max_daily_rate: "",
    is_pf_applicable: false,
    is_esi_applicable: false,
  });

  const [industries, setIndustries] = useState([]);
  const [filteredIndustries, setFilteredIndustries] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [filteredDesignations, setFilteredDesignations] = useState([]);
  const [earningComponents, setEarningComponents] = useState([]);
  const [defaultDeductions, setDefaultDeductions] = useState([]);
  const [deductionComponents, setDeductionComponents] = useState([]);
  const [deductionTemplateInfo, setDeductionTemplateInfo] = useState(null);

  const [designationsLoading, setDesignationsLoading] = useState(false);
  const [deductionTemplateLoading, setDeductionTemplateLoading] =
    useState(false);

  const [workingDays, setWorkingDays] = useState(26);
  const [hoursPerDay, setHoursPerDay] = useState(8);

  const [earningValues, setEarningValues] = useState({});
  const [calculationResults, setCalculationResults] = useState(null);
  const [complianceRules, setComplianceRules] = useState([]);

  // ----- Fetch Initial Data -----
  useEffect(() => {
    const fetchData = async () => {
      try {
        const industriesRes = await getIndustriesAPI();
        const industriesData = Array.isArray(industriesRes?.data?.data)
          ? industriesRes.data.data
          : [];
        setIndustries(industriesData);
        setFilteredIndustries(industriesData);

        const initRes = await getSalaryInitAPI();
        if (initRes && initRes.status !== 200) {
          throw new Error(
            initRes.message || "Could not load initial salary structure data.",
          );
        }
        const initData = initRes?.data || {};
        const allEarningComponents = initData.earning_components || [];
        const allDeductionComponents = initData.deduction_components || [];
        const rules = initData.compliance_rules || [];

        const baselineDays = parseInt(initData.baseline_working_days) || 26;
        const stdHours = parseInt(initData.standard_hours_per_day) || 8;
        setWorkingDays(baselineDays);
        setHoursPerDay(stdHours);

        setEarningComponents(allEarningComponents);
        setComplianceRules(rules);

        const defaultPfCap =
          rules.find((r) => r.rule_key === "pf_applicability")?.value ||
          "15000";
        const defaultEsiCap =
          rules.find((r) => r.rule_key === "esi_applicability")?.value ||
          "21000";

        // Map global deductions to the format expected by the state
        const mappedDefaults = allDeductionComponents.map((comp) => ({
          deduction_component: comp,
          value: parseFloat(comp.value) || 0,
        }));
        setDefaultDeductions(mappedDefaults);

        if (isEditMode) {
          const structureRes = await getSalaryStructureDetailsAPI(structureId);
          if (structureRes && structureRes.status !== 200) {
            throw new Error(
              structureRes.message ||
                "Could not load salary structure details.",
            );
          }
          const responseData = structureRes?.data;
          const template = responseData?.template || responseData;
          const earnings = responseData?.earnings || template?.earnings || [];
          const savedDeductions =
            responseData?.deductions || template?.deductions || [];

          const industryId = template.industry_id || "";
          const designationId = template.designation_id || "";

          setFormData({
            name: template.name || "",
            industry_id: industryId,
            designation_id: designationId,
            pf_upper_cap: template.pf_upper_cap || defaultPfCap,
            esi_upper_cap: template.esi_upper_cap || defaultEsiCap,
            max_daily_rate: template.max_daily_rate ?? "",
            is_pf_applicable: template.is_pf_applicable ?? true,
            is_esi_applicable: template.is_esi_applicable ?? true,
          });

          if (industryId) {
            await fetchDesignationsByIndustry(industryId);
          }

          // Prioritize: 1. Saved Deductions, 2. Fetch via Designation, 3. Local mappedDefaults
          if (savedDeductions.length > 0) {
            setDeductionComponents(savedDeductions);
          } else {
            setDeductionComponents(mappedDefaults);
          }

          const values = {};
          allEarningComponents.forEach((comp) => {
            values[comp.id] = { value: "", factor: 1 };
          });
          earnings.forEach((item) => {
            const val =
              item.value !== null && item.value !== undefined ? item.value : "";
            values[item.earning_component_id || item.component_id] = {
              value: val,
              factor: 1,
            };
          });
          setEarningValues(values);
        } else {
          const params = new URLSearchParams(location.search);
          const paramIndustryId = params.get("industry_id") || "";
          const paramDesignationId = params.get("designation_id") || "";

          setFormData((prev) => ({
            ...prev,
            pf_upper_cap: defaultPfCap,
            esi_upper_cap: defaultEsiCap,
            is_pf_applicable: false,
            is_esi_applicable: false,
            industry_id: paramIndustryId,
            designation_id: paramDesignationId,
          }));

          if (paramIndustryId) {
            await fetchDesignationsByIndustry(paramIndustryId);
          }

          const initialValues = {};
          allEarningComponents.forEach((comp) => {
            initialValues[comp.id] = { value: "", factor: 1 };
          });
          setEarningValues(initialValues);
          setDeductionComponents(mappedDefaults);
        }
      } catch (error) {
        console.error("Failed to fetch form data:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            error.response?.data?.message ||
            error.message ||
            "Could not load form data. Please try again.",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [structureId, isEditMode]);

  const fetchDesignationsByIndustry = async (industryId) => {
    if (!industryId) {
      setDesignations([]);
      setFilteredDesignations([]);
      return;
    }
    setDesignationsLoading(true);
    try {
      const response = await getDesignationsByIndustryAPI(industryId);
      const rawData = response?.data?.data?.data || response?.data || [];
      const designationsData = Array.isArray(rawData) ? rawData : [];
      setDesignations(designationsData);
      setFilteredDesignations(designationsData);
    } catch (error) {
      console.error("Failed to fetch designations:", error);
      setDesignations([]);
      setFilteredDesignations([]);
    } finally {
      setDesignationsLoading(false);
    }
  };

  useEffect(() => {
    if (formData.industry_id) {
      fetchDesignationsByIndustry(formData.industry_id);
      if (!initialLoading) {
        if (isFirstLoad.current) {
          isFirstLoad.current = false;
        } else {
          setFormData((prev) => ({ ...prev, designation_id: "" }));
          setDeductionComponents(defaultDeductions);
          setDeductionTemplateInfo(null);
        }
      }
    }
  }, [formData.industry_id, initialLoading]);

  // Removed fetchDeductionTemplateDetails as we now use global components from init

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEarningValueChange = (componentId, value, factor = 1) => {
    setEarningValues((prev) => ({
      ...prev,
      [componentId]: { value, factor },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please enter a structure name.",
      });
      return;
    }
    if (!formData.industry_id) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please select an industry.",
      });
      return;
    }
    if (!formData.designation_id) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please select a designation.",
      });
      return;
    }

    // --- COMPLIANCE VALIDATION ---
    if (calculationResults && !calculationResults.compliance.isBasicDAPass) {
      Swal.fire({
        icon: "error",
        title: "Compliance Check Failed",
        text: `BASIC must be at least 50% of the Gross Salary. Currently it is ${calculationResults.compliance.basicDAPercent}%.`,
      });
      return;
    }
    // -----------------------------

    const earnings = earningComponents.map((comp) => {
      const input = earningValues[comp.id];
      let perDayValue = 0;
      if (typeof input === "object" && input !== null) {
        const val = parseFloat(input.value) || 0;
        const factor = input.factor || 1;
        if (factor === 1) {
          perDayValue = val;
        } else if (factor === 1 / 26) {
          perDayValue = val / workingDays;
        } else if (factor === 1 / 8) {
          perDayValue = val * hoursPerDay;
        } else {
          perDayValue = val * factor;
        }
      } else {
        perDayValue = parseFloat(input) || 0;
      }

      return {
        component_id: comp.id,
        value: perDayValue !== "" ? perDayValue : null,
        priority_order: comp.priority_order,
      };
    });

    const payload = {
      name: formData.name,
      industry_id: parseInt(formData.industry_id),
      designation_id: parseInt(formData.designation_id),
      gross_amount: calculationResults ? calculationResults.grossPerDay : 0,
      pf_upper_cap: formData.pf_upper_cap,
      esi_upper_cap: formData.esi_upper_cap,
      max_daily_rate: formData.max_daily_rate,
      is_pf_applicable: formData.is_pf_applicable,
      is_esi_applicable: formData.is_esi_applicable,
      earnings,
    };

    setLoading(true);
    try {
      let res;
      if (isEditMode) {
        res = await updateSalaryStructureAPI(structureId, payload);
      } else {
        res = await createSalaryStructureAPI(payload);
      }

      if (res && res.status !== 200) {
        throw new Error(res.message || "Could not save salary structure.");
      }

      if (isEditMode) {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Salary structure updated.",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Created!",
          text: "Salary structure created.",
          timer: 2000,
          showConfirmButton: false,
        });
      }
      navigate("/admin/salary-structure");
    } catch (error) {
      console.error("Save failed:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Could not save salary structure.",
      });
    } finally {
      setLoading(false);
    }
  };

  const groupedEarnings = useMemo(() => {
    const groups = {};
    earningComponents.forEach((comp) => {
      const group = comp.component_group || "other";
      if (!groups[group]) groups[group] = [];
      groups[group].push(comp);
    });
    return groups;
  }, [earningComponents]);

  const findDeduction = useCallback(
    (searchTerms) => {
      return deductionComponents.find((item) => {
        const comp = item?.deduction_component;
        const name = comp?.name || "";
        return searchTerms.every((term) => name.includes(term));
      });
    },
    [deductionComponents],
  );

  const calculatePreview = useCallback(() => {
    if (!earningComponents.length) return;

    const results = calculateSalaryResults({
      earningComponents,
      earningValues,
      deductionComponents,
      complianceRules,
      pfUpperCap: parseFloat(formData.pf_upper_cap) || 0,
      esiUpperCap: parseFloat(formData.esi_upper_cap) || 0,
      isPfApplicable: formData.is_pf_applicable,
      isEsiApplicable: formData.is_esi_applicable,
      workingDays,
      hoursPerDay,
    });

    setCalculationResults(results);
  }, [
    earningComponents,
    earningValues,
    deductionComponents,
    complianceRules,
    formData.pf_upper_cap,
    formData.esi_upper_cap,
    formData.is_pf_applicable,
    formData.is_esi_applicable,
    workingDays,
    hoursPerDay,
  ]);

  useEffect(() => {
    if (!initialLoading) {
      calculatePreview();
    }
  }, [
    earningValues,
    calculatePreview,
    initialLoading,
    deductionComponents,
    formData.is_pf_applicable,
    formData.is_esi_applicable,
    formData.pf_upper_cap,
    formData.esi_upper_cap,
  ]);

  const getComputedPerDay = useCallback(
    (componentId) => {
      if (!calculationResults) return "";
      const comp = calculationResults.components.find(
        (c) => c.id === componentId,
      );
      return comp ? comp.perDay.toFixed(2) : "";
    },
    [calculationResults],
  );

  return {
    loading,
    initialLoading,
    formData,
    industries: filteredIndustries,
    designations: filteredDesignations,
    designationsLoading,
    deductionTemplateLoading,
    deductionComponents,
    deductionTemplateInfo,
    earningComponents,
    groupedEarnings,
    earningValues,
    calculationResults,
    getComputedPerDay,
    handleInputChange,
    handleEarningValueChange,
    handleSubmit,
    filterIndustries: () => {},
    filterDesignations: () => {},
    isEditMode,
  };
};
