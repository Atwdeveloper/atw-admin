"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import {
  getDesignationsPageAPI,
  getIndustryAPI,
  setDesignationStatusAPI,
  deleteDesignationAPI,
  bulkDesignationStatusAPI,
  bulkDeleteDesignationsAPI,
} from "../../../api/adminV1/masterdataAPI";
import { apiError } from "../../../api/javaApi";
import { useDebounce } from "../../../common/hooks/useDebounce";
import { showBulkResult } from "../utils/bulkResult";

export const PAGE_SIZE = 10;

// Backend only accepts these sort fields (anything else is a 400).
const SORTABLE = ["name", "status", "createdAt"];

// Designations of one industry, paged/filtered/sorted on the server.
export const useDesignationManagement = (industryId) => {
  const [designations, setDesignations] = useState([]);
  const [industry, setIndustry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination (UI is 1-based, API is 0-based)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters — status is "" | "ACTIVE" | "INACTIVE"
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });
  const debouncedSearch = useDebounce(filters.search, 400).trim();

  // Sorting — { key: "name" | "status" | "createdAt" | null, direction }
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

  // ---------------- FETCH DESIGNATIONS ----------------
  const fetchDesignations = useCallback(async () => {
    if (!industryId) return;

    const seq = ++requestSeq.current;
    setLoading(true);
    setLoadError("");

    try {
      const res = await getDesignationsPageAPI({
        industryIds: [industryId],
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
      setDesignations(content);
      setTotalRecords(res?.totalElements ?? content.length);
      setTotalPages(Math.max(1, pages));
    } catch (error) {
      if (seq !== requestSeq.current) return;
      setDesignations([]);
      setTotalRecords(0);
      setTotalPages(1);
      setLoadError(apiError(error, "Couldn't load designations.").message);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [industryId, filters.status, debouncedSearch, page, sortConfig]);

  // Industry header name (the ?name= query param is only a fallback)
  useEffect(() => {
    if (!industryId) return;
    getIndustryAPI(industryId)
      .then(setIndustry)
      .catch(() => setIndustry(null));
  }, [industryId]);

  // ---------------- FETCH ON PAGE / FILTER / SORT CHANGE ----------------
  // A filter or sort change goes back to page 1 (and clears the selection)
  // before fetching, so we never request a stale page with new filters.
  const filterKey = JSON.stringify([
    industryId,
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
    fetchDesignations();
  }, [filterKey, page, fetchDesignations]);

  // Selection is tied to the current page — reset it when the page changes
  useEffect(() => {
    setSelectedIds([]);
  }, [page]);

  const toggleSelectDesignation = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    const pageIds = designations.map((d) => d.id);
    setSelectedIds((prev) => (prev.length === pageIds.length ? [] : pageIds));
  };

  const nameOf = (id) => designations.find((d) => d.id === id)?.name || id;

  // ---------------- CLEAR FILTERS ----------------
  const handleClear = () => {
    setFilters({
      search: "",
      status: "",
    });
  };

  // ---------------- SET STATUS ----------------
  const handleToggleStatus = async (id, currentStatus) => {
    const activate = currentStatus !== "ACTIVE";
    const action = activate ? "activate" : "deactivate";

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to ${action} this designation?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${action} it!`,
    });

    if (!result.isConfirmed) return;

    try {
      await setDesignationStatusAPI(id, activate ? "ACTIVE" : "INACTIVE");

      Swal.fire("Success!", `Designation ${action}d successfully.`, "success");

      fetchDesignations();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Action failed",
        text: apiError(error).message,
      });
    }
  };

  // ---------------- DELETE ----------------
  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: "Delete designation?",
      text: `"${name || "This designation"}" will be permanently deleted. This cannot be undone.`,
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
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Designation deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
      fetchDesignations();
    } catch (error) {
      // 409 CONFLICT carries a friendly "still in use" message
      Swal.fire({
        icon: "error",
        title: "Couldn't delete designation",
        text: apiError(error, "Failed to delete designation").message,
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
      const res = await bulkDesignationStatusAPI(selectedIds, activate ? "ACTIVE" : "INACTIVE");
      setSelectedIds([]);
      fetchDesignations();
      showBulkResult({ result: res, noun: "designation", verb: `${actionText}d`, nameOf });
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
      title: "Delete designations?",
      text: `${count} selected designation${count > 1 ? "s" : ""} will be permanently deleted. Designations still in use will be skipped.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await bulkDeleteDesignationsAPI(selectedIds);
      setSelectedIds([]);
      fetchDesignations();
      showBulkResult({ result: res, noun: "designation", verb: "deleted", nameOf });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: apiError(error).message,
      });
    }
  };

  return {
    // Current page of designations (already filtered/sorted by the server)
    designations,
    industry,
    loading,
    loadError,

    // Pagination
    page,
    setPage,
    totalPages,
    totalRecords,

    // Filters
    filters,
    setFilters,

    // Sorting
    sortConfig,
    handleSort,

    // Actions
    handleClear,
    handleToggleStatus,
    handleDelete,

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
