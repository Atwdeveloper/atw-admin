import { adminSession } from "../javaApi";
import { logoutAPI } from "./authAPI";

// Small copy of the admin for the "user" cookie. The full authorities list can
// be long enough to overflow a cookie, and permissions are fetched separately.
export const toStoredAdmin = (admin) => ({
  id: admin.id,
  username: admin.username,
  email: admin.email,
  fullName: admin.fullName,
  name: admin.fullName || admin.username,
  superAdmin: admin.superAdmin,
  roles: admin.roles || [],
  mustChangePassword: admin.mustChangePassword,
});

export const adminRoleOf = (admin) => (admin.superAdmin ? "admin" : "admin_staff");

// Call with the AuthTokens from verify-otp (or a login with OTP disabled).
// `login` is AuthContext's login(user, token, role).
export const startAdminSession = (tokens, login) => {
  adminSession.saveTokens(tokens);
  login(toStoredAdmin(tokens.admin), tokens.accessToken, adminRoleOf(tokens.admin));
};

// Revokes the refresh token server-side (best effort), then clears locally.
// `logout` is AuthContext's logout().
export const endAdminSessionLocally = async (logout) => {
  const refreshToken = adminSession.refreshToken();
  adminSession.clear();
  logout();
  if (refreshToken) {
    try {
      await logoutAPI(refreshToken);
    } catch {
      // Already invalid or offline — the local session is gone either way.
    }
  }
};
