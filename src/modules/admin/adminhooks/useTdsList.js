"use client";

import { useState, useEffect } from "react";
import { getTdsListAPI, deleteTdsAPI, activateTdsAPI, deactivateTdsAPI } from "../../../api/admin/adminTdsAPI";
import Swal from "sweetalert2";

export const useTdsList = () => {
  const [tdsRules, setTdsRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  
  // Filter state object (matching deduction template hook style)
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
  });

  const fetchTdsList = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: pagination.itemsPerPage,
      };
      if (filters.search) params.search = filters.search;
      if (filters.status !== "all") params.is_active = filters.status === "active" ? 1 : 0;

      const response = await getTdsListAPI(params);
      const data = response?.data;
      
      if (Array.isArray(data)) {
        setTdsRules(data);
        if (response.meta) {
          setPagination({
            currentPage: response.meta.current_page || page,
            totalPages: response.meta.last_page || 1,
            totalItems: response.meta.total || data.length,
            itemsPerPage: response.meta.per_page || pagination.itemsPerPage,
          });
        } else {
          setPagination(prev => ({
            ...prev,
            currentPage: page,
            totalItems: data.length,
            totalPages: Math.ceil(data.length / prev.itemsPerPage),
          }));
        }
      } else {
        setTdsRules([]);
      }
    } catch (error) {
      console.error("Failed to fetch TDS list:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not load TDS rules.",
      });
      setTdsRules([]);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when filters change (with debounce)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTdsList(1);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [filters]);

  const handlePageChange = (newPage) => {
    fetchTdsList(newPage);
  };

  const handleClear = () => {
    setFilters({ search: "", status: "all" });
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Delete TDS rule "${name}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });
    if (result.isConfirmed) {
      try {
        await deleteTdsAPI(id);
        Swal.fire("Deleted!", "TDS rule has been deleted.", "success");
        fetchTdsList(pagination.currentPage);
      } catch (error) {
        Swal.fire("Error", error.response?.data?.message || "Delete failed.", "error");
      }
    }
  };

  const handleToggleActive = async (id, currentStatus, name) => {
    const action = currentStatus === 1 ? "deactivate" : "activate";
    const result = await Swal.fire({
      title: `Confirm ${action}`,
      text: `Are you sure you want to ${action} TDS rule "${name}"?`,
      icon: "question",
      showCancelButton: true,
    });
    if (result.isConfirmed) {
      try {
        if (currentStatus === 1) {
          await deactivateTdsAPI(id);
        } else {
          await activateTdsAPI(id);
        }
        Swal.fire("Success", `TDS rule ${action}d successfully.`, "success");
        fetchTdsList(pagination.currentPage);
      } catch (error) {
        Swal.fire("Error", error.response?.data?.message || "Action failed.", "error");
      }
    }
  };

  return {
    tdsRules,
    loading,
    pagination,
    filters,
    setFilters,
    handlePageChange,
    handleClear,
    handleDelete,
    handleToggleActive,
    fetchTdsList,
  };
};