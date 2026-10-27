// Java backend base path — every endpoint is relative to this
// (e.g. `${ADMIN_API_URL}/admin/auth/login`). Shared by the browser client
// (javaApi.js) and the dev proxy route, which can't import browser-only code.
export const ADMIN_API_URL = "https://api-dev.techagent.co.in/api/v1";
