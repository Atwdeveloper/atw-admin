"use client";

// hooks/useAdminPermissions.js
import { useState, useEffect, useContext, createContext, useCallback } from "react";
import { getMyPermissionsAPI } from "../../api/adminV1/accountAPI";
import { codesToPermissionMap } from "../../api/adminV1/permissions";
import { useAuthContext } from "../context/AuthContext";

const PermissionContext = createContext();

export const useAdminPermissions = () => {
  return useContext(PermissionContext);
};

export const PermissionProvider = ({ children }) => {
  const { user, token } = useAuthContext();
  // { module: [actions] }, or { "*": true } for a super-admin
  const [permissions, setPermissions] = useState({});

  // Which session the permissions belong to. Nothing to ask for when logged
  // out, or while a password change is pending (the backend answers 403 to
  // everything but change-password until then).
  const sessionKey = token && !user?.mustChangePassword ? token : null;
  const [loadedFor, setLoadedFor] = useState(undefined);
  // Still loading until permissions match the current session — avoids an
  // "Access Denied" flash while AuthContext is still reading the cookies.
  const loading = loadedFor !== sessionKey;

  const fetchPermissions = useCallback(async () => {
    if (!sessionKey) {
      setPermissions({});
      setLoadedFor(null);
      return;
    }
    try {
      const codes = await getMyPermissionsAPI();
      setPermissions(codesToPermissionMap(codes));
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      setPermissions({});
    } finally {
      setLoadedFor(sessionKey);
    }
  }, [sessionKey]);

  const hasPermission = (module, action) => {
    if (permissions["*"]) return true;
    return Boolean(permissions[module]?.includes(action));
  };

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return (
    <PermissionContext.Provider
      value={{ permissions, hasPermission, loading, refresh: fetchPermissions }}
    >
      {children}
    </PermissionContext.Provider>
  );
};
