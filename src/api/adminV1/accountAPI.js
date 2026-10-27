import javaApi, { unwrap } from "../javaApi";

// -> AdminProfile { id, username, email, fullName, superAdmin, roles, authorities, mustChangePassword }
export const getMeAPI = () => javaApi.get("/admin/account/me").then(unwrap);

// -> string[] of permission codes, or ["*"] for a super-admin.
export const getMyPermissionsAPI = () => javaApi.get("/admin/account/my-permissions").then(unwrap);

// Revokes the current session on success — log out straight after.
export const changePasswordAPI = (currentPassword, newPassword) =>
  javaApi.post("/admin/account/change-password", { currentPassword, newPassword }).then(unwrap);
