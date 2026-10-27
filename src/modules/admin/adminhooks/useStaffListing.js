"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import {
  getStaffListAPI,
  deleteStaffAPI,
  setStaffStatusAPI,
} from "../../../api/adminV1/staffAPI";
import { getRolesAPI } from "../../../api/adminV1/roleAPI";
import { apiError } from "../../../api/javaApi";
import { useAuth } from "../../../common/hooks/useAuth";

const PAGE_SIZE = 10;

export const useStaffListing = () => {
  const { user } = useAuth();
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); // 1-based in the UI, 0-based on the API
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [roles, setRoles] = useState([]);

  // The backend has no search/filter params, so these apply to the loaded page.
  const defaultFilters = { search: "", status: "", roleId: "" };
  const [filters, setFilters] = useState(defaultFilters);

  const fetchStaffs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getStaffListAPI({ page: page - 1, size: PAGE_SIZE, sort: "createdAt,desc" });
      setStaffs(result.content || []);
      setTotalPages(Math.max(1, result.totalPages || 1));
      setTotalRecords(result.totalElements || 0);
    } catch (error) {
      console.error("Failed to fetch staff:", error);
      setStaffs([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchStaffs();
  }, [fetchStaffs]);

  // For the role filter (needs admin_roles.view; the filter just hides without it)
  useEffect(() => {
    getRolesAPI()
      .then((list) => setRoles(list || []))
      .catch(() => setRoles([]));
  }, []);

  const visibleStaffs = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return staffs.filter(
      (s) =>
        (!q ||
          s.fullName?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.username?.toLowerCase().includes(q) ||
          s.phone?.includes(q)) &&
        (!filters.status || s.status === filters.status) &&
        (!filters.roleId || s.roles?.some((r) => r.id === filters.roleId)),
    );
  }, [staffs, filters]);

  const handleClear = () => setFilters(defaultFilters);

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
    loading,
    page,
    totalPages,
    totalRecords,
    setPage,
    filters,
    setFilters,
    handleClear,
    handleDelete,
    handleToggleStatus,
    canActOn,
    refresh: fetchStaffs,
  };
};
