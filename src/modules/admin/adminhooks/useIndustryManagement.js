"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Swal from "sweetalert2";
import {
  getIndustriesPageAPI,
  getDesignationsAPI,
  setIndustryStatusAPI,
  deleteIndustryAPI,
  bulkDeleteIndustriesAPI,
  bulkIndustryStatusAPI,
} from "../../../api/adminV1/masterdataAPI";
import { apiError } from "../../../api/javaApi";
import { useDebounce } from "../../../common/hooks/useDebounce";
import { showBulkResult } from "../utils/bulkResult";

const PAGE_SIZE = 10;
// Fields the Java list endpoint can sort by (anything else is a 400).
const SORTABLE = ["name", "status", "createdAt"];

// Search, status filter, sort and paging all happen on the server
// (GET /admin/masterdata/industries is paged). Pass withDesignations (needs
// designation.view) to also count each industry's designations from one extra
// list call.
export const useIndustryManagement = ({ withDesignations = false } = {}) => {
  const [rows, setRows] = useState([]);
  const [designations, setDesignations] = useState([]);
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
  const requestRef = useRef(0);

  const debouncedSearch = useDebounce(filters.search.trim(), 500);

  // Back to page 1 (and drop the selection) whenever the query changes. Done
  // during render so the fetch below never runs with a stale page number.
  const queryKey = JSON.stringify([debouncedSearch, filters.status, sortConfig]);
  const [prevQueryKey, setPrevQueryKey] = useState(queryKey);
  if (prevQueryKey !== queryKey) {
    setPrevQueryKey(queryKey);
    setPage(1);
    setSelectedIds([]);
  }

  const handleSort = (key) => {
    if (!SORTABLE.includes(key)) return;
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: "asc" };
    });
  };

  const fetchIndustries = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    try {
      const data = await getIndustriesPageAPI({
        page: page - 1,
        size: PAGE_SIZE,
        search: debouncedSearch,
        statuses: filters.status ? [filters.status] : undefined,
        sort: sortConfig.key ? `${sortConfig.key},${sortConfig.direction}` : undefined,
      });
      if (requestId !== requestRef.current) return;
      setRows(data?.content || []);
      setTotalPages(Math.max(1, data?.totalPages || 1));
      setTotalRecords(data?.totalElements || 0);
    } catch (error) {
      if (requestId !== requestRef.current) return;
      Swal.fire({
        icon: "error",
        title: "Failed to load industries",
        text: apiError(error, "Something went wrong").message,
      });
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [page, debouncedSearch, filters.status, sortConfig]);

  const fetchDesignations = useCallback(async () => {
    if (!withDesignations) {
      setDesignations([]);
      return;
    }
    try {
      setDesignations((await getDesignationsAPI()) || []);
    } catch {
      setDesignations([]);
    }
  }, [withDesignations]);

  useEffect(() => {
    fetchIndustries();
  }, [fetchIndustries]);

  useEffect(() => {
    fetchDesignations();
  }, [fetchDesignations]);

  const refresh = useCallback(() => {
    fetchIndustries();
    fetchDesignations();
  }, [fetchIndustries, fetchDesignations]);

  // industryId -> designations belonging to it
  const designationsByIndustry = useMemo(() => {
    const map = {};
    designations.forEach((d) =>
      (d.industries || []).forEach((i) => {
        (map[i.id] = map[i.id] || []).push(d);
      }),
    );
    return map;
  }, [designations]);

  const industries = useMemo(
    () => rows.map((i) => ({ ...i, designations: designationsByIndustry[i.id] || [] })),
    [rows, designationsByIndustry],
  );

  // Stay on a real page when a delete shrinks the list
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Selection is tied to the current page — reset it whenever it changes
  useEffect(() => {
    setSelectedIds([]);
  }, [page]);

  const toggleSelectIndustry = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.length === industries.length ? [] : industries.map((i) => i.id),
    );
  };

  // Search is debounced and live; this just jumps back to page 1.
  const handleSearch = useCallback(() => {
    setPage(1);
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ search: "", status: "" });
    setPage(1);
  }, []);

  const nameOf = (id) => rows.find((i) => i.id === id)?.name || `#${id}`;

  const handleToggleStatus = async (id, currentStatus) => {
    const activating = currentStatus !== "ACTIVE";
    const action = activating ? "activate" : "deactivate";
    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `Do you want to ${action} this industry?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${action} it!`,
    });

    if (!result.isConfirmed) return;

    try {
      const updated = await setIndustryStatusAPI(id, activating ? "ACTIVE" : "INACTIVE");
      setRows((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
      Swal.fire("Success!", `Industry ${action}d successfully.`, "success");
      // A status filter may now exclude this row
      if (filters.status) fetchIndustries();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Action failed",
        text: apiError(error, "Something went wrong").message,
      });
    }
  };

  const handleDelete = async (industry) => {
    const result = await Swal.fire({
      title: "Delete industry?",
      text: `"${industry.name}" will be permanently deleted. This can't be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteIndustryAPI(industry.id);
      setSelectedIds((prev) => prev.filter((sid) => sid !== industry.id));
      refresh();
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Industry deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      // 409 CONFLICT carries a friendly "still used by ..." message
      const { code, message } = apiError(error, "Something went wrong");
      Swal.fire({
        icon: code === "CONFLICT" ? "warning" : "error",
        title: code === "CONFLICT" ? "Can't delete this industry" : "Delete failed",
        text: message,
      });
    }
  };

  const handleBulkStatusChange = async (activate) => {
    if (selectedIds.length === 0) return;
    const actionText = activate ? "activate" : "deactivate";
    const count = selectedIds.length;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `${count} selected industr${count > 1 ? "ies" : "y"} will be ${actionText}d.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${actionText}`,
      cancelButtonText: "Cancel",
      confirmButtonColor: activate ? "#16a34a" : "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await bulkIndustryStatusAPI(selectedIds, activate ? "ACTIVE" : "INACTIVE");
      setSelectedIds([]);
      showBulkResult({
        result: res,
        noun: "industry",
        nounPlural: "industries",
        verb: `${actionText}d`,
        nameOf,
      });
      fetchIndustries();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
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
      title: "Delete selected industries?",
      text: `${count} selected industr${count > 1 ? "ies" : "y"} will be permanently deleted. Industries still in use are skipped.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await bulkDeleteIndustriesAPI(selectedIds);
      setSelectedIds([]);
      showBulkResult({
        result: res,
        noun: "industry",
        nounPlural: "industries",
        verb: "deleted",
        nameOf,
      });
      refresh();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: apiError(error, "Something went wrong").message,
      });
    }
  };

  return {
    industries,
    loading,
    page,
    totalPages,
    totalRecords,
    filters,
    setFilters,
    setPage,
    handleSearch,
    handleClear,
    handleToggleStatus,
    handleDelete,
    refresh,
    selectedIds,
    toggleSelectIndustry,
    toggleSelectAll,
    handleBulkActivate,
    handleBulkDeactivate,
    handleBulkDelete,
    sortConfig,
    handleSort,
    hasDesignationCounts: withDesignations,
  };
};
