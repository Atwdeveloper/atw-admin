"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getCompaniesAPI,
  deleteCompanyAPI,
  toggleCompanyStatusAPI,
  exportCompaniesAPI,
  addAgentCommissionAPI,
  updateAgentCommissionAPI,
  bulkToggleCompanyStatusAPI,
  bulkDeleteCompaniesAPI,
  bulkExportSelectedCompaniesAPI,
} from "../../../api/admin/adminCompanyAPI";
import { useDebounce } from "../../../common/hooks/useDebounce";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const useCompanyListing = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const isExportingRef = useRef(false);

  // Refs for AbortController and cleanup
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  const defaultFilters = {
    companyname: "",
    companyemail: "",
    industry_ids: [],
    state_ids: [],
    city_ids: [],
    dor_from: "",
    dor_to: "",
    status: "",
    company_type: "all",
    agent_ids: [],
    rm_ids: [],
  };

  const [filters, setFilters] = useState(defaultFilters);
  const debouncedFilters = useDebounce(filters, 800);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const [selectedIds, setSelectedIds] = useState([]);

  // Cleanup function for aborting requests
  const abortPreviousRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const fetchCompanies = useCallback(
    async (debouncedFilters) => {
      // Don't fetch if exporting
      if (isExportingRef.current) {
        return;
      }

      abortPreviousRequest();

      // Create new AbortController
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setLoading(true);

      try {
        const params = new URLSearchParams();
        params.append("page", page);
        params.append("limit", limit);
        if (debouncedFilters.companyname)
          params.append("companyname", debouncedFilters.companyname);
        if (debouncedFilters.companyemail)
          params.append("companyemail", debouncedFilters.companyemail);
        (debouncedFilters.industry_ids || []).forEach((id) =>
          params.append("industry_ids[]", id),
        );
        (debouncedFilters.state_ids || []).forEach((id) =>
          params.append("state_ids[]", id),
        );
        (debouncedFilters.city_ids || []).forEach((id) =>
          params.append("city_ids[]", id),
        );
        (debouncedFilters.agent_ids || []).forEach((id) =>
          params.append("agent_ids[]", id),
        );
        (debouncedFilters.rm_ids || []).forEach((id) =>
          params.append("rm_ids[]", id),
        );
        if (debouncedFilters.dor_from)
          params.append("dor_from", debouncedFilters.dor_from);
        if (debouncedFilters.dor_to)
          params.append("dor_to", debouncedFilters.dor_to);
        if (debouncedFilters.status)
          params.append("status", debouncedFilters.status);
        if (
          debouncedFilters.company_type &&
          debouncedFilters.company_type !== "all"
        )
          params.append("company_type", debouncedFilters.company_type);
        if (sortConfig.key) {
          params.append("sort_by", sortConfig.key);
          params.append("sort_dir", sortConfig.direction);
        }

        // Pass signal to API call
        const response = await getCompaniesAPI(params, { signal });

        // Check if component is still mounted
        if (!isMountedRef.current) return;

        // Check if request was aborted
        if (signal.aborted) {
          return;
        }

        const data = response?.data?.data || [];

        if (response?.data) {
          setCompanies(data);
          setTotalPages(response.data.last_page || 1);
          setTotalRecords(response.data.total || 0);
        } else {
          setCompanies([]);
          setTotalPages(1);
          setTotalRecords(0);
        }
      } catch (error) {
        // Only handle error if not aborted and component is mounted
        if (!isMountedRef.current) return;

        // Check if error is from abort
        if (error.name === "AbortError") {
          return;
        }

        console.error("Failed to fetch companies:", error);
      } finally {
        if (isMountedRef.current && !signal.aborted) {
          setLoading(false);
        }
      }
    },
    [page, limit, sortConfig, abortPreviousRequest],
  );

  useEffect(() => {
    isMountedRef.current = true;

    fetchCompanies(debouncedFilters);

    return () => {
      isMountedRef.current = false;
      abortPreviousRequest();
    };
  }, [page, debouncedFilters, fetchCompanies]);

  // Selection is tied to the current page/filters — reset it whenever either changes
  useEffect(() => {
    setSelectedIds([]);
  }, [page, debouncedFilters]);

  const toggleSelectCompany = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.length === companies.length ? [] : companies.map((c) => c.id),
    );
  };

  const clearSelection = () => setSelectedIds([]);

  const handleSearch = () => {
    setPage(1);
    // No need to call fetchCompanies directly, useEffect will handle it
  };

  const handleClear = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: "asc" };
    });
    setPage(1);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This company will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteCompanyAPI(id);
      if (response?.status === 500) {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: response?.message || "Cannot delete company",
        });

        return;
      }
      if (response?.status === 200 || response?.status === 204) {
        // Remove from list after success
        setCompanies((prev) => prev.filter((company) => company.id !== id));
        setTotalRecords((prev) => prev - 1);

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "The company has been successfully deleted.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Could not delete the company. Please try again.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong. Please try again.",
      });
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const actionText = currentStatus ? "deactivate" : "activate";

    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `This company will be ${actionText}d.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${actionText} it`,
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await toggleCompanyStatusAPI(id, !currentStatus);

      if (response?.status === 200 || response?.status === 204) {
        // Update the status in the local state
        setCompanies((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: !currentStatus } : c)),
        );

        Swal.fire({
          icon: "success",
          title: "Success!",
          text: `Company has been ${
            !currentStatus ? "activated" : "deactivated"
          }.`,
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Could not update company status. Please try again.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong. Please try again.",
      });
    }
  };

  const handleBulkStatusChange = async (activate) => {
    if (selectedIds.length === 0) return;
    const actionText = activate ? "activate" : "deactivate";
    const count = selectedIds.length;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `${count} selected compan${count > 1 ? "ies" : "y"} will be ${actionText}d.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${actionText}`,
      cancelButtonText: "Cancel",
      confirmButtonColor: activate ? "#16a34a" : "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      await bulkToggleCompanyStatusAPI(selectedIds, activate ? 1 : 0);

      setCompanies((prev) =>
        prev.map((c) =>
          selectedIds.includes(c.id) ? { ...c, status: activate } : c,
        ),
      );
      setSelectedIds([]);

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: `Selected companies have been ${actionText}d.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Failed to ${actionText} selected companies.`,
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
      text: `${count} selected compan${count > 1 ? "ies" : "y"} will be permanently deleted.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await bulkDeleteCompaniesAPI(selectedIds);
      // Some endpoints in this API return the payload flat, others nest it
      // under `data` (e.g. { status, data: { deleted, skipped }, message }).
      // Handle both shapes.
      const payload =
        Array.isArray(response?.deleted) || Array.isArray(response?.skipped)
          ? response
          : response?.data || {};
      // Fall back to treating the whole selection as deleted if the API
      // response doesn't include a `deleted` list (e.g. an older/different shape).
      const deletedIds = Array.isArray(payload.deleted)
        ? payload.deleted
        : selectedIds;
      const skipped = Array.isArray(payload.skipped) ? payload.skipped : [];

      setCompanies((prev) => prev.filter((c) => !deletedIds.includes(c.id)));
      setTotalRecords((prev) => prev - deletedIds.length);
      setSelectedIds([]);

      if (skipped.length > 0) {
        const escapeHtml = (value) =>
          String(value).replace(
            /[&<>"']/g,
            (char) =>
              ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
              })[char],
          );
        const nameOf = (id) =>
          companies.find((c) => c.id === id)?.company_name ||
          `Company #${id}`;

        const checkIconSvg = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>`;
        const xIconSvg = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"></path>
            <path d="M6 6l12 12"></path>
          </svg>`;

        // Stat pills — always visible, cheap regardless of list size.
        const statsHtml = `
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
              <div class="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">${checkIconSvg}</div>
              <div>
                <p class="text-lg font-bold text-green-800 leading-none m-0">${deletedIds.length}</p>
                <p class="text-xs text-green-700 m-0 mt-0.5">Deleted</p>
              </div>
            </div>
            <div class="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <div class="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">${xIconSvg}</div>
              <div>
                <p class="text-lg font-bold text-red-800 leading-none m-0">${skipped.length}</p>
                <p class="text-xs text-red-700 m-0 mt-0.5">Skipped</p>
              </div>
            </div>
          </div>`;

        // Deleted companies — compact pills, collapsed by default so the
        // dialog stays short even with 100+ items; scrolls internally past that.
        const deletedHtml =
          deletedIds.length > 0
            ? `
              <details class="mb-3">
                <summary class="cursor-pointer text-sm font-semibold text-green-700 select-none">
                  Deleted companies (${deletedIds.length})
                </summary>
                <div class="mt-2 max-h-40 overflow-y-auto flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-lg border border-gray-100">
                  ${deletedIds
                    .map(
                      (id) =>
                        `<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">${escapeHtml(nameOf(id))}</span>`,
                    )
                    .join("")}
                </div>
              </details>`
            : "";

        // Skipped companies — grouped by reason so 70 skips collapse into a
        // handful of expandable reason groups instead of one giant list.
        const groups = new Map();
        skipped.forEach(({ id, reason }) => {
          const key = reason || "Unknown reason";
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(id);
        });

        const skippedGroupsHtml = Array.from(groups.entries())
          .map(
            ([reason, ids]) => `
              <details class="bg-red-50 border border-red-200 rounded-lg p-2.5 mb-2" ${groups.size === 1 ? "open" : ""}>
                <summary class="cursor-pointer text-xs font-semibold text-red-800 select-none flex items-center justify-between gap-2">
                  <span>${escapeHtml(reason)}</span>
                  <span class="flex-shrink-0 px-1.5 py-0.5 bg-red-200 text-red-900 rounded-full text-[10px]">${ids.length}</span>
                </summary>
                <div class="mt-2 flex flex-wrap gap-1.5">
                  ${ids
                    .map(
                      (id) =>
                        `<span class="px-2 py-1 bg-white border border-red-200 text-red-700 rounded-full text-xs">${escapeHtml(nameOf(id))}</span>`,
                    )
                    .join("")}
                </div>
              </details>`,
          )
          .join("");

        Swal.fire({
          title: "Bulk Delete Summary",
          html: `
            <div class="text-left">
              ${statsHtml}
              ${deletedHtml}
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Skipped — grouped by reason
              </p>
              <div class="max-h-72 overflow-y-auto pr-1">${skippedGroupsHtml}</div>
            </div>
          `,
          confirmButtonText: "Got it",
          confirmButtonColor: "#2563eb",
          width: 520,
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Selected companies have been deleted.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete selected companies.",
      });
    }
  };

  // Shared Excel builder used by both the filtered export and the bulk
  // (selected-rows) export below.
  const exportCompaniesToExcel = (dataArray, filenamePrefix = "companies-export") => {
    const exportData = dataArray.map((company) => {
      const primaryAddress =
        company.addresses && company.addresses.length > 0
          ? company.addresses[0]
          : null;

      return {
        ID: company.id,
        "Company Code": company.company_code || "",
        "Company Name": company.company_name || "",
        Email: company.email || "",
        Phone: company.phone || "",
        Industry: company.industry?.name || company.industry || "",
        "Company Owner": company.company_owner?.owner_name || "",
        "Owner Email": company.company_owner?.owner_email || "",
        "Owner Phone": company.company_owner?.owner_phone || "",
        "GST Number": company.gst_number || "",
        "GST Rate": company.gst_rate || "",
        "PAN Number": company.pan_number || "",
        "TIN Number": company.tin_number || "",
        "Work Type": company.work_type || "",
        "Service Charge": company.service_charge || "",
        "Service Charge Type": company.service_charge_type || "",
        Status: company.status ? "Active" : "Inactive",
        "Created At": company.created_at || "",
        "Updated At": company.updated_at || "",
        Address: primaryAddress?.address || "",
        City: primaryAddress?.city || "",
        State: primaryAddress?.state || "",
        ZIP: primaryAddress?.zip || "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Companies");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(
      blob,
      `${filenamePrefix}-${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  // Export only the selected rows via the backend export endpoint.
  // The endpoint returns JSON ({ status, data: [...] }), not a real file,
  // so the actual .xlsx is still built client-side from that data.
  const handleBulkExport = async () => {
    if (selectedIds.length === 0) return;

    try {
      setLoading(true);

      const res = await bulkExportSelectedCompaniesAPI(selectedIds);
      const dataArray = Array.isArray(res) ? res : res?.data || [];

      if (dataArray.length === 0) {
        Swal.fire({
          icon: "error",
          title: "Export Failed",
          text: "No data received for the selected companies.",
        });
        return;
      }

      exportCompaniesToExcel(dataArray, "selected-companies-export");
      setSelectedIds([]);

      Swal.fire({
        icon: "success",
        title: "Excel Export Successful!",
        text: `Exported ${dataArray.length} selected compan${dataArray.length > 1 ? "ies" : "y"}.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Export Failed",
        text: "Unable to export selected companies.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportDownload = async () => {
    isExportingRef.current = true;

    const exportAbortController = new AbortController();

    const exportSignal = exportAbortController.signal;

    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.companyname) params.append("companyname", filters.companyname);
      if (filters.companyemail) params.append("companyemail", filters.companyemail);
      (filters.industry_ids || []).forEach((id) =>
        params.append("industry_ids[]", id),
      );
      (filters.state_ids || []).forEach((id) => params.append("state_ids[]", id));
      (filters.city_ids || []).forEach((id) => params.append("city_ids[]", id));
      (filters.agent_ids || []).forEach((id) => params.append("agent_ids[]", id));
      (filters.rm_ids || []).forEach((id) => params.append("rm_ids[]", id));
      if (filters.dor_from) params.append("dor_from", filters.dor_from);
      if (filters.dor_to) params.append("dor_to", filters.dor_to);
      if (filters.status) params.append("status", filters.status);
      if (filters.company_type && filters.company_type !== "all")
        params.append("company_type", filters.company_type);

      const response = await exportCompaniesAPI(params, {
        signal: exportSignal,
      });

      if (exportSignal.aborted) return;

      const dataArray = Array.isArray(response.data)
        ? response.data
        : response.data?.data || companies;

      exportCompaniesToExcel(dataArray);

      Swal.fire({
        icon: "success",
        title: "Excel Export Successful!",
        text: `Exported ${dataArray.length} companies.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      if (error.name === "AbortError") return;

      console.error("Export failed:", error);

      Swal.fire({
        icon: "error",
        title: "Export Failed",
        text: "Unable to export companies.",
      });
    } finally {
      setLoading(false);
      isExportingRef.current = false;
    }
  };

  // Function to manually cancel ongoing requests (optional, for cleanup)
  const cancelRequests = useCallback(() => {
    abortPreviousRequest();
  }, [abortPreviousRequest]);

  // === NEW: Save agent commission ===
  const handleSaveCommission = async (company, value, type) => {
    try {
      if (!company?.agent) {
        Swal.fire({
          icon: "error",
          title: "No Agent",
          text: "No agent assigned to this company",
        });
        return;
      }

      const payload = {
        company_id: company.id,
        agent_charge: value,
        agent_charge_type: type,
      };

      // Decide add or update
      if (!company.agent_charge) {
        await addAgentCommissionAPI(payload);
      } else {
        await updateAgentCommissionAPI(payload);
      }

      // Update UI instantly (no reload needed)
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === company.id
            ? {
                ...c,
                agent_charge: value,
                agent_charge_type: type,
              }
            : c,
        ),
      );

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Commission saved successfully",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save commission",
      });
    }
  };

  return {
    companies,
    loading,
    page,
    totalPages,
    totalRecords,
    setPage,
    defaultFilters,
    filters,
    setFilters,
    sortConfig,
    handleSort,
    handleSearch,
    handleClear,
    handleDelete,
    handleToggleStatus,
    handleExportDownload,
    cancelRequests,
    handleSaveCommission, // ✅ Exposed for components
    selectedIds,
    toggleSelectCompany,
    toggleSelectAll,
    clearSelection,
    handleBulkActivate,
    handleBulkDeactivate,
    handleBulkDelete,
    handleBulkExport,
  };
};
