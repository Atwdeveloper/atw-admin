import javaApi, { unwrap } from "../javaApi";

// AdminRoleDto: { id, name, description, systemRole, permissionCodes[] }

// No server-side paging or search — the full list comes back.
export const getRolesAPI = () => javaApi.get("/admin/roles").then(unwrap);

export const getRoleAPI = (id) => javaApi.get(`/admin/roles/${id}`).then(unwrap);

// body: { name, description?, permissionCodes[] }
export const createRoleAPI = (body) => javaApi.post("/admin/roles", body).then(unwrap);

export const updateRoleAPI = (id, body) => javaApi.put(`/admin/roles/${id}`, body).then(unwrap);

export const deleteRoleAPI = (id) => javaApi.delete(`/admin/roles/${id}`).then(unwrap);

// Permission catalog for the role editor: [{ module, permissions: [{ code, action, label }] }]
export const getPermissionCatalogAPI = () => javaApi.get("/admin/permissions").then(unwrap);
