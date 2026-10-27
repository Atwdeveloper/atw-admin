"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "@/lib/navigation";
import Swal from "sweetalert2";
import {
  createStaffAPI,
  getStaffAPI,
  getStaffBankAPI,
  getStaffKycAPI,
  getStaffProfileAPI,
  updateStaffAPI,
  updateStaffBankAPI,
  updateStaffKycAPI,
  updateStaffProfileAPI,
} from "../../../api/adminV1/staffAPI";
import { getRolesAPI } from "../../../api/adminV1/roleAPI";
import { apiError } from "../../../api/javaApi";

// Form field groups — each maps to one backend resource.
export const CORE_FIELDS = ["fullName", "email", "username", "phone", "roleIds"];
export const PROFILE_FIELDS = ["dateOfBirth", "gender", "addressLine", "pincode"];
export const KYC_FIELDS = ["aadhaarNumber", "panNumber", "uanNumber", "pfNumber", "esicNumber"];
export const BANK_FIELDS = ["accountHolderName", "bankName", "accountNumber", "ifscCode", "branchName"];

const EMPTY = Object.fromEntries(
  [...CORE_FIELDS, ...PROFILE_FIELDS, ...KYC_FIELDS, ...BANK_FIELDS].map((f) => [
    f,
    f === "roleIds" ? [] : "",
  ]),
);

const isMasked = (value) => typeof value === "string" && value.includes("*");
const trimOrNull = (value) => (typeof value === "string" && value.trim() ? value.trim() : null);
const pick = (obj, fields) => Object.fromEntries(fields.map((f) => [f, obj[f]]));
const changed = (a, b, fields) => fields.some((f) => JSON.stringify(a[f]) !== JSON.stringify(b[f]));

const validate = (form, { mode, maskedKyc, replaceKyc, savedAccountMasked, bankChanged, showExtras }) => {
  const e = {};
  if (!form.fullName.trim()) e.fullName = "Full name is required";
  else if (form.fullName.trim().length > 150) e.fullName = "Full name must be at most 150 characters";

  if (mode === "create") {
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Enter a valid email address";
  }
  if (form.username && !/^[a-zA-Z0-9._-]{3,100}$/.test(form.username.trim()))
    e.username = "3–100 characters: letters, numbers, dot, dash or underscore";
  if (form.phone && !/^\+?[0-9\s-]{7,20}$/.test(form.phone.trim()))
    e.phone = "Enter a valid phone number";
  if (form.roleIds.length === 0) e.roleIds = "Select at least one role";

  if (!showExtras) return e;

  if (form.pincode && !/^\d{6}$/.test(form.pincode.trim())) e.pincode = "Pincode must be 6 digits";
  if (form.addressLine.length > 255) e.addressLine = "Address must be at most 255 characters";

  if (!maskedKyc || replaceKyc) {
    if (form.aadhaarNumber && !/^\d{12}$/.test(form.aadhaarNumber.replace(/\s/g, "")))
      e.aadhaarNumber = "Aadhaar must be 12 digits";
    if (form.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.panNumber.trim().toUpperCase()))
      e.panNumber = "PAN format: ABCDE1234F";
    if (form.uanNumber && !/^\d{12}$/.test(form.uanNumber.trim())) e.uanNumber = "UAN must be 12 digits";
    if (form.pfNumber.length > 50) e.pfNumber = "PF number must be at most 50 characters";
    if (form.esicNumber && !/^[0-9]{10,17}$/.test(form.esicNumber.trim()))
      e.esicNumber = "ESIC number must be 10–17 digits";
  }

  if (form.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifscCode.trim().toUpperCase()))
    e.ifscCode = "IFSC format: ABCD0123456";
  if (form.accountNumber && !/^\d{9,18}$/.test(form.accountNumber.trim()))
    e.accountNumber = "Account number must be 9–18 digits";
  // The saved account number is masked, and a bank save replaces every field.
  if (bankChanged && savedAccountMasked && !form.accountNumber.trim())
    e.accountNumber = "Re-enter the account number to save bank changes";

  return e;
};

