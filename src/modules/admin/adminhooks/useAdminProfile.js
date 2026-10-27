"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import {
  changeUsernameAPI,
  changeEmailAPI,   // <-- ADD THIS API
} from "../../../api/admin/adminProfileAPI";
import { useAuth } from "../../../common/hooks/useAuth";
import { changePasswordAPI as changeAdminPasswordAPI } from "../../../api/adminV1/accountAPI";
import { endAdminSessionLocally } from "../../../api/adminV1/session";
import { apiError } from "../../../api/javaApi";

export const useAdminProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { logout } = useAuth();

  // -----------------------------------------------------
  // CHANGE PASSWORD
  // -----------------------------------------------------
  // Java backend: a successful change revokes this session (and every other
  // device's), so the admin logs in again with the new password.
  const handleChangePassword = async (current_password, new_password) => {
    setLoading(true);
    setError("");

    try {
      await changeAdminPasswordAPI(current_password, new_password);
      await Swal.fire({
        icon: "success",
        title: "Password Updated",
        text: "Your password has been updated. Please log in again with your new password.",
        confirmButtonText: "OK, Log in",
        allowOutsideClick: false,
      });
      await endAdminSessionLocally(logout);
      window.location.href = "/admin/login";
      return true;
    } catch (err) {
      const { message, fieldErrors } = apiError(err, "Unable to change password");
      const text = fieldErrors.currentPassword || fieldErrors.newPassword || message;
      setError(text);

      Swal.fire({
        icon: "error",
        title: "Failed",
        text,
      });
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------
  // CHANGE USERNAME
  // -----------------------------------------------------
  const handleChangeUsername = async (new_username) => {
    setLoading(true);
    setError("");

    try {
      const body = { new_username };
      const data = await changeUsernameAPI(body);

      if (data.status === 200) {
      Swal.fire({
        icon: "success",
        title: "Username Updated",
        text: "Your username has been updated successfully. You will be logged out for security reasons.",
        confirmButtonText: "OK, Logout",
        allowOutsideClick: false,
      }).then(() => logout());
      return data;
      }

    } catch (err) {
      const message = err.response?.data?.detail || "Unable to update username";
      setError(message);

      Swal.fire({
        icon: "error",
        title: "Failed",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------
  // ⭐ NEW — CHANGE EMAIL
  // -----------------------------------------------------
  const handleChangeEmail = async (new_email) => {
    setLoading(true);
    setError("");

    try {
      const body = { new_email };
      const data = await changeEmailAPI(body);

      Swal.fire({
        icon: "success",
        title: "Email Updated",
        text: "Your email has been updated successfully. You will be logged out for security reasons.",
        confirmButtonText: "OK, Logout",
        allowOutsideClick: false,
      }).then(() => logout());

      return data;

    } catch (err) {
      const message = err.response?.data?.detail || "Unable to update email";
      setError(message);

      Swal.fire({
        icon: "error",
        title: "Failed",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    handleChangePassword,
    handleChangeUsername,
    handleChangeEmail,  
  };
};
