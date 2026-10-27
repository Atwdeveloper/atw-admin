"use client";

import { useAuthContext } from "../context/AuthContext";

export const useAuth = () => {
  const {
    user,
    setUser,
    token,
    role,
    login,
    logout,
    loading,
    profileStatus,
    settings,
    refreshSettings,
  } = useAuthContext();

  const isAuthenticated = !!(token && user);

  return {
    user,
    setUser,
    token,
    role,
    profileStatus,
    login,
    logout,
    isAuthenticated,
    loading,
    settings,
    refreshSettings,
  };
};