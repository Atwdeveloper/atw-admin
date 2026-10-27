import axios from "axios";
import Swal from "sweetalert2";
import Cookies from "js-cookie";

const axiosInstance = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "https://anytimework.in/anytimework/public/api/",
});

// Attach token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// This app only has the admin panel, so an expired session always ends at its login.
const getRedirectUrl = () => "/admin/login";

// Handle expired tokens
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const redirectUrl = getRedirectUrl();

      // Clear all authentication data
      const authItems = ["token", "user", "role"];
      authItems.forEach((item) => {
        Cookies.remove(item);
        localStorage.removeItem(item);
      });

      // Show notification before redirect (except for auth endpoints)
      if (!error.config?.url?.includes("/auth/")) {
        Swal.fire({
          title: "Session Expired",
          text: "Please login again to continue.",
          icon: "warning",
          confirmButtonText: "Login",
          timer: 5000,
          showConfirmButton: true,
        }).then((result) => {
          window.location.href = redirectUrl;
        });
      } else {
        // Immediate redirect for auth endpoints
        window.location.href = redirectUrl;
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
