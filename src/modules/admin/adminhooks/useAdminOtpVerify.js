"use client";

// src/modules/admin/hooks/useAdminOtpVerify.js
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "@/lib/navigation";
import Swal from "sweetalert2";
import { verifyOtpAPI, resendOtpAPI } from "../../../api/adminV1/authAPI";
import { startAdminSession } from "../../../api/adminV1/session";
import { apiError, CHANGE_PASSWORD_PATH } from "../../../api/javaApi";
import { useAuth } from "../../../common/hooks/useAuth";

// Matches the backend's default resend cooldown (the server enforces it too).
const RESEND_COOLDOWN_SECONDS = 60;

export const useAdminOtpVerify = (initialChallengeId) => {
  // Each resend issues a new challenge id and kills the old one.
  const [challengeId, setChallengeId] = useState(initialChallengeId);
  const [testOtp, setTestOtp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const timerRef = useRef(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Countdown for the "resend OTP" button
  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [cooldown]);

  const verifyOtp = useCallback(
    async (otp) => {
      if (!challengeId) {
        setError("Session expired. Please login again.");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const tokens = await verifyOtpAPI(challengeId, otp);
        startAdminSession(tokens, login);

        if (tokens.admin.mustChangePassword) {
          await Swal.fire({
            icon: "info",
            title: "Set a new password",
            text: "For security, please change your password before continuing.",
            confirmButtonText: "Continue",
          });
          navigate(CHANGE_PASSWORD_PATH, { replace: true });
          return;
        }

        Swal.fire({
          icon: "success",
          title: "Login Successful",
          text: "Redirecting...",
          timer: 1200,
          showConfirmButton: false,
        }).then(() => navigate("/admin/dashboard", { replace: true }));
      } catch (err) {
        // 422: too many wrong codes — the user needs a fresh code.
        setError(apiError(err, "Invalid or expired OTP. Please try again.").message);
      } finally {
        setLoading(false);
      }
    },
    [challengeId, login, navigate],
  );

  const resendOtp = useCallback(async () => {
    if (!challengeId || cooldown > 0) return;
    setResending(true);
    setError("");
    try {
      const result = await resendOtpAPI(challengeId);
      setChallengeId(result.challengeId);
      setTestOtp(result.testOtp || null);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      Swal.fire({
        icon: "success",
        title: "OTP Resent",
        text: "A new OTP has been sent to your email",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      setError(apiError(err, "Could not resend OTP. Try again.").message);
    } finally {
      setResending(false);
    }
  }, [challengeId, cooldown]);

  return { verifyOtp, resendOtp, loading, resending, error, cooldown, testOtp };
};
