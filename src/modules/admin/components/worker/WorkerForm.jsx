"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Home,
  Hash,
  CreditCard,
  FileText,
  Fingerprint,
  MapPinned,
  Building,
  Building2,
  Star,
  ShieldCheck,
  Award,
} from "lucide-react";
import { containerVariants, itemVariants } from "../../../../common/utils/motionVariants";
import { useWorkerForm, formatMobile } from "../../adminhooks/useWorkerForm";
import Loader from "../../../../common/components/Loader";
import useUnsavedChangesWarning from "../../../../common/hooks/useUnsavedChangesWarning";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import { useNavigate } from "@/lib/navigation";
import AadhaarVerifyModal from "./AadhaarVerifyModal";
import { GENDER_OPTIONS, KYC_META, kycLabel } from "../../utils/workerUtils";

const Thumb = ({ image, name, size = 26 }) => (
  <span
    className="relative shrink-0 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-semibold text-gray-400 ring-1 ring-gray-200"
    style={{ width: size, height: size }}
  >
    {String(name || "?").charAt(0).toUpperCase()}
    {image && (
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    )}
  </span>
);

// Click-to-open checklist used for Industry / Designation / Skills.
const PickerDropdown = ({ open, setOpen, placeholder, loading, items, isSelected, onPick, multi = true, disabledReason, error }) => {
  const ref = useRef(null);
  useEffect(() => {
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [setOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabledReason && setOpen((o) => !o)}
        disabled={!!disabledReason}
        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg border text-left text-sm transition ${
          disabledReason
            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
            : error
              ? "border-red-500 bg-white text-gray-700"
              : "bg-white border-gray-300 text-gray-700 hover:border-blue-400"
        }`}
      >
        <span>{disabledReason || placeholder}</span>
        <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && !disabledReason && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">Loading...</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">Nothing available</div>
          ) : (
            items.map((item) => {
              const picked = isSelected(item);
              return (
                <label
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50/60 cursor-pointer border-b last:border-b-0 border-gray-100"
                >
                  <input
                    type={multi ? "checkbox" : "radio"}
                    checked={picked}
                    readOnly
                    onClick={() => {
                      onPick(item);
                      if (!multi) setOpen(false);
                    }}
                    className="shrink-0"
                  />
                  <Thumb image={item.image} name={item.name} />
                  <span className="flex-1 text-sm text-gray-700">{item.name}</span>
                  {picked && <CheckCircle size={16} className="text-blue-600 shrink-0" />}
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// Selected values below a picker. `primaryId`/`onMakePrimary` add the
// primary-designation star.
const ChipsRow = ({ items, onRemove, emptyHint, primaryId, onMakePrimary }) =>
  items.length === 0 ? (
    emptyHint ? (
      <p className="text-xs text-gray-400 mt-2">{emptyHint}</p>
    ) : null
  ) : (
    <div className="flex flex-wrap gap-2 mt-3">
      {items.map((item) => {
        const isPrimary = primaryId && item.id === primaryId;
        return (
          <span
            key={item.id}
            className={`flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full text-xs font-medium border ${
              isPrimary ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-100"
            }`}
          >
            <Thumb image={item.image} name={item.name} size={20} />
            {item.name}
            {onMakePrimary && (
              <button
                type="button"
                onClick={() => onMakePrimary(item.id)}
                title={isPrimary ? "Primary designation" : "Make primary"}
                className={isPrimary ? "text-amber-500" : "text-gray-300 hover:text-amber-500"}
              >
                <Star size={12} className={isPrimary ? "fill-current" : ""} />
              </button>
            )}
            {onRemove && (
              <button type="button" onClick={() => onRemove(item)} className="text-blue-400 hover:text-red-500">
                <X size={12} />
              </button>
            )}
          </span>
        );
      })}
    </div>
  );

const FieldError = ({ message }) =>
  message ? (
    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
      <AlertCircle size={14} /> {message}
    </p>
  ) : null;

const IconInput = ({ icon: Icon, error, className = "", ...props }) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
    <input
      {...props}
      className={`w-full pl-10 pr-4 py-2 rounded-lg border ${error ? "border-red-500" : "border-gray-300"} ${
        props.disabled ? "bg-gray-100 cursor-not-allowed" : ""
      } ${className}`}
    />
  </div>
);

const CardShell = ({ title, children, right }) => (
  <motion.div variants={itemVariants} className="relative bg-white rounded-[22px] shadow-sm border border-[#DDDDDD]">
    <div className="text-lg bg-[#F9F9F9] rounded-t-[22px] border-b border-[#DDDDDD] px-6 py-4 font-semibold text-slate-700 flex items-center justify-between gap-2">
      <span>{title}</span>
      {right}
    </div>
    {children}
  </motion.div>
);

// Button that sits beside an input (Fetch / Verify).
const SideButton = ({ onClick, disabled, active, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`whitespace-nowrap text-xs font-medium px-4 py-2.5 rounded-lg transition-colors ${
      active
        ? "bg-green-100 text-green-700"
        : "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
    }`}
  >
    {children}
  </button>
);

// PAN / UAN / ESIC lookup — the backend endpoints aren't available yet. Wire
// each one up here once they are.
const FETCHERS = {
  pan: { label: "PAN", length: 10 },
  uan: { label: "UAN", length: 12 },
  esic: { label: "ESIC", length: 10 },
};
const handleFetch = (kind, value) => {
  const { label, length } = FETCHERS[kind];
  if (!value || value.length < length) {
    Swal.fire({ icon: "warning", title: `Enter the ${label} number first` });
    return;
  }
  Swal.fire({
    icon: "info",
    title: `${label} fetch not available yet`,
    text: `Fetching details by ${label} will be enabled once the backend endpoint is ready.`,
  });
};

// Bank verification is on hold: the backend's verify endpoint needs a saved
// worker id, and its request/response shape isn't confirmed yet.
const handleVerifyBank = () =>
  Swal.fire({
    icon: "info",
    title: "Bank verification not available yet",
    text: "Account verification will be enabled once the backend endpoint is finalised.",
  });

const selectClass = (error, disabled) =>
  `w-full px-3 py-2 rounded-lg border bg-white ${error ? "border-red-500" : "border-gray-300"} ${
    disabled ? "bg-gray-100 cursor-not-allowed" : ""
  }`;

const WorkerForm = ({ mode = "create", workerId }) => {
  const isEdit = mode === "edit";
  const navigate = useNavigate();
  const { hasPermission } = useAdminPermissions();
  const canViewKyc = hasPermission("kyc", "view");
  const canSubmitKyc = hasPermission("kyc", "submit");

  const {
    form,
    errors,
    update,
    formLoading,
    submitting,
    notFound,
    onFile,
    isDirty,
    accountHolderName,
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
  } = useWorkerForm({ mode, workerId, canViewKyc, canSubmitKyc });

  const [showIndustry, setShowIndustry] = useState(false);
  const [showDesignation, setShowDesignation] = useState(false);
  const [showSkill, setShowSkill] = useState(false);
  const [showAadhaarModal, setShowAadhaarModal] = useState(!isEdit);
  const [leaving, setLeaving] = useState(false);

  useUnsavedChangesWarning(
    isDirty && !submitting && !leaving,
    "You have unsaved changes. Are you sure you want to leave? All changes will be lost.",
  );

  const text = (name, extra = {}) => ({
    name,
    value: form[name],
    onChange: (e) => update({ [name]: e.target.value }),
    error: errors[name],
    disabled: submitting,
    ...extra,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await submit();
    if (!result.success) return;
    setLeaving(true);

    if (!isEdit && result.failures?.length) {
      await Swal.fire({
        icon: "warning",
        title: "Worker added — some details weren't saved",
        html:
          result.failures.map((f) => `• ${f.replace(/</g, "&lt;")}`).join("<br>") +
          "<br><br>You'll be taken to the worker's edit page to fix them.",
      });
      navigate(`/admin/worker/edit/${result.worker.id}`);
      return;
    }
    await Swal.fire({
      icon: "success",
      title: isEdit ? (result.nothingToSave ? "No changes to save" : "Worker Updated") : "Worker Added",
      text: isEdit
        ? result.nothingToSave
          ? undefined
          : "Worker details have been updated successfully."
        : `New worker ${result.worker.workerCode} has been added successfully.`,
      timer: 1800,
      showConfirmButton: false,
    });
    navigate("/admin/worker/listing");
  };

  const handleReset = () => {
    Swal.fire({
      title: isEdit ? "Discard changes?" : "Reset Form?",
      text: isEdit ? "The form goes back to the saved values." : "This will clear all entered data.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, reset",
      confirmButtonColor: "#d33",
    }).then((r) => r.isConfirmed && reset());
  };

  if (formLoading) {
    return (
      <div className="flex-1 bg-gray-50 p-6 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex-1 bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Worker not found</p>
        </div>
      </div>
    );
  }

  const toItem = (x) => ({ id: x.id, name: x.name, image: x.imageUrl || null });
  const industryItems = industries.filter((i) => i.status === "ACTIVE" || i.id === form.industryId).map(toItem);
  const designationItems = designations.map(toItem);
  const skillItems = skillOptions.map(toItem);
  const selectedIndustry = industries.find((i) => i.id === form.industryId);
  const aadhaarVerified = !!form.aadhaarVerificationId;

  return (
    <>
      {!isEdit && (
        <AadhaarVerifyModal
          isOpen={showAadhaarModal}
          onClose={() => setShowAadhaarModal(false)}
          onVerified={applyAadhaarVerification}
        />
      )}

      {isDirty && !submitting && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="my-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 font-medium">You have unsaved changes</span>
          </div>
        </motion.div>
      )}

      {!isEdit && (
        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={() => setShowAadhaarModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100"
          >
            <Fingerprint size={16} />
            Verify via Aadhaar
          </button>
        </div>
      )}

      <motion.form variants={containerVariants} initial="hidden" animate="visible" className="mt-6 space-y-8" onSubmit={handleSubmit}>
        {/* BASIC DETAILS */}
        <CardShell title="Basic Details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
            {isEdit && (
              <div className="md:col-span-3">
                <label className="text-sm text-slate-600 font-medium">Worker Code</label>
                <IconInput icon={User} value={form.workerCode} readOnly className="bg-gray-50" />
                <p className="text-xs text-gray-500 mt-1">Worker Code cannot be changed</p>
              </div>
            )}
            <div>
              <label className="text-sm text-slate-600">
                First Name <span className="text-red-500">*</span>
              </label>
              <IconInput icon={User} maxLength={100} placeholder="Enter First Name" {...text("firstName")} />
              <FieldError message={errors.firstName} />
            </div>
            <div>
              <label className="text-sm text-slate-600">Middle Name</label>
              <IconInput icon={User} maxLength={100} placeholder="Enter Middle Name" {...text("middleName")} />
              <FieldError message={errors.middleName} />
            </div>
            <div>
              <label className="text-sm text-slate-600">
                Last Name <span className="text-red-500">*</span>
              </label>
              <IconInput icon={User} maxLength={100} placeholder="Enter Last Name" {...text("lastName")} />
              <FieldError message={errors.lastName} />
            </div>
            <div>
              <label className="text-sm text-slate-600">Personal Email</label>
              <IconInput icon={Mail} maxLength={255} placeholder="Enter Personal Email" {...text("personalEmail")} />
              <FieldError message={errors.personalEmail} />
            </div>
            <div>
              <label className="text-sm text-slate-600">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <IconInput
                icon={Phone}
                placeholder="xxx-xxxx-xxx"
                maxLength={12}
                {...text("mobileNumber", {
                  onChange: (e) => update({ mobileNumber: formatMobile(e.target.value) }),
                })}
              />
              <FieldError message={errors.mobileNumber} />
            </div>
            <div>
              <label className="text-sm text-slate-600">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                value={form.gender}
                onChange={(e) => update({ gender: e.target.value })}
                disabled={submitting}
                className={selectClass(errors.gender, submitting)}
              >
                <option value="">Select Gender</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.gender} />
            </div>
          </div>

          {/* Statutory Details */}
          <div className="border-t p-6">
            <h3 className="font-semibold mb-1 flex items-center gap-2 text-slate-700">
              <ShieldCheck className="text-orange-500" size={20} />
              Statutory Details
            </h3>
            <p className="text-xs text-amber-700 mb-4">
              UAN and ESIC aren't saved yet — they'll be stored once the backend endpoints are connected.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-600">UAN Number</label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <IconInput
                      icon={Hash}
                      inputMode="numeric"
                      maxLength={12}
                      placeholder="12-digit UAN"
                      {...text("uanNumber", {
                        onChange: (e) => update({ uanNumber: e.target.value.replace(/\D/g, "").slice(0, 12) }),
                      })}
                    />
                  </div>
                  <SideButton onClick={() => handleFetch("uan", form.uanNumber)} disabled={submitting}>
                    Fetch
                  </SideButton>
                </div>
                <FieldError message={errors.uanNumber} />
              </div>
              <div>
                <label className="text-sm text-slate-600">ESIC Number</label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <IconInput
                      icon={ShieldCheck}
                      inputMode="numeric"
                      maxLength={17}
                      placeholder="Enter ESIC Number"
                      {...text("esicNumber", {
                        onChange: (e) => update({ esicNumber: e.target.value.replace(/\D/g, "").slice(0, 17) }),
                      })}
                    />
                  </div>
                  <SideButton onClick={() => handleFetch("esic", form.esicNumber)} disabled={submitting}>
                    Fetch
                  </SideButton>
                </div>
                <FieldError message={errors.esicNumber} />
              </div>
            </div>
          </div>
        </CardShell>

        {/* PROFESSIONAL DETAILS */}
        <CardShell title="Professional Details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
            <div>
              <label className="text-sm text-slate-600">Industry</label>
              <PickerDropdown
                open={showIndustry}
                setOpen={setShowIndustry}
                placeholder={selectedIndustry ? selectedIndustry.name : "Select industry"}
                items={industryItems}
                isSelected={(item) => form.industryId === item.id}
                onPick={selectIndustry}
                multi={false}
                error={errors.industryId}
              />
              <FieldError message={errors.industryId} />
              <ChipsRow items={selectedIndustry ? [toItem(selectedIndustry)] : []} onRemove={() => selectIndustry(null)} />
            </div>

            <div>
              <label className="text-sm text-slate-600">
                Designation <span className="text-red-500">*</span>
              </label>
              <PickerDropdown
                open={showDesignation}
                setOpen={setShowDesignation}
                placeholder={
                  form.designations.length > 0 ? `${form.designations.length}/3 selected` : "Select up to 3 designations"
                }
                loading={designationsLoading}
                items={designationItems}
                isSelected={(item) => form.designations.some((d) => d.id === item.id)}
                onPick={toggleDesignation}
                error={errors.designations}
              />
              <FieldError message={errors.designations} />
              <ChipsRow
                items={form.designations}
                onRemove={toggleDesignation}
                primaryId={form.primaryDesignationId}
                onMakePrimary={setPrimaryDesignation}
                emptyHint="No designations selected yet."
              />
              {form.designations.length > 1 && (
                <p className="text-xs text-gray-400 mt-1">The starred designation is the primary one.</p>
              )}
            </div>

            <div>
              <label className="text-sm text-slate-600">Experience (Years)</label>
              <IconInput
                icon={Award}
                type="number"
                min="0"
                max="60"
                step="0.5"
                placeholder="Years"
                {...text("workExperienceYears")}
              />
              <FieldError message={errors.workExperienceYears} />
            </div>

            <div className="md:col-span-3">
              <label className="text-sm text-slate-600">Skills</label>
              <PickerDropdown
                open={showSkill}
                setOpen={setShowSkill}
                placeholder={form.skills.length > 0 ? `${form.skills.length} skill(s) selected` : "Select skills"}
                loading={skillsLoading}
                items={skillItems}
                isSelected={(item) => form.skills.some((s) => s.id === item.id)}
                onPick={toggleSkill}
                disabledReason={form.designations.length === 0 ? "Pick a designation first" : undefined}
                error={errors.skills}
              />
              <FieldError message={errors.skills} />
              <ChipsRow
                items={form.skills}
                onRemove={toggleSkill}
                emptyHint={form.designations.length > 0 ? "No skills selected yet." : undefined}
              />
            </div>
          </div>
        </CardShell>

        {/* PERSONAL DETAILS */}
        <CardShell
          title="Personal Details"
          right={
            isEdit && onFile.kycStatus ? (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${KYC_META[onFile.kycStatus]?.className || ""}`}>
                KYC: {kycLabel(onFile.kycStatus)}
              </span>
            ) : null
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            <div>
              <label className="text-sm text-slate-600">Date of Birth</label>
              <IconInput
                icon={Calendar}
                type="date"
                max={new Date().toISOString().split("T")[0]}
                {...text("dateOfBirth")}
              />
              <FieldError message={errors.dateOfBirth} />
            </div>
            <div>
              <label className="text-sm text-slate-600">Father's Name</label>
              <IconInput icon={User} maxLength={150} placeholder="Father's Name" {...text("fatherName")} />
              <FieldError message={errors.fatherName} />
            </div>

            <div>
              <label className="text-sm text-slate-600">
                Aadhaar Number {!isEdit && canSubmitKyc && <span className="text-red-500">*</span>}
              </label>
              <IconInput
                icon={Fingerprint}
                inputMode="numeric"
                maxLength={12}
                placeholder={
                  isEdit && onFile.aadhaar ? `On file: ${onFile.aadhaar} — enter to replace` : "12-digit Aadhaar"
                }
                {...text("aadhaarNumber", {
                  onChange: (e) => update({ aadhaarNumber: e.target.value.replace(/\D/g, "").slice(0, 12) }),
                  disabled: submitting || aadhaarVerified || !canSubmitKyc,
                })}
              />
              {aadhaarVerified && (
                <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                  <ShieldCheck size={14} /> Verified via Aadhaar e-KYC — KYC will be marked verified on save.
                </p>
              )}
              {!canSubmitKyc && (
                <p className="text-xs text-gray-500 mt-1">You don't have permission to submit KYC numbers.</p>
              )}
              {isEdit && canSubmitKyc && onFile.kycStatus === "VERIFIED" && (
                <p className="text-xs text-gray-500 mt-1">KYC is already verified; entering a number won't change that.</p>
              )}
              <FieldError message={errors.aadhaarNumber} />
            </div>
            <div>
              <label className="text-sm text-slate-600">PAN Number</label>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <IconInput
                    icon={FileText}
                    maxLength={10}
                    placeholder={isEdit && onFile.pan ? `On file: ${onFile.pan} — enter to replace` : "ABCPE1234F"}
                    {...text("panNumber", {
                      onChange: (e) => {
                        const v = e.target.value.toUpperCase();
                        if (/^[A-Z0-9]*$/.test(v)) update({ panNumber: v.slice(0, 10) });
                      },
                      disabled: submitting || !canSubmitKyc,
                    })}
                  />
                </div>
                <SideButton
                  onClick={() => handleFetch("pan", form.panNumber)}
                  disabled={submitting || !canSubmitKyc}
                >
                  Fetch
                </SideButton>
              </div>
              <FieldError message={errors.panNumber} />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-slate-600">Address Line 1</label>
              <IconInput icon={Home} maxLength={255} placeholder="House / flat, street" {...text("line1")} />
              <FieldError message={errors.line1} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-600">Address Line 2</label>
              <IconInput icon={Home} maxLength={255} placeholder="Area, landmark" {...text("line2")} />
              <FieldError message={errors.line2} />
            </div>
            <div>
              <label className="text-sm text-slate-600">
                State <span className="text-red-500">*</span>
              </label>
              <select
                value={form.stateId}
                onChange={(e) => selectState(e.target.value)}
                disabled={submitting}
                className={selectClass(errors.stateId, submitting)}
              >
                <option value="">Select state</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <FieldError message={errors.stateId} />
            </div>
            <div>
              <label className="text-sm text-slate-600">
                City <span className="text-red-500">*</span>
              </label>
              <select
                value={form.cityId}
                onChange={(e) => update({ cityId: e.target.value })}
                disabled={submitting || !form.stateId || citiesLoading}
                className={selectClass(errors.cityId, submitting || !form.stateId || citiesLoading)}
              >
                <option value="">
                  {!form.stateId ? "Select state first" : citiesLoading ? "Loading..." : "Select city"}
                </option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <FieldError message={errors.cityId} />
            </div>
            <div>
              <label className="text-sm text-slate-600">Pincode</label>
              <IconInput
                icon={MapPinned}
                maxLength={6}
                placeholder="6-digit"
                {...text("pincode", {
                  onChange: (e) => update({ pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }),
                })}
              />
              <FieldError message={errors.pincode} />
            </div>
          </div>
        </CardShell>

        {/* PAYMENT INFORMATION */}
        <CardShell
          title="Payment Information"
          right={
            isEdit && onFile.accountNumber ? (
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${onFile.bankVerified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
              >
                {onFile.bankVerified ? "Verified" : "Not verified"}
              </span>
            ) : null
          }
        >
          <div className="p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg w-fit">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">Bank Transfer</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6">
              <div>
                <label className="text-sm text-slate-600">Account Holder Name</label>
                <IconInput icon={User} value={accountHolderName} disabled />
              </div>
              <div>
                <label className="text-sm text-slate-600">Bank Name</label>
                <IconInput icon={Building} maxLength={150} placeholder="e.g. State Bank of India" {...text("bankName")} />
                <FieldError message={errors.bankName} />
              </div>
              <div>
                <label className="text-sm text-slate-600">Account Number</label>
                <IconInput
                  icon={CreditCard}
                  inputMode="numeric"
                  maxLength={18}
                  placeholder={
                    isEdit && onFile.accountNumber && !form.accountNumber
                      ? `On file: ${onFile.accountNumber} — re-enter to change bank details`
                      : "Account number"
                  }
                  {...text("accountNumber", {
                    onChange: (e) => update({ accountNumber: e.target.value.replace(/\D/g, "").slice(0, 18) }),
                  })}
                />
                <FieldError message={errors.accountNumber} />
              </div>
              <div>
                <label className="text-sm text-slate-600">IFSC Code</label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <IconInput
                      icon={Hash}
                      maxLength={11}
                      placeholder="e.g. SBIN0001234"
                      className="uppercase"
                      {...text("ifscCode", { onChange: (e) => update({ ifscCode: e.target.value.toUpperCase() }) })}
                    />
                  </div>
                  <SideButton
                    onClick={handleVerifyBank}
                    disabled={submitting || (isEdit && onFile.bankVerified)}
                    active={isEdit && onFile.bankVerified}
                  >
                    {isEdit && onFile.bankVerified ? "Verified" : "Verify Account"}
                  </SideButton>
                </div>
                <FieldError message={errors.ifscCode} />
              </div>
              <div>
                <label className="text-sm text-slate-600">Branch Name</label>
                <IconInput icon={Building2} maxLength={150} placeholder="Branch" {...text("branchName")} />
                <FieldError message={errors.branchName} />
              </div>
            </div>
            {isEdit && (
              <p className="text-xs text-gray-500 mt-4">Changing bank details resets their verification.</p>
            )}
          </div>
        </CardShell>

        {/* ACTIONS */}
        <motion.div variants={itemVariants} className="flex justify-end gap-4">
          <button
            type="button"
            onClick={handleReset}
            disabled={submitting}
            className="border px-6 py-2 rounded-lg text-slate-600 bg-gray-50 hover:bg-gray-100"
          >
            {isEdit ? "Reset Changes" : "Reset"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/worker/listing")}
            disabled={submitting}
            className="border px-6 py-2 rounded-lg text-slate-600 bg-gray-50 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:brightness-105 disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isEdit ? "Updating..." : "Submitting..."}
              </span>
            ) : isEdit ? (
              "Update Worker"
            ) : (
              "Submit"
            )}
          </button>
        </motion.div>
      </motion.form>
    </>
  );
};

export default WorkerForm;
