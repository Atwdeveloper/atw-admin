"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import { useDebounce } from "../../../common/hooks/useDebounce";
import {
  getRolesPageAPI,
  deleteRoleAPI,
  getPermissionCatalogAPI,
} from "../../../api/adminV1/roleAPI";
import { catalogToModules, groupCodes } from "../../../api/adminV1/permissions";
import { apiError } from "../../../api/javaApi";

const PAGE_SIZE = 10;

// UI sort keys -> backend sort fields. Permission count isn't a column the
// backend can sort by, so it isn't here.
const SORT_FIELDS = { profile_name: "name", description: "description", systemRole: "systemRole" };

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

// GET /admin/roles is paged, searchable (name/description), filterable by
// systemRole and sortable on the server.
export const useRoleListing = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); // 1-based in the UI, 0-based on the API
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // roleType: "" (all) | "system" | "custom"
  const defaultFilters = { search: "", roleType: "" };
  const [filters, setFilters] = useState(defaultFilters);
  const debouncedSearch = useDebounce(filters.search.trim(), 400);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const handleSort = (key) => {
    if (!SORT_FIELDS[key]) return;
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: "asc" };
    });
    setPage(1);
  };

  // Permission labels for the view modal; loaded once.
  const modulesRef = useRef([]);
  const [catalogReady, setCatalogReady] = useState(false);
  useEffect(() => {
    getPermissionCatalogAPI()
      .then((catalog) => (modulesRef.current = catalogToModules(catalog)))
      .catch(() => (modulesRef.current = []))
      .finally(() => setCatalogReady(true));
  }, []);

  const requestRef = useRef(0);
  const fetchRoles = useCallback(async () => {
    if (!catalogReady) return;
    const requestId = ++requestRef.current;
    setLoading(true);
    try {
      const result = await getRolesPageAPI({
        page: page - 1,
        size: PAGE_SIZE,
        search: debouncedSearch || undefined,
        systemRole: filters.roleType === "system" ? true : filters.roleType === "custom" ? false : undefined,
        sort: sortConfig.key ? `${SORT_FIELDS[sortConfig.key]},${sortConfig.direction}` : undefined,
      });
      if (requestId !== requestRef.current) return;
      setRoles((result?.content || []).map((role) => toListRole(role, modulesRef.current)));
      setTotalPages(Math.max(1, result?.totalPages || 1));
      setTotalRecords(result?.totalElements || 0);
    } catch (error) {
      if (requestId !== requestRef.current) return;
      const err = apiError(error);
      // An unsupported sort field is a 400 — fall back to the default order.
      if (sortConfig.key && err.code === "VALIDATION_ERROR") {
        Swal.fire({ icon: "info", title: "Can't sort by this column", text: err.message });
        setSortConfig({ key: null, direction: "asc" });
        return;
      }
      console.error("Failed to fetch roles:", error);
      setRoles([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [catalogReady, page, debouncedSearch, filters.roleType, sortConfig]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Back to page 1 when the search or role type changes.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.roleType]);

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
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "The role has been successfully deleted.",
        timer: 1500,
        showConfirmButton: false,
      });
      // Step back if that was the last role on this page.
      if (roles.length === 1 && page > 1) setPage(page - 1);
      else fetchRoles();
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
    totalRecords,
    setPage,
    filters,
    setFilters,
    handleSearch,
    sortConfig,
    handleSort,
    handleClear,
    handleDelete,
    getPermissionCount,
    fetchRoles,
  };
};
