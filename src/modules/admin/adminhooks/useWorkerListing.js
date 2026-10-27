"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getWorkersAPI,
  deleteWorkerAPI,
  toggleWorkerStatusAPI,
  exportWorkersAPI,
  bulkDeleteWorkersAPI,
  bulkToggleWorkerStatusAPI,
  bulkExportSelectedWorkersAPI,
} from "../../../api/admin/adminWorkerAPI";
import { useDebounce } from "../../../common/hooks/useDebounce";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const useWorkerListing = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const isExportingRef = useRef(false);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  const defaultFilters = {
    worker_name: "",
    worker_code: "",
    department: "",
    department_id: "",
    status: "",
    worker_type: "",
    registration_date_from: "",
    registration_date_to: "",
    industry_ids: [],
    designation_ids: [],
    state_ids: [],
    city_ids: [],
    agent_ids: [],
    rm_ids: [],
  };

  const [filters, setFilters] = useState(defaultFilters);
  const debouncedFilters = useDebounce(filters, 800);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: "asc" };
    });
    setPage(1);
  };

  const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelectWorker = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.length === workers.length ? [] : workers.map((w) => w.id),
    );
  };

  const abortPreviousRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const convertWorkerType = (value) => {
    if (value === "all") return "";
    if (value === "1") return "1";
    if (value === "0") return "0";
    if (value === "incomplete") return "incomplete";
    return "";
  };

  // Builds the /admin/workers query string. Array filters (industry_ids,
  // designation_ids, state_ids, city_ids, agent_ids, rm_ids) are sent as
  // repeated key[]=value params, matching the same convention used for
  // /admin/companies.
  const buildApiParams = (appliedFilters) => {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("per_page", limit);
    if (appliedFilters.worker_name)
      params.append("worker_name", appliedFilters.worker_name);
    if (appliedFilters.worker_code)
      params.append("worker_code", appliedFilters.worker_code);
    if (appliedFilters.department)
      params.append("department", appliedFilters.department);
    if (appliedFilters.department_id)
      params.append("department_id", appliedFilters.department_id);
    if (appliedFilters.registration_date_from)
      params.append("registration_date_from", appliedFilters.registration_date_from);
    if (appliedFilters.registration_date_to)
      params.append("registration_date_to", appliedFilters.registration_date_to);
    if (appliedFilters.status) params.append("status", appliedFilters.status);
    const workerType = convertWorkerType(appliedFilters.worker_type);
    if (workerType) params.append("worker_type", workerType);
    (appliedFilters.industry_ids || []).forEach((id) =>
      params.append("industry_ids[]", id),
    );
    (appliedFilters.designation_ids || []).forEach((id) =>
      params.append("designation_ids[]", id),
    );
    (appliedFilters.state_ids || []).forEach((id) =>
      params.append("state_ids[]", id),
    );
    (appliedFilters.city_ids || []).forEach((id) =>
      params.append("city_ids[]", id),
    );
    (appliedFilters.agent_ids || []).forEach((id) =>
      params.append("agent_ids[]", id),
    );
    (appliedFilters.rm_ids || []).forEach((id) =>
      params.append("rm_ids[]", id),
    );
    if (sortConfig.key) {
      params.append("sort_by", sortConfig.key);
      params.append("sort_dir", sortConfig.direction);
    }
    return params;
  };

  const fetchWorkers = useCallback(
    async (appliedFilters = debouncedFilters) => {
      if (isExportingRef.current) return;
      abortPreviousRequest();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      setLoading(true);
      try {
        const apiParams = buildApiParams(appliedFilters);
        const response = await getWorkersAPI(apiParams, { signal });
        if (!isMountedRef.current) return;
        if (signal.aborted) return;
        const data = response?.data?.data || [];
        const total = response?.data?.total || 0;
        const lastPage = response?.data?.last_page || 1;
        setWorkers(data);
        setTotalRecords(total);
        setTotalPages(lastPage);
      } catch (error) {
        if (!isMountedRef.current) return;
        if (error.name === "AbortError") return;
        console.error("Error fetching workers:", error);
      } finally {
        if (isMountedRef.current && !signal.aborted) setLoading(false);
      }
    },
    [page, limit, sortConfig, abortPreviousRequest, debouncedFilters],
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchWorkers(debouncedFilters);
    return () => {
      isMountedRef.current = false;
      abortPreviousRequest();
    };
  }, [page, debouncedFilters, fetchWorkers]);

  // Selection is tied to the current page/filters — reset it whenever either changes
  useEffect(() => {
    setSelectedIds([]);
  }, [page, debouncedFilters]);

  const handleSearch = () => setPage(1);
  const handleClear = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This worker will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });
    if (!result.isConfirmed) return;
    try {
      const response = await deleteWorkerAPI(id);
      if (response?.status === 500) {
        Swal.fire({
          icon: "error",
          title: response?.data || "Delete failed",

          text: response?.message || "Worker cannot be deleted",
        });

        return;
      }
      if (response?.status === 200 || response?.status === 204) {
        setWorkers((prev) => prev.filter((worker) => worker.id !== id));
        setTotalRecords((prev) => prev - 1);
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: response?.message || "Worker deleted successfully",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Could not delete worker.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong.",
      });
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const isActive = currentStatus === "active";
    const actionText = isActive ? "deactivate" : "activate";
    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `This worker will be ${actionText}d.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${actionText} it`,
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });
    if (!result.isConfirmed) return;
    try {
      const response = await toggleWorkerStatusAPI(id, !isActive);
      if (response?.status === 200 || response?.status === 204) {
        setWorkers((prev) =>
          prev.map((w) =>
            w.id === id
              ? { ...w, status: !isActive ? "active" : "inactive" }
              : w,
          ),
        );
        Swal.fire({
          icon: "success",
          title: "Success!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Could not update status.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong.",
      });
    }
  };

  const handleBulkStatusChange = async (activate) => {
    if (selectedIds.length === 0) return;
    const actionText = activate ? "activate" : "deactivate";
    const count = selectedIds.length;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `${count} selected worker${count > 1 ? "s" : ""} will be ${actionText}d.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${actionText}`,
      cancelButtonText: "Cancel",
      confirmButtonColor: activate ? "#16a34a" : "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      await bulkToggleWorkerStatusAPI(selectedIds, activate ? 1 : 0);

      setWorkers((prev) =>
        prev.map((w) =>
          selectedIds.includes(w.id)
            ? { ...w, status: activate ? "active" : "inactive" }
            : w,
        ),
      );
      setSelectedIds([]);

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: `Selected workers have been ${actionText}d.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Failed to ${actionText} selected workers.`,
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
      text: `${count} selected worker${count > 1 ? "s" : ""} will be permanently deleted.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await bulkDeleteWorkersAPI(selectedIds);
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

      setWorkers((prev) => prev.filter((w) => !deletedIds.includes(w.id)));
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
          workers.find((w) => w.id === id)?.worker_name || `Worker #${id}`;

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

        // Deleted workers — compact pills, collapsed by default so the
        // dialog stays short even with 100+ items; scrolls internally past that.
        const deletedHtml =
          deletedIds.length > 0
            ? `
              <details class="mb-3">
                <summary class="cursor-pointer text-sm font-semibold text-green-700 select-none">
                  Deleted workers (${deletedIds.length})
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

        // Skipped workers — grouped by reason so many skips collapse into a
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
          text: "Selected workers have been deleted.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete selected workers.",
      });
    }
  };

  // Shared Excel builder used by both the filtered export and the bulk
  // (selected-rows) export below.
  const exportWorkersToExcel = (dataArray, filenamePrefix = "workers-export") => {
    const exportData = dataArray.map((worker) => ({
      ID: worker.id,
      "Worker Code": worker.worker_code || "",
      "Worker Name": worker.worker_name || worker.employee_name || "",
      Department: worker.department?.name || worker.department || "",
      Designation: worker.designation?.name || worker.designation || "",
      "Work Location": worker.work_location || "",
      Email: worker.work_email || "",
      Phone: worker.mobile_number || "",
      Industry: worker.industry?.name || worker.industry || "",
      "Worker Type": worker.worker_type || "",
      Status:
        worker.status === "active" || worker.status === 1
          ? "Active"
          : "Inactive",
      "Joining Date": worker.joining_date || "",
      "Created At": worker.created_at || "",
      "Updated At": worker.updated_at || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Workers");

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

  const handleExportDownload = async () => {
    isExportingRef.current = true;

    const exportAbortController = new AbortController();
    const exportSignal = exportAbortController.signal;

    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.worker_name) params.append("worker_name", filters.worker_name);
      if (filters.worker_code) params.append("worker_code", filters.worker_code);
      if (filters.department) params.append("department", filters.department);
      if (filters.department_id)
        params.append("department_id", filters.department_id);
      if (filters.registration_date_from)
        params.append("registration_date_from", filters.registration_date_from);
      if (filters.registration_date_to)
        params.append("registration_date_to", filters.registration_date_to);
      if (filters.status) params.append("status", filters.status);
      (filters.industry_ids || []).forEach((id) =>
        params.append("industry_ids[]", id),
      );
      (filters.designation_ids || []).forEach((id) =>
        params.append("designation_ids[]", id),
      );
      (filters.state_ids || []).forEach((id) => params.append("state_ids[]", id));
      (filters.city_ids || []).forEach((id) => params.append("city_ids[]", id));
      (filters.agent_ids || []).forEach((id) => params.append("agent_ids[]", id));
      (filters.rm_ids || []).forEach((id) => params.append("rm_ids[]", id));
      const workerType = convertWorkerType(filters.worker_type);
      if (workerType) params.append("worker_type", workerType);

      const response = await exportWorkersAPI(params, { signal: exportSignal });

      if (exportSignal.aborted) return;

      const dataArray = Array.isArray(response.data)
        ? response.data
        : response.data?.data || workers;

      exportWorkersToExcel(dataArray);

      Swal.fire({
        icon: "success",
        title: "Excel Export Successful!",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      if (error.name === "AbortError") return;

      console.error("Export failed:", error);

      Swal.fire({
        icon: "error",
        title: "Export Failed",
        text: "Unable to export workers.",
      });
    } finally {
      setLoading(false);
      isExportingRef.current = false;
    }
  };

  // Export only the selected rows via the backend export endpoint.
  const handleBulkExport = async () => {
    if (selectedIds.length === 0) return;

    try {
      setLoading(true);

      const res = await bulkExportSelectedWorkersAPI(selectedIds);
      const dataArray = Array.isArray(res) ? res : res?.data || [];

      if (dataArray.length === 0) {
        Swal.fire({
          icon: "error",
          title: "Export Failed",
          text: "No data received for the selected workers.",
        });
        return;
      }

      exportWorkersToExcel(dataArray, "selected-workers-export");
      setSelectedIds([]);

      Swal.fire({
        icon: "success",
        title: "Excel Export Successful!",
        text: `Exported ${dataArray.length} selected worker${dataArray.length > 1 ? "s" : ""}.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Export Failed",
        text: "Unable to export selected workers.",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelRequests = useCallback(
    () => abortPreviousRequest(),
    [abortPreviousRequest],
  );

  return {
    workers,
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
    selectedIds,
    toggleSelectWorker,
    toggleSelectAll,
    handleBulkActivate,
    handleBulkDeactivate,
    handleBulkDelete,
    handleBulkExport,
  };
};
