"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import {
  getSkillCategoriesPageAPI,
  setSkillCategoryStatusAPI,
  bulkSkillCategoryStatusAPI,
  deleteSkillCategoryAPI,
  bulkDeleteSkillCategoriesAPI,
} from "../../../api/adminV1/masterdataAPI";
import { apiError } from "../../../api/javaApi";
import { useDebounce } from "../../../common/hooks/useDebounce";
import { showBulkResult } from "../utils/bulkResult";

const PAGE_SIZE = 10;
// Only these fields are sortable server-side (anything else is a 400).
const SORTABLE = ["name", "status", "createdAt"];

// Server-side paging / search / status filter / sort against the Java API.
export const useSkillCategoryManagement = () => {
  const [skillCategories, setSkillCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters, setFilters] = useState({ search: "", status: "" });
  const debouncedSearch = useDebounce(filters.search, 500);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    if (!SORTABLE.includes(key)) return;
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: "asc" };
    });
    setPage(1);
  };

  // Ignore responses from superseded requests (e.g. filter change + page reset)
  const requestRef = useRef(0);

  const fetchSkillCategories = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    try {
      const res = await getSkillCategoriesPageAPI({
        search: debouncedSearch.trim(),
        statuses: filters.status ? [filters.status] : undefined,
        page: page - 1,
        size: PAGE_SIZE,
        sort: sortConfig.key ? `${sortConfig.key},${sortConfig.direction}` : undefined,
      });
      if (requestId !== requestRef.current) return;
      setSkillCategories(res?.content || []);
      setTotalRecords(res?.totalElements ?? 0);
      setTotalPages(Math.max(1, res?.totalPages ?? 1));
    } catch (error) {
      if (requestId !== requestRef.current) return;
      Swal.fire({
        icon: "error",
        title: "Failed to load skill categories",
        text: apiError(error).message,
      });
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [debouncedSearch, filters.status, page, sortConfig]);

  useEffect(() => {
    fetchSkillCategories();
  }, [fetchSkillCategories]);

  // A new search/status filter always starts from page 1
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.status]);

  // Selection is tied to the current page/filters — reset it whenever either changes
  useEffect(() => {
    setSelectedIds([]);
  }, [page, debouncedSearch, filters.status, sortConfig]);

  // Step back if the current page emptied out (e.g. after a delete)
  useEffect(() => {
    if (!loading && page > totalPages) setPage(totalPages);
  }, [loading, page, totalPages]);

  const toggleSelectSkillCategory = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.length === skillCategories.length
        ? []
        : skillCategories.map((s) => s.id),
    );
  };

  const handleClear = useCallback(() => {
    setFilters({ search: "", status: "" });
    setPage(1);
  }, []);

  const nameOf = (id) => skillCategories.find((s) => s.id === id)?.name || `#${id}`;

  const handleToggleStatus = async (id, currentStatus) => {
    const activating = currentStatus !== "ACTIVE";
    const action = activating ? "activate" : "deactivate";
    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `Do you want to ${action} this skill category?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${action} it!`,
    });

    if (!result.isConfirmed) return;

    try {
      await setSkillCategoryStatusAPI(id, activating ? "ACTIVE" : "INACTIVE");
      Swal.fire("Success!", `Skill category ${action}d successfully.`, "success");
      fetchSkillCategories();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Action failed",
        text: apiError(error).message,
      });
    }
  };

  const handleDelete = async (skillCategory) => {
    const result = await Swal.fire({
      title: "Delete skill category?",
      text: `"${skillCategory.name}" will be permanently deleted.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });
    if (!result.isConfirmed) return;

    try {
      await deleteSkillCategoryAPI(skillCategory.id);
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Skill category deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
      setSelectedIds((prev) => prev.filter((sid) => sid !== skillCategory.id));
      fetchSkillCategories();
    } catch (error) {
      // 409 when still used by designations or minimum wage rates — backend message explains
      Swal.fire({
        icon: "error",
        title: "Couldn't delete",
        text: apiError(error).message,
      });
    }
  };

  const handleBulkStatusChange = async (activate) => {
    if (selectedIds.length === 0) return;
    const actionText = activate ? "activate" : "deactivate";
    const count = selectedIds.length;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `${count} selected skill categor${count > 1 ? "ies" : "y"} will be ${actionText}d.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${actionText}`,
      cancelButtonText: "Cancel",
      confirmButtonColor: activate ? "#16a34a" : "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await bulkSkillCategoryStatusAPI(
        [...selectedIds],
        activate ? "ACTIVE" : "INACTIVE",
      );
      showBulkResult({
        result: res,
        noun: "skill category",
        nounPlural: "skill categories",
        verb: `${actionText}d`,
        nameOf,
      });
      setSelectedIds([]);
      fetchSkillCategories();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Action failed", text: apiError(error).message });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;

    const result = await Swal.fire({
      title: "Delete selected?",
      text: `${count} selected skill categor${count > 1 ? "ies" : "y"} will be permanently deleted. Categories still in use will be skipped.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await bulkDeleteSkillCategoriesAPI([...selectedIds]);
      showBulkResult({
        result: res,
        noun: "skill category",
        nounPlural: "skill categories",
        verb: "deleted",
        nameOf,
      });
      setSelectedIds([]);
      fetchSkillCategories();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Delete failed", text: apiError(error).message });
    }
  };

  const handleBulkActivate = () => handleBulkStatusChange(true);
  const handleBulkDeactivate = () => handleBulkStatusChange(false);

  return {
    skillCategories,
    loading,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
    totalRecords,
    filters,
    setFilters,
    setPage,
    handleClear,
    handleToggleStatus,
    handleDelete,
    refresh: fetchSkillCategories,
    selectedIds,
    toggleSelectSkillCategory,
    toggleSelectAll,
    handleBulkActivate,
    handleBulkDeactivate,
    handleBulkDelete,
    sortConfig,
    handleSort,
  };
};
