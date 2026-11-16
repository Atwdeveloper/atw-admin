"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Phone,
  Fingerprint,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import {
  sendIntakeMobileOtpAPI,
  verifyIntakeMobileOtpAPI,
  sendIntakeAadhaarOtpAPI,
  verifyIntakeAadhaarOtpAPI,
} from "../../../../api/adminV1/workerAPI";
import { apiError } from "../../../../api/javaApi";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;

// The provider passes gender through as free text (MALE/FEMALE/TRANSGENDER...).
const normalizeGender = (g) => {
  const val = String(g || "").trim().toUpperCase();
  if (val === "M" || val === "MALE") return "MALE";
  if (val === "F" || val === "FEMALE") return "FEMALE";
  return val ? "OTHER" : "";
};

const errorMessage = (err, fallback) => apiError(err, fallback).message;

const emptyOtp = () => Array(OTP_LENGTH).fill("");

const OtpBoxes = ({ digits, onChange, refs, error }) => (
  <div className="flex items-center justify-center gap-2">
    {digits.map((digit, i) => (
      <input
        key={i}
        ref={(el) => (refs.current[i] = el)}
        type="text"
        inputMode="numeric"
        maxLength={1}
        value={digit}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, "").slice(-1);
          const next = [...digits];
          next[i] = val;
          onChange(next);
          if (val && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
        }}
        onKeyDown={(e) => {
          if (e.key === "Backspace" && !digits[i] && i > 0) {
            refs.current[i - 1]?.focus();
          }
        }}
        className={`w-11 h-12 text-center text-lg font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${
          error ? "border-red-500" : "border-gray-300 hover:border-gray-400"
        }`}
      />
    ))}
  </div>
);

