import javaApi, { unwrap } from "../javaApi";

// AdminRoleDto: { id, name, description, systemRole, permissionCodes[] }

// Paged: -> { content, page, size, totalElements, totalPages, first, last }.
// params: { search (name/description), systemRole (true|false), page (0-based), size, sort: "field,dir" }
export const getRolesPageAPI = (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );
  return javaApi.get("/admin/roles", { params: clean }).then(unwrap);
};

// Every role as a plain array (dropdowns: staff form, staff filters).
export const getRolesAPI = () =>
  getRolesPageAPI({ page: 0, size: 500 }).then((page) =>
    Array.isArray(page) ? page : page?.content || [],
  );

export const getRoleAPI = (id) => javaApi.get(`/admin/roles/${id}`).then(unwrap);

// body: { name, description?, permissionCodes[] }
export const createRoleAPI = (body) => javaApi.post("/admin/roles", body).then(unwrap);

export const updateRoleAPI = (id, body) => javaApi.put(`/admin/roles/${id}`, body).then(unwrap);

export const deleteRoleAPI = (id) => javaApi.delete(`/admin/roles/${id}`).then(unwrap);

// Permission catalog for the role editor: [{ module, permissions: [{ code, action, label }] }]
export const getPermissionCatalogAPI = () => javaApi.get("/admin/permissions").then(unwrap);
