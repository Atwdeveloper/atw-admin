"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import {
  getWorkersAPI,
  deleteWorkerAPI,
  changeWorkerStatusAPI,
  bulkChangeWorkerStatusAPI,
  bulkDeleteWorkersAPI,
  exportWorkersAPI,
} from "../../../api/adminV1/workerAPI";
import { apiError } from "../../../api/javaApi";
import { useDebounce } from "../../../common/hooks/useDebounce";
import { showBulkSummary, blobApiError, downloadBlob } from "../utils/workerUtils";

// Activate = ACTIVE, Deactivate = INACTIVE (the backend requires a reason).
// The backend only allows ACTIVE from SUSPENDED/INACTIVE: registered/KYC-pending
// workers become active by completing KYC, and blacklisting needs a super-admin
// to reverse.
const ACTIVATABLE = ["SUSPENDED", "INACTIVE"];

// The backend requires a reason for INACTIVE; the admin isn't asked for one,
// so a fixed reason is sent (it shows up in the worker's status history).
const DEACTIVATE_REASON = "Deactivated by admin";

const confirmDeactivate = async (subject) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: `${subject} will be deactivated.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, deactivate",
    confirmButtonColor: "#d33",
  });
  return result.isConfirmed;
};

const PAGE_SIZE = 10;

export const defaultWorkerFilters = {
  search: "",
  status: "", // single status from the header dropdown ("" = all)
  departmentIds: [],
  industryIds: [],
  designationIds: [],
  kycStatuses: [],
  // Matches a worker whose CURRENT or PERMANENT address is in these.
  stateIds: [],
  cityIds: [],
  registeredFrom: "", // YYYY-MM-DD
  registeredTo: "",
};

// Filter state -> the list/export query shape. Every non-empty filter is
// ANDed; values within one filter are ORed.
const toQuery = (f) => ({
  search: f.search.trim() || undefined,
  status: f.status ? [f.status] : undefined,
  departmentId: f.departmentIds.length ? f.departmentIds : undefined,
  industryId: f.industryIds.length ? f.industryIds : undefined,
  designationId: f.designationIds.length ? f.designationIds : undefined,
  kycStatus: f.kycStatuses.length ? f.kycStatuses : undefined,
  stateId: f.stateIds.length ? f.stateIds : undefined,
  cityId: f.cityIds.length ? f.cityIds : undefined,
  registeredFrom: f.registeredFrom || undefined,
  registeredTo: f.registeredTo || undefined,
});

export const useWorkerListing = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1); // 1-based in the UI, 0-based on the API
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState(defaultWorkerFilters);
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

  const fetchWorkers = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const result = await getWorkersAPI(
        {
          ...toQuery(debouncedFilters),
          page: page - 1,
          size: PAGE_SIZE,
          sort: sortConfig.key ? `${sortConfig.key},${sortConfig.direction}` : undefined,
        },
        { signal: controller.signal },
      );
      setWorkers(result?.content || []);
      setTotalRecords(result?.totalElements || 0);
      setTotalPages(Math.max(1, result?.totalPages || 1));
    } catch (error) {
      if (controller.signal.aborted || error?.code === "ERR_CANCELED") return;
      Swal.fire({ icon: "error", title: "Failed to load workers", text: apiError(error).message });
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [page, debouncedFilters, sortConfig]);

  useEffect(() => {
    fetchWorkers();
    return () => abortRef.current?.abort();
  }, [fetchWorkers]);

  // Any filter change goes back to page 1
  useEffect(() => {
    setPage(1);
  }, [debouncedFilters]);

  // Selection is tied to the current page/filters
  useEffect(() => {
    setSelectedIds([]);
  }, [page, debouncedFilters, sortConfig]);

  const toggleSelectWorker = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const toggleSelectAll = () =>
    setSelectedIds((prev) => (prev.length === workers.length ? [] : workers.map((w) => w.id)));

  const handleClear = () => {
    setFilters(defaultWorkerFilters);
    setPage(1);
  };

  const nameOf = (id) => {
    const w = workers.find((x) => x.id === id);
    return w ? `${w.firstName} ${w.lastName} (${w.workerCode})` : id;
  };

  // Replace one row in place after a write that returns the full worker.
  const patchRow = (updated) =>
    setWorkers((prev) =>
      prev.map((w) =>
        w.id === updated.id
          ? {
              ...w,
              status: updated.status,
              kycStatus: updated.kycStatus,
              faceEnrolledAt: updated.faceEnrollment?.enrolled
                ? updated.faceEnrollment.enrolledAt
                : w.faceEnrolledAt,
            }
          : w,
      ),
    );

  const handleActivate = async (worker) => {
    if (!ACTIVATABLE.includes(worker.status)) {
      Swal.fire({
        icon: "info",
        title: "Can't activate this worker",
        text:
          worker.status === "BLACKLISTED"
            ? "Blacklisted workers can't be activated."
            : "A registered worker becomes Active automatically once their KYC is verified.",
      });
      return;
    }
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This worker will be activated.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, activate it",
      confirmButtonColor: "#16a34a",
    });
    if (!result.isConfirmed) return;
    try {
      patchRow(await changeWorkerStatusAPI(worker.id, "ACTIVE"));
      Swal.fire({ icon: "success", title: "Activated!", timer: 1500, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Could not activate", text: apiError(error).message });
    }
  };

  const handleDeactivate = async (worker) => {
    if (!(await confirmDeactivate("This worker"))) return;
    try {
      patchRow(await changeWorkerStatusAPI(worker.id, "INACTIVE", DEACTIVATE_REASON));
      Swal.fire({ icon: "success", title: "Deactivated!", timer: 1500, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Could not deactivate", text: apiError(error).message });
    }
  };

  const handleDelete = async (worker) => {
    if (worker.status === "ACTIVE") {
      Swal.fire({
        icon: "info",
        title: "Worker is Active",
        text: "An active worker can't be deleted. Change their status first (e.g. to Inactive), then delete.",
      });
      return;
    }
    const result = await Swal.fire({
      title: "Delete this worker?",
      text: "The worker is removed from all lists, and their mobile number becomes free for a new registration. Their history is kept.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteWorkerAPI(worker.id);
      Swal.fire({ icon: "success", title: "Deleted!", timer: 1500, showConfirmButton: false });
      fetchWorkers();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Delete failed", text: apiError(error).message });
    }
  };

  // Bulk: each id is processed independently; ones the backend refuses
  // (e.g. activating a registered worker) show up in the summary.
  const runBulkStatus = async (status, reason, verb) => {
    try {
      const result = await bulkChangeWorkerStatusAPI(selectedIds, status, reason);
      showBulkSummary({ title: `Bulk ${verb === "activated" ? "Activate" : "Deactivate"} Summary`, verb, result, nameOf });
      setSelectedIds([]);
      fetchWorkers();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Bulk status change failed", text: apiError(error).message });
    }
  };

  const handleBulkActivate = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `${count} selected worker${count > 1 ? "s" : ""} will be activated. Workers that can't be activated (registered, KYC pending, blacklisted) are skipped.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, activate",
      confirmButtonColor: "#16a34a",
    });
    if (result.isConfirmed) await runBulkStatus("ACTIVE", undefined, "activated");
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (await confirmDeactivate(`${count} selected worker${count > 1 ? "s" : ""}`))
      await runBulkStatus("INACTIVE", DEACTIVATE_REASON, "deactivated");
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `${count} selected worker${count > 1 ? "s" : ""} will be deleted. Active workers are skipped.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;
    try {
      const summary = await bulkDeleteWorkersAPI(selectedIds);
      showBulkSummary({ title: "Bulk Delete Summary", verb: "deleted", result: summary, nameOf });
      setSelectedIds([]);
      fetchWorkers();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Bulk delete failed", text: apiError(error).message });
    }
  };

  const runExport = async (body, filename) => {
    try {
      const blob = await exportWorkersAPI(body);
      downloadBlob(blob, `${filename}-${new Date().toISOString().split("T")[0]}.csv`);
      Swal.fire({ icon: "success", title: "Export ready", timer: 1500, showConfirmButton: false });
    } catch (error) {
      const err = await blobApiError(error, "Unable to export workers.");
      Swal.fire({ icon: "error", title: "Export Failed", text: err.message });
    }
  };

  // Export everything matching the current filters.
  const handleExport = () => runExport(toQuery(filters), "workers-export");

  // Export only the selected rows.
  const handleBulkExport = async () => {
    if (selectedIds.length === 0) return;
    await runExport({ ids: selectedIds }, "selected-workers-export");
    setSelectedIds([]);
  };

  return {
    workers,
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
    toggleSelectWorker,
    toggleSelectAll,
    patchRow,
    refresh: fetchWorkers,
    handleActivate,
    handleDeactivate,
    handleDelete,
    handleBulkActivate,
    handleBulkDeactivate,
    handleBulkDelete,
    handleExport,
    handleBulkExport,
  };
};
