"use client";

// src/components/LogoutModal.jsx
import React from "react";
import Swal from "sweetalert2";

export const showLogoutConfirmation = (logoutCallback) => {
  Swal.fire({
    title: "Are you sure?",
    text: "You'll be logged out of the dashboard.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, logout!",
    cancelButtonText: "Cancel",
    background: "#ffffff",
    color: "#333333",
  }).then((result) => {
    if (result.isConfirmed) {
      logoutCallback();
    }
  });
};
