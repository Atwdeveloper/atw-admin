"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import {
  getSkillsPageAPI,
  getDesignationAPI,
  setSkillStatusAPI,
  deleteSkillAPI,
  bulkSkillStatusAPI,
  bulkDeleteSkillsAPI,
} from "../../../api/adminV1/masterdataAPI";
import { apiError } from "../../../api/javaApi";
import { useDebounce } from "../../../common/hooks/useDebounce";
import { showBulkResult } from "../utils/bulkResult";

export const PAGE_SIZE = 10;

// Backend only accepts these sort fields (anything else is a 400).
const SORTABLE = ["name", "status", "createdAt"];

// Skills of one designation, paged/filtered/sorted on the server.
export const useSkillManagement = (designationId) => {
  const [skills, setSkills] = useState([]);
  const [designation, setDesignation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters, setFilters] = useState({
    search: "",
    status: "", // "" | "ACTIVE" | "INACTIVE"
  });
  const debouncedSearch = useDebounce(filters.search, 400).trim();
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    if (!SORTABLE.includes(key)) return;
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: "asc" };
    });
  };

  // Ignore responses from requests that were superseded
  const requestSeq = useRef(0);

  const fetchSkills = useCallback(async () => {
    if (!designationId) return;
    const seq = ++requestSeq.current;
    setLoading(true);
    setLoadError("");
    try {
      const res = await getSkillsPageAPI({
        designationIds: [designationId],
        statuses: filters.status ? [filters.status] : undefined,
        search: debouncedSearch || undefined,
        page: page - 1,
        size: PAGE_SIZE,
        sort: sortConfig.key ? `${sortConfig.key},${sortConfig.direction}` : undefined,
      });
      if (seq !== requestSeq.current) return;

      const content = res?.content || [];
      const pages = res?.totalPages || 0;
      // Current page vanished (e.g. last row deleted) — step back to the last real page.
      if (content.length === 0 && page > 1 && pages < page) {
        setPage(Math.max(1, pages));
        return;
      }
      setSkills(content);
      setTotalRecords(res?.totalElements ?? content.length);
      setTotalPages(Math.max(1, pages));
    } catch (error) {
      if (seq !== requestSeq.current) return;
      setSkills([]);
      setTotalRecords(0);
      setTotalPages(1);
      setLoadError(apiError(error, "Couldn't load skills.").message);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [designationId, filters.status, debouncedSearch, page, sortConfig]);

  // A filter or sort change goes back to page 1 (and clears the selection)
  // before fetching, so we never request a stale page with new filters.
  const filterKey = JSON.stringify([
    designationId,
    debouncedSearch,
    filters.status,
    sortConfig.key,
    sortConfig.direction,
  ]);
  const lastFilterKey = useRef(filterKey);

  useEffect(() => {
    if (lastFilterKey.current !== filterKey) {
      lastFilterKey.current = filterKey;
      setSelectedIds([]);
      if (page !== 1) {
        setPage(1);
        return;
      }
    }
    fetchSkills();
  }, [filterKey, page, fetchSkills]);

  // Selection is tied to the current page — reset it when the page changes
  useEffect(() => {
    setSelectedIds([]);
  }, [page]);

  // Designation details for the header/breadcrumb
  useEffect(() => {
    if (!designationId) return;
    getDesignationAPI(designationId)
      .then(setDesignation)
      .catch(() => setDesignation(null));
  }, [designationId]);

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

  const nameOf = (id) => skills.find((s) => s.id === id)?.name || id;

  const handleClear = () => {
    setFilters({ search: "", status: "" });
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const activating = currentStatus !== "ACTIVE";
    const action = activating ? "activate" : "deactivate";
    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `Do you want to ${action} this skill?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${action} it!`,
    });

    if (!result.isConfirmed) return;

    try {
      await setSkillStatusAPI(id, activating ? "ACTIVE" : "INACTIVE");
      Swal.fire("Success!", `Skill ${action}d successfully.`, "success");
      // Refetch: with a status filter applied the row may drop off this page.
      fetchSkills();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Action failed",
        text: apiError(error).message,
      });
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: "Delete skill?",
      text: `"${name || "This skill"}" will be permanently deleted. This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteSkillAPI(id);
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Skill deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
      fetchSkills();
    } catch (error) {
      // 409 CONFLICT carries a friendly "still in use" message
      Swal.fire({
        icon: "error",
        title: "Couldn't delete skill",
        text: apiError(error, "Failed to delete skill").message,
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
      const res = await bulkSkillStatusAPI(selectedIds, activate ? "ACTIVE" : "INACTIVE");
      setSelectedIds([]);
      fetchSkills();
      showBulkResult({ result: res, noun: "skill", verb: `${actionText}d`, nameOf });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Action failed",
        text: apiError(error).message,
      });
    }
  };

  const handleBulkActivate = () => handleBulkStatusChange(true);
  const handleBulkDeactivate = () => handleBulkStatusChange(false);

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;

    const result = await Swal.fire({
      title: "Delete skills?",
      text: `${count} selected skill${count > 1 ? "s" : ""} will be permanently deleted. Skills still in use will be skipped.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await bulkDeleteSkillsAPI(selectedIds);
      setSelectedIds([]);
      fetchSkills();
      showBulkResult({ result: res, noun: "skill", verb: "deleted", nameOf });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: apiError(error).message,
      });
    }
  };

  return {
    skills,
    designation,
    loading,
    loadError,
    page,
    totalPages,
    totalRecords,
    filters,
    setFilters,
    setPage,
    handleClear,
    handleToggleStatus,
    handleDelete,
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
