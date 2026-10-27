"use client";

import { motion } from "framer-motion";
import { useNavigate } from "@/lib/navigation";
import {
  AlertCircle,
  AtSign,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Hash,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  User,
} from "lucide-react";
import { containerVariants, itemVariants } from "../../../../common/utils/motionVariants";
import useUnsavedChangesWarning from "../../../../common/hooks/useUnsavedChangesWarning";
import Loader from "../../../../common/components/Loader";
import { useStaffForm } from "../../adminhooks/useStaffForm";

const KYC_LABELS = {
  aadhaarNumber: "Aadhaar Number",
  panNumber: "PAN Number",
  uanNumber: "UAN Number",
  pfNumber: "PF Number",
  esicNumber: "ESIC Number",
};

const Card = ({ icon: Icon, title, subtitle, children, aside }) => (
  <motion.div
    className="bg-white rounded-[22px] border border-[#DDDDDD] shadow-sm p-6"
    variants={itemVariants}
  >
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {aside}
    </div>
    {children}
  </motion.div>
);

const Field = ({ label, required, error, icon: Icon, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <Icon
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          size={18}
        />
      )}
      {children}
    </div>
    {hint && !error && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    {error && (
      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
        <AlertCircle size={14} /> {error}
      </p>
    )}
  </div>
);

const inputClass = (error, disabled, withIcon = true) =>
  `w-full ${withIcon ? "pl-10" : "pl-4"} pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    error ? "border-red-500" : "border-gray-300"
  } ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white"}`;

