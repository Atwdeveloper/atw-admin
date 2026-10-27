"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { getAllSettingsAPI } from "../../api/getAllSettings";
import { BACKEND_ENABLED } from "../utils/features";
import siteSettings from "../utils/siteSettings";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [profileStatus, setProfileStatus] = useState(null);
  const [settings, setSettings] = useState(
    BACKEND_ENABLED ? null : siteSettings,
  );
  // Cookie configuration
  const cookieOptions = {
    expires: 7,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  // Helper to read auth from cookies and update state
  const refreshAuth = () => {
    try {
      const storedUser = Cookies.get("user");
      const storedToken = Cookies.get("token");
      const storedRole = Cookies.get("role");
      const storedProfileStatus = Cookies.get("profile_status");

      if (
        storedToken &&
        storedToken !== "undefined" &&
        storedToken !== "null"
      ) {
        setToken(storedToken);
      } else {
        setToken(null);
      }

      if (
        storedProfileStatus &&
        storedProfileStatus !== "undefined" &&
        storedProfileStatus !== "null"
      ) {
        setProfileStatus(storedProfileStatus);
      } else {
        setProfileStatus(null);
      }

      if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }

      if (storedRole && storedRole !== "undefined" && storedRole !== "null") {
        setRole(storedRole);
      } else {
        setRole(null);
      }
    } catch (error) {
      console.error("Error refreshing auth:", error);
      // Clear corrupted data
      Cookies.remove("user");
      Cookies.remove("token");
      Cookies.remove("role");
      Cookies.remove("profile_status");
      setUser(null);
      setToken(null);
      setRole(null);
      setProfileStatus(null);
    }
  };

  useEffect(() => {
    allSettings();
    refreshAuth(); // initial load
    setLoading(false);
  }, []);

  const allSettings = async () => {
    if (!BACKEND_ENABLED) return;
    try {
      const response = await getAllSettingsAPI();
      if (response.status === 200 && response.data) {
        setSettings(response.data);
        Cookies.set("logo_url", response.data.site_logo_url);
        Cookies.set("support_email", response.data.support_email);
        Cookies.set(
          "whatsapp_number",
          response.data.whatsapp_number,
          cookieOptions,
        );

        Cookies.set("phone_number", response.data.support_phone, cookieOptions);
      }
    } catch (error) {}
  };

  const login = (userData, tokenValue, userRole, profile_status) => {
    setUser(userData);
    setToken(tokenValue);
    setRole(userRole);
    setProfileStatus(profile_status);

    // Store in cookies
    Cookies.set("user", JSON.stringify(userData), cookieOptions);
    Cookies.set("token", tokenValue, cookieOptions);
    Cookies.set("role", userRole, cookieOptions);
    Cookies.set("profile_status", profile_status, cookieOptions);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRole(null);
    setProfileStatus(null);
    Cookies.remove("user");
    Cookies.remove("token");
    Cookies.remove("role");
    Cookies.remove("profile_status");
    Cookies.remove("refresh_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        role,
        settings,
        profileStatus,
        login,
        logout,
        loading,
        refreshAuth,
        refreshSettings: allSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
