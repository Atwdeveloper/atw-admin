"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Swal from "sweetalert2";
import {
  getDesignationsPageAPI,
  getIndustriesAPI,
  getSkillCategoriesAPI,
  setDesignationStatusAPI,
  deleteDesignationAPI,
  bulkDeleteDesignationsAPI,
  bulkDesignationStatusAPI,
} from "../../../api/adminV1/masterdataAPI";
import { apiError } from "../../../api/javaApi";
import { useDebounce } from "../../../common/hooks/useDebounce";
import { showBulkResult } from "../utils/bulkResult";

const PAGE_SIZE = 10;

// Server-side paged listing: search, filters, sort and paging are all sent to
// GET /admin/masterdata/designations. The UI page is 1-based; the API is 0-based.
export const useDesignationListManagement = () => {
  const [designationRows, setDesignationRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPageState] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters, setFiltersState] = useState({
    search: "",
    status: "",
    industry_ids: [],
    skill_category_ids: [],
  });
  const [selectedIds, setSelectedIds] = useState([]);
  // Only name / status / createdAt are sortable on the backend.
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [industries, setIndustries] = useState([]);
  const [skillCategories, setSkillCategories] = useState([]);

  const debouncedSearch = useDebounce(filters.search, 500);

  const setPage = useCallback((p) => {
    setPageState(p);
    setSelectedIds([]);
  }, []);

  // Any filter change goes back to page 1 and clears the selection.
  const setFilters = useCallback((updater) => {
    setFiltersState(updater);
    setPageState(1);
    setSelectedIds([]);
  }, []);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: "asc" };
    });
    setPageState(1);
    setSelectedIds([]);
  };

  // Lookups for the industry filter and the skill category column
  useEffect(() => {
    getIndustriesAPI()
      .then((list) => setIndustries(list || []))
      .catch(() => setIndustries([]));
    getSkillCategoriesAPI()
      .then((list) => setSkillCategories(list || []))
      .catch(() => setSkillCategories([]));
  }, []);

  // Ignore responses from superseded requests (fast typing / paging).
  const requestSeq = useRef(0);

  const fetchDesignations = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const res = await getDesignationsPageAPI({
        page: page - 1,
        size: PAGE_SIZE,
        search: debouncedSearch.trim(),
        statuses: filters.status ? [filters.status] : undefined,
        industryIds: filters.industry_ids,
        skillCategoryIds: filters.skill_category_ids,
        sort: sortConfig.key ? `${sortConfig.key},${sortConfig.direction}` : undefined,
      });
      if (seq !== requestSeq.current) return;
      const pages = Math.max(1, res?.totalPages || 1);
      setDesignationRows(res?.content || []);
      setTotalRecords(res?.totalElements || 0);
      setTotalPages(pages);
      // Stay on a real page when the result set shrinks (e.g. after a delete)
      if (page > pages) setPageState(pages);
    } catch (error) {
      if (seq !== requestSeq.current) return;
      Swal.fire({
        icon: "error",
        title: "Failed to load designations",
        text: apiError(error, "Something went wrong").message,
      });
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [
    page,
    debouncedSearch,
    filters.status,
    filters.industry_ids,
    filters.skill_category_ids,
    sortConfig,
  ]);

  useEffect(() => {
    fetchDesignations();
  }, [fetchDesignations]);

  // Debounced search changes after the user stops typing; page was already reset
  // by setFilters, so only the selection needs resetting here.
  useEffect(() => {
    setSelectedIds([]);
  }, [debouncedSearch]);

  const designations = useMemo(() => {
    const categoryName = Object.fromEntries(skillCategories.map((c) => [c.id, c.name]));
    return designationRows.map((d) => ({
      ...d,
      skillCategoryName: categoryName[d.skillCategoryId] || null,
    }));
  }, [designationRows, skillCategories]);

  const nameOf = (id) => designationRows.find((d) => d.id === id)?.name || `#${id}`;

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

  const handleClear = useCallback(() => {
    setFilters({ search: "", status: "", industry_ids: [], skill_category_ids: [] });
  }, [setFilters]);

  const handleToggleStatus = async (id, currentStatus) => {
    const activating = currentStatus !== "ACTIVE";
    const action = activating ? "activate" : "deactivate";
    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `Do you want to ${action} this designation?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${action} it!`,
    });

    if (!result.isConfirmed) return;

    try {
      await setDesignationStatusAPI(id, activating ? "ACTIVE" : "INACTIVE");
      fetchDesignations();
      Swal.fire("Success!", `Designation ${action}d successfully.`, "success");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Action failed",
        text: apiError(error, "Something went wrong").message,
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete designation?",
      text: `"${nameOf(id)}" will be permanently deleted. This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteDesignationAPI(id);
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
      fetchDesignations();
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Designation deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      // 409 when skills/workers still reference it — show the backend's message
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: apiError(error, "Something went wrong").message,
      });
    }
  };

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

    const names = Object.fromEntries(selectedIds.map((id) => [id, nameOf(id)]));
    try {
      const res = await bulkDesignationStatusAPI(selectedIds, activate ? "ACTIVE" : "INACTIVE");
      setSelectedIds([]);
      fetchDesignations();
      showBulkResult({
        result: res,
        noun: "designation",
        verb: `${actionText}d`,
        nameOf: (id) => names[id] || `#${id}`,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Action failed",
        text: apiError(error, "Something went wrong").message,
      });
    }
  };

  const handleBulkActivate = () => handleBulkStatusChange(true);
  const handleBulkDeactivate = () => handleBulkStatusChange(false);

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;

    const result = await Swal.fire({
      title: "Delete designations?",
      text: `${count} selected designation${count > 1 ? "s" : ""} will be permanently deleted. Designations still used by skills or workers will be skipped.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    const names = Object.fromEntries(selectedIds.map((id) => [id, nameOf(id)]));
    try {
      const res = await bulkDeleteDesignationsAPI(selectedIds);
      setSelectedIds([]);
      fetchDesignations();
      showBulkResult({
        result: res,
        noun: "designation",
        verb: "deleted",
        nameOf: (id) => names[id] || `#${id}`,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: apiError(error, "Something went wrong").message,
      });
    }
  };

  return {
    designations,
    loading,
    page,
    totalPages,
    totalRecords,
    filters,
    setFilters,
    setPage,
    handleClear,
    handleToggleStatus,
    handleDelete,
    refresh: fetchDesignations,
    industries,
    skillCategories,
    selectedIds,
    toggleSelectDesignation,
    toggleSelectAll,
    handleBulkActivate,
    handleBulkDeactivate,
    handleBulkDelete,
    sortConfig,
    handleSort,
  };
};
