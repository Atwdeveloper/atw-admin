"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import { AlertCircle, Building2, Mail, Phone, User, FileText, Hash, ShieldCheck, Lock } from "lucide-react";
import { useNavigate } from "@/lib/navigation";
import { containerVariants, itemVariants } from "../../../../common/utils/motionVariants";
import Loader from "../../../../common/components/Loader";
import useUnsavedChangesWarning from "../../../../common/hooks/useUnsavedChangesWarning";
import { getIndustriesAPI } from "../../../../api/adminV1/masterdataAPI";
import {
  getCompanyAPI,
  createCompanyAPI,
  updateCompanyAPI,
  getCompanyAddressesAPI,
  addCompanyAddressAPI,
  updateCompanyAddressAPI,
  deleteCompanyAddressAPI,
} from "../../../../api/adminV1/companyAPI";
import { apiError } from "../../../../api/javaApi";
import { asList, formatDate } from "../../utils/workerUtils";
import { GST_REGEX, PAN_REGEX, EMAIL_REGEX, COMPANY_STATUS_META, companyStatusLabel } from "../../utils/companyUtils";
import { useGeoNames } from "../../adminhooks/useGeoNames";
import CompanyAddressList from "./CompanyAddressList";
import CompanyAddressModal from "./CompanyAddressModal";

const EMPTY = { name: "", industryId: "", gstNumber: "", panNumber: "", ownerName: "", ownerEmail: "", ownerPhone: "" };

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

const ReadOnly = ({ icon: Icon, value }) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 border border-gray-200 text-gray-700 min-h-[42px]">
    <Icon size={18} className="text-gray-400 shrink-0" />
    <span className="truncate">{value || "Not Provided"}</span>
  </div>
);

// A CONFLICT's message names the clashing field; route it there.
const conflictField = (message = "") => {
  if (/email/i.test(message)) return "ownerEmail";
  if (/gst/i.test(message)) return "gstNumber";
  if (/pan/i.test(message)) return "panNumber";
  return null;
};

let keySeq = 0;
const localKey = () => `new-${++keySeq}`;

// Local address-list ops for create mode, keeping exactly one primary.
const withPrimary = (list, primaryKey) => list.map((a) => ({ ...a, primary: a._key === primaryKey }));

