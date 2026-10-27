import javaApi, { unwrap } from "../javaApi";

// Public /admin/auth/** endpoints. skipAuth: no token is attached, and a 401
// here (wrong password, bad OTP) must not trigger the session-expired flow.
const post = (path, body) =>
  javaApi.post(`/admin/auth/${path}`, body, { skipAuth: true }).then(unwrap);

// -> { otpRequired, challengeId?, tokens?, testOtp? }
export const loginAPI = (usernameOrEmail, password) =>
  post("login", { usernameOrEmail, password });

// -> AuthTokens { accessToken, refreshToken, expiresIn, admin }
export const verifyOtpAPI = (challengeId, otp) => post("verify-otp", { challengeId, otp });

// -> { challengeId, testOtp? } — a NEW challengeId; the old one stops working.
export const resendOtpAPI = (challengeId) => post("resend-otp", { challengeId });

export const logoutAPI = (refreshToken) => post("logout", { refreshToken });

// Always succeeds (never reveals whether the email exists).
export const forgotPasswordAPI = (email) => post("forgot-password", { email });

export const resetPasswordAPI = (token, newPassword) =>
  post("reset-password", { token, newPassword });

export const acceptInviteAPI = (token, password) => post("accept-invite", { token, password });
