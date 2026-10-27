"use client";

import React, { useEffect, useState } from "react";
import { User, Lock, Eye, EyeOff, Phone } from "lucide-react";
import { useAdminLogin } from "../adminhooks/useAdminLogin";
import Cookies from "js-cookie";
import { useNavigate } from "@/lib/navigation";
const AdminLogin = () => {
  const { handleLogin, loading } = useAdminLogin();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    const loadCookieData = () => {
      setLogoUrl(Cookies.get("logo_url") || "");
      setSupportEmail(Cookies.get("support_email") || "");
      setWhatsappNumber(Cookies.get("whatsapp_number") || "");
      setPhoneNumber(Cookies.get("phone_number") || "");
    };

    loadCookieData();

    const timer = setTimeout(loadCookieData, 500);

    const savedUsername = localStorage.getItem("rememberedUsername");

    if (savedUsername) {
      setFormData((prev) => ({
        ...prev,
        username: savedUsername,
      }));
      setRememberMe(true);
    }

    return () => clearTimeout(timer);
  }, []);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();

    let newErrors = { username: "", password: "" };
    let isValid = true;

    if (!formData.username.trim()) {
      newErrors.username = "Username or email is required";
      isValid = false;
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) return;

    // Remember Me Logic
    if (rememberMe) {
      localStorage.setItem("rememberedUsername", formData.username);
    } else {
      localStorage.removeItem("rememberedUsername");
    }

    handleLogin(formData.username, formData.password);
  };

  return (
    <div
      style={{ backgroundImage: "url('/images/admin/Login-Bg.png')" }}
      className="flex flex-col gap-0 items-center justify-center bg-no-repeat bg-cover min-h-screen"
    >
      {/* {logoUrl && <img src={logoUrl} alt="Company Logo" className="max-h-24" />} */}
      {logoUrl && (
        <img
          src={logoUrl}
          alt="Company Logo"
          className="max-h-24 cursor-pointer mb-6"
          onClick={() => navigate("/")}
        />
      )}
      <div className="bg-white p-12 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 text-center">
          Admin Panel
        </h1>
        <h2 className="text-xl font-bold text-center text-gray-800 mt-6 mb-6 ">
          Welcome <span className="font-light ml-2">Please Login</span>
        </h2>
        <form className="space-y-4" onSubmit={onSubmit}>
          {/* Username Field */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm text-gray-700">
              Username or email <span className="text-red-500">*</span>
            </label>
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <User size={20} />
              </span>
              <input
                type="text"
                maxLength={320}
                name="username"
                placeholder="Username or email"
                onChange={handleChange}
                value={formData.username}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  errors.username ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm text-gray-700">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <Lock size={20} />
              </span>

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                maxLength={100}
                onChange={handleChange}
                value={formData.password}
                className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
              />

              <span
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </span>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-sm mt-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="accent-blue-500"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="text-gray-700">Remember me</span>
            </label>

            <a
              href="/admin/forgot-password"
              className="text-blue-500 hover:underline font-medium"
            >
              Forgot password?
            </a>
          </div>

          {/* API Error Message */}
          {/*  {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )} */}

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className={`mt-4 px-8 py-2 text-white font-semibold rounded-lg transition duration-200 w-full ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#2D8FD8] to-[#6E258E] hover:from-[#2D8FD8] hover:to-[#6E258E] hover:shadow-lg transform hover:-translate-y-0.5"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Logging in...
                </div>
              ) : (
                "Login"
              )}
            </button>
          </div>
        </form>
        {(whatsappNumber || phoneNumber) && (
          <div className="pt-6 border-t border-gray-200 mt-6">
            <p className="text-sm font-semibold text-gray-500 text-center mb-3">
              Help & Support
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors w-full sm:w-auto"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                    alt="WhatsApp"
                    className="w-5 h-5"
                  />
                  <span className="font-medium">WhatsApp</span>
                </a>
              )}

              {phoneNumber && (
                <a
                  href={`tel:${phoneNumber}`}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors w-full sm:w-auto"
                >
                  <Phone size={20} />
                  <span className="font-medium">Call Us</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="text-center text-white text-sm mt-2">
        <p>© {new Date().getFullYear()} Admin Portal. All rights reserved.</p>

        <p className="mt-1">
          Need help?{" "}
          <a
            href={`mailto:${supportEmail}`}
            className="text-amber-300 hover:underline"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
