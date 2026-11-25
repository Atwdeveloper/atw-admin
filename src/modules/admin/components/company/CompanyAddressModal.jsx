"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle } from "lucide-react";
import { ADDRESS_TYPES } from "../../../../api/adminV1/companyAPI";
import { useStates, loadCities } from "../../adminhooks/useGeoNames";
import { addressTypeLabel, PINCODE_REGEX } from "../../utils/companyUtils";

const EMPTY = { addressType: "REGISTERED_OFFICE", primary: false, line1: "", line2: "", stateId: "", cityId: "", pincode: "" };

const inputClass = (error, disabled) =>
  `w-full px-3 py-2 rounded-lg border bg-white text-sm ${error ? "border-red-500" : "border-gray-300"} ${
    disabled ? "bg-gray-100 cursor-not-allowed" : ""
  }`;

const FieldError = ({ message }) =>
  message ? (
    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
      <AlertCircle size={12} /> {message}
    </p>
  ) : null;

// Add / edit one company address.
// - address: the row being edited, or null to add.
// - lockPrimary: the address is the company's current primary — it can't be
//   unset here (make another one primary instead).
// - forcePrimary: the first address is always primary.
// - onSubmit(body) resolves on success; a thrown error keeps the modal open
//   and shows its message.
const CompanyAddressModal = ({ isOpen, address, lockPrimary, forcePrimary, onSubmit, onClose }) => {
  const isEdit = !!address;
  const states = useStates();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setForm(
      address
        ? {
            addressType: address.addressType || "BRANCH",
            primary: !!address.primary,
            line1: address.line1 || "",
            line2: address.line2 || "",
            stateId: address.stateId || "",
            cityId: address.cityId || "",
            pincode: address.pincode || "",
          }
        : { ...EMPTY, addressType: forcePrimary ? "REGISTERED_OFFICE" : "BRANCH", primary: !!forcePrimary },
    );
    setErrors({});
    setSubmitError("");
  }, [isOpen, address, forcePrimary]);

  useEffect(() => {
    if (!form.stateId) {
      setCities([]);
      return;
    }
    let cancelled = false;
    setCitiesLoading(true);
    loadCities(form.stateId)
      .then((list) => !cancelled && setCities(list))
      .catch(() => !cancelled && setCities([]))
      .finally(() => !cancelled && setCitiesLoading(false));
    return () => {
      cancelled = true;
    };
  }, [form.stateId]);

  const update = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((k) => delete next[k]);
      return next;
    });
  };

  const validate = () => {
    const e = {};
    if (!form.line1.trim()) e.line1 = "Address line 1 is required";
    if (!form.stateId) e.stateId = "State is required";
    if (!form.cityId) e.cityId = "City is required";
    if (!form.pincode) e.pincode = "Pincode is required";
    else if (!PINCODE_REGEX.test(form.pincode)) e.pincode = "Enter a valid 6-digit pincode";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setSubmitError("");
    try {
      await onSubmit({
        ...(isEdit ? {} : { addressType: form.addressType }),
        primary: forcePrimary || lockPrimary ? true : form.primary,
        line1: form.line1.trim(),
        line2: form.line2.trim() || null,
        stateId: form.stateId,
        cityId: form.cityId,
        pincode: form.pincode,
      });
      onClose();
    } catch (error) {
      setSubmitError(error?.message || "Could not save the address.");
    } finally {
      setSaving(false);
    }
  };

  const primaryFixed = forcePrimary || lockPrimary;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">{isEdit ? "Edit Address" : "Add Address"}</h2>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-600">Address Type</label>
                {isEdit ? (
                  <p className="px-3 py-2 rounded-lg bg-gray-100 text-sm text-gray-700">
                    {addressTypeLabel(form.addressType)}
                  </p>
                ) : (
                  <select
                    value={form.addressType}
                    onChange={(e) => update({ addressType: e.target.value })}
                    className={inputClass(false, saving)}
                    disabled={saving}
                  >
                    {ADDRESS_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {addressTypeLabel(t)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex items-end">
                <label className={`flex items-center gap-2 text-sm ${primaryFixed ? "text-gray-500" : "text-slate-700 cursor-pointer"}`}>
                  <input
                    type="checkbox"
                    checked={primaryFixed || form.primary}
                    disabled={primaryFixed || saving}
                    onChange={(e) => update({ primary: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  Primary address
                </label>
              </div>
              {primaryFixed && (
                <p className="md:col-span-2 -mt-2 text-xs text-gray-500">
                  {forcePrimary
                    ? "The first address is always the primary one."
                    : "This is the primary address. To change that, make another address primary."}
                </p>
              )}

              <div className="md:col-span-2">
                <label className="text-sm text-slate-600">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.line1}
                  maxLength={255}
                  onChange={(e) => update({ line1: e.target.value })}
                  placeholder="Building, floor, street"
                  className={inputClass(errors.line1, saving)}
                  disabled={saving}
                />
                <FieldError message={errors.line1} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-slate-600">Address Line 2</label>
                <input
                  value={form.line2}
                  maxLength={255}
                  onChange={(e) => update({ line2: e.target.value })}
                  placeholder="Area, landmark"
                  className={inputClass(false, saving)}
                  disabled={saving}
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.stateId}
                  onChange={(e) => update({ stateId: e.target.value, cityId: "" })}
                  className={inputClass(errors.stateId, saving)}
                  disabled={saving}
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
                  className={inputClass(errors.cityId, saving || !form.stateId || citiesLoading)}
                  disabled={saving || !form.stateId || citiesLoading}
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
                <label className="text-sm text-slate-600">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.pincode}
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(e) => update({ pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                  placeholder="6-digit pincode"
                  className={inputClass(errors.pincode, saving)}
                  disabled={saving}
                />
                <FieldError message={errors.pincode} />
              </div>

              {submitError && (
                <p className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {submitError}
                </p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEdit ? "Save Address" : "Add Address"}
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CompanyAddressModal;