const CompanyForm = ({ mode = "create", companyId }) => {
  const isEdit = mode === "edit";
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [initialForm, setInitialForm] = useState(EMPTY);
  const [company, setCompany] = useState(null); // edit: the record on file
  const [addresses, setAddresses] = useState([]);
  const [errors, setErrors] = useState({});
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [addressModal, setAddressModal] = useState(null); // { address } | { address: null }
  const [busyAddressId, setBusyAddressId] = useState(null);

  const geo = useGeoNames(addresses.map((a) => a.stateId));

  const isDirty =
    JSON.stringify(form) !== JSON.stringify(initialForm) || (!isEdit && addresses.length > 0);

  useUnsavedChangesWarning(
    isDirty && !submitting && !leaving,
    "You have unsaved changes. Are you sure you want to leave? All changes will be lost.",
  );

  useEffect(() => {
    getIndustriesAPI()
      .then((list) => setIndustries(asList(list)))
      .catch(() => setIndustries([]));
  }, []);

  useEffect(() => {
    if (!isEdit || !companyId) return;
    let cancelled = false;
    setLoading(true);
    getCompanyAPI(companyId)
      .then((c) => {
        if (cancelled) return;
        const loaded = { ...EMPTY, name: c.name || "", industryId: c.industryId || "" };
        setCompany(c);
        setForm(loaded);
        setInitialForm(loaded);
        setAddresses(c.addresses || []);
      })
      .catch((error) => {
        if (cancelled) return;
        Swal.fire({ icon: "error", title: "Could not load company", text: apiError(error).message });
        navigate("/admin/company/listing");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, companyId]);

  const update = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((k) => delete next[k]);
      return next;
    });
  };

  const field = (name, extra = {}) => ({
    name,
    value: form[name],
    onChange: (e) => update({ [name]: e.target.value }),
    error: errors[name],
    disabled: submitting,
    ...extra,
  });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Company name is required";
    if (!form.industryId) e.industryId = "Industry is required";
    if (!isEdit) {
      if (form.gstNumber && !GST_REGEX.test(form.gstNumber)) e.gstNumber = "Enter a valid 15-character GSTIN";
      if (form.panNumber && !PAN_REGEX.test(form.panNumber)) e.panNumber = "Enter a valid PAN (e.g. ABCDE1234F)";
      if (form.gstNumber && form.panNumber && GST_REGEX.test(form.gstNumber) && form.gstNumber.slice(2, 12) !== form.panNumber)
        e.panNumber = "PAN doesn't match the PAN inside the GSTIN";
      if (!form.ownerName.trim()) e.ownerName = "Owner name is required";
      if (!form.ownerEmail.trim()) e.ownerEmail = "Owner email is required";
      else if (!EMAIL_REGEX.test(form.ownerEmail.trim())) e.ownerEmail = "Enter a valid email address";
      if (form.ownerPhone && !/^[6-9]\d{9}$/.test(form.ownerPhone)) e.ownerPhone = "Enter a valid 10-digit mobile number";
      if (addresses.length === 0) e.addresses = "Add at least the registered office address";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const showServerErrors = (error, title) => {
    const err = apiError(error);
    const fieldErrors = { ...err.fieldErrors };
    if (err.code === "CONFLICT") {
      const f = conflictField(err.message);
      if (f) fieldErrors[f] = err.message;
    }
    if (Object.keys(fieldErrors).length) setErrors((prev) => ({ ...prev, ...fieldErrors }));
    Swal.fire({ icon: "error", title, text: err.message });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      Swal.fire({ icon: "warning", title: "Please fix the highlighted fields", timer: 1800, showConfirmButton: false });
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit) {
        if (!isDirty) {
          setLeaving(true);
          await Swal.fire({ icon: "info", title: "No changes to save", timer: 1500, showConfirmButton: false });
          navigate("/admin/company/listing");
          return;
        }
        await updateCompanyAPI(companyId, { name: form.name.trim(), industryId: form.industryId });
        setLeaving(true);
        await Swal.fire({ icon: "success", title: "Company Updated", timer: 1600, showConfirmButton: false });
      } else {
        const created = await createCompanyAPI({
          name: form.name.trim(),
          industryId: form.industryId,
          gstNumber: form.gstNumber || undefined,
          panNumber: form.panNumber || undefined,
          addresses: addresses.map(({ _key, ...a }) => a),
          ownerName: form.ownerName.trim(),
          ownerEmail: form.ownerEmail.trim().toLowerCase(),
          ownerPhone: form.ownerPhone || undefined,
        });
        setLeaving(true);
        await Swal.fire({
          icon: "success",
          title: "Company Added",
          html: `<b>${created.companyCode}</b> has been created as <b>Pending Verification</b>.<br/>An invite email has been sent to the owner.`,
        });
      }
      navigate("/admin/company/listing");
    } catch (error) {
      showServerErrors(error, isEdit ? "Could not update company" : "Could not add company");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    const result = await Swal.fire({
      title: isEdit ? "Reset changes?" : "Reset form?",
      text: isEdit ? "Name and industry go back to what's saved." : "Everything you've entered will be cleared.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, reset",
    });
    if (!result.isConfirmed) return;
    setForm(initialForm);
    setErrors({});
    if (!isEdit) setAddresses([]);
  };

  // ---- Addresses -------------------------------------------------------------
  const reloadAddresses = useCallback(async () => {
    try {
      setAddresses(asList(await getCompanyAddressesAPI(companyId)));
    } catch (error) {
      Swal.fire({ icon: "error", title: "Could not reload addresses", text: apiError(error).message });
    }
  }, [companyId]);

  const saveAddress = async (body) => {
    const editing = addressModal?.address;
    if (!isEdit) {
      setAddresses((prev) => {
        if (editing) {
          const next = prev.map((a) => (a._key === editing._key ? { ...a, ...body } : a));
          return body.primary ? withPrimary(next, editing._key) : next;
        }
        const added = { ...body, _key: localKey(), primary: prev.length === 0 || body.primary };
        const next = [...prev, added];
        return added.primary ? withPrimary(next, added._key) : next;
      });
      setErrors((prev) => ({ ...prev, addresses: undefined }));
      return;
    }
    try {
      if (editing) await updateCompanyAddressAPI(companyId, editing.id, body);
      else await addCompanyAddressAPI(companyId, body);
    } catch (error) {
      throw new Error(apiError(error).message);
    }
    await reloadAddresses();
  };

  const makePrimary = async (addr) => {
    if (!isEdit) {
      setAddresses((prev) => withPrimary(prev, addr._key));
      return;
    }
    setBusyAddressId(addr.id);
    try {
      const { id, addressType, ...rest } = addr;
      await updateCompanyAddressAPI(companyId, id, { ...rest, primary: true });
      await reloadAddresses();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Could not update address", text: apiError(error).message });
    } finally {
      setBusyAddressId(null);
    }
  };

  const deleteAddress = async (addr) => {
    if (!isEdit) {
      setAddresses((prev) => {
        const next = prev.filter((a) => a._key !== addr._key);
        return addr.primary && next.length ? withPrimary(next, next[0]._key) : next;
      });
      return;
    }
    if (addresses.length === 1) {
      Swal.fire({
        icon: "info",
        title: "Can't delete the only address",
        text: "A company must always have at least one address. Add another one first.",
      });
      return;
    }
    const result = await Swal.fire({
      title: "Delete this address?",
      text: addr.primary ? "It's the primary address — the next oldest address becomes primary." : undefined,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;
    setBusyAddressId(addr.id);
    try {
      await deleteCompanyAddressAPI(companyId, addr.id);
      await reloadAddresses();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Could not delete address", text: apiError(error).message });
    } finally {
      setBusyAddressId(null);
    }
  };

  if (loading) return <Loader />;

  const industryKnown = !form.industryId || industries.some((i) => i.id === form.industryId);

  return (
    <>
      <motion.form
        onSubmit={handleSubmit}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6 mt-4"
        noValidate
      >
        {/* COMPANY DETAILS */}
        <CardShell
          title="Company Details"
          right={
            isEdit && company ? (
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${COMPANY_STATUS_META[company.status]?.className || ""}`}
              >
                {companyStatusLabel(company.status)}
              </span>
            ) : null
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            <div>
              <label className="text-sm text-slate-600">
                Company Name <span className="text-red-500">*</span>
              </label>
              <IconInput icon={Building2} maxLength={200} placeholder="Registered company name" {...field("name")} />
              <FieldError message={errors.name} />
            </div>
            <div>
              <label className="text-sm text-slate-600">
                Industry <span className="text-red-500">*</span>
              </label>
              <select
                value={form.industryId}
                onChange={(e) => update({ industryId: e.target.value })}
                disabled={submitting}
                className={`w-full px-3 py-2 rounded-lg border bg-white ${errors.industryId ? "border-red-500" : "border-gray-300"}`}
              >
                <option value="">Select industry</option>
                {!industryKnown && <option value={form.industryId}>Current industry</option>}
                {industries.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
              <FieldError message={errors.industryId} />
            </div>

            {isEdit ? (
              <>
                <div>
                  <label className="text-sm text-slate-600">Company Code</label>
                  <ReadOnly icon={Hash} value={company?.companyCode} />
                </div>
                <div>
                  <label className="text-sm text-slate-600">Created On</label>
                  <ReadOnly icon={Hash} value={formatDate(company?.createdAt, true)} />
                </div>
                <div>
                  <label className="text-sm text-slate-600">GST Number</label>
                  <ReadOnly icon={FileText} value={company?.gstNumber} />
                  {company?.gstVerifiedAt ? (
                    <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                      <ShieldCheck size={14} /> Verified on {formatDate(company.gstVerifiedAt)}
                    </p>
                  ) : (
                    company?.gstNumber && (
                      <p className="text-xs text-gray-500 mt-1">Not verified — verify it from the company's details view.</p>
                    )
                  )}
                </div>
                <div>
                  <label className="text-sm text-slate-600">PAN Number</label>
                  <ReadOnly icon={FileText} value={company?.panNumber} />
                </div>
                <p className="md:col-span-2 text-xs text-gray-500 flex items-center gap-1">
                  <Lock size={12} /> GST and PAN can only be set when the company is created.
                </p>
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm text-slate-600">GST Number</label>
                  <IconInput
                    icon={FileText}
                    maxLength={15}
                    placeholder="22AAAAA0000A1Z5"
                    className="uppercase"
                    {...field("gstNumber", {
                      onChange: (e) => {
                        const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);
                        // A GSTIN carries the PAN in characters 3-12 — fill it in if PAN is empty.
                        const patch = { gstNumber: v };
                        if (GST_REGEX.test(v) && !form.panNumber) patch.panNumber = v.slice(2, 12);
                        update(patch);
                      },
                    })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional. Verify it after the company is created.</p>
                  <FieldError message={errors.gstNumber} />
                </div>
                <div>
                  <label className="text-sm text-slate-600">PAN Number</label>
                  <IconInput
                    icon={FileText}
                    maxLength={10}
                    placeholder="ABCDE1234F"
                    className="uppercase"
                    {...field("panNumber", {
                      onChange: (e) =>
                        update({ panNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) }),
                    })}
                  />
                  <FieldError message={errors.panNumber} />
                </div>
              </>
            )}
          </div>
        </CardShell>

        {/* OWNER */}
        <CardShell title="Owner Account">
          {isEdit ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              <div>
                <label className="text-sm text-slate-600">Owner Name</label>
                <ReadOnly icon={User} value={company?.owner?.name} />
              </div>
              <div>
                <label className="text-sm text-slate-600">Owner Email</label>
                <ReadOnly icon={Mail} value={company?.owner?.email} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              <div>
                <label className="text-sm text-slate-600">
                  Owner Name <span className="text-red-500">*</span>
                </label>
                <IconInput icon={User} maxLength={150} placeholder="Full name" {...field("ownerName")} />
                <FieldError message={errors.ownerName} />
              </div>
              <div>
                <label className="text-sm text-slate-600">
                  Owner Email <span className="text-red-500">*</span>
                </label>
                <IconInput icon={Mail} type="email" maxLength={254} placeholder="owner@company.com" {...field("ownerEmail")} />
                <FieldError message={errors.ownerEmail} />
              </div>
              <div>
                <label className="text-sm text-slate-600">Owner Mobile</label>
                <IconInput
                  icon={Phone}
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  {...field("ownerPhone", {
                    onChange: (e) => update({ ownerPhone: e.target.value.replace(/\D/g, "").slice(0, 10) }),
                  })}
                />
                <FieldError message={errors.ownerPhone} />
              </div>
              <p className="md:col-span-3 text-xs text-gray-500">
                An owner login account is created with the company, and an invite email is sent to this address.
              </p>
            </div>
          )}
        </CardShell>

        {/* ADDRESSES */}
        <CardShell
          title={
            <span>
              Addresses {!isEdit && <span className="text-red-500">*</span>}
            </span>
          }
          right={isEdit ? <span className="text-xs font-normal text-gray-500">Changes here are saved immediately</span> : null}
        >
          <div className="p-6">
            <CompanyAddressList
              addresses={addresses}
              geo={geo}
              editable={!submitting}
              busyId={busyAddressId}
              error={errors.addresses}
              onAdd={() => setAddressModal({ address: null })}
              onEdit={(address) => setAddressModal({ address })}
              onMakePrimary={makePrimary}
              onDelete={deleteAddress}
            />
            <FieldError message={errors.addresses} />
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
            onClick={() => navigate("/admin/company/listing")}
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
              "Update Company"
            ) : (
              "Add Company"
            )}
          </button>
        </motion.div>
      </motion.form>

      <CompanyAddressModal
        isOpen={!!addressModal}
        address={addressModal?.address || null}
        forcePrimary={!addressModal?.address && addresses.length === 0}
        lockPrimary={!!addressModal?.address?.primary}
        onSubmit={saveAddress}
        onClose={() => setAddressModal(null)}
      />
    </>
  );
};

export default CompanyForm;