export const useStaffForm = ({ mode = "create", staffId } = {}) => {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [initial, setInitial] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Set before the success dialog so the unsaved-changes guard is off by the time we navigate.
  const [isSaved, setIsSaved] = useState(false);

  const [roles, setRoles] = useState([]);
  const [rolesError, setRolesError] = useState("");

  // Edit-mode facts about the existing record
  const [staff, setStaff] = useState(null);
  const [maskedKyc, setMaskedKyc] = useState(null); // masked values as returned, or null
  const [replaceKyc, setReplaceKyc] = useState(false);
  const [savedAccountMasked, setSavedAccountMasked] = useState(""); // e.g. "********2333"

  // Super-admin profile/KYC/bank can't be changed through these endpoints.
  const showExtras = !staff?.superAdmin;

  // Roles for the picker (needs admin_roles.view)
  useEffect(() => {
    getRolesAPI()
      .then((list) => setRoles(list || []))
      .catch((err) => {
        const { code } = apiError(err);
        setRolesError(
          code === "ACCESS_DENIED"
            ? "You don't have permission to view roles, so roles can't be changed here."
            : "Couldn't load roles.",
        );
      });
  }, []);

  // Load the existing staff member + sub-resources
  useEffect(() => {
    if (mode !== "edit" || !staffId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const s = await getStaffAPI(staffId);
        const extras = s.superAdmin
          ? [{}, {}, {}]
          : await Promise.all([
              getStaffProfileAPI(staffId).catch(() => ({})),
              getStaffKycAPI(staffId).catch(() => ({})),
              getStaffBankAPI(staffId).catch(() => ({})),
            ]);
        if (cancelled) return;
        const [profile, kyc, bank] = extras;

        const kycIsMasked = KYC_FIELDS.some((f) => isMasked(kyc?.[f]));
        const accountMasked = isMasked(bank?.accountNumber) ? bank.accountNumber : "";

        const loaded = {
          ...EMPTY,
          fullName: s.fullName || "",
          email: s.email || "",
          username: s.username || "",
          phone: s.phone || "",
          roleIds: (s.roles || []).map((r) => r.id),
          dateOfBirth: profile?.dateOfBirth || "",
          gender: profile?.gender || "",
          addressLine: profile?.addressLine || "",
          pincode: profile?.pincode || "",
          // Masked KYC isn't put in the inputs — it's shown read-only instead.
          ...Object.fromEntries(KYC_FIELDS.map((f) => [f, kycIsMasked ? "" : kyc?.[f] || ""])),
          accountHolderName: bank?.accountHolderName || "",
          bankName: bank?.bankName || "",
          accountNumber: accountMasked ? "" : bank?.accountNumber || "",
          ifscCode: bank?.ifscCode || "",
          branchName: bank?.branchName || "",
        };

        setStaff(s);
        setMaskedKyc(kycIsMasked ? pick(kyc, KYC_FIELDS) : null);
        setSavedAccountMasked(accountMasked);
        setForm(loaded);
        setInitial(loaded);
      } catch (err) {
        if (cancelled) return;
        Swal.fire({
          icon: "error",
          title: "Couldn't load staff member",
          text: apiError(err).message,
        }).then(() => navigate("/admin/staff/listing"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, staffId, navigate]);

  const isDirty = useMemo(
    () => !isSaved && (replaceKyc || JSON.stringify(form) !== JSON.stringify(initial)),
    [form, initial, replaceKyc, isSaved],
  );

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
  };

  const toggleRole = (roleId) => {
    setForm((f) => ({
      ...f,
      roleIds: f.roleIds.includes(roleId)
        ? f.roleIds.filter((id) => id !== roleId)
        : [...f.roleIds, roleId],
    }));
    setErrors((e) => ({ ...e, roleIds: undefined }));
  };

  const startReplaceKyc = () => setReplaceKyc(true);
  const cancelReplaceKyc = () => {
    setReplaceKyc(false);
    setForm((f) => ({ ...f, ...pick(EMPTY, KYC_FIELDS) }));
    setErrors((e) => ({ ...e, ...Object.fromEntries(KYC_FIELDS.map((k) => [k, undefined])) }));
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();

    const profileChanged = changed(form, initial, PROFILE_FIELDS);
    const kycChanged = maskedKyc ? replaceKyc : changed(form, initial, KYC_FIELDS);
    const bankChanged = changed(form, initial, BANK_FIELDS);

    const found = validate(form, { mode, maskedKyc, replaceKyc, savedAccountMasked, bankChanged, showExtras });
    setErrors(found);
    if (Object.keys(found).length) {
      Swal.fire({ icon: "warning", title: "Please check the form", text: Object.values(found)[0] });
      return;
    }

    setIsSubmitting(true);
    let id = staffId;
    try {
      // 1. Core record
      if (mode === "create") {
        const created = await createStaffAPI({
          username: trimOrNull(form.username),
          email: form.email.trim(),
          fullName: form.fullName.trim(),
          phone: trimOrNull(form.phone),
          roleIds: form.roleIds,
        });
        id = created.id;
      } else if (changed(form, initial, CORE_FIELDS)) {
        await updateStaffAPI(id, {
          username: trimOrNull(form.username),
          fullName: form.fullName.trim(),
          phone: trimOrNull(form.phone),
          roleIds: form.roleIds,
        });
      }
    } catch (err) {
      setIsSubmitting(false);
      const { code, message, fieldErrors } = apiError(err);
      setErrors(fieldErrors);
      Swal.fire({
        icon: "error",
        title: mode === "create" ? "Couldn't create staff" : "Couldn't update staff",
        text: code === "CONFLICT" ? "A staff member with this email or username already exists." : message,
      });
      return;
    }

    // 2. Sub-resources — each is a full replace, so only send changed sections.
    const failures = [];
    if (showExtras) {
      const steps = [
        profileChanged && [
          "Profile",
          () =>
            updateStaffProfileAPI(id, {
              dateOfBirth: form.dateOfBirth || null,
              gender: form.gender || null,
              addressLine: trimOrNull(form.addressLine),
              pincode: trimOrNull(form.pincode),
            }),
        ],
        kycChanged && [
          "KYC",
          () =>
            updateStaffKycAPI(id, {
              aadhaarNumber: trimOrNull(form.aadhaarNumber.replace(/\s/g, "")),
              panNumber: trimOrNull(form.panNumber.toUpperCase()),
              uanNumber: trimOrNull(form.uanNumber),
              pfNumber: trimOrNull(form.pfNumber),
              esicNumber: trimOrNull(form.esicNumber),
            }),
        ],
        bankChanged && [
          "Bank details",
          () =>
            updateStaffBankAPI(id, {
              accountHolderName: trimOrNull(form.accountHolderName),
              bankName: trimOrNull(form.bankName),
              accountNumber: trimOrNull(form.accountNumber),
              ifscCode: trimOrNull(form.ifscCode.toUpperCase()),
              branchName: trimOrNull(form.branchName),
            }),
        ],
      ].filter(Boolean);

      for (const [label, run] of steps) {
        try {
          await run();
        } catch (err) {
          failures.push(`${label}: ${apiError(err).message}`);
        }
      }
    }

    setIsSubmitting(false);
    setIsSaved(true);

    if (failures.length) {
      await Swal.fire({
        icon: "warning",
        title: mode === "create" ? "Staff created, with some problems" : "Saved, with some problems",
        html: `${mode === "create" ? "The staff member was created and an invite email sent, but" : "Some details"} couldn't be saved:<br><br>${failures.join("<br>")}<br><br>You can fix them from Edit Staff.`,
      });
      navigate(`/admin/staff/edit/${id}`, { replace: true });
      return;
    }

    await Swal.fire({
      icon: "success",
      title: mode === "create" ? "Staff created" : "Staff updated",
      text:
        mode === "create"
          ? `An invite email has been sent to ${form.email.trim()} to set their password.`
          : "The staff member has been updated.",
      timer: mode === "create" ? undefined : 1500,
      showConfirmButton: mode === "create",
    });
    navigate("/admin/staff/listing");
  };

  return {
    form,
    errors,
    update,
    toggleRole,
    roles,
    rolesError,
    staff,
    loading,
    isSubmitting,
    isDirty,
    handleSubmit,
    showExtras,
    maskedKyc,
    replaceKyc,
    startReplaceKyc,
    cancelReplaceKyc,
    savedAccountMasked,
  };
};
