"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/navigation";
import {
  getTdsDetailsAPI,
  createTdsAPI,
  updateTdsAPI,
} from "../../../api/admin/adminTdsAPI";
import Swal from "sweetalert2";

export const useTdsForm = (tdsId = null) => {
  const navigate = useNavigate();
  const isEditMode = !!tdsId;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [formData, setFormData] = useState({
    financial_year: "",
    applicable_from: "",
    applicable_to: "",
    is_active: true,
  });

  const [slabs, setSlabs] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode) {
      fetchTdsDetails();
    } else {
      setInitialLoading(false);
    }
  }, [tdsId]);

  const fetchTdsDetails = async () => {
    try {
      const response = await getTdsDetailsAPI(tdsId);
      const data = response?.data;
      if (data) {
        setFormData({
          financial_year: data.financial_year || "",
          applicable_from: data.applicable_from || "",
          applicable_to: data.applicable_to || "",
          is_active: data.is_active === 1,
        });
        // Assuming API returns slabs in data.slabs
        setSlabs(data.slabs || []);
      }
    } catch (error) {
      console.error("Failed to fetch TDS details:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not load TDS rule details.",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Slab handlers
  const addSlab = () => {
    setSlabs([
      ...slabs,
      {
        id: null, // will be assigned by backend for existing, temp key for new
        tempId: Date.now(),
        min_income: "",
        max_income: "",
        rate: "",
        age_group: "general", // default
      },
    ]);
  };

  const removeSlab = (index) => {
    setSlabs(slabs.filter((_, i) => i !== index));
  };

  const handleSlabChange = (index, field, value) => {
    const updated = [...slabs];
    updated[index][field] = value;
    setSlabs(updated);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.financial_year.trim()) {
      newErrors.financial_year = "Financial year is required";
    }
    if (!formData.applicable_from) {
      newErrors.applicable_from = "Applicable from date is required";
    }
    if (!formData.applicable_to) {
      newErrors.applicable_to = "Applicable to date is required";
    }
    if (formData.applicable_from && formData.applicable_to) {
      if (
        new Date(formData.applicable_from) > new Date(formData.applicable_to)
      ) {
        newErrors.applicable_to = "End date must be after start date";
      }
    }

    // Validate slabs
    if (slabs.length === 0) {
      newErrors.slabs = "At least one slab is required";
    } else {
      const slabErrors = [];
      slabs.forEach((slab, idx) => {
        const err = {};
        if (!slab.min_income && slab.min_income !== 0) {
          err.min_income = "Min income required";
        }
        if (!slab.rate) {
          err.rate = "Rate required";
        }
        if (
          slab.min_income &&
          slab.max_income &&
          Number(slab.min_income) >= Number(slab.max_income)
        ) {
          err.max_income = "Max must be greater than min";
        }
        if (Object.keys(err).length > 0) {
          slabErrors[idx] = err;
        }
      });
      if (slabErrors.length > 0) {
        newErrors.slabErrors = slabErrors;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      financial_year: formData.financial_year,
      applicable_from: formData.applicable_from,
      applicable_to: formData.applicable_to,
      is_active: formData.is_active ? 1 : 0,
      slabs: slabs.map(({ id, min_income, max_income, rate, age_group }) => ({
        id: id || null,
        min_income: parseFloat(min_income),
        max_income: max_income ? parseFloat(max_income) : null,
        rate: parseFloat(rate),
        age_group,
      })),
    };

    setLoading(true);
    try {
      if (isEditMode) {
        await updateTdsAPI(tdsId, payload);
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "TDS rule has been updated successfully.",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await createTdsAPI(payload);
        Swal.fire({
          icon: "success",
          title: "Created!",
          text: "TDS rule has been created successfully.",
          timer: 2000,
          showConfirmButton: false,
        });
      }
      navigate("/admin/tds");
    } catch (error) {
      console.error("Save failed:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Could not save TDS rule.",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    initialLoading,
    formData,
    slabs,
    errors,
    handleInputChange,
    addSlab,
    removeSlab,
    handleSlabChange,
    handleSubmit,
    isEditMode,
  };
};
