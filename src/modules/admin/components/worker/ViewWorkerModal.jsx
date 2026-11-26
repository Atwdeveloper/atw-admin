"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Briefcase,
  FileText,
  CreditCard,
  Home,
  Users,
  Activity,
  History,
  Wrench,
  ShieldCheck,
  ScanFace,
  Trash2,
  Star,
  Loader2,
  Clock,
  Landmark,
  IdCard,
  Fingerprint,
  FileCheck,
  HeartPulse,
  BadgeCheck,
} from "lucide-react";
import { useNavigate } from "@/lib/navigation";
import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import {
  getWorkerAPI,
  getWorkerAddressAPI,
  getWorkerBankDetailAPI,
  getWorkerKycAPI,
  getWorkerStatusHistoryAPI,
  getWorkerStatutoryDetailAPI,
  removeFaceEnrollmentAPI,
  changeWorkerStatusAPI,
} from "../../../../api/adminV1/workerAPI";
import { getStatesAPI, getCitiesAPI } from "../../../../api/adminV1/geographyAPI";
import { apiError } from "../../../../api/javaApi";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import WorkerFaceScanner, { confirmFaceConsent } from "./WorkerFaceScanner";
import ActorName from "../ActorName";
import {
  STATUS_META,
  KYC_META,
  statusLabel,
  kycLabel,
  fullName,
  formatDate,
  GENDER_OPTIONS,
  asList,
  workerStatusActions,
  confirmWorkerStatus,
} from "../../utils/workerUtils";

const settled = (r) => (r.status === "fulfilled" ? r.value : null);