const StaffForm = ({ mode = "create", staffId }) => {
  const navigate = useNavigate();
  const {
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
  } = useStaffForm({ mode, staffId });

  useUnsavedChangesWarning(
    isDirty && !isSubmitting,
    "You have unsaved changes. Are you sure you want to leave? All changes will be lost.",
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader />
      </div>
    );
  }

  const isEdit = mode === "edit";
  const text = (name, { icon, type = "text", placeholder, maxLength, transform } = {}) => (
    <input
      type={type}
      value={form[name]}
      onChange={(e) => update(name, transform ? transform(e.target.value) : e.target.value)}
      disabled={isSubmitting}
      maxLength={maxLength}
      placeholder={placeholder}
      className={inputClass(errors[name], isSubmitting, Boolean(icon))}
    />
  );

  // Roles the staff member already has but the picker can't list (no admin_roles.view)
  const assignedRoles = staff?.roles || [];
  const roleOptions = roles.length ? roles : assignedRoles;

  return (
    <motion.div className="flex-1 bg-gray-50" initial="hidden" animate="visible" variants={containerVariants}>
      <motion.div className="mb-6" variants={itemVariants}>
        <h1 className="text-3xl font-bold text-gray-800">{isEdit ? "Edit Staff" : "Add New Staff"}</h1>
        <p className="text-gray-600 mt-1">
          {isEdit
            ? "Update this staff member's details, roles and records"
            : "They'll get an email invite to set their own password"}
        </p>
      </motion.div>

      {isDirty && !isSubmitting && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2"
        >
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-yellow-800 font-medium">You have unsaved changes</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-6">
          {/* ACCOUNT */}
          <Card
            icon={User}
            title="Account Details"
            aside={
              isEdit && staff ? (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    staff.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {staff.status === "ACTIVE" ? "Active" : "Disabled"}
                </span>
              ) : null
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Field label="Full Name" required error={errors.fullName} icon={User}>
                {text("fullName", { icon: User, placeholder: "Enter full name", maxLength: 150 })}
              </Field>

              <Field
                label="Email Address"
                required={!isEdit}
                error={errors.email}
                icon={Mail}
                hint={isEdit ? "Email can't be changed" : "The invite is sent here"}
              >
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  disabled={isEdit || isSubmitting}
                  maxLength={320}
                  placeholder="name@example.com"
                  className={inputClass(errors.email, isEdit || isSubmitting)}
                />
              </Field>

              <Field
                label="Username"
                error={errors.username}
                icon={AtSign}
                hint="Optional — can be used to log in instead of email"
              >
                {text("username", {
                  icon: AtSign,
                  placeholder: "e.g. riya.sharma",
                  maxLength: 100,
                  transform: (v) => v.toLowerCase(),
                })}
              </Field>

              <Field label="Phone" error={errors.phone} icon={Phone}>
                {text("phone", { icon: Phone, type: "tel", placeholder: "10-digit mobile", maxLength: 20 })}
              </Field>
            </div>

            {/* ROLES */}
            <div className="mt-6">
              <p className="block text-sm font-medium text-gray-700 mb-2">
                Roles <span className="text-red-500">*</span>
              </p>
              {rolesError && <p className="text-sm text-amber-700 mb-2">{rolesError}</p>}
              <div className="flex flex-wrap gap-2">
                {roleOptions.map((role) => {
                  const selected = form.roleIds.includes(role.id);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => !rolesError && toggleRole(role.id)}
                      disabled={isSubmitting || Boolean(rolesError)}
                      aria-pressed={selected}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition ${
                        selected
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-gray-300 text-gray-700 hover:border-blue-400"
                      } ${rolesError ? "cursor-not-allowed opacity-80" : ""}`}
                    >
                      <Shield size={14} />
                      {role.name}
                    </button>
                  );
                })}
                {roleOptions.length === 0 && !rolesError && (
                  <p className="text-sm text-gray-500">No roles yet — create one under Roles first.</p>
                )}
              </div>
              {errors.roleIds && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <AlertCircle size={14} /> {errors.roleIds}
                </p>
              )}
              {isEdit && (
                <p className="text-xs text-gray-500 mt-2">
                  Changing roles signs this person out on every device so their new permissions apply.
                </p>
              )}
            </div>
          </Card>

          {!showExtras && (
            <motion.div
              variants={itemVariants}
              className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-800"
            >
              This is a super-admin account. Profile, KYC and bank details can't be edited for super-admins.
            </motion.div>
          )}

          {showExtras && (
            <>
              {/* PROFILE */}
              <Card icon={MapPin} title="Personal Details" subtitle="Optional">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Field label="Date of Birth" error={errors.dateOfBirth} icon={Calendar}>
                    {text("dateOfBirth", { icon: Calendar, type: "date" })}
                  </Field>
                  <Field label="Gender" error={errors.gender}>
                    <select
                      value={form.gender}
                      onChange={(e) => update("gender", e.target.value)}
                      disabled={isSubmitting}
                      className={inputClass(errors.gender, isSubmitting, false)}
                    >
                      <option value="">Select</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Address" error={errors.addressLine} icon={MapPin}>
                      {text("addressLine", { icon: MapPin, placeholder: "House, street, city", maxLength: 255 })}
                    </Field>
                  </div>
                  <Field label="Pincode" error={errors.pincode} icon={Hash}>
                    {text("pincode", {
                      icon: Hash,
                      placeholder: "6 digits",
                      maxLength: 6,
                      transform: (v) => v.replace(/\D/g, ""),
                    })}
                  </Field>
                </div>
              </Card>

              {/* KYC */}
              <Card
                icon={FileText}
                title="KYC Details"
                subtitle="Optional · stored encrypted"
                aside={
                  maskedKyc && !replaceKyc ? (
                    <button
                      type="button"
                      onClick={startReplaceKyc}
                      className="px-4 py-2 rounded-lg border border-blue-300 text-blue-700 text-sm font-medium hover:bg-blue-50"
                    >
                      Replace KYC details
                    </button>
                  ) : maskedKyc && replaceKyc ? (
                    <button
                      type="button"
                      onClick={cancelReplaceKyc}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                    >
                      Keep saved details
                    </button>
                  ) : null
                }
              >
                {maskedKyc && !replaceKyc ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {Object.entries(KYC_LABELS).map(([field, label]) => (
                      <div key={field} className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="font-mono text-sm text-gray-800 flex items-center gap-1">
                          {maskedKyc[field] ? (
                            <>
                              <Lock size={12} className="text-gray-400" /> {maskedKyc[field]}
                            </>
                          ) : (
                            <span className="text-gray-400">Not added</span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {maskedKyc && replaceKyc && (
                      <p className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                        Saving replaces <strong>all</strong> KYC numbers. Enter every number you want to keep —
                        any field left blank will be cleared.
                      </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <Field label={KYC_LABELS.aadhaarNumber} error={errors.aadhaarNumber} icon={CreditCard}>
                        {text("aadhaarNumber", {
                          icon: CreditCard,
                          placeholder: "12 digits",
                          maxLength: 12,
                          transform: (v) => v.replace(/\D/g, ""),
                        })}
                      </Field>
                      <Field label={KYC_LABELS.panNumber} error={errors.panNumber} icon={CreditCard}>
                        {text("panNumber", {
                          icon: CreditCard,
                          placeholder: "ABCDE1234F",
                          maxLength: 10,
                          transform: (v) => v.toUpperCase(),
                        })}
                      </Field>
                      <Field label={KYC_LABELS.uanNumber} error={errors.uanNumber} icon={Hash}>
                        {text("uanNumber", {
                          icon: Hash,
                          placeholder: "12 digits",
                          maxLength: 12,
                          transform: (v) => v.replace(/\D/g, ""),
                        })}
                      </Field>
                      <Field label={KYC_LABELS.pfNumber} error={errors.pfNumber} icon={Hash}>
                        {text("pfNumber", { icon: Hash, placeholder: "PF account number", maxLength: 50 })}
                      </Field>
                      <Field label={KYC_LABELS.esicNumber} error={errors.esicNumber} icon={Hash}>
                        {text("esicNumber", {
                          icon: Hash,
                          placeholder: "10–17 digits",
                          maxLength: 17,
                          transform: (v) => v.replace(/\D/g, ""),
                        })}
                      </Field>
                    </div>
                  </>
                )}
              </Card>

              {/* BANK */}
              <Card icon={Building2} title="Bank Details" subtitle="Optional · account number stored encrypted">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Field label="Account Holder Name" error={errors.accountHolderName} icon={User}>
                    {text("accountHolderName", { icon: User, placeholder: "As per bank records", maxLength: 150 })}
                  </Field>
                  <Field label="Bank Name" error={errors.bankName} icon={Building2}>
                    {text("bankName", { icon: Building2, placeholder: "e.g. State Bank of India", maxLength: 150 })}
                  </Field>
                  <Field
                    label="Account Number"
                    error={errors.accountNumber}
                    icon={Lock}
                    hint={
                      savedAccountMasked
                        ? `Saved: ${savedAccountMasked}. Re-enter it only if you change bank details.`
                        : undefined
                    }
                  >
                    {text("accountNumber", {
                      icon: Lock,
                      placeholder: savedAccountMasked ? "Re-enter to change" : "9–18 digits",
                      maxLength: 18,
                      transform: (v) => v.replace(/\D/g, ""),
                    })}
                  </Field>
                  <Field label="IFSC Code" error={errors.ifscCode} icon={Hash}>
                    {text("ifscCode", {
                      icon: Hash,
                      placeholder: "ABCD0123456",
                      maxLength: 11,
                      transform: (v) => v.toUpperCase(),
                    })}
                  </Field>
                  <Field label="Branch Name" error={errors.branchName} icon={MapPin}>
                    {text("branchName", { icon: MapPin, placeholder: "Branch", maxLength: 150 })}
                  </Field>
                </div>
              </Card>
            </>
          )}

          {/* ACTIONS */}
          <motion.div className="flex justify-end space-x-4" variants={itemVariants}>
            <button
              type="button"
              onClick={() => navigate("/admin/staff/listing")}
              disabled={isSubmitting}
              className={`px-8 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium transition ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-300"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-2.5 text-white rounded-lg font-medium transition ${
                isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isEdit ? "Saving..." : "Creating..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save size={18} />
                  {isEdit ? "Save Changes" : "Create & Send Invite"}
                </span>
              )}
            </button>
          </motion.div>
        </div>
      </form>
    </motion.div>
  );
};

export default StaffForm;
