"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@/lib/navigation";
import { Building2, Edit2, FileText, Lock, MapPin, Shield, User, X } from "lucide-react";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import {
  getStaffBankAPI,
  getStaffKycAPI,
  getStaffProfileAPI,
} from "../../../../api/adminV1/staffAPI";

const formatDate = (value, withTime = false) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
      })
    : null;

const GENDER = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };

const Row = ({ label, value, mono }) => (
  <div className="py-2.5 flex justify-between gap-4 border-b border-gray-100 last:border-b-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className={`text-sm text-right text-gray-900 ${mono ? "font-mono" : "font-medium"}`}>
      {value || <span className="text-gray-400 font-normal">—</span>}
    </span>
  </div>
);

const Section = ({ icon: Icon, title, children, note }) => (
  <div className="rounded-xl border border-gray-200 p-5">
    <div className="flex items-center justify-between gap-2 mb-2">
      <h3 className="flex items-center gap-2 font-semibold text-gray-800">
        <Icon size={18} className="text-blue-600" /> {title}
      </h3>
      {note}
    </div>
    {children}
  </div>
);

const maskedNote = (
  <span className="flex items-center gap-1 text-xs text-gray-400">
    <Lock size={12} /> Masked
  </span>
);

const StaffViewModal = ({ staff, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { hasPermission } = useAdminPermissions();
  const [details, setDetails] = useState(null); // { profile, kyc, bank }
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !staff || staff.superAdmin) {
      setDetails(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getStaffProfileAPI(staff.id).catch(() => null),
      getStaffKycAPI(staff.id).catch(() => null),
      getStaffBankAPI(staff.id).catch(() => null),
    ]).then(([profile, kyc, bank]) => {
      if (cancelled) return;
      setDetails({ profile, kyc, bank });
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, staff]);

  if (!isOpen || !staff) return null;

  const { profile, kyc, bank } = details || {};
  const kycMasked = kyc && Object.values(kyc).some((v) => typeof v === "string" && v.includes("*"));
  const bankMasked = bank?.accountNumber?.includes("*");
  const active = staff.status === "ACTIVE";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col"
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                {(staff.fullName || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {staff.fullName}
                  {staff.superAdmin && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20">
                      SUPER ADMIN
                    </span>
                  )}
                </h2>
                <p className="text-sm text-blue-100">{staff.email}</p>
                <span
                  className={`mt-2 inline-flex px-3 py-0.5 rounded-full text-xs font-medium ${
                    active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {active ? "Active" : "Disabled"}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10" aria-label="Close">
              <X size={20} />
            </button>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto p-6 grid gap-5 md:grid-cols-2">
            <Section icon={User} title="Account">
              <Row label="Username" value={staff.username && `@${staff.username}`} />
              <Row label="Phone" value={staff.phone} />
              <Row label="Last login" value={formatDate(staff.lastLoginAt, true) || "Never"} />
              <Row label="Created" value={formatDate(staff.createdAt)} />
            </Section>

            <Section icon={Shield} title="Roles">
              <div className="flex flex-wrap gap-2 pt-1">
                {staff.superAdmin ? (
                  <span className="text-sm text-gray-600">Full access to everything.</span>
                ) : (staff.roles || []).length ? (
                  staff.roles.map((role) => (
                    <span
                      key={role.id}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium bg-blue-50 text-blue-700"
                    >
                      <Shield size={13} /> {role.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">No roles assigned</span>
                )}
              </div>
            </Section>

            {staff.superAdmin ? (
              <p className="md:col-span-2 text-sm text-gray-500">
                Profile, KYC and bank details aren't kept for super-admin accounts.
              </p>
            ) : loading || !details ? (
              <div className="md:col-span-2 flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <Section icon={MapPin} title="Personal">
                  <Row label="Date of birth" value={formatDate(profile?.dateOfBirth)} />
                  <Row label="Gender" value={GENDER[profile?.gender]} />
                  <Row label="Address" value={profile?.addressLine} />
                  <Row label="Pincode" value={profile?.pincode} />
                </Section>

                <Section icon={FileText} title="KYC" note={kycMasked ? maskedNote : null}>
                  <Row label="Aadhaar" value={kyc?.aadhaarNumber} mono />
                  <Row label="PAN" value={kyc?.panNumber} mono />
                  <Row label="UAN" value={kyc?.uanNumber} mono />
                  <Row label="PF" value={kyc?.pfNumber} mono />
                  <Row label="ESIC" value={kyc?.esicNumber} mono />
                </Section>

                <div className="md:col-span-2">
                  <Section icon={Building2} title="Bank details" note={bankMasked ? maskedNote : null}>
                    <div className="grid md:grid-cols-2 gap-x-8">
                      <Row label="Account holder" value={bank?.accountHolderName} />
                      <Row label="Bank" value={bank?.bankName} />
                      <Row label="Account number" value={bank?.accountNumber} mono />
                      <Row label="IFSC" value={bank?.ifscCode} mono />
                      <Row label="Branch" value={bank?.branchName} />
                    </div>
                  </Section>
                </div>
              </>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
            >
              Close
            </button>
            {hasPermission("admin_staff", "edit") && (
              <button
                onClick={() => navigate(`/admin/staff/edit/${staff.id}`)}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
              >
                <Edit2 size={16} /> Edit Staff
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StaffViewModal;
