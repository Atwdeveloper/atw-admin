"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import {
  getSkillsAPI,
  deleteSkillAPI,
  toggleSkillStatusAPI,
  bulkDeleteSkillsAPI,
  bulkToggleSkillStatusAPI,
} from "../../../api/admin/adminSkillAPI";

export const useSkillManagement = (designationId) => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });
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

  const fetchSkills = useCallback(async () => {
    if (!designationId) return;
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: filters.search || undefined,
        status: filters.status || undefined,
        designation_id: designationId,
        sort_by: sortConfig.key || undefined,
        sort_dir: sortConfig.key ? sortConfig.direction : undefined,
      };
      const response = await getSkillsAPI(params);
      const responseData = response.data;
      setSkills(responseData.data || []);
      setTotalPages(responseData.last_page || 1);
      setTotalRecords(responseData.total || 0);
    } catch (error) {
      console.error("Error fetching skills:", error);
      // Swal.fire({
      //   icon: "error",
      //   title: "Failed to load skills",
      //   text: error.response?.data?.message || "Something went wrong",
      // });
    } finally {
      setLoading(false);
    }
  }, [designationId, page, filters.search, filters.status, sortConfig]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  // Selection is tied to the current page/filters — reset it whenever either changes
  useEffect(() => {
    setSelectedIds([]);
  }, [page, filters.search, filters.status]);

  const toggleSelectSkill = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.length === skills.length ? [] : skills.map((s) => s.id),
    );
  };

  const handleSearch = () => {
    setPage(1);
    fetchSkills();
  };

  const handleClear = () => {
    setFilters({ search: "", status: "" });
    setPage(1);
  };

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
      await deleteSkillAPI(id);
      Swal.fire("Deleted!", "Skill has been deleted.", "success");
      fetchSkills();
    } catch (error) {
      console.error("Error deleting skill:", error);
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
      text: `Do you want to ${action} this skill?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${action} it!`,
    });

    if (!result.isConfirmed) return;

    try {
      await toggleSkillStatusAPI(id);
      Swal.fire("Success!", `Skill ${action}d successfully.`, "success");
      fetchSkills();
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
      text: `${count} selected skill${count > 1 ? "s" : ""} will be ${actionText}d.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${actionText}`,
      cancelButtonText: "Cancel",
      confirmButtonColor: activate ? "#16a34a" : "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      await bulkToggleSkillStatusAPI(selectedIds, activate ? 1 : 0);
      setSelectedIds([]);
      fetchSkills();

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: `Selected skills have been ${actionText}d.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Failed to ${actionText} selected skills.`,
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
      text: `${count} selected skill${count > 1 ? "s" : ""} will be permanently deleted.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      await bulkDeleteSkillsAPI(selectedIds);
      setSelectedIds([]);
      fetchSkills();

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Selected skills have been deleted.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete selected skills.",
      });
    }
  };

  return {
    skills,
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
    refresh: fetchSkills,
    selectedIds,
    toggleSelectSkill,
    toggleSelectAll,
    handleBulkActivate,
    handleBulkDeactivate,
    handleBulkDelete,
    sortConfig,
    handleSort,
  };
};