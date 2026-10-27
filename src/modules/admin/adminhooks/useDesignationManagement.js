"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import {
  getDesignationsByIndustryAPI,
  deleteDesignationAPI,
  toggleDesignationStatusAPI,
  bulkDeleteDesignationsAPI,
  bulkToggleDesignationStatusAPI,
} from "../../../api/admin/adminDesignationAPI";

export const useDesignationManagement = (industryId) => {
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });

  // ---------------- FETCH DESIGNATIONS ----------------
  const fetchDesignations = useCallback(async () => {
    if (!industryId) return;

    setLoading(true);

    try {
      const params = {
        page,
        per_page: 10, // ✅ better than limit for Laravel pagination
        search: filters.search || undefined,
        status: filters.status || undefined,
      };

      const response = await getDesignationsByIndustryAPI(industryId, params);

      const apiData = response.data || {};

      // ✅ designation list
      setDesignations(apiData.data || []);

      // ✅ pagination fix
      setTotalPages(apiData.last_page || 1);

      // ✅ total records
      setTotalRecords(apiData.total || 0);
    } catch (error) {
      console.error("Error fetching designations:", error);

      // Optional error alert
      // Swal.fire({
      //   icon: "error",
      //   title: "Failed to load designations",
      //   text: error.response?.data?.message || "Something went wrong",
      // });

      setDesignations([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [industryId, page, filters.search, filters.status]);

  // ---------------- INITIAL FETCH ----------------
  useEffect(() => {
    fetchDesignations();
  }, [fetchDesignations]);

  // Selection is tied to the current page/filters — reset it whenever either changes
  useEffect(() => {
    setSelectedIds([]);
  }, [page, filters.search, filters.status]);

  const toggleSelectDesignation = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.length === designations.length ? [] : designations.map((d) => d.id),
    );
  };

  // ---------------- SEARCH ----------------
  const handleSearch = () => {
    setPage(1);
    fetchDesignations();
  };

  // ---------------- CLEAR FILTERS ----------------
  const handleClear = () => {
    setFilters({
      search: "",
      status: "",
    });

    setPage(1);
  };

  // ---------------- DELETE DESIGNATION ----------------

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
      const response = await deleteDesignationAPI(id);

      // Handle API response that returns status in body
      if (response?.status === 500 || response?.data?.success === false) {
        return Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: response?.message || "This designation cannot be deleted",
        });
      }

      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Designation has been deleted.",
      });

      fetchDesignations();
    } catch (error) {
      console.error("Error deleting designation:", error);

      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text:
          error?.response?.data?.message ||
          error?.message ||
          "Something went wrong",
      });
    }
  };

  // ---------------- TOGGLE STATUS ----------------
  const handleToggleStatus = async (id, currentStatus) => {
    const action = Number(currentStatus) === 1 ? "deactivate" : "activate";

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to ${action} this designation?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${action} it!`,
    });

    if (!result.isConfirmed) return;

    try {
      await toggleDesignationStatusAPI(id);

      Swal.fire("Success!", `Designation ${action}d successfully.`, "success");

      fetchDesignations();
    } catch (error) {
      console.error("Error toggling status:", error);

      Swal.fire({
        icon: "error",
        title: "Action failed",
        text: error.response?.data?.message || "Something went wrong",
      });
    }
  };

  // ---------------- BULK ACTIONS ----------------
  const handleBulkStatusChange = async (activate) => {
    if (selectedIds.length === 0) return;
    const actionText = activate ? "activate" : "deactivate";
    const count = selectedIds.length;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `${count} selected designation${count > 1 ? "s" : ""} will be ${actionText}d.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${actionText}`,
      cancelButtonText: "Cancel",
      confirmButtonColor: activate ? "#16a34a" : "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      await bulkToggleDesignationStatusAPI(selectedIds, activate ? 1 : 0);
      setSelectedIds([]);
      fetchDesignations();

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: `Selected designations have been ${actionText}d.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Failed to ${actionText} selected designations.`,
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
      text: `${count} selected designation${count > 1 ? "s" : ""} will be permanently deleted.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      await bulkDeleteDesignationsAPI(selectedIds);
      setSelectedIds([]);
      fetchDesignations();

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Selected designations have been deleted.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete selected designations.",
      });
    }
  };

  return {
    designations,
    loading,

    // Pagination
    page,
    setPage,
    totalPages,
    totalRecords,

    // Filters
    filters,
    setFilters,

    // Actions
    handleSearch,
    handleClear,
    handleDelete,
    handleToggleStatus,

    // Bulk selection
    selectedIds,
    toggleSelectDesignation,
    toggleSelectAll,
    handleBulkActivate,
    handleBulkDeactivate,
    handleBulkDelete,

    // Refresh
    refresh: fetchDesignations,
  };
};
