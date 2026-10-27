"use client";

import { useState, useEffect } from "react";
import {
  getDeductionComponentsAPI,
  updateDefaultTemplateAPI,
  getComplianceRulesAPI,
  updateComplianceRulesAPI,
} from "../../../api/admin/adminDeductionSettingsAPI";
import Swal from "sweetalert2";

export const useDeductionSettings = () => {
  const [components, setComponents] = useState([]); 
  const [formValues, setFormValues] = useState({}); 
  const [statutoryRules, setStatutoryRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const employerComponents = components.filter(c => c.contribution_type === "employer");
  const employeeComponents = components.filter(c => c.contribution_type === "employee");

  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      try {
        const [compRes, rulesRes] = await Promise.all([
          getDeductionComponentsAPI(),
          getComplianceRulesAPI()
        ]);

        setComponents(compRes?.data || []);
        setStatutoryRules(rulesRes?.data || []);

        const initialValues = {};
        (compRes?.data || []).forEach(item => {
          initialValues[item.id] = item.value;
        });
        setFormValues(initialValues);
      } catch (error) {
        console.error("Failed to fetch deduction settings", error);
      } finally {
        setTimeout(() => setInitialLoading(false), 500);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (componentId, value) => {
    setFormValues(prev => ({
      ...prev,
      [componentId]: value,
    }));
  };

  const handleStatutoryChange = (ruleKey, value) => {
    setStatutoryRules(prev => prev.map(rule => 
      rule.rule_key === ruleKey ? { ...rule, value: value } : rule
    ));
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const templatePayload = {
        components: Object.entries(formValues).map(([componentId, value]) => ({
          component_id: parseInt(componentId),
          value: parseFloat(value) || 0,
        })),
      };

      const rulesPayload = {
        rules: statutoryRules.map(rule => ({
          rule_key: rule.rule_key,
          rule_value: rule.value
        }))
      };

      await Promise.all([
        updateDefaultTemplateAPI(templatePayload),
        updateComplianceRulesAPI(rulesPayload)
      ]);

      Swal.fire({
        icon: "success",
        title: "Saved!",
        text: "Global settings and statutory caps updated successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Save failed", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Could not save settings.",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    components,
    employerComponents,
    employeeComponents,
    formValues,
    statutoryRules,
    loading,
    initialLoading,
    handleInputChange,
    handleStatutoryChange,
    saveSettings,
  };
};