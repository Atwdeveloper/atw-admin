"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import {
  getMinimumWagesAPI,
  deleteMinimumWageAPI,
  toggleMinimumWageStatusAPI,
  getMinimumWageFilterOptionsAPI,
  bulkDeleteMinimumWagesAPI,
  bulkToggleMinimumWageStatusAPI,
} from "../../../api/admin/adminMinimumWageAPI";

export const useMinimumWageManagement = () => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters, setFilters] = useState({
    state_ids: [],
    skill_category_ids: [],
    status: "",
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: "asc" };
    });
    setPage(1);
  };

  const [states, setStates] = useState([]);
  const [skillCategories, setSkillCategories] = useState([]);
  const [initLoading, setInitLoading] = useState(true);

  // Keep filters stable in a ref for the fetch callback
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Fetch states + skill categories once for filter/form dropdowns
  const fetchInit = useCallback(async () => {
    setInitLoading(true);
    try {
      const response = await getMinimumWageFilterOptionsAPI();
      const data = response?.data || response || {};
      setStates(data.states || []);
      setSkillCategories(data.skill_categories || []);
    } catch (error) {
      console.error("Error fetching minimum wage filter options:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to load form data",
        text: error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setInitLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInit();
  }, [fetchInit]);

  // Core fetch function – depends only on page/sort, uses filters from ref
  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        state_ids: filtersRef.current.state_ids,
        skill_category_ids: filtersRef.current.skill_category_ids,
        status: filtersRef.current.status || undefined,
        sort_by: sortConfig.key || undefined,
        sort_dir: sortConfig.key ? sortConfig.direction : undefined,
      };
      const response = await getMinimumWagesAPI(params);
      const responseData = response.data;
      setRates(responseData.data || []);
      setTotalPages(responseData.last_page || 1);
      setTotalRecords(responseData.total || 0);
    } catch (error) {
      console.error("Error fetching minimum wage rates:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to load minimum wage rates",
        text: error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  }, [page, sortConfig]);

  // Trigger a fresh fetch (used by filter changes, clear, etc.)
  const triggerFetch = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Fetch whenever page or refreshTrigger changes
  useEffect(() => {
    fetchRates();
  }, [page, refreshTrigger, fetchRates]);

  // Selection is tied to the current page/filters — reset it whenever either changes
  useEffect(() => {
    setSelectedIds([]);
  }, [page, refreshTrigger]);

  const toggleSelectRate = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.length === rates.length ? [] : rates.map((r) => r.id),
    );
  };

  // Filter handler: reset page to 1 and force a refetch
  const handleSearch = useCallback(() => {
    setPage(1);
    triggerFetch();
  }, [triggerFetch]);

  // Clear all filters and refetch
  const handleClear = useCallback(() => {
    setFilters({ state_ids: [], skill_category_ids: [], status: "" });
    setPage(1);
    triggerFetch();
  }, [triggerFetch]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteMinimumWageAPI(id);

      if (response?.status !== 200) {
        Swal.fire({
          icon: "error",
          title: "Delete failed",
          text: response?.message || "Cannot delete minimum wage rate",
        });

        return;
      }

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Minimum wage rate has been deleted.",
      });

      fetchRates();
    } catch (error) {
      console.error("Error deleting minimum wage rate:", error);

      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: error.response?.data?.message || "Something went wrong",
      });
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const action = currentStatus === 1 ? "deactivate" : "activate";
    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `Do you want to ${action} this minimum wage rate?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${action} it!`,
    });

    if (!result.isConfirmed) return;

    try {
      const response = await toggleMinimumWageStatusAPI(id);

      if (response?.status !== 200) {
        Swal.fire({
          icon: "error",
          title: "Action failed",
          text: response?.message || "Cannot update minimum wage rate status",
        });

        return;
      }

      Swal.fire("Success!", `Minimum wage rate ${action}d successfully.`, "success");
      fetchRates();
    } catch (error) {
      console.error("Error toggling status:", error);
      Swal.fire({
        icon: "error",
        title: "Action failed",
        text: error.response?.data?.message || "Something went wrong",
      });
    }
  };

  const handleBulkStatusChange = async (activate) => {
    if (selectedIds.length === 0) return;
    const actionText = activate ? "activate" : "deactivate";
    const count = selectedIds.length;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `${count} selected rate${count > 1 ? "s" : ""} will be ${actionText}d.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${actionText}`,
      cancelButtonText: "Cancel",
      confirmButtonColor: activate ? "#16a34a" : "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      await bulkToggleMinimumWageStatusAPI(selectedIds, activate ? 1 : 0);
      setSelectedIds([]);
      fetchRates();

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: `Selected rates have been ${actionText}d.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Failed to ${actionText} selected rates.`,
      });
    }
  };

  const handleBulkActivate = () => handleBulkStatusChange(true);
  const handleBulkDeactivate = () => handleBulkStatusChange(false);

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `${count} selected rate${count > 1 ? "s" : ""} will be permanently deleted.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      await bulkDeleteMinimumWagesAPI(selectedIds);
      setSelectedIds([]);
      fetchRates();

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Selected rates have been deleted.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete selected rates.",
      });
    }
  };

  return {
    rates,
    loading,
    page,
    totalPages,
    totalRecords,
    filters,
    setFilters,
    setPage,
    handleSearch,
    handleClear,
    handleDelete,
    handleToggleStatus,
    refresh: fetchRates,
    states,
    skillCategories,
    initLoading,
    selectedIds,
    toggleSelectRate,
    toggleSelectAll,
    handleBulkActivate,
    handleBulkDeactivate,
    handleBulkDelete,
    sortConfig,
    handleSort,
  };
};