const StepDot = ({ active, done, icon, label }) => (
  <div className="flex flex-col items-center gap-1">
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
        done
          ? "bg-blue-600 border-blue-600 text-white"
          : active
            ? "border-blue-600 text-blue-600 bg-blue-50"
            : "border-gray-200 text-gray-400 bg-gray-50"
      }`}
    >
      {done ? <CheckCircle2 size={18} /> : icon}
    </div>
    <span
      className={`text-xs font-medium ${
        active || done ? "text-blue-700" : "text-gray-400"
      }`}
    >
      {label}
    </span>
  </div>
);

// The "add worker via Aadhaar" wizard (/admin/workers/intake/*): verify the
// mobile number by SMS OTP, then optionally run a live Aadhaar e-KYC OTP to
// pull UIDAI-sourced details into the form. The verificationId it hands back
// is sent as aadhaarVerificationId on create, which marks KYC verified.
// There is no separate resend endpoint — resending is another send, and sends
// are rate limited (3 per number / 10 per IP in 10 minutes).
const AadhaarVerifyModal = ({ isOpen, onClose, onVerified }) => {
  // mobile | mobile_otp | mobile_success | aadhaar | aadhaar_otp | aadhaar_success
  const [stage, setStage] = useState("mobile");
  const [mobile, setMobile] = useState("");
  const [mobileOtpId, setMobileOtpId] = useState("");
  const [mobileOtpDigits, setMobileOtpDigits] = useState(emptyOtp());
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [aadhaarOtpDigits, setAadhaarOtpDigits] = useState(emptyOtp());
  const [referenceId, setReferenceId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mobileResendTimer, setMobileResendTimer] = useState(0);
  const [resendTimer, setResendTimer] = useState(0);
  const mobileOtpRefs = useRef([]);
  const aadhaarOtpRefs = useRef([]);
  const verifiedDataRef = useRef(null);
  const mobileVerifiedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    setStage("mobile");
    setMobile("");
    setMobileOtpId("");
    setMobileOtpDigits(emptyOtp());
    setAadhaarNumber("");
    setConsentGiven(false);
    setAadhaarOtpDigits(emptyOtp());
    setReferenceId("");
    setError("");
    setBusy(false);
    setMobileResendTimer(0);
    setResendTimer(0);
    verifiedDataRef.current = null;
    mobileVerifiedRef.current = false;
  }, [isOpen]);

  useEffect(() => {
    if (stage !== "mobile_otp" || mobileResendTimer <= 0) return;
    const t = setTimeout(() => setMobileResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, mobileResendTimer]);

  useEffect(() => {
    if (stage !== "aadhaar_otp" || resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, resendTimer]);

  useEffect(() => {
    if (stage === "aadhaar_success") {
      const t = setTimeout(() => {
        if (verifiedDataRef.current) onVerified(verifiedDataRef.current);
        onClose();
      }, 1500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => {
    if (stage === "mobile_otp") setTimeout(() => mobileOtpRefs.current[0]?.focus(), 50);
    if (stage === "aadhaar_otp") setTimeout(() => aadhaarOtpRefs.current[0]?.focus(), 50);
  }, [stage]);

  // Skipping (X or "fill manually") after the mobile number has already
  // been verified should still hand that verified number back to the form.
  const handleClose = () => {
    if (mobileVerifiedRef.current) {
      onVerified({ mobile_number: mobile.replace(/\D/g, "") });
    }
    onClose();
  };

  const handleSendMobileOtp = async () => {
    const digits = mobile.replace(/\D/g, "");
    if (digits.length !== 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await sendIntakeMobileOtpAPI(digits);
      setMobileOtpId(res?.otpId || "");
      setMobileOtpDigits(emptyOtp());
      setStage("mobile_otp");
      setMobileResendTimer(RESEND_SECONDS);
    } catch (err) {
      setError(errorMessage(err, "Failed to send OTP. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  // No resend endpoint — a resend is a fresh send (new otpId).
  const handleResendMobileOtp = async () => {
    if (mobileResendTimer > 0) return;
    const digits = mobile.replace(/\D/g, "");
    setBusy(true);
    try {
      const res = await sendIntakeMobileOtpAPI(digits);
      setMobileOtpId(res?.otpId || "");
      setMobileOtpDigits(emptyOtp());
      setMobileResendTimer(RESEND_SECONDS);
      setError("");
      mobileOtpRefs.current[0]?.focus();
    } catch (err) {
      setError(errorMessage(err, "Unable to resend OTP."));
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyMobileOtp = async () => {
    const otp = mobileOtpDigits.join("");
    if (otp.length !== OTP_LENGTH) {
      setError("Please enter the full 6-digit OTP");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await verifyIntakeMobileOtpAPI(mobileOtpId, otp);
      mobileVerifiedRef.current = true;
      setStage("mobile_success");
    } catch (err) {
      setError(errorMessage(err, "Invalid OTP. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const handleChangeMobile = () => {
    setStage("mobile");
    setMobileOtpDigits(emptyOtp());
    setError("");
  };

  const handleSendAadhaarOtp = async () => {
    const digits = aadhaarNumber.replace(/\D/g, "");
    if (digits.length !== 12) {
      setError("Enter a valid 12-digit Aadhaar number");
      return;
    }
    if (!consentGiven) {
      setError("The worker's consent is required for Aadhaar verification");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await sendIntakeAadhaarOtpAPI(digits);
      setReferenceId(res?.verificationId || "");
      setAadhaarOtpDigits(emptyOtp());
      setStage("aadhaar_otp");
      setResendTimer(RESEND_SECONDS);
    } catch (err) {
      setError(errorMessage(err, "Could not send OTP. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  // No resend endpoint — a resend starts a fresh verification.
  const handleResendAadhaarOtp = async () => {
    if (resendTimer > 0) return;
    const digits = aadhaarNumber.replace(/\D/g, "");
    setBusy(true);
    try {
      const res = await sendIntakeAadhaarOtpAPI(digits);
      setReferenceId(res?.verificationId || referenceId);
      setResendTimer(RESEND_SECONDS);
      setAadhaarOtpDigits(emptyOtp());
      setError("");
      aadhaarOtpRefs.current[0]?.focus();
    } catch (err) {
      setError(errorMessage(err, "Unable to resend OTP."));
    } finally {
      setBusy(false);
    }
  };

  const handleChangeAadhaar = () => {
    setStage("aadhaar");
    setAadhaarOtpDigits(emptyOtp());
    setError("");
  };

  const handleVerifyAadhaarOtp = async () => {
    const otp = aadhaarOtpDigits.join("");
    if (otp.length !== OTP_LENGTH) {
      setError("Please enter the full 6-digit OTP");
      return;
    }
    if (!referenceId) {
      setError("Missing OTP reference — please resend the OTP and try again.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const aadhaar = (await verifyIntakeAadhaarOtpAPI(referenceId, otp)) || {};
      const names = String(aadhaar.fullName || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      verifiedDataRef.current = {
        aadhaar_verification_id: aadhaar.verificationId || referenceId,
        mobile_number: mobile.replace(/\D/g, ""),
        first_name: names[0] || "",
        middle_name: names.length > 2 ? names.slice(1, -1).join(" ") : "",
        last_name: names.length > 1 ? names[names.length - 1] : "",
        date_of_birth: aadhaar.dateOfBirth || "",
        father_name: aadhaar.fatherName || "",
        gender: normalizeGender(aadhaar.gender),
        address_line1: aadhaar.addressLine1 || "",
        address_line2: aadhaar.addressLine2 || "",
        pincode: aadhaar.pincode || "",
        state_id: aadhaar.stateId || "",
        city_id: aadhaar.cityId || "",
        state_name: aadhaar.stateName || "",
        district_name: aadhaar.districtName || "",
        aadhar_number: aadhaarNumber.replace(/\D/g, ""),
      };
      setStage("aadhaar_success");
    } catch (err) {
      setError(errorMessage(err, "Invalid OTP, please try again"));
    } finally {
      setBusy(false);
    }
  };

  // Auto-verify as soon as the last OTP digit is typed, so there's no
  // separate "Verify" button to click on either OTP screen.
  useEffect(() => {
    if (stage !== "mobile_otp" || busy) return;
    if (mobileOtpDigits.every((d) => d !== "")) handleVerifyMobileOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileOtpDigits, stage]);

  useEffect(() => {
    if (stage !== "aadhaar_otp" || busy) return;
    if (aadhaarOtpDigits.every((d) => d !== "")) handleVerifyAadhaarOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aadhaarOtpDigits, stage]);

  const stageMeta = {
    mobile: {
      icon: <Phone size={22} />,
      title: "Verify Worker's Mobile Number",
      subtitle: "Enter the worker's mobile number to send a verification OTP.",
    },
    mobile_otp: {
      icon: <Phone size={22} />,
      title: "Enter Mobile OTP",
      subtitle: `A 6-digit code was sent to ${mobile}.`,
    },
    aadhaar: {
      icon: <Fingerprint size={22} />,
      title: "Verify Aadhaar",
      subtitle:
        "Enter the worker's Aadhaar number to fetch and auto-fill their details.",
    },
    aadhaar_otp: {
      icon: <Fingerprint size={22} />,
      title: "Enter Aadhaar OTP",
      subtitle: "A 6-digit code was sent to the Aadhaar-linked mobile number.",
    },
  };

  const isSuccessStage = stage === "mobile_success" || stage === "aadhaar_success";
  const majorStep = stage.startsWith("aadhaar") ? 2 : 1;

  // Only reached for "mobile" / "aadhaar" (the number-entry screens) — the
  // OTP screens auto-verify on the last digit and render no button here.
  const handlePrimaryAction = () => {
    if (stage === "mobile") return handleSendMobileOtp();
    if (stage === "aadhaar") return handleSendAadhaarOtp();
  };

  const primaryLabel = busy ? "Sending OTP..." : "Send OTP";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <X size={20} />
            </button>

            <div className="px-8 pt-9 pb-2 text-center">
              {!isSuccessStage && (
                <div className="flex items-center justify-center gap-4 mb-6">
                  <StepDot
                    active={majorStep === 1}
                    done={majorStep > 1}
                    icon={<Phone size={16} />}
                    label="Mobile"
                  />
                  <div
                    className={`h-0.5 w-12 rounded ${
                      majorStep > 1 ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                  <StepDot
                    active={majorStep === 2}
                    done={false}
                    icon={<Fingerprint size={16} />}
                    label="Aadhaar (optional)"
                  />
                </div>
              )}

              {!isSuccessStage && (
                <>
                  <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
                    {stageMeta[stage].icon}
                  </div>
                  <h1 className="text-xl font-bold text-blue-700">
                    {stageMeta[stage].title}
                  </h1>
                  <p className="text-gray-500 text-sm mt-2">
                    {stageMeta[stage].subtitle}
                  </p>
                </>
              )}
            </div>

            {stage === "mobile_success" && (
              <div className="px-8 pb-9 pt-4 flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-4"
                >
                  <CheckCircle2 size={34} />
                </motion.div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Mobile Number Verified!
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Auto-fill the worker's details using Aadhaar, or continue
                  filling the form manually.
                </p>

                <div className="w-full flex flex-col gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setStage("aadhaar");
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
                  >
                    <Fingerprint size={18} />
                    Verify with Aadhaar
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full py-3 px-4 rounded-lg font-medium text-slate-600 border border-gray-300 hover:bg-gray-50 transition"
                  >
                    Skip &amp; Fill Manually
                  </button>
                </div>
              </div>
            )}

            {stage === "aadhaar_success" && (
              <div className="px-8 pb-10 pt-4 flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-4"
                >
                  <CheckCircle2 size={34} />
                </motion.div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Aadhaar Verified!
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Details fetched — filling the form for you.
                </p>
              </div>
            )}

            {!isSuccessStage && (
              <div className="px-8 pb-8 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle size={16} className="shrink-0" /> {error}
                  </div>
                )}

                {stage === "mobile" && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <Phone size={18} />
                      </span>
                      <input
                        type="tel"
                        value={mobile}
                        onChange={(e) => {
                          setMobile(
                            e.target.value.replace(/\D/g, "").slice(0, 10),
                          );
                          if (error) setError("");
                        }}
                        placeholder="Enter 10-digit mobile number"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition hover:border-gray-400"
                      />
                    </div>
                  </div>
                )}

                {stage === "mobile_otp" && (
                  <div className="space-y-3">
                    <OtpBoxes
                      digits={mobileOtpDigits}
                      onChange={(d) => {
                        setMobileOtpDigits(d);
                        if (error) setError("");
                      }}
                      refs={mobileOtpRefs}
                      error={!!error}
                    />
                    {busy && (
                      <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                        <Loader2 size={16} className="animate-spin" />
                        Verifying...
                      </div>
                    )}
                    <div className="text-center text-sm">
                      <span className="text-gray-500">
                        Didn't receive the OTP?{" "}
                      </span>
                      {mobileResendTimer > 0 ? (
                        <span className="text-blue-600">
                          Resend OTP in 0:
                          {String(mobileResendTimer).padStart(2, "0")}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendMobileOtp}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleChangeMobile}
                      className="flex items-center gap-1 mx-auto text-sm text-blue-600 hover:underline"
                    >
                      <ChevronLeft size={14} /> Change mobile number
                    </button>
                  </div>
                )}

                {stage === "aadhaar" && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Aadhaar Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <Fingerprint size={18} />
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={aadhaarNumber}
                        onChange={(e) => {
                          setAadhaarNumber(
                            e.target.value.replace(/\D/g, "").slice(0, 12),
                          );
                          if (error) setError("");
                        }}
                        placeholder="Enter 12-digit Aadhaar number"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition hover:border-gray-400"
                      />
                    </div>
                    <label className="flex items-start gap-2 pt-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consentGiven}
                        onChange={(e) => {
                          setConsentGiven(e.target.checked);
                          if (error) setError("");
                        }}
                        className="mt-0.5"
                      />
                      <span>
                        The worker consents to verifying their identity with
                        Aadhaar e-KYC.
                      </span>
                    </label>
                  </div>
                )}

                {stage === "aadhaar_otp" && (
                  <div className="space-y-3">
                    <OtpBoxes
                      digits={aadhaarOtpDigits}
                      onChange={(d) => {
                        setAadhaarOtpDigits(d);
                        if (error) setError("");
                      }}
                      refs={aadhaarOtpRefs}
                      error={!!error}
                    />
                    {busy && (
                      <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                        <Loader2 size={16} className="animate-spin" />
                        Verifying...
                      </div>
                    )}
                    <div className="text-center text-sm">
                      <span className="text-gray-500">
                        Didn't receive the OTP?{" "}
                      </span>
                      {resendTimer > 0 ? (
                        <span className="text-blue-600">
                          Resend OTP in 0:{String(resendTimer).padStart(2, "0")}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendAadhaarOtp}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleChangeAadhaar}
                      className="flex items-center gap-1 mx-auto text-sm text-blue-600 hover:underline"
                    >
                      <ChevronLeft size={14} /> Change Aadhaar number
                    </button>
                  </div>
                )}

                {stage !== "mobile_otp" && stage !== "aadhaar_otp" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handlePrimaryAction}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-white transition ${
                      busy
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {busy && <Loader2 size={16} className="animate-spin" />}
                    {primaryLabel}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full text-center text-sm text-slate-500 hover:text-slate-700 hover:underline"
                >
                  Skip &amp; fill manually
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AadhaarVerifyModal;
