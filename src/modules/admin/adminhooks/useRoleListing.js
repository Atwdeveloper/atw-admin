"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import { useDebounce } from "../../../common/hooks/useDebounce";
import {
  getRolesAPI,
  deleteRoleAPI,
  getPermissionCatalogAPI,
} from "../../../api/adminV1/roleAPI";
import { catalogToModules, groupCodes } from "../../../api/adminV1/permissions";
import { apiError } from "../../../api/javaApi";

const PAGE_SIZE = 10;

// AdminRoleDto -> the shape RoleListing and ViewRoleModal render.
const toListRole = (role, modules) => ({
  id: role.id,
  profile_name: role.name,
  description: role.description,
  systemRole: role.systemRole,
  permissionCodes: role.permissionCodes || [],
  permissions: groupCodes(role.permissionCodes, modules),
  total_permissions: (role.permissionCodes || []).length,
});

export const useRoleListing = () => {
  const [allRoles, setAllRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const defaultFilters = { search: "" };
  const [filters, setFilters] = useState(defaultFilters);
  const debouncedFilters = useDebounce(filters, 300);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      // The catalog only supplies nicer labels; the list works without it.
      const [roles, catalog] = await Promise.all([
        getRolesAPI(),
        getPermissionCatalogAPI().catch(() => []),
      ]);
      const modules = catalogToModules(catalog);
      setAllRoles((roles || []).map((role) => toListRole(role, modules)));
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      setAllRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // The backend has no search or paging for roles, so both happen here.
  const filteredRoles = useMemo(() => {
    const q = debouncedFilters.search.trim().toLowerCase();
    if (!q) return allRoles;
    return allRoles.filter(
      (role) =>
        role.profile_name?.toLowerCase().includes(q) ||
        role.description?.toLowerCase().includes(q),
    );
  }, [allRoles, debouncedFilters.search]);

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / PAGE_SIZE));
  const roles = filteredRoles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Back to page 1 when the search changes or the last page empties.
  useEffect(() => {
    setPage(1);
  }, [debouncedFilters.search]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleSearch = () => setPage(1);

  const handleClear = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This role will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteRoleAPI(id);
      setAllRoles((prev) => prev.filter((role) => role.id !== id));
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "The role has been successfully deleted.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      // 409: staff are still assigned. 422: system role.
      const { code, message } = apiError(error, "Could not delete the role. Please try again.");
      Swal.fire({
        icon: "error",
        title: "Can't delete this role",
        text:
          code === "CONFLICT"
            ? "Staff members are still assigned to this role. Move them to another role first."
            : message,
      });
    }
  };

  // Called with role.permissions (grouped by module)
  const getPermissionCount = (permissions) =>
    (permissions || []).reduce((sum, module) => sum + (module.actions?.length || 0), 0);

  return {
    roles,
    loading,
    page,
    totalPages,
    totalRecords: filteredRoles.length,
    setPage,
    filters,
    setFilters,
    handleSearch,
    handleClear,
    handleDelete,
    getPermissionCount,
    fetchRoles,
  };
};
