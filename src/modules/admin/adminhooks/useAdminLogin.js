"use client";

// src/modules/admin/hooks/useAdminLogin.js
import { useState } from "react";
import { useNavigate } from "@/lib/navigation";
import Swal from "sweetalert2";
import { loginAPI } from "../../../api/adminV1/authAPI";
import { startAdminSession } from "../../../api/adminV1/session";
import { apiError, CHANGE_PASSWORD_PATH } from "../../../api/javaApi";
import { useAuth } from "../../../common/hooks/useAuth";

export const useAdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (usernameOrEmail, password) => {
    setLoading(true);
    setError("");
    try {
      const result = await loginAPI(usernameOrEmail.trim(), password);

      if (result.otpRequired) {
        // Step 2: the OTP is emailed. testOtp is only present on local/test
        // backends, to fill the code in without a real inbox.
        navigate("/admin/verify-otp", {
          replace: true,
          state: {
            challengeId: result.challengeId,
            usernameOrEmail: usernameOrEmail.trim(),
            testOtp: result.testOtp || null,
          },
        });
        return;
      }

      // OTP disabled on the backend — tokens come straight back.
      startAdminSession(result.tokens, login);
      navigate(
        result.tokens.admin.mustChangePassword ? CHANGE_PASSWORD_PATH : "/admin/dashboard",
        { replace: true },
      );
    } catch (err) {
      const { message } = apiError(err, "Login failed. Please try again.");
      setError(message);
      Swal.fire({ icon: "error", title: "Login Failed", text: message });
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin, loading, error };
};