// "line1, line2, City, State pincode" — the backend's formattedAddress when it
// has one, otherwise built from the parts.
const describeAddress = (addr, geo) => {
  if (!addr) return null;
  if (addr.formattedAddress) return addr.formattedAddress;
  const parts = [
    addr.line1,
    addr.line2,
    geo.cities[addr.cityId],
    [geo.states[addr.stateId], addr.pincode].filter(Boolean).join(" "),
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
};

const WorkerViewModal = ({ workerId, isOpen, onClose, onWorkerChanged, industries = [] }) => {
  const navigate = useNavigate();
  const { hasPermission } = useAdminPermissions();
  const canEdit = hasPermission("workers", "edit");
  const canViewKyc = hasPermission("kyc", "view");
  const canEnrollFace = hasPermission("faceauth", "enroll");
  const canChangeStatus = hasPermission("workers", "toggle_status");

  const [worker, setWorker] = useState(null);
  const [extras, setExtras] = useState({});
  const [geo, setGeo] = useState({ states: {}, cities: {} });
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [removingFace, setRemovingFace] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [brokenPhotos, setBrokenPhotos] = useState([]);

  const load = useCallback(async () => {
    if (!workerId) return;
    setLoading(true);
    try {
      const [w, permanent, bank, kyc, history, statutory] = await Promise.allSettled([
        getWorkerAPI(workerId),
        getWorkerAddressAPI(workerId, "PERMANENT"),
        getWorkerBankDetailAPI(workerId),
        canViewKyc ? getWorkerKycAPI(workerId) : Promise.resolve(null),
        getWorkerStatusHistoryAPI(workerId, { size: 50 }),
        getWorkerStatutoryDetailAPI(workerId),
      ]);
      if (w.status === "rejected") throw w.reason;
      setWorker(w.value);
      const next = {
        permanent: settled(permanent),
        bank: settled(bank),
        kyc: settled(kyc),
        history: settled(history)?.content || [],
        statutory: settled(statutory),
      };
      setExtras(next);

      // Resolve the address's state/city names.
      const stateId = next.permanent?.stateId;
      if (stateId) {
        const [states, cities] = await Promise.all([
          getStatesAPI().catch(() => []),
          getCitiesAPI(stateId).catch(() => []),
        ]);
        setGeo({
          states: Object.fromEntries(asList(states).map((s) => [s.id, s.name])),
          cities: Object.fromEntries(asList(cities).map((c) => [c.id, c.name])),
        });
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Could not load worker", text: apiError(error).message });
      onClose();
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId, canViewKyc]);

  useEffect(() => {
    if (isOpen && workerId) {
      setWorker(null);
      setExtras({});
      setGeo({ states: {}, cities: {} });
      setBrokenPhotos([]);
      load();
    }
  }, [isOpen, workerId, load]);

  const startFaceEnroll = async () => {
    if (await confirmFaceConsent(fullName(worker), !!worker.faceEnrollment?.enrolled)) setShowScanner(true);
  };

  // POST /status, then update the badge and re-read the history (the backend
  // adds the entry). Errors are shown as the backend wrote them.
  const handleStatusChange = async (action) => {
    const confirmed = await confirmWorkerStatus(action);
    if (!confirmed) return;
    setChangingStatus(true);
    try {
      const updated = await changeWorkerStatusAPI(worker.id, action.status, confirmed.reason);
      setWorker(updated);
      onWorkerChanged?.(updated);
      getWorkerStatusHistoryAPI(worker.id, { size: 50 })
        .then((h) => setExtras((prev) => ({ ...prev, history: h?.content || [] })))
        .catch(() => {});
      Swal.fire({ icon: "success", title: "Status updated", timer: 1500, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Could not change status", text: apiError(error).message });
    } finally {
      setChangingStatus(false);
    }
  };

  const handleRemoveFace = async () => {
    const result = await Swal.fire({
      title: "Remove face enrollment?",
      text: "The stored face template and reference photo will be deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;
    setRemovingFace(true);
    try {
      await removeFaceEnrollmentAPI(worker.id);
      const updated = { ...worker, faceEnrollment: null };
      setWorker(updated);
      onWorkerChanged?.();
      Swal.fire({ icon: "success", title: "Face enrollment removed", timer: 1500, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Could not remove", text: apiError(error).message });
    } finally {
      setRemovingFace(false);
    }
  };

  const industryName = asList(industries).find((i) => i.id === worker?.industryId)?.name;
  const genderLabel = GENDER_OPTIONS.find((g) => g.value === worker?.gender)?.label || worker?.gender;
  const face = worker?.faceEnrollment?.enrolled ? worker.faceEnrollment : null;
  const { permanent, bank, kyc, history = [], statutory } = extras;
  // Face reference photo first, then the profile photo; a URL that fails to
  // load falls through to the next one.
  const headerPhotos = [face?.photoUrl, worker?.profilePhotoUrl].filter(Boolean);
  const headerPhoto = headerPhotos.find((url) => !brokenPhotos.includes(url));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
          >
            {loading || !worker ? (
              <div className="p-16 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 rounded-t-2xl z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                        <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        {headerPhoto && (
                          <img
                            key={headerPhoto}
                            src={headerPhoto}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={() => setBrokenPhotos((prev) => [...prev, headerPhoto])}
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {fullName(worker)} - {worker.workerCode}
                        </h3>
                        {industryName && (
                          <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium">
                            {industryName}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard
                      icon={<Mail className="text-blue-500" />}
                      label="Personal Email"
                      value={worker.personalEmail || "Not Provided"}
                    />
                    <StatCard icon={<Phone className="text-green-500" />} label="Mobile" value={worker.mobileNumber} />
                    <StatCard
                      icon={<ShieldCheck className="text-amber-500" />}
                      label="KYC Status"
                      value={<Badge meta={KYC_META[worker.kycStatus]} label={kycLabel(worker.kycStatus)} />}
                    />
                    <StatCard
                      icon={<Activity className="text-purple-500" />}
                      label="Status"
                      value={
                        <span className="flex flex-col gap-1">
                          <Badge meta={STATUS_META[worker.status]} label={statusLabel(worker.status)} />
                          {worker.statusReason && (
                            <span className="text-xs font-normal text-slate-500">{worker.statusReason}</span>
                          )}
                        </span>
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column */}
                    <div className="lg:col-span-2 space-y-6">
                      <Card title="Basic Information" icon={<User className="text-indigo-500" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <DetailItem icon={<User size={16} />} label="Full Name" value={fullName(worker)} />
                          <DetailItem icon={<IdCard size={16} />} label="Worker Code" value={worker.workerCode} />
                          <DetailItem
                            icon={<Calendar size={16} />}
                            label="Date of Registration"
                            value={formatDate(worker.createdAt, true)}
                          />
                          <DetailItem icon={<Users size={16} />} label="Gender" value={genderLabel || "Not Provided"} />
                          <DetailItem
                            icon={<Clock size={16} />}
                            label="Work Experience"
                            value={
                              worker.workExperienceYears != null
                                ? `${worker.workExperienceYears} ${Number(worker.workExperienceYears) === 1 ? "year" : "years"}`
                                : "Not Provided"
                            }
                          />
                          <div className="md:col-span-2">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                              <Briefcase size={16} />
                              <span>Designation</span>
                            </div>
                            {worker.designations?.length ? (
                              <div className="flex flex-wrap gap-2">
                                {worker.designations.map((d) => (
                                  <span
                                    key={d.id}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium"
                                  >
                                    {d.primary && <Star className="w-3 h-3 fill-current" />}
                                    {d.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-900 dark:text-slate-100 font-medium">Not Provided</span>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                              <Wrench size={16} />
                              <span>Skills</span>
                            </div>
                            {worker.skills?.length ? (
                              <div className="flex flex-wrap gap-2">
                                {worker.skills.map((s) => (
                                  <span
                                    key={s.id}
                                    className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium"
                                  >
                                    {s.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-900 dark:text-slate-100 font-medium">Not Provided</span>
                            )}
                          </div>
                        </div>
                      </Card>

                      <Card title="Personal Details" icon={<Home className="text-blue-500" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <DetailItem
                            icon={<Users size={16} />}
                            label="Father's Name"
                            value={worker.fatherName || "Not Provided"}
                          />
                          <DetailItem
                            icon={<Calendar size={16} />}
                            label="Date of Birth"
                            value={worker.dateOfBirth ? formatDate(worker.dateOfBirth) : "Not Provided"}
                          />
                          {canViewKyc ? (
                            <>
                              <DetailItem
                                icon={<Fingerprint size={16} />}
                                label="Aadhaar Number"
                                value={kyc?.aadhaarNumber || "Not Provided"}
                              />
                              <DetailItem
                                icon={<FileText size={16} />}
                                label="PAN Number"
                                value={kyc?.panNumber || "Not Provided"}
                              />
                              <DetailItem
                                icon={<ShieldCheck size={16} />}
                                label="KYC Verified On"
                                value={kyc?.verifiedAt ? formatDate(kyc.verifiedAt, true) : "Not verified"}
                              />
                              <DetailItem
                                icon={<FileCheck size={16} />}
                                label="Verification Reference"
                                value={kyc?.verificationRef || "—"}
                              />
                            </>
                          ) : (
                            <p className="md:col-span-2 text-sm text-slate-500">
                              You don't have permission to view KYC details.
                            </p>
                          )}
                          <div className="md:col-span-2">
                            <DetailItem
                              icon={<MapPin size={16} />}
                              label="Address"
                              value={describeAddress(permanent, geo) || "Not Provided"}
                            />
                          </div>
                        </div>
                      </Card>

                      <Card title="Statutory Details" icon={<Landmark className="text-emerald-500" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <DetailItem
                            icon={<HeartPulse size={16} />}
                            label="ESIC Number"
                            value={statutory?.esicNumber || "Not Provided"}
                          />
                          <DetailItem
                            icon={<BadgeCheck size={16} />}
                            label="UAN Number"
                            value={statutory?.uanNumber || "Not Provided"}
                          />
                        </div>
                      </Card>
                    </div>

                    {/* Right column */}
                    <div className="space-y-6">
                      {canChangeStatus && workerStatusActions(worker.status).length > 0 && (
                        <Card title="Change Status" icon={<Activity className="text-purple-500" />}>
                          <div className="flex flex-wrap gap-2">
                            {workerStatusActions(worker.status).map((action) => (
                              <button
                                key={action.label}
                                onClick={() => handleStatusChange(action)}
                                disabled={changingStatus}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 ${
                                  action.danger
                                    ? "text-red-600 border border-red-200 bg-white hover:bg-red-50"
                                    : "text-white bg-green-600 hover:bg-green-700"
                                }`}
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-slate-500 mt-3">
                            Suspend, Deactivate and Blacklist need a reason. Every change is recorded in Status History.
                          </p>
                        </Card>
                      )}
                      <Card title="Face Enrollment" icon={<ScanFace className="text-teal-500" />}>
                        {face ? (
                          <div className="space-y-3">
                            {face.photoUrl && (
                              <img
                                src={face.photoUrl}
                                alt="Enrollment reference"
                                className="w-24 h-24 rounded-xl object-cover border border-slate-200"
                              />
                            )}
                            <DetailItem
                              icon={<Calendar size={16} />}
                              label="Enrolled On"
                              value={formatDate(face.enrolledAt, true)}
                            />
                            {face.livenessConfidence != null && (
                              <DetailItem
                                icon={<Activity size={16} />}
                                label="Liveness Confidence"
                                value={`${Math.round(face.livenessConfidence * 100)}%`}
                              />
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">No face template on file.</p>
                        )}
                        {canEnrollFace && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            <button
                              onClick={startFaceEnroll}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                              <ScanFace size={16} />
                              {face ? "Re-enroll" : "Enroll Face"}
                            </button>
                            {face && (
                              <button
                                onClick={handleRemoveFace}
                                disabled={removingFace}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50"
                              >
                                <Trash2 size={16} />
                                Remove
                              </button>
                            )}
                          </div>
                        )}
                      </Card>

                      <Card title="Payment Information" icon={<CreditCard className="text-purple-500" />}>
                        <div className="space-y-3">
                          <DetailItem
                            icon={<User size={16} />}
                            label="Account Holder"
                            value={bank?.accountHolderName || "Not Provided"}
                          />
                          <DetailItem
                            icon={<Building size={16} />}
                            label="Bank Name"
                            value={bank?.bankName || "Not Provided"}
                          />
                          <DetailItem
                            icon={<CreditCard size={16} />}
                            label="Account Number"
                            value={bank?.accountNumber || "Not Provided"}
                          />
                          <DetailItem icon={<Landmark size={16} />} label="IFSC Code" value={bank?.ifscCode || "Not Provided"} />
                          <DetailItem
                            icon={<ShieldCheck size={16} />}
                            label="Verification"
                            value={bank?.verified ? `Verified ${formatDate(bank.verifiedAt)}` : "Not verified"}
                          />
                        </div>
                      </Card>

                      <Card title="Status History" icon={<History className="text-amber-500" />}>
                        {history.length ? (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {history.map((h) => (
                              <div key={h.id} className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    {h.fromStatus ? `${statusLabel(h.fromStatus)} → ` : ""}
                                    {statusLabel(h.toStatus)}
                                  </span>
                                  <span className="text-xs text-slate-500">{formatDate(h.changedAt)}</span>
                                </div>
                                {h.reason && <p className="text-xs text-slate-600 mt-1">{h.reason}</p>}
                                {h.changedBy && (
                                  <p className="text-xs text-slate-400 mt-1">
                                    <ActorName actor={h.changedBy} prefix="by " />
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">No history records found</p>
                          </div>
                        )}
                      </Card>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white dark:bg-slate-800 px-6 py-4 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {history.length} status change{history.length === 1 ? "" : "s"}
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Close
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => {
                            onClose();
                            navigate(`/admin/worker/edit/${worker.id}`);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Edit Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {showScanner && worker && (
        <WorkerFaceScanner
          worker={worker}
          workerName={fullName(worker)}
          reEnroll={!!face}
          onClose={() => setShowScanner(false)}
          onEnrolled={(enrollment) => {
            const updated = { ...worker, faceEnrollment: enrollment };
            setWorker(updated);
            onWorkerChanged?.(updated);
          }}
        />
      )}
    </AnimatePresence>
  );
};

const Badge = ({ meta, label }) => (
  <span className={`inline-flex w-fit px-2.5 py-1 rounded-full text-xs font-medium ${meta?.className || "bg-gray-100 text-gray-700"}`}>
    {label}
  </span>
);

const Card = ({ title, icon, children }) => (
  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
      {icon}
      <span className="ml-2">{title}</span>
    </h4>
    {children}
  </div>
);

const DetailItem = ({ icon, label, value }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
      {icon}
      <span>{label}</span>
    </div>
    <span className="text-slate-900 dark:text-slate-100 font-medium break-words">{value}</span>
  </div>
);

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-all duration-300">
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <div className="text-lg font-medium break-all text-slate-900 dark:text-slate-100">{value}</div>
      </div>
      <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg shrink-0">{icon}</div>
    </div>
  </div>
);

export default WorkerViewModal;
