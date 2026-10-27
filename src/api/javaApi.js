import axios from "axios";
import Cookies from "js-cookie";
import Swal from "sweetalert2";

// Java backend (admin panel). Every response is { success, data } or
// { success: false, error: { code, message, fieldErrors, traceId } }.
// Requests go to this app's own /api/v1 route handler
// (src/app/api/v1/[...path]/route.js), which relays them to ADMIN_API_URL,
// because the backend CORS allows neither localhost nor the deployed domain.
// Set NEXT_PUBLIC_ADMIN_API_URL to call a backend directly instead.
export const ADMIN_API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_URL || "/api/v1";

const cookieOptions = {
  expires: 7,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

// Tokens live in the same cookies AuthContext already uses ("token", "user",
// "role"), plus "refresh_token" for the Java backend's rotating refresh token.
export const adminSession = {
  accessToken: () => Cookies.get("token"),
  refreshToken: () => Cookies.get("refresh_token"),
  saveTokens({ accessToken, refreshToken }) {
    Cookies.set("token", accessToken, cookieOptions);
    Cookies.set("refresh_token", refreshToken, cookieOptions);
  },
  clear() {
    ["token", "refresh_token", "user", "role", "profile_status"].forEach((name) =>
      Cookies.remove(name, { path: "/" }),
    );
  },
};

const javaApi = axios.create({
  baseURL: ADMIN_API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Unwraps the { success, data } envelope.
export const unwrap = (response) => response.data?.data;

javaApi.interceptors.request.use((config) => {
  const token = adminSession.accessToken();
  if (token && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${token}`;
    config._accessToken = token;
  }
  return config;
});

// ---- Refresh -------------------------------------------------------------
// Refresh tokens rotate, and replaying an already-rotated one makes the
// backend revoke the whole session. So only one refresh may run at a time:
// one shared promise per tab, plus a Web Lock across tabs where supported.
let refreshing = null;

const refreshAccessToken = (staleAccessToken) => {
  if (!refreshing) {
    const run = async () => {
      // Another tab may have refreshed while this one waited for the lock.
      const current = adminSession.accessToken();
      if (current && current !== staleAccessToken) return current;

      const refreshToken = adminSession.refreshToken();
      if (!refreshToken) throw new Error("No refresh token");

      const response = await axios.post(
        `${ADMIN_API_BASE}/admin/auth/refresh`,
        { refreshToken },
        { headers: { "Content-Type": "application/json" } },
      );
      const tokens = unwrap(response);
      adminSession.saveTokens(tokens);
      return tokens.accessToken;
    };

    const locked = navigator.locks?.request
      ? navigator.locks.request("atw-admin-token-refresh", run)
      : run();
    refreshing = locked.finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
};

// ---- Session end ---------------------------------------------------------
let sessionEnding = false;

export const endAdminSession = (message = "Please log in again to continue.") => {
  if (sessionEnding) return;
  sessionEnding = true;
  adminSession.clear();
  Swal.fire({
    title: "Session ended",
    text: message,
    icon: "warning",
    confirmButtonText: "Log in",
    timer: 5000,
  }).then(() => {
    window.location.href = "/admin/login";
  });
};

export const CHANGE_PASSWORD_PATH = "/admin/settings/change-password";

javaApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const code = response?.data?.error?.code;

    // No token was sent (logged out, or a public call) — nothing to refresh or end.
    if (!config || config.skipAuth || !config._accessToken) return Promise.reject(error);

    if (response?.status === 401 && code === "UNAUTHENTICATED" && !config._retried) {
      config._retried = true;
      try {
        const token = await refreshAccessToken(config._accessToken);
        config.headers.Authorization = `Bearer ${token}`;
        config._accessToken = token;
        return javaApi(config);
      } catch {
        endAdminSession("Your session has expired. Please log in again.");
      }
    } else if (response?.status === 401) {
      // SESSION_REVOKED (password changed/reset or account disabled
      // elsewhere) — the refresh token is dead too, so don't try it.
      endAdminSession(
        code === "SESSION_REVOKED"
          ? "Your session was ended because your password changed or your account was disabled."
          : undefined,
      );
    } else if (response?.status === 403 && code === "MUST_CHANGE_PASSWORD") {
      if (window.location.pathname !== CHANGE_PASSWORD_PATH) {
        window.location.href = CHANGE_PASSWORD_PATH;
      }
    }
    return Promise.reject(error);
  },
);

// ---- Errors --------------------------------------------------------------
// Turns any failure into { code, message, fieldErrors: { field: message } }.
// Branch on `code`; `message` is safe to show the user.
export const apiError = (err, fallback = "Something went wrong. Please try again.") => {
  const body = err?.response?.data?.error;
  if (body) {
    const fieldErrors = Object.fromEntries(
      (body.fieldErrors || []).map((f) => [f.field, f.message]),
    );
    let message = body.message || fallback;
    if (body.code === "RATE_LIMITED") {
      message = "Too many attempts. Please wait a moment and try again.";
    } else if (body.code === "VALIDATION_ERROR" && Object.keys(fieldErrors).length) {
      message = "Please check the highlighted fields.";
    } else if (body.code === "INTERNAL_ERROR") {
      message = fallback;
    }
    return { code: body.code, message, fieldErrors, traceId: body.traceId, status: err.response.status };
  }
  if (err?.request && !err?.response) {
    return {
      code: "NETWORK_ERROR",
      message: "Unable to reach the server. Check your connection and try again.",
      fieldErrors: {},
    };
  }
  return { code: "UNKNOWN", message: fallback, fieldErrors: {} };
};

export default javaApi;
