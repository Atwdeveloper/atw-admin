"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Swal from "sweetalert2";
import {
  getWorkerAPI,
  createWorkerAPI,
  updateWorkerAPI,
  replaceWorkerDesignationsAPI,
  replaceWorkerSkillsAPI,
  getWorkerAddressAPI,
  updateWorkerAddressAPI,
  getWorkerBankDetailAPI,
  updateWorkerBankDetailAPI,
  getWorkerKycAPI,
  submitWorkerAadhaarAPI,
  submitWorkerPanAPI,
} from "../../../api/adminV1/workerAPI";
import {
  getDepartmentsAPI,
  getIndustriesAPI,
  getDesignationsAPI,
  getSkillsAPI,
} from "../../../api/adminV1/masterdataAPI";
import { getStatesAPI, getCitiesAPI } from "../../../api/adminV1/geographyAPI";
import { apiError } from "../../../api/javaApi";
import { asList } from "../utils/workerUtils";

const phonePattern = /^[6-9]\d{9}$/;
const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const emailPattern = /^\S+@\S+\.\S+$/;

const isMasked = (value) => typeof value === "string" && value.includes("*");
const digits = (v) => String(v || "").replace(/\D/g, "");
const orNull = (v) => (v === "" || v === undefined ? null : v);

export const formatMobile = (value) => {
  const d = digits(value).slice(0, 10);
  return [d.slice(0, 3), d.slice(3, 7), d.slice(7, 10)].filter(Boolean).join("-");
};

const emptyForm = {
  workerCode: "",
  firstName: "",
  middleName: "",
  lastName: "",
  personalEmail: "",
  mobileNumber: "",
  gender: "",
  dateOfBirth: "",
  fatherName: "",
  workExperienceYears: "",
  departmentId: "",
  industryId: "",
  designations: [], // [{ id, name, image }]
  primaryDesignationId: "",
  skills: [], // [{ id, name, image }]
  // KYC — on edit these start empty; the masked values on file are shown alongside.
  aadhaarNumber: "",
  panNumber: "",
  aadhaarVerificationId: "",
  // Statutory — inputs only for now; save/fetch endpoints not wired yet.
  uanNumber: "",
  esicNumber: "",
  // Permanent (home) address
  line1: "",
  line2: "",
  stateId: "",
  cityId: "",
  pincode: "",
  // Bank detail
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  branchName: "",
};

// Backend field names -> form keys, for fieldErrors.
const FIELD_ALIASES = {
  designationIds: "designations",
  primaryDesignationId: "designations",
  skillIds: "skills",
  mobileNumber: "mobileNumber",
};

const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k]]));
const PROFILE_KEYS = [
  "firstName",
  "middleName",
  "lastName",
  "personalEmail",
  "mobileNumber",
  "gender",
  "dateOfBirth",
  "fatherName",
  "workExperienceYears",
  "departmentId",
  "industryId",
];
const ADDRESS_KEYS = ["line1", "line2", "stateId", "cityId", "pincode"];
const BANK_KEYS = ["bankName", "accountNumber", "ifscCode", "branchName"];

const designationKey = (f) =>
  JSON.stringify([f.designations.map((d) => d.id).sort(), f.primaryDesignationId]);
const skillKey = (f) => JSON.stringify(f.skills.map((s) => s.id).sort());

const asItem = (x) => ({ id: x.id, name: x.name, image: x.imageUrl || null });

