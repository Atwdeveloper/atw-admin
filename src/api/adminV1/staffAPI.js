import javaApi, { unwrap } from "../javaApi";

// AdminStaffDto: { id, username, email, fullName, phone, superAdmin, status,
//                  roles: [{ id, name }], lastLoginAt, createdAt }

// page is 0-based. -> { content, page, size, totalElements, totalPages, first, last }
export const getStaffListAPI = ({ page = 0, size = 10, sort } = {}) =>
  javaApi.get("/admin/staff", { params: { page, size, sort } }).then(unwrap);

export const getStaffAPI = (id) => javaApi.get(`/admin/staff/${id}`).then(unwrap);

// body: { username?, email, fullName, phone?, roleIds[] } — no password; the
// backend emails an invite link (/admin/accept-invite?token=...).
export const createStaffAPI = (body) => javaApi.post("/admin/staff", body).then(unwrap);

// body: { username?, fullName, phone?, roleIds[] } — email isn't editable.
export const updateStaffAPI = (id, body) => javaApi.put(`/admin/staff/${id}`, body).then(unwrap);

// status: "ACTIVE" | "DISABLED"
export const setStaffStatusAPI = (id, status) =>
  javaApi.post(`/admin/staff/${id}/status`, { status }).then(unwrap);

export const deleteStaffAPI = (id) => javaApi.delete(`/admin/staff/${id}`).then(unwrap);

// Sub-resources. Each GET returns all-null fields until set; each PUT is a
// full replace. KYC numbers and bank account number come back masked unless
// the caller holds admin_staff.view_kyc / admin_staff.view_bank_details.
export const getStaffProfileAPI = (id) => javaApi.get(`/admin/staff/${id}/profile`).then(unwrap);
export const updateStaffProfileAPI = (id, body) =>
  javaApi.put(`/admin/staff/${id}/profile`, body).then(unwrap);

export const getStaffKycAPI = (id) => javaApi.get(`/admin/staff/${id}/kyc`).then(unwrap);
export const updateStaffKycAPI = (id, body) =>
  javaApi.put(`/admin/staff/${id}/kyc`, body).then(unwrap);

export const getStaffBankAPI = (id) => javaApi.get(`/admin/staff/${id}/bank-detail`).then(unwrap);
export const updateStaffBankAPI = (id, body) =>
  javaApi.put(`/admin/staff/${id}/bank-detail`, body).then(unwrap);
