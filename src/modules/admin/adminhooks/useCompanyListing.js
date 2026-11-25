"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import {
  getCompaniesAPI,
  deleteCompanyAPI,
  changeCompanyStatusAPI,
  bulkChangeCompanyStatusAPI,
  bulkDeleteCompaniesAPI,
  exportCompaniesAPI,
} from "../../../api/adminV1/companyAPI";
import { apiError } from "../../../api/javaApi";
import { useDebounce } from "../../../common/hooks/useDebounce";
import { showBulkSummary, blobApiError, downloadBlob } from "../utils/workerUtils";
import { confirmCompanyStatus } from "../utils/companyUtils";

const PAGE_SIZE = 10;
const NOUN = ["company", "companies"];

export const defaultCompanyFilters = {
  search: "",
  status: "", // single status from the header dropdown ("" = all)
  industryIds: [],
  stateIds: [], // matches a company with ANY address in these
  cityIds: [],
  gstVerified: "", // "" | "true" | "false"
  createdFrom: "", // YYYY-MM-DD
  createdTo: "",
};

// Filter state -> the list/export query shape. Every non-empty filter is
// ANDed; values within one filter are ORed.
const toQuery = (f) => ({
  search: f.search.trim() || undefined,
  status: f.status ? [f.status] : undefined,
  industryId: f.industryIds.length ? f.industryIds : undefined,
  stateId: f.stateIds.length ? f.stateIds : undefined,
  cityId: f.cityIds.length ? f.cityIds : undefined,
  gstVerified: f.gstVerified === "" ? undefined : f.gstVerified === "true",
  createdFrom: f.createdFrom || undefined,
  createdTo: f.createdTo || undefined,
});

export const useCompanyListing = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1); // 1-based in the UI, 0-based on the API
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState(defaultCompanyFilters);
  const debouncedFilters = useDebounce(filters, 600);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedIds, setSelectedIds] = useState([]);
  const abortRef = useRef(null);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: "asc" };
    });
    setPage(1);
  };

  const fetchCompanies = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const result = await getCompaniesAPI(
        {
          ...toQuery(debouncedFilters),
          page: page - 1,
          size: PAGE_SIZE,
          sort: sortConfig.key ? `${sortConfig.key},${sortConfig.direction}` : undefined,
        },
        { signal: controller.signal },
      );
      setCompanies(result?.content || []);
      setTotalRecords(result?.totalElements || 0);
      setTotalPages(Math.max(1, result?.totalPages || 1));
    } catch (error) {
      if (controller.signal.aborted || error?.code === "ERR_CANCELED") return;
      Swal.fire({ icon: "error", title: "Failed to load companies", text: apiError(error).message });
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [page, debouncedFilters, sortConfig]);

  useEffect(() => {
    fetchCompanies();
    return () => abortRef.current?.abort();
  }, [fetchCompanies]);

  // Any filter change goes back to page 1
  useEffect(() => {
    setPage(1);
  }, [debouncedFilters]);

  // Selection is tied to the current page/filters
  useEffect(() => {
    setSelectedIds([]);
  }, [page, debouncedFilters, sortConfig]);

  const toggleSelect = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const toggleSelectAll = () =>
    setSelectedIds((prev) => (prev.length === companies.length ? [] : companies.map((c) => c.id)));

  const handleClear = () => {
    setFilters(defaultCompanyFilters);
    setPage(1);
  };

  const nameOf = (id) => {
    const c = companies.find((x) => x.id === id);
    return c ? `${c.name} (${c.companyCode})` : id;
  };

  // Replace one row in place after a write that returns the full company.
  const patchRow = (updated) =>
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === updated.id
          ? { ...c, name: updated.name, industryId: updated.industryId, status: updated.status }
          : c,
      ),
    );

  // action: { status, label } from statusActions()
  const handleStatusChange = async (company, action) => {
    const confirmed = await confirmCompanyStatus({ status: action.status, label: action.label });
    if (!confirmed) return;
    try {
      patchRow(await changeCompanyStatusAPI(company.id, action.status, confirmed.reason));
      Swal.fire({ icon: "success", title: "Status updated", timer: 1500, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Could not change status", text: apiError(error).message });
    }
  };

  const handleDelete = async (company) => {
    if (company.status === "ACTIVE") {
      Swal.fire({
        icon: "info",
        title: "Company is Active",
        text: "An active company can't be deleted. Suspend it first, then delete.",
      });
      return;
    }
    const result = await Swal.fire({
      title: "Delete this company?",
      text: "The company is removed from all lists and its users can't log in. Its history is kept.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteCompanyAPI(company.id);
      Swal.fire({ icon: "success", title: "Deleted!", timer: 1500, showConfirmButton: false });
      fetchCompanies();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Delete failed", text: apiError(error).message });
    }
  };

  // Bulk: each id is processed independently; ones the backend refuses
  // (an illegal transition) show up in the summary.
  const handleBulkStatus = async (status, label, verb) => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const confirmed = await confirmCompanyStatus({
      status,
      label,
      subject: `${count} selected ${count === 1 ? NOUN[0] : NOUN[1]}`,
    });
    if (!confirmed) return;
    try {
      const result = await bulkChangeCompanyStatusAPI(selectedIds, status, confirmed.reason);
      showBulkSummary({ title: `Bulk ${label} Summary`, verb, result, nameOf, noun: NOUN });
      setSelectedIds([]);
      fetchCompanies();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Bulk status change failed", text: apiError(error).message });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `${count} selected ${count === 1 ? NOUN[0] : NOUN[1]} will be deleted. Active companies are skipped.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;
    try {
      const summary = await bulkDeleteCompaniesAPI(selectedIds);
      showBulkSummary({ title: "Bulk Delete Summary", verb: "deleted", result: summary, nameOf, noun: NOUN });
      setSelectedIds([]);
      fetchCompanies();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Bulk delete failed", text: apiError(error).message });
    }
  };

  const runExport = async (body, filename) => {
    try {
      const blob = await exportCompaniesAPI(body);
      downloadBlob(blob, `${filename}-${new Date().toISOString().split("T")[0]}.xlsx`);
      Swal.fire({ icon: "success", title: "Export ready", timer: 1500, showConfirmButton: false });
    } catch (error) {
      const err = await blobApiError(error, "Unable to export companies.");
      Swal.fire({ icon: "error", title: "Export Failed", text: err.message });
    }
  };

  // Export everything matching the current filters.
  const handleExport = () => runExport(toQuery(filters), "companies-export");

  // Export only the selected rows.
  const handleBulkExport = async () => {
    if (selectedIds.length === 0) return;
    await runExport({ ids: selectedIds }, "selected-companies-export");
    setSelectedIds([]);
  };

  return {
    companies,
    loading,
    page,
    setPage,
    totalPages,
    totalRecords,
    filters,
    setFilters,
    sortConfig,
    handleSort,
    handleClear,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    patchRow,
    refresh: fetchCompanies,
    handleStatusChange,
    handleDelete,
    handleBulkStatus,
    handleBulkDelete,
    handleExport,
    handleBulkExport,
  };
};