export const useWorkerForm = ({ mode = "create", workerId, canViewKyc, canSubmitKyc } = {}) => {
  const isEdit = mode === "edit";
  const [form, setForm] = useState(emptyForm);
  const [initialForm, setInitialForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [formLoading, setFormLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  // What's on file (edit): masked numbers, KYC status, bank verification.
  const [onFile, setOnFile] = useState({});

  const [departments, setDepartments] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [designationsLoading, setDesignationsLoading] = useState(false);
  const [skillOptions, setSkillOptions] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const skipSkillPrune = useRef(true);

  const update = useCallback((updates) => {
    setForm((prev) => ({ ...prev, ...updates }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(updates).forEach((k) => delete next[k]);
      return next;
    });
  }, []);

  const loadCities = useCallback(async (stateId) => {
    if (!stateId) {
      setCities([]);
      return;
    }
    setCitiesLoading(true);
    try {
      setCities(asList(await getCitiesAPI(stateId)));
    } catch {
      setCities([]);
    } finally {
      setCitiesLoading(false);
    }
  }, []);

  // ---- Initial load ----------------------------------------------------------
  const load = useCallback(async () => {
    setFormLoading(true);
    try {
      const [dep, ind, st] = await Promise.all([
        getDepartmentsAPI(),
        getIndustriesAPI(),
        getStatesAPI(),
      ]);
      setDepartments(asList(dep));
      setIndustries(asList(ind));
      setStates(asList(st));

      if (!isEdit) {
        // No Department field on the form; it's optional on the API. Edit
        // sends back whatever department the worker already has.
        setForm(emptyForm);
        setInitialForm(emptyForm);
        return;
      }

      const [worker, address, bank, kyc] = await Promise.all([
        getWorkerAPI(workerId),
        getWorkerAddressAPI(workerId, "PERMANENT").catch(() => null),
        getWorkerBankDetailAPI(workerId).catch(() => null),
        canViewKyc ? getWorkerKycAPI(workerId).catch(() => null) : Promise.resolve(null),
      ]);

      const loaded = {
        ...emptyForm,
        workerCode: worker.workerCode || "",
        firstName: worker.firstName || "",
        middleName: worker.middleName || "",
        lastName: worker.lastName || "",
        personalEmail: worker.personalEmail || "",
        mobileNumber: formatMobile(worker.mobileNumber),
        gender: worker.gender || "",
        dateOfBirth: worker.dateOfBirth || "",
        fatherName: worker.fatherName || "",
        workExperienceYears: worker.workExperienceYears ?? "",
        departmentId: worker.departmentId || "",
        industryId: worker.industryId || "",
        designations: (worker.designations || []).map(asItem),
        primaryDesignationId: worker.designations?.find((d) => d.primary)?.id || "",
        skills: (worker.skills || []).map(asItem),
        line1: address?.line1 || "",
        line2: address?.line2 || "",
        stateId: address?.stateId || "",
        cityId: address?.cityId || "",
        pincode: address?.pincode || "",
        bankName: bank?.bankName || "",
        // A masked number can't be sent back — the field starts empty instead.
        accountNumber: isMasked(bank?.accountNumber) ? "" : bank?.accountNumber || "",
        ifscCode: bank?.ifscCode || "",
        branchName: bank?.branchName || "",
      };
      skipSkillPrune.current = true;
      setForm(loaded);
      setInitialForm(loaded);
      setOnFile({
        status: worker.status,
        kycStatus: worker.kycStatus,
        aadhaar: kyc?.aadhaarNumber || null,
        pan: kyc?.panNumber || null,
        kycVerifiedAt: kyc?.verifiedAt || null,
        accountNumber: bank?.accountNumber || null,
        bankVerified: !!bank?.verified,
      });
      if (address?.stateId) loadCities(address.stateId);
    } catch (error) {
      const err = apiError(error, "Failed to load worker data");
      if (err.status === 404) setNotFound(true);
      else Swal.fire({ icon: "error", title: "Error", text: err.message });
    } finally {
      setFormLoading(false);
    }
  }, [isEdit, workerId, canViewKyc, loadCities]);

  useEffect(() => {
    load();
  }, [load]);

  // ---- Designation options (scoped to the industry when one is picked) -------
  useEffect(() => {
    let cancelled = false;
    setDesignationsLoading(true);
    getDesignationsAPI(form.industryId || undefined)
      .then((list) => !cancelled && setDesignations(asList(list).filter((d) => d.status === "ACTIVE")))
      .catch(() => !cancelled && setDesignations([]))
      .finally(() => !cancelled && setDesignationsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [form.industryId]);

  // ---- Skill options: the union of the selected designations' skills --------
  const designationIdsKey = form.designations.map((d) => d.id).join(",");
  useEffect(() => {
    let cancelled = false;
    const ids = designationIdsKey ? designationIdsKey.split(",") : [];
    if (ids.length === 0) {
      setSkillOptions([]);
      if (!skipSkillPrune.current) setForm((prev) => ({ ...prev, skills: [] }));
      skipSkillPrune.current = false;
      return;
    }
    setSkillsLoading(true);
    Promise.all(ids.map((id) => getSkillsAPI(id).catch(() => null)))
      .then((lists) => {
        if (cancelled) return;
        const all = new Map(lists.filter(Boolean).flatMap(asList).map((s) => [s.id, s]));
        setSkillOptions([...all.values()].filter((s) => s.status === "ACTIVE"));
        // Drop picked skills that no longer belong to a selected designation
        // (the backend does the same when designations are replaced). Skipped
        // if a lookup failed, so a network blip can't silently drop skills.
        if (lists.every(Boolean)) {
          setForm((prev) => ({ ...prev, skills: prev.skills.filter((s) => all.has(s.id)) }));
        }
        skipSkillPrune.current = false;
      })
      .finally(() => !cancelled && setSkillsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [designationIdsKey]);

  // ---- Field helpers ------------------------------------------------------------
  const selectIndustry = (industry) =>
    // Designations (and so skills) are picked per industry — switching resets them.
    update({ industryId: industry?.id || "", designations: [], primaryDesignationId: "", skills: [] });

  const toggleDesignation = (item) => {
    const selected = form.designations;
    const exists = selected.some((d) => d.id === item.id);
    if (!exists && selected.length >= 3) return;
    const next = exists ? selected.filter((d) => d.id !== item.id) : [...selected, item];
    const primary = next.some((d) => d.id === form.primaryDesignationId)
      ? form.primaryDesignationId
      : next[0]?.id || "";
    update({ designations: next, primaryDesignationId: primary });
  };

  const setPrimaryDesignation = (id) => update({ primaryDesignationId: id });

  const toggleSkill = (item) => {
    const exists = form.skills.some((s) => s.id === item.id);
    update({ skills: exists ? form.skills.filter((s) => s.id !== item.id) : [...form.skills, item] });
  };

  const selectState = (stateId) => {
    update({ stateId, cityId: "" });
    loadCities(stateId);
  };

  // Prefill from the Aadhaar e-KYC wizard. Only touch fields that came back.
  const applyAadhaarVerification = async (data) => {
    const updates = {};
    if (data.mobile_number) updates.mobileNumber = formatMobile(data.mobile_number);
    if (data.aadhaar_verification_id) {
      updates.aadhaarVerificationId = data.aadhaar_verification_id;
      updates.aadhaarNumber = data.aadhar_number || "";
    }
    if (data.first_name) updates.firstName = data.first_name;
    if (data.middle_name) updates.middleName = data.middle_name;
    if (data.last_name) updates.lastName = data.last_name;
    if (data.date_of_birth) updates.dateOfBirth = data.date_of_birth;
    if (data.father_name) updates.fatherName = data.father_name;
    if (data.gender) updates.gender = data.gender;
    if (data.address_line1) updates.line1 = data.address_line1;
    if (data.address_line2) updates.line2 = data.address_line2;
    if (data.pincode) updates.pincode = data.pincode;
    if (data.state_id) {
      updates.stateId = data.state_id;
      updates.cityId = data.city_id || "";
      await loadCities(data.state_id);
    }
    update(updates);
    if (data.aadhaar_verification_id) {
      const unmatched = data.state_name && !data.state_id;
      Swal.fire({
        icon: "success",
        title: "Aadhaar Verified",
        text:
          "Details have been auto-filled. Please review and fill the remaining fields." +
          (unmatched ? ` Pick the state/city manually (Aadhaar says ${data.district_name || ""}, ${data.state_name}).` : ""),
        timer: unmatched ? undefined : 2500,
        showConfirmButton: !!unmatched,
      });
    }
  };

  // ---- Change tracking ------------------------------------------------------------
  const changed = useMemo(
    () => ({
      profile: JSON.stringify(pick(form, PROFILE_KEYS)) !== JSON.stringify(pick(initialForm, PROFILE_KEYS)),
      designations: designationKey(form) !== designationKey(initialForm),
      skills: skillKey(form) !== skillKey(initialForm),
      address: JSON.stringify(pick(form, ADDRESS_KEYS)) !== JSON.stringify(pick(initialForm, ADDRESS_KEYS)),
      bank: JSON.stringify(pick(form, BANK_KEYS)) !== JSON.stringify(pick(initialForm, BANK_KEYS)),
      aadhaar: !form.aadhaarVerificationId && !!digits(form.aadhaarNumber),
      pan: !!form.panNumber.trim(),
    }),
    [form, initialForm],
  );
  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  const accountHolderName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ");
  const hasAddress = ADDRESS_KEYS.some((k) => form[k]);
  const hasBank = BANK_KEYS.some((k) => form[k]);

  // ---- Validation -------------------------------------------------------------
  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.gender) e.gender = "Gender is required";
    if (!digits(form.mobileNumber)) e.mobileNumber = "Mobile number is required";
    else if (!phonePattern.test(digits(form.mobileNumber)))
      e.mobileNumber = "Mobile number must be 10 digits starting with 6-9";
    if (form.personalEmail && !emailPattern.test(form.personalEmail)) e.personalEmail = "Invalid email format";
    if (form.workExperienceYears !== "") {
      const years = Number(form.workExperienceYears);
      if (!Number.isFinite(years) || years < 0 || years > 60)
        e.workExperienceYears = "Experience must be between 0 and 60 years";
    }
    if (form.designations.length === 0) e.designations = "At least one designation is required";
    else if (form.designations.length > 3) e.designations = "You can select up to 3 designations";
    if (form.dateOfBirth) {
      const dob = new Date(form.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      if (age < 18) e.dateOfBirth = "Worker must be at least 18 years old";
    }

    const aadhaar = digits(form.aadhaarNumber);
    if (canSubmitKyc && !isEdit && !form.aadhaarVerificationId && !aadhaar)
      e.aadhaarNumber = "Aadhaar number is required";
    else if (aadhaar && aadhaar.length !== 12) e.aadhaarNumber = "Aadhaar number must be 12 digits";
    if (form.panNumber && !panPattern.test(form.panNumber))
      e.panNumber = "PAN must be 5 letters, 4 digits, 1 letter (e.g. ABCPE1234F)";
    if (form.uanNumber && !/^\d{12}$/.test(form.uanNumber)) e.uanNumber = "UAN must be exactly 12 digits";
    if (form.esicNumber && !/^\d{10,17}$/.test(form.esicNumber))
      e.esicNumber = "ESIC number must be 10-17 digits";

    if (!form.stateId) e.stateId = "State is required";
    if (!form.cityId) e.cityId = "City is required";
    if (form.pincode && !/^\d{6}$/.test(form.pincode)) e.pincode = "Pincode must be 6 digits";

    if (form.ifscCode && !ifscPattern.test(form.ifscCode)) e.ifscCode = "Invalid IFSC code (e.g. SBIN0001234)";
    if (form.accountNumber && !/^\d{6,18}$/.test(form.accountNumber))
      e.accountNumber = "Account number must be 6-18 digits";
    // The bank row is a full replace: changing it without the full account
    // number would wipe the number on file.
    if (isEdit && changed.bank && !form.accountNumber && onFile.accountNumber)
      e.accountNumber = "Re-enter the full account number to save bank detail changes";
    return e;
  };

  // ---- Payloads -----------------------------------------------------------------
  const profileBody = () => ({
    firstName: form.firstName.trim(),
    middleName: orNull(form.middleName.trim()),
    lastName: form.lastName.trim(),
    gender: form.gender,
    dateOfBirth: orNull(form.dateOfBirth),
    mobileNumber: digits(form.mobileNumber),
    personalEmail: orNull(form.personalEmail.trim()),
    fatherName: orNull(form.fatherName.trim()),
    workExperienceYears: form.workExperienceYears === "" ? null : Number(form.workExperienceYears),
    departmentId: orNull(form.departmentId),
    industryId: orNull(form.industryId),
  });
  const addressBody = () => ({
    line1: orNull(form.line1.trim()),
    line2: orNull(form.line2.trim()),
    stateId: orNull(form.stateId),
    cityId: orNull(form.cityId),
    pincode: orNull(form.pincode),
  });
  const bankBody = () => ({
    accountHolderName: orNull(accountHolderName),
    bankName: orNull(form.bankName.trim()),
    accountNumber: orNull(form.accountNumber),
    ifscCode: orNull(form.ifscCode),
    branchName: orNull(form.branchName.trim()),
  });

  // Maps a failed call onto field errors where possible. Returns the message.
  const absorbError = (error, fallback) => {
    const err = apiError(error, fallback);
    const fieldErrors = {};
    Object.entries(err.fieldErrors || {}).forEach(([k, v]) => {
      fieldErrors[FIELD_ALIASES[k] || k] = v;
    });
    if (err.code === "CONFLICT" && /mobile/i.test(err.message)) fieldErrors.mobileNumber = err.message;
    if (err.code === "CONFLICT" && /aadhaar/i.test(err.message)) fieldErrors.aadhaarNumber = err.message;
    if (err.code === "CONFLICT" && /PAN/.test(err.message)) fieldErrors.panNumber = err.message;
    if (Object.keys(fieldErrors).length) setErrors((prev) => ({ ...prev, ...fieldErrors }));
    return err.message;
  };

  const failValidation = (e) => {
    setErrors(e);
    Swal.fire({
      icon: "error",
      title: "Validation Error",
      html: Object.values(e)
        .map((msg) => `• ${msg}`)
        .join("<br>"),
    });
  };

  // Create: one POST for the core worker, then the satellite rows. A failed
  // follow-up leaves the worker created — the caller is sent to its edit page.
  const submitCreate = async () => {
    let created;
    try {
      created = await createWorkerAPI({
        ...profileBody(),
        designationIds: form.designations.map((d) => d.id),
        primaryDesignationId: form.primaryDesignationId || form.designations[0]?.id,
        skillIds: form.skills.map((s) => s.id),
        aadhaarVerificationId: form.aadhaarVerificationId || undefined,
      });
    } catch (error) {
      const message = absorbError(error, "Failed to add worker");
      Swal.fire({ icon: "error", title: "Could not add worker", text: message });
      return { success: false };
    }

    const steps = [];
    if (hasAddress) steps.push(["Address", () => updateWorkerAddressAPI(created.id, "PERMANENT", addressBody())]);
    if (hasBank) steps.push(["Bank detail", () => updateWorkerBankDetailAPI(created.id, bankBody())]);
    if (canSubmitKyc && changed.aadhaar)
      steps.push(["Aadhaar", () => submitWorkerAadhaarAPI(created.id, digits(form.aadhaarNumber))]);
    if (canSubmitKyc && changed.pan) steps.push(["PAN", () => submitWorkerPanAPI(created.id, form.panNumber)]);

    const failures = [];
    for (const [label, run] of steps) {
      try {
        await run();
      } catch (error) {
        failures.push(`${label}: ${apiError(error).message}`);
      }
    }
    return { success: true, worker: created, failures };
  };

  // Edit: only the sections that changed, in dependency order (designations
  // before skills, since skills are checked against the current designations).
  // Each section's snapshot is updated as soon as it saves, so a retry after a
  // failure only resends what's still outstanding.
  const submitEdit = async () => {
    const steps = [];
    if (changed.profile)
      steps.push(["Profile", () => updateWorkerAPI(workerId, profileBody()), PROFILE_KEYS]);
    if (changed.designations)
      steps.push([
        "Designations",
        () =>
          replaceWorkerDesignationsAPI(
            workerId,
            form.designations.map((d) => d.id),
            form.primaryDesignationId || form.designations[0]?.id,
          ),
        ["designations", "primaryDesignationId"],
      ]);
    if (changed.skills || changed.designations)
      steps.push(["Skills", () => replaceWorkerSkillsAPI(workerId, form.skills.map((s) => s.id)), ["skills"]]);
    if (changed.address)
      steps.push(["Address", () => updateWorkerAddressAPI(workerId, "PERMANENT", addressBody()), ADDRESS_KEYS]);
    if (changed.bank)
      steps.push([
        "Bank detail",
        async () => {
          await updateWorkerBankDetailAPI(workerId, bankBody());
          // Any bank change resets verification server-side.
          setOnFile((prev) => ({
            ...prev,
            bankVerified: false,
            accountNumber: form.accountNumber || prev.accountNumber,
          }));
        },
        BANK_KEYS,
      ]);
    if (canSubmitKyc && changed.aadhaar)
      steps.push(["Aadhaar", () => submitWorkerAadhaarAPI(workerId, digits(form.aadhaarNumber)), ["aadhaarNumber"]]);
    if (canSubmitKyc && changed.pan)
      steps.push(["PAN", () => submitWorkerPanAPI(workerId, form.panNumber), ["panNumber"]]);

    if (steps.length === 0) return { success: true, nothingToSave: true };

    const saved = [];
    for (const [label, run, keys] of steps) {
      try {
        await run();
        saved.push(label);
        setInitialForm((prev) => ({ ...prev, ...pick(form, keys) }));
      } catch (error) {
        const message = absorbError(error, `Failed to save ${label.toLowerCase()}`);
        Swal.fire({
          icon: "error",
          title: `Could not save ${label.toLowerCase()}`,
          html:
            `${message.replace(/</g, "&lt;")}` +
            (saved.length ? `<br><br><small>Already saved: ${saved.join(", ")}.</small>` : ""),
        });
        return { success: false };
      }
    }
    // KYC inputs are write-only — clear them once recorded.
    setForm((prev) => ({ ...prev, aadhaarNumber: "", panNumber: "" }));
    setInitialForm((prev) => ({ ...prev, aadhaarNumber: "", panNumber: "" }));
    return { success: true };
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      failValidation(e);
      return { success: false };
    }
    setSubmitting(true);
    try {
      return isEdit ? await submitEdit() : await submitCreate();
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm(initialForm);
    setErrors({});
    if (initialForm.stateId) loadCities(initialForm.stateId);
  };

  return {
    form,
    errors,
    update,
    formLoading,
    submitting,
    notFound,
    onFile,
    isDirty,
    accountHolderName,
    departments,
    industries,
    designations,
    designationsLoading,
    skillOptions,
    skillsLoading,
    states,
    cities,
    citiesLoading,
    selectIndustry,
    toggleDesignation,
    setPrimaryDesignation,
    toggleSkill,
    selectState,
    applyAadhaarVerification,
    submit,
    reset,
  };
};
