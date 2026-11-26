"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Building2,
  Mail,
  User,
  Calendar,
  FileText,
  Activity,
  History,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Loader2,
  Factory,
  CreditCard,
  Barcode,
  FileCheck,
} from "lucide-react";
import { useNavigate } from "@/lib/navigation";
import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import {
  getCompanyAPI,
  getCompanyStatusHistoryAPI,
  verifyCompanyGstAPI,
  changeCompanyStatusAPI,
} from "../../../../api/adminV1/companyAPI";
import { apiError } from "../../../../api/javaApi";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import { useGeoNames } from "../../adminhooks/useGeoNames";
import { formatDate, asList } from "../../utils/workerUtils";
import {
  COMPANY_STATUS_META,
  companyStatusLabel,
  statusActions,
  confirmCompanyStatus,
} from "../../utils/companyUtils";
import CompanyAddressList from "./CompanyAddressList";
import ActorName from "../ActorName";

const CompanyViewModal = ({ companyId, isOpen, onClose, onCompanyChanged, industries = [] }) => {
  const navigate = useNavigate();
  const { hasPermission } = useAdminPermissions();
  const canEdit = hasPermission("company", "edit");
  const canManageStatus = hasPermission("company", "manage_status");

  const [company, setCompany] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const geo = useGeoNames((company?.addresses || []).map((a) => a.stateId));

  const loadHistory = useCallback(async () => {
    try {
      const h = await getCompanyStatusHistoryAPI(companyId, { size: 50 });
      setHistory(h?.content || []);
    } catch {
      setHistory([]);
    }
  }, [companyId]);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [c] = await Promise.all([getCompanyAPI(companyId), loadHistory()]);
      setCompany(c);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Could not load company", text: apiError(error).message });
      onClose();
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, loadHistory]);

  useEffect(() => {
    if (isOpen && companyId) {
      setCompany(null);
      setHistory([]);
      load();
    }
  }, [isOpen, companyId, load]);

  const handleVerifyGst = async () => {
    setVerifying(true);
    try {
      const updated = await verifyCompanyGstAPI(company.id);
      setCompany(updated);
      onCompanyChanged?.(updated);
      Swal.fire({ icon: "success", title: "GST verified", timer: 1600, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: "error", title: "GST verification failed", text: apiError(error).message });
    } finally {
      setVerifying(false);
    }
  };

  const handleStatus = async (action) => {
    const confirmed = await confirmCompanyStatus({ status: action.status, label: action.label });
    if (!confirmed) return;
    setChangingStatus(true);
    try {
      const updated = await changeCompanyStatusAPI(company.id, action.status, confirmed.reason);
      setCompany(updated);
      onCompanyChanged?.(updated);
      loadHistory();
      Swal.fire({ icon: "success", title: "Status updated", timer: 1500, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Could not change status", text: apiError(error).message });
    } finally {
      setChangingStatus(false);
    }
  };

  const industryName = asList(industries).find((i) => i.id === company?.industryId)?.name;
  const actions = canManageStatus && company ? statusActions(company.status) : [];

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
            {loading || !company ? (
              <div className="p-16 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 rounded-t-2xl z-10">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className="w-14 h-14 shrink-0 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
                          {company.name} - {company.companyCode}
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
                      icon={<User className="text-blue-500" />}
                      label="Owner"
                      value={company.owner?.name || "Not Provided"}
                    />
                    <StatCard
                      icon={<Mail className="text-green-500" />}
                      label="Owner Email"
                      value={company.owner?.email || "Not Provided"}
                    />
                    <StatCard
                      icon={
                        company.gstVerifiedAt ? (
                          <ShieldCheck className="text-green-500" />
                        ) : (
                          <ShieldAlert className="text-amber-500" />
                        )
                      }
                      label="GST"
                      value={
                        <Badge
                          className={company.gstVerifiedAt ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                          label={company.gstVerifiedAt ? "Verified" : company.gstNumber ? "Not Verified" : "Not Provided"}
                        />
                      }
                    />
                    <StatCard
                      icon={<Activity className="text-purple-500" />}
                      label="Status"
                      value={
                        <span className="flex flex-col gap-1">
                          <Badge
                            className={COMPANY_STATUS_META[company.status]?.className}
                            label={companyStatusLabel(company.status)}
                          />
                          {company.statusReason && (
                            <span className="text-xs font-normal text-slate-500">{company.statusReason}</span>
                          )}
                        </span>
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column */}
                    <div className="lg:col-span-2 space-y-6">
                      <Card title="Company Information" icon={<Building2 className="text-indigo-500" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <DetailItem icon={<Building2 size={16} />} label="Company Name" value={company.name} />
                          <DetailItem icon={<Barcode size={16} />} label="Company Code" value={company.companyCode} />
                          <DetailItem icon={<Factory size={16} />} label="Industry" value={industryName || "—"} />
                          <DetailItem
                            icon={<Calendar size={16} />}
                            label="Created On"
                            value={formatDate(company.createdAt, true)}
                          />
                        </div>
                      </Card>

                      <Card title="Tax Details" icon={<FileText className="text-blue-500" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <DetailItem
                            icon={<FileText size={16} />}
                            label="GST Number"
                            value={company.gstNumber || "Not Provided"}
                          />
                          <DetailItem
                            icon={<CreditCard size={16} />}
                            label="PAN Number"
                            value={company.panNumber || "Not Provided"}
                          />
                          <DetailItem
                            icon={<ShieldCheck size={16} />}
                            label="GST Verified On"
                            value={company.gstVerifiedAt ? formatDate(company.gstVerifiedAt, true) : "Not verified"}
                          />
                          <DetailItem
                            icon={<FileCheck size={16} />}
                            label="Verification Reference"
                            value={company.gstVerificationRef || "—"}
                          />
                        </div>
                        {canEdit && company.gstNumber && (
                          <button
                            onClick={handleVerifyGst}
                            disabled={verifying}
                            className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                          >
                            {verifying ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                            {company.gstVerifiedAt ? "Re-verify GST" : "Verify GST"}
                          </button>
                        )}
                      </Card>

                      <Card title="Addresses" icon={<MapPin className="text-rose-500" />}>
                        <CompanyAddressList addresses={company.addresses || []} geo={geo} editable={false} />
                      </Card>
                    </div>

                    {/* Right column */}
                    <div className="space-y-6">
                      {actions.length > 0 && (
                        <Card title="Change Status" icon={<Activity className="text-purple-500" />}>
                          <div className="flex flex-wrap gap-2">
                            {actions.map((action) => (
                              <button
                                key={action.status}
                                onClick={() => handleStatus(action)}
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
                            Suspending or rejecting logs out all of the company's users and blocks their login.
                          </p>
                        </Card>
                      )}

                      <Card title="Status History" icon={<History className="text-amber-500" />}>
                        {history.length ? (
                          <div className="space-y-2 max-h-72 overflow-y-auto">
                            {history.map((h) => (
                              <div
                                key={h.id}
                                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    {h.fromStatus ? `${companyStatusLabel(h.fromStatus)} → ` : ""}
                                    {companyStatusLabel(h.toStatus)}
                                  </span>
                                  <span className="text-xs text-slate-500 whitespace-nowrap">{formatDate(h.changedAt)}</span>
                                </div>
                                {h.reason && <p className="text-xs text-slate-600 mt-1">{h.reason}</p>}
                                {(h.changedBy || h.changedByAdminEmail) && (
                                  <p className="text-xs text-slate-400 mt-1">
                                    <ActorName actor={h.changedBy || h.changedByAdminEmail} prefix="by " />
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
                      {(company.addresses || []).length} address{(company.addresses || []).length === 1 ? "" : "es"}
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
                            navigate(`/admin/company/edit/${company.id}`);
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
    </AnimatePresence>
  );
};

const Badge = ({ className, label }) => (
  <span className={`inline-flex w-fit px-2.5 py-1 rounded-full text-xs font-medium ${className || "bg-gray-100 text-gray-700"}`}>
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

export default CompanyViewModal;
