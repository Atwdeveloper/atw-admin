"use client";

import React, { useEffect, useRef, useState } from "react";
import { ShieldCheck, ArrowLeft, Mail } from "lucide-react";
import Cookies from "js-cookie";
import { useLocation, useNavigate } from "@/lib/navigation";
import { useAdminOtpVerify } from "../adminhooks/useAdminOtpVerify";

const OTP_LENGTH = 6;

const AdminOtpVerify = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const challengeId = location.state?.challengeId || "";
  // Shown (masked) in "Code sent to ..."
  const username = location.state?.usernameOrEmail || "";
  const initialTestOtp = location.state?.testOtp || null;

  const [logoUrl, setLogoUrl] = useState("");
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef([]);
  const autoSubmittedRef = useRef("");

  const { verifyOtp, resendOtp, loading, resending, error, cooldown, testOtp } =
    useAdminOtpVerify(challengeId);

  // Local/test backends return the code itself (testOtp) so the flow works
  // without a real inbox. Real deployments never send it.
  const devOtp = testOtp || initialTestOtp;
  useEffect(() => {
    if (devOtp && /^\d+$/.test(devOtp)) {
      setDigits(devOtp.slice(0, OTP_LENGTH).split(""));
    }
  }, [devOtp]);

  useEffect(() => {
    setLogoUrl(Cookies.get("logo_url") || "");

    // No challenge in state usually means the user landed here directly
    // (refresh, back button, bookmark) rather than via the login step.
    if (!challengeId) {
      navigate("/admin/login", { replace: true });
    }
  }, [challengeId, navigate]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const focusInput = (index) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  const handleChange = (index, value) => {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }

    setDigits((prev) => {
      const next = [...prev];
      next[index] = clean[clean.length - 1];
      return next;
    });

    if (index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        setDigits((prev) => {
          const next = [...prev];
          next[index] = "";
          return next;
        });
      } else if (index > 0) {
        focusInput(index - 1);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((char, i) => {
      next[i] = char;
    });
    setDigits(next);
    focusInput(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  const otpValue = digits.join("");
  const isComplete = otpValue.length === OTP_LENGTH;

  // Auto-verify as soon as the last digit is entered (or a full code is
  // pasted), without waiting for the user to click the submit button.
  // The ref guards against re-submitting the same code again (e.g. after a
  // failed attempt leaves the same digits on screen).
  useEffect(() => {
    if (isComplete && !loading && autoSubmittedRef.current !== otpValue) {
      autoSubmittedRef.current = otpValue;
      verifyOtp(otpValue);
    }
  }, [isComplete, otpValue, loading, verifyOtp]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!isComplete || loading) return;
    verifyOtp(otpValue);
  };

  const maskedUsername = username.includes("@")
    ? username.replace(/^(.{2}).+(@.+)$/, "$1***$2")
    : username;

  return (
    <div
      style={{ backgroundImage: "url('/images/admin/Login-Bg.png')" }}
      className="flex flex-col gap-0 items-center justify-center bg-no-repeat bg-cover min-h-screen"
    >
      {logoUrl && (
        <img
          src={logoUrl}
          alt="Company Logo"
          className="max-h-24 cursor-pointer mb-6"
          onClick={() => navigate("/")}
        />
      )}

      <div className="bg-white p-12 rounded-2xl shadow-lg w-full max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#2D8FD8] to-[#6E258E] flex items-center justify-center">
            <ShieldCheck className="text-white" size={28} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 text-center">
          Verify OTP
        </h1>

        <p className="text-sm text-gray-500 text-center mt-2 mb-8 flex items-center justify-center gap-1.5">
          <Mail size={15} className="shrink-0" />
          <span>
            Code sent to{" "}
            <span className="font-medium text-gray-700">
              {maskedUsername || "your registered email"}
            </span>
          </span>
        </p>

        <form className="space-y-6" onSubmit={onSubmit}>
          {/* OTP boxes */}
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-semibold border rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                  transition-all
                  ${error ? "border-red-400" : "border-gray-300"}
                  ${digit ? "border-[#2D8FD8] text-gray-800" : "text-gray-400"}
                `}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isComplete || loading}
            className={`px-8 py-2 text-white font-semibold rounded-lg transition duration-200 w-full ${
              !isComplete || loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-[#2D8FD8] to-[#6E258E] hover:shadow-lg transform hover:-translate-y-0.5"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verifying...
              </div>
            ) : (
              "Verify & Continue"
            )}
          </button>

          {/* Resend OTP */}
          <div className="text-center text-sm text-gray-600">
            {cooldown > 0 ? (
              <span>
                Resend OTP in{" "}
                <span className="font-medium text-gray-800">{cooldown}s</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={resendOtp}
                disabled={resending}
                className="text-blue-500 hover:underline font-medium disabled:text-gray-400 disabled:no-underline"
              >
                {resending ? "Resending..." : "Resend OTP"}
              </button>
            )}
          </div>

          {/* Back to login */}
          <button
            type="button"
            onClick={() => navigate("/admin/login", { replace: true })}
            className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 w-full"
          >
            <ArrowLeft size={15} />
            Back to login
          </button>
        </form>
      </div>

      <div className="text-center text-white text-sm mt-2">
        <p>© {new Date().getFullYear()} Admin Portal. All rights reserved.</p>
      </div>
    </div>
  );
};

export default AdminOtpVerify;