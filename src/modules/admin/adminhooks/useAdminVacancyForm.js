"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  getVacancyAPI,
  createVacancyAPI,
  updateVacancyAPI,
  getCompaniesDropdown,
  getDesignationsByCompanyDropdown,
  getSkillsByDesignation,
} from "../../../api/admin/adminVacancyAPI";

export const useCompanyVacancyForm = (mode = "create", vacancyId = null) => {
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);

  // Companies & Designations
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [designations, setDesignations] = useState([]);
  const [designationsLoading, setDesignationsLoading] = useState(false);
    const [skills, setSkills] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(false);

  // Form state – no industry, no state/city
  const [formData, setFormData] = useState({
    rate_type: "",
    company_id: "",
    designation_id: "",
    skills: [],
    number_of_workers: "",
    shift_start: "",
    shift_end: "",
    base_rate: "",
    salary_amount: "",
    break_type: "",
    break_duration_minutes: "",
    meals: "",
    notes_to_workers: "",
    selected_dates: [],
    weekdays: [],
    start_date: "",
    end_date: "",
  });

  const [errors, setErrors] = useState({});

  // 1. Fetch companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      setCompaniesLoading(true);
      try {
        const response = await getCompaniesDropdown();
        const companiesData = response.data?.data || response.data || [];
        setCompanies(companiesData);
      } catch (error) {
        console.error("Error fetching companies:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load companies.",
        });
      } finally {
        setCompaniesLoading(false);
      }
    };
    fetchCompanies();
    const fetchSkills = async () => {
      if (!formData.designation_id) {
        setSkills([]);
        return;
      }
      setSkillsLoading(true);
      try {
        const response = await getSkillsByDesignation(
          formData.designation_id
        );
        setSkills(response.data.data.data ?? []);
      } catch (error) {
        console.error("Error fetching skills:", error);
        setSkills([]);
      } finally {
        setSkillsLoading(false);
      }

    };

    fetchSkills();
  }, [formData.designation_id]);

  // 2. Fetch designations when company_id changes
  useEffect(() => {
    const fetchDesignations = async () => {
      if (!formData.company_id) {
        setDesignations([]);
        return;
      }
      setDesignationsLoading(true);
      try {
        const response = await getDesignationsByCompanyDropdown(
          formData.company_id,
        );
        const designationsData = response.data?.data || response.data || [];
        setDesignations(designationsData);
      } catch (error) {
        console.error("Error fetching designations:", error);
        setDesignations([]);
      } finally {
        setDesignationsLoading(false);
      }
    };
    fetchDesignations();
  }, [formData.company_id]);

  // 3. Load vacancy data for edit mode
  useEffect(() => {
    const fetchVacancy = async () => {
      if (mode === "edit" && vacancyId) {
        try {
          setFormLoading(true);
          const response = await getVacancyAPI(vacancyId);
          const data = response.data.data;

          const rateType = data.rate_type || "";
          const baseRate = data.base_rate || "";
          const salaryAmount = rateType === "salary" ? baseRate : "";

          const breakType = data.break_type || "";
          const breakDuration = data.break_duration_minutes || "";
          const meals = data.meal_provided ? "provided" : "not_provided";

          let scheduleMode = "dates";
          let selectedDates = [];
          let weekdays = [];
          let startDate = "";
          let endDate = "";

          if (data.schedules && data.schedules.length > 0) {
            const schedule = data.schedules[0];
            scheduleMode = schedule.mode || "dates";
            if (scheduleMode === "salary") {
              startDate = schedule.start_date || "";
              endDate = schedule.end_date || "";
            }
            if (scheduleMode === "dates") {
              if (schedule.dates && Array.isArray(schedule.dates)) {
                if (
                  schedule.dates.length > 0 &&
                  typeof schedule.dates[0] === "string"
                ) {
                  selectedDates = schedule.dates.map((d) => d.split("T")[0]);
                } else {
                  selectedDates = schedule.dates
                    .map((d) => (d.date ? d.date.split("T")[0] : ""))
                    .filter(Boolean);
                }
              }
            } else if (scheduleMode === "weekly") {
              if (schedule.weekdays && Array.isArray(schedule.weekdays)) {
                if (
                  schedule.weekdays.length > 0 &&
                  typeof schedule.weekdays[0] === "number"
                ) {
                  weekdays = schedule.weekdays;
                } else {
                  weekdays = schedule.weekdays
                    .map((w) => w.weekday)
                    .filter(Boolean);
                }
              }
              startDate = schedule.start_date || "";
              endDate = schedule.end_date || "";
            }
          }

          setFormData({
            rate_type: rateType,
            company_id: data.company_id || "",
            designation_id: data.designation_id || "",
            skills: data.skills
              ? data.skills.map(skill => skill.id)
              : [],
            number_of_workers: data.number_of_workers || "",
            shift_start: data.shift_start_time || "",
            shift_end: data.shift_end_time || "",
            base_rate: rateType !== "salary" ? baseRate : "",
            salary_amount: salaryAmount,
            break_type: breakType,
            break_duration_minutes: breakDuration,
            meals,
            notes_to_workers: data.notes_to_workers || "",
            schedule_mode: scheduleMode,
            selected_dates: selectedDates,
            weekdays,
            start_date: startDate,
            end_date: endDate,
          });
        } catch (error) {
          console.error("Error fetching vacancy:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to load vacancy data.",
          });
        } finally {
          setFormLoading(false);
        }
      } else {
        setFormLoading(false);
      }
    };
    fetchVacancy();
  }, [mode, vacancyId]);

  const handleSubmit = async (localData) => {
    if (!localData.company_id) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select a company.",
      });
      return { success: false, message: "Company required" };
    }

    setLoading(true);

    try {
      const isSalary = localData.rate_type === "salary";

      const apiData = {
        company_id: String(localData.company_id),
        rate_type: isSalary ? "salary" : localData.rate_type,
        designation_id: localData.designation_id,
        skill_ids: localData.skills.map(Number),
        number_of_workers: localData.number_of_workers,
        shift_start_time: localData.shift_start,
        shift_end_time: localData.shift_end,
        break_type: localData.break_type || "none",
        break_duration_minutes:
          localData.break_type === "unpaid"
            ? localData.break_duration_minutes
            : null,
        meal_provided: localData.meals === "provided" ? 1 : 0,
        notes_to_workers: localData.notes_to_workers || null,
        base_rate: isSalary ? localData.salary_amount : localData.base_rate,
        mode: localData.schedule_mode,
        dates:
          localData.schedule_mode === "dates" ? localData.selected_dates : [],
        weekdays:
          localData.schedule_mode === "weekly" ? localData.weekdays : [],
        // start_date:
        //   localData.schedule_mode === "weekly" && localData.start_date
        //     ? localData.start_date
        //     : null,
        start_date:
          (localData.schedule_mode === "weekly" ||
            localData.schedule_mode === "salary") &&
          localData.start_date
            ? localData.start_date
            : null,
        end_date:
          localData.schedule_mode === "weekly" && localData.end_date
            ? localData.end_date
            : null,
      };

      const response =
        mode === "edit"
          ? await updateVacancyAPI(vacancyId, apiData)
          : await createVacancyAPI(apiData);

      const resData = response?.data;

      // if (resData?.status === 500) {
      //   const message =
      //     resData?.message || "Something went wrong";

      //   Swal.fire({
      //     icon: "warning ",
      //     title: "Error",
      //     text: message,
      //   });

      //   return {
      //     success: false,
      //     message,
      //   };
      // }
      if (resData?.status === 500) {
        const validationErrors = resData?.data || {};

        const firstError = Object.values(validationErrors)?.[0]?.[0];

        const message =
          firstError || resData?.message || "Something went wrong";

        Swal.fire({
          icon: "error",
          title: "Error",
          text: message,
        });

        return {
          success: false,
          errors: validationErrors,
          message,
        };
      }
      // ✅ SUCCESS CASE
      return {
        success: true,
        data: resData,
      };
    } catch (error) {
      console.error("Submit error:", error);

      const message = error?.message || "Something went wrong";

      return {
        success: false,
        message,
      };
    } finally {
      setLoading(false);
    }
  };
  // 5. Validation (no state/city)
  const validateForm = (localData) => {
    const newErrors = {};

    if (!localData.rate_type) newErrors.rate_type = "Job type is required";
    if (!localData.company_id) newErrors.company_id = "Company is required";
    if (!localData.designation_id)
      newErrors.designation_id = "Designation is required";
    if (!localData.skills || localData.skills.length === 0)
      newErrors.skills = "Skill is required";
    if (!localData.number_of_workers)
      newErrors.number_of_workers = "Number of workers is required";
    else if (localData.number_of_workers <= 0)
      newErrors.number_of_workers = "Must be at least 1";
    if (!localData.shift_start)
      newErrors.shift_start = "Shift start time is required";
    if (!localData.shift_end)
      newErrors.shift_end = "Shift end time is required";

    if (localData.rate_type === "salary") {
      if (!localData.salary_amount)
        newErrors.salary_amount = "Monthly salary is required";
      else if (localData.salary_amount <= 0)
        newErrors.salary_amount = "Salary must be positive";
    } else {
      if (!localData.base_rate) newErrors.base_rate = "Base rate is required";
      else if (localData.base_rate <= 0)
        newErrors.base_rate = "Rate must be positive";
    }

    if (localData.break_type === "unpaid") {
      if (!localData.break_duration_minutes) {
        newErrors.break_duration_minutes =
          "Break duration is required for unpaid breaks";
      } else if (localData.break_duration_minutes <= 0) {
        newErrors.break_duration_minutes = "Duration must be positive";
      }
    }

    if (localData.schedule_mode === "dates") {
      if (!localData.selected_dates || localData.selected_dates.length === 0) {
        newErrors.selected_dates = "At least one date must be selected";
      }
    } else if (localData.schedule_mode === "weekly") {
      if (!localData.weekdays || localData.weekdays.length === 0) {
        newErrors.weekdays = "At least one weekday must be selected";
      }
    }

    return newErrors;
  };

  // Helpers
  const updateFormData = (updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const updateErrors = (updates) => {
    setErrors((prev) => ({ ...prev, ...updates }));
  };

  const clearError = (field) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const clearAllErrors = () => setErrors({});

  return {
    loading,
    formLoading,
    formData,
    errors,
    companies,
    companiesLoading,
    designations,
    designationsLoading,
    skills,
    skillsLoading,
    handleSubmit,
    validateForm,
    updateFormData,
    updateErrors,
    clearError,
    clearAllErrors,
  };
};
