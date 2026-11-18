"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import {
  getStaffListAPI,
  deleteStaffAPI,
  setStaffStatusAPI,
} from "../../../api/adminV1/staffAPI";
import { getRolesAPI } from "../../../api/adminV1/roleAPI";
import { getStatesAPI, getCitiesAPI } from "../../../api/adminV1/geographyAPI";
import { apiError } from "../../../api/javaApi";
import { useAuth } from "../../../common/hooks/useAuth";
import { useDebounce } from "../../../common/hooks/useDebounce";

// tab: "" (all) | "ACTIVE" | "DISABLED" | "INCOMPLETE" (invite pending — never logged in)
export const defaultStaffFilters = {
  search: "",
  tab: "",
  roleIds: [],
  superAdmin: "", // "" (all) | "true" | "false"
  stateIds: [],
  cityIds: [],
  createdFrom: "", // YYYY-MM-DD
  createdTo: "",
};

// Server-side filters on GET /admin/staff: search (name/email/username/phone),
// status (multi), roleId (multi), superAdmin. State/city/date aren't supported
// by the backend yet — they're sent anyway (ignored until it adds them).
const toQuery = (f) => ({
  search: f.search.trim() || undefined,
  status: f.tab === "ACTIVE" || f.tab === "DISABLED" ? [f.tab] : undefined,
  roleId: f.roleIds,
  superAdmin: f.superAdmin || undefined,
  stateId: f.stateIds,
  cityId: f.cityIds,
  createdFrom: f.createdFrom || undefined,
  createdTo: f.createdTo || undefined,
});

const dayOf = (iso) => (iso ? String(iso).slice(0, 10) : "");

// What the backend doesn't filter yet, applied to the loaded page: the
// Incomplete tab (never logged in) and the created-date range. State/city
// can't be checked here — the rows carry no address.
const matchesOnPage = (s, f) => {
  if (f.tab === "INCOMPLETE" && s.lastLoginAt) return false;
  if (f.createdFrom && dayOf(s.createdAt) < f.createdFrom) return false;
  if (f.createdTo && dayOf(s.createdAt) > f.createdTo) return false;
  return true;
};

const PAGE_SIZE = 10;

export const useStaffListing = () => {
  const { user } = useAuth();
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); // 1-based in the UI, 0-based on the API
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [roles, setRoles] = useState([]);

  const [filters, setFilters] = useState(defaultStaffFilters);
  const debouncedFilters = useDebounce(filters, 500);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  // Sorting is done by the backend across all staff (Spring "field,dir").
  // With no column sort, newest first.
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: "asc" };
    });
    setPage(1);
  };

  const fetchStaffs = useCallback(async () => {
    setLoading(true);
    const sort = sortConfig.key ? `${sortConfig.key},${sortConfig.direction}` : "createdAt,desc";
    try {
      const result = await getStaffListAPI({
        page: page - 1,
        size: PAGE_SIZE,
        sort,
        ...toQuery(debouncedFilters),
      });
      setStaffs(result.content || []);
      setTotalPages(Math.max(1, result.totalPages || 1));
      setTotalRecords(result.totalElements || 0);
    } catch (error) {
      const err = apiError(error);
      // An unsupported sort field is a 400 — fall back to the default order.
      if (sortConfig.key && err.code === "VALIDATION_ERROR") {
        Swal.fire({ icon: "info", title: "Can't sort by this column", text: err.message });
        setSortConfig({ key: null, direction: "asc" });
        return;
      }
      console.error("Failed to fetch staff:", error);
      setStaffs([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [page, sortConfig, debouncedFilters]);

  useEffect(() => {
    fetchStaffs();
  }, [fetchStaffs]);

  // A filter change goes back to page 1.
  useEffect(() => {
    setPage(1);
  }, [debouncedFilters]);

  // Role filter options (needs admin_roles.view; the filter just hides without it), and states.
  useEffect(() => {
    getRolesAPI()
      .then((list) => setRoles(list || []))
      .catch(() => setRoles([]));
    getStatesAPI()
      .then((list) => setStates(Array.isArray(list) ? list : []))
      .catch(() => setStates([]));
  }, []);

  // City options = cities of the selected states; drop picked cities that no longer fit.
  const stateKey = filters.stateIds.join(",");
  useEffect(() => {
    let cancelled = false;
    const ids = stateKey ? stateKey.split(",") : [];
    if (ids.length === 0) {
      setCities([]);
      setFilters((prev) => (prev.cityIds.length ? { ...prev, cityIds: [] } : prev));
      return;
    }
    Promise.all(ids.map((id) => getCitiesAPI(id).catch(() => []))).then((lists) => {
      if (cancelled) return;
      const all = lists.flatMap((l) => (Array.isArray(l) ? l : []));
      const allowed = new Set(all.map((c) => c.id));
      setCities(all);
      setFilters((prev) =>
        prev.cityIds.every((id) => allowed.has(id))
          ? prev
          : { ...prev, cityIds: prev.cityIds.filter((id) => allowed.has(id)) },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [stateKey]);

  const visibleStaffs = useMemo(
    () => staffs.filter((s) => matchesOnPage(s, filters)),
    [staffs, filters],
  );

  const handleClear = () => setFilters(defaultStaffFilters);

  // The backend refuses actions on your own account or a super-admin.
  const canActOn = (staff) => staff.id !== user?.id && !staff.superAdmin;

  const handleDelete = async (staff) => {
    const result = await Swal.fire({
      title: "Delete this staff member?",
      text: `${staff.fullName} will lose access immediately. This can't be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });
    if (!result.isConfirmed) return;

    try {
      await deleteStaffAPI(staff.id);
      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "The staff member has been deleted.",
        timer: 1500,
        showConfirmButton: false,
      });
      // Refetch so paging stays right; step back if this page is now empty.
      if (staffs.length === 1 && page > 1) setPage(page - 1);
      else fetchStaffs();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Couldn't delete", text: apiError(error).message });
    }
  };

  const handleToggleStatus = async (staff) => {
    const activating = staff.status !== "ACTIVE";
    const result = await Swal.fire({
      title: activating ? "Activate this staff member?" : "Disable this staff member?",
      text: activating
        ? `${staff.fullName} will be able to log in again.`
        : `${staff.fullName} will be signed out everywhere and can't log in until re-activated.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: activating ? "Yes, activate" : "Yes, disable",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      const updated = await setStaffStatusAPI(staff.id, activating ? "ACTIVE" : "DISABLED");
      setStaffs((prev) => prev.map((s) => (s.id === staff.id ? updated : s)));
      Swal.fire({
        icon: "success",
        title: activating ? "Activated" : "Disabled",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Couldn't change status", text: apiError(error).message });
    }
  };

  return {
    staffs: visibleStaffs,
    pageCount: staffs.length,
    roles,
    states,
    cities,
    loading,
    page,
    totalPages,
    totalRecords,
    setPage,
    filters,
    setFilters,
    sortConfig,
    handleSort,
    handleClear,
    handleDelete,
    handleToggleStatus,
    canActOn,
    refresh: fetchStaffs,
  };
};
