"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@/lib/navigation";
import { useState } from "react";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import {
  X,
  Building2,
  User,
  Mail,
  Phone,
  Hash,
  ClipboardList,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Trash2,
  Landmark,
  Percent,
  IndianRupee,
  Star,
  Users,
  UserCheck,
  History,
  FileEdit,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from "lucide-react";

const CompanyViewModal = ({
  company,
  isOpen,
  onClose,
  onEdit,
  onToggleStatus,
  onDelete,
}) => {
  const navigate = useNavigate();
  const [expandedHistory, setExpandedHistory] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const { hasPermission } = useAdminPermissions();
  const canEdit = hasPermission("companies", "edit");

  // const formatDate = (dateString) => {
  //   if (!dateString) return "Not Provided";
  //   return new Date(dateString).toLocaleDateString('en-US', {
  //     year: 'numeric',
  //     month: 'long',
  //     day: 'numeric'
  //   });
  // };
  const formatDate = (dateString) => {
    if (!dateString) return "Not Provided";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to safely render industry
  const renderIndustry = () => {
    if (!company.industry) {
      return (
        <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium">
          Not specified
        </span>
      );
    }

    // Check if industry is an array (old structure) or object (new structure)
    if (Array.isArray(company.industry)) {
      return company.industry.map((item, i) => (
        <span
          key={i}
          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
        >
          {typeof item === "string" ? item : item.name || "N/A"}
        </span>
      ));
    } else {
      // It's an object with id and name
      return (
        <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">
          {company.industry.name || "Not specified"}
        </span>
      );
    }
  };

  // Helper function to get industry name for display
  const getIndustryName = () => {
    if (!company.industry) return "Not specified";

    if (Array.isArray(company.industry)) {
      return (
        company.industry[0]?.name || company.industry[0] || "Not specified"
      );
    } else {
      return company.industry.name || "Not specified";
    }
  };

  // Helper function to render rating stars
  const renderRating = () => {
    const rating = company.rating || 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex items-center gap-2">
        <div className="flex">
          {[...Array(5)].map((_, index) => {
            if (index < fullStars) {
              return (
                <Star
                  key={index}
                  className="w-4 h-4 text-amber-500 fill-amber-500"
                />
              );
            } else if (index === fullStars && hasHalfStar) {
              return (
                <Star
                  key={index}
                  className="w-4 h-4 text-amber-500 fill-amber-500"
                />
              );
            } else {
              return <Star key={index} className="w-4 h-4 text-gray-300" />;
            }
          })}
        </div>
        {/* <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {rating.toFixed(1)}
        </span> */}
        {company.review_count && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            ({company.review_count} reviews)
          </span>
        )}
      </div>
    );
  };

  // Function to get actor name
  const getActorName = (actorType, actorId) => {
    switch (actorType) {
      case "admin":
        return `Admin #${actorId}`;
      case "company":
        return `Company #${actorId}`;
      case "worker":
        return `Worker #${actorId}`;
      default:
        return `User #${actorId}`;
    }
  };

  // Function to get action icon and color
  const getActionInfo = (action) => {
    switch (action) {
      case "created":
        return {
          icon: <FileEdit className="w-4 h-4" />,
          color: "text-emerald-600 dark:text-emerald-400",
          bgColor: "bg-emerald-100 dark:bg-emerald-900/20",
          label: "Created",
        };
      case "updated":
        return {
          icon: <RefreshCw className="w-4 h-4" />,
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-100 dark:bg-blue-900/20",
          label: "Updated",
        };
      case "deleted":
        return {
          icon: <Trash2 className="w-4 h-4" />,
          color: "text-rose-600 dark:text-rose-400",
          bgColor: "bg-rose-100 dark:bg-rose-900/20",
          label: "Deleted",
        };
      default:
        return {
          icon: <FileEdit className="w-4 h-4" />,
          color: "text-gray-600 dark:text-gray-400",
          bgColor: "bg-gray-100 dark:bg-gray-900/20",
          label: action,
        };
    }
  };

  // Function to render compact changes summary
  const renderCompactChanges = (changes) => {
    if (!changes || Object.keys(changes).length === 0) return "No changes";

    const changeCount = Object.keys(changes).length;
    if (changeCount === 1) {
      const [field] = Object.keys(changes);
      return `Updated ${field.replace(/_/g, " ")}`;
    }
    return `${changeCount} fields updated`;
  };

  // Function to render history details modal
  const renderHistoryDetails = () => {
    if (!selectedHistory) return null;

    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedHistory(null)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Change Details
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(selectedHistory.performed_at)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedHistory(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="space-y-4">
                {/* Action Info */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div
                    className={`p-2 rounded-lg ${getActionInfo(selectedHistory.action).bgColor}`}
                  >
                    {getActionInfo(selectedHistory.action).icon}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {getActionInfo(selectedHistory.action).label}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      By{" "}
                      {getActorName(
                        selectedHistory.actor_type,
                        selectedHistory.actor_id,
                      )}
                    </p>
                  </div>
                </div>

                {/* Changes */}
                {selectedHistory.changes &&
                Object.keys(selectedHistory.changes).length > 0 ? (
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">
                      Changes ({Object.keys(selectedHistory.changes).length})
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(selectedHistory.changes).map(
                        ([field, change], index) => (
                          <div
                            key={index}
                            className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
                          >
                            <div className="bg-slate-50 dark:bg-slate-700/50 px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                              <span className="font-medium text-sm text-slate-700 dark:text-slate-300 capitalize">
                                {change.field.replace(/_/g, " ")}
                              </span>
                            </div>
                            <div className="divide-y divide-slate-200 dark:divide-slate-700">
                              <div className="px-3 py-2">
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                  Previous Value
                                </div>
                                <div className="text-sm">
                                  {change.old || (
                                    <span className="text-slate-400 italic">
                                      Empty
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="px-3 py-2">
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                  New Value
                                </div>
                                <div className="text-sm">
                                  {change.new || (
                                    <span className="text-slate-400 italic">
                                      Empty
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                    No specific changes recorded
                  </div>
                )}

                {/* Batch Info */}
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Batch ID:{" "}
                  <span className="font-mono">{selectedHistory.batch_id}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && company && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                    <Building2 className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
                      {company.company_code}
                      {" - "}
                      {company.company_name}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {/* Industry display */}
                      <div className="flex items-center gap-2">
                        {/* <Briefcase className="w-3 h-3 text-gray-500" /> */}
                        <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium">
                          {getIndustryName()}
                        </span>
                      </div>

                      {/* Rating display */}
                      {/* {company.rating !== undefined && ( */}
                      {/* <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-lg">
                          <span className="text-xs font-semibold">
                            {company?.rating?.toFixed(1) ?? "—"}
                          </span>
                          <Star className="w-3 h-3" />
                        </div>
                      </div> */}
                      {/* )} */}
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Basic Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Company Details */}
                  <Card
                    title="Company Information"
                    icon={<ClipboardList className="text-indigo-500" />}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DetailItem
                        label="Company Code"
                        value={company.company_code}
                      />
                      <DetailItem label="Email" value={company.email} />
                      <DetailItem label="Phone" value={company.phone || "—"} />
                      <DetailItem
                        label="Status"
                        value={
                          <span
                            className={`inline-flex items-center gap-2 ${
                              company.status
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {company.status ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            {company.status ? "Active" : "Inactive"}
                          </span>
                        }
                      />

                      {/* Address - Moved to Company Information section */}
                      {company.addresses && company.addresses.length > 0 && (
                        <div className="md:col-span-2">
                          <DetailItem
                            label="Working Address"
                            value={
                              <div className="space-y-1">
                                {company.addresses.map((addr, idx) => (
                                  <div
                                    key={idx}
                                    className="text-slate-700 dark:text-slate-300"
                                  >
                                    <p className="font-medium">
                                      {addr.address || "—"}
                                      {addr.address_type && (
                                        <span className="ml-2 text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">
                                          {addr.address_type}
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                      {[
                                        addr.city,
                                        addr.state,
                                        addr.zip,
                                        addr.country,
                                      ]
                                        .filter(Boolean)
                                        .join(", ")}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            }
                          />
                        </div>
                      )}

                      {/* Rating */}
                      {/* <DetailItem
                        label="Rating"
                        value={renderRating()}
                      /> */}
                    </div>
                  </Card>
                  {company.company_owner && (
                    <Card
                      title="Contact Person Details"
                      icon={<User className="text-green-500" />}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DetailItem
                          icon={<User size={16} />}
                          label="Full Name"
                          value={company.company_owner.owner_name}
                        />
                        <DetailItem
                          icon={<Mail size={16} />}
                          label="Email"
                          value={company.company_owner.owner_email}
                        />
                        <DetailItem
                          icon={<Phone size={16} />}
                          label="Phone"
                          value={company.company_owner.owner_phone || "—"}
                        />
                      </div>
                    </Card>
                  )}

                  {/* Tax Information */}
                  <Card
                    title="Legal & Tax Information"
                    icon={<FileText className="text-red-500" />}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DetailItem
                        label="GST Number"
                        value={company.gst_number || "—"}
                      />
                      <DetailItem
                        label="TAN Number"
                        value={company.pan_number || "—"}
                      />
                      <DetailItem
                        label="CIN Number"
                        value={company.tin_number || "—"}
                      />
                    </div>
                  </Card>

                  <Card
                    title="Charges Applied"
                    icon={<Landmark className="text-amber-500" />}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DetailItem
                        label="Service Charge Type"
                        value={company.service_charge_type || "—"}
                      />
                      <DetailItem
                        label="Service Charge"
                        value={company.service_charge || "—"}
                        type={company.service_charge_type}
                        valueIcon={
                          company.service_charge_type === "percentage" ? (
                            <Percent className="w-4 h-4 text-emerald-500" />
                          ) : company.service_charge_type === "fixed" ? (
                            <IndianRupee className="w-4 h-4 text-blue-500" />
                          ) : null
                        }
                      />
                    </div>
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Owner Information */}
                  {/* {company.company_owner && (
                    <Card
                      title="Contact Person Details"
                      icon={<User className="text-green-500" />}
                    >
                      <div className="space-y-3">
                        <DetailItem
                          icon={<User size={16} />}
                          label="Full Name"
                          value={company.company_owner.owner_name}
                        />
                        <DetailItem
                          icon={<Mail size={16} />}
                          label="Email"
                          value={company.company_owner.owner_email}
                        />
                        <DetailItem
                          icon={<Phone size={16} />}
                          label="Phone"
                          value={company.company_owner.owner_phone || "—"}
                        />
                      </div>
                    </Card>
                  )} */}

                  {/* Agent Information */}
                  <Card
                    title="Agent Details"
                    icon={<Users className="text-purple-500" />}
                  >
                    <div className="space-y-4">
                      {company.agent ? (
                        <>
                          <div className="space-y-3">
                            <DetailItem
                              icon={<User size={16} />}
                              label="Agent Name"
                              value={company.agent.agent_name || "—"}
                            />
                            <DetailItem
                              icon={<Mail size={16} />}
                              label="Agent Email"
                              value={company.agent.agent_email || "—"}
                            />
                            <DetailItem
                              icon={<Phone size={16} />}
                              label="Agent Phone"
                              value={company.agent.agent_phone || "—"}
                            />
                            {company.agent.employee_id && (
                              <DetailItem
                                icon={<Hash size={16} />}
                                label="Employee ID"
                                value={company.agent.employee_id}
                              />
                            )}
                          </div>
                          {company.referral_date && (
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-600">
                              <DetailItem
                                icon={<Calendar size={16} />}
                                label="Referred On"
                                value={formatDate(company.referral_date)}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                          <p className="text-slate-500 dark:text-slate-400">
                            No agent assigned
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Relationship Manager Information */}
                  <Card
                    title="Relationship Manager"
                    icon={<UserCheck className="text-cyan-500" />}
                  >
                    <div className="space-y-3">
                      {company.relationship_manager ? (
                        <>
                          <DetailItem
                            icon={<User size={16} />}
                            label="RM Name"
                            value={company.relationship_manager.name || "—"}
                          />
                          <DetailItem
                            icon={<Mail size={16} />}
                            label="RM Email"
                            value={company.relationship_manager.email || "—"}
                          />
                          <DetailItem
                            icon={<Phone size={16} />}
                            label="RM Phone"
                            value={company.relationship_manager.phone || "—"}
                          />
                          {company.relationship_manager.employee_id && (
                            <DetailItem
                              icon={<Hash size={16} />}
                              label="Employee ID"
                              value={company.relationship_manager.staff_code}
                            />
                          )}
                          {company.relationship_manager.department && (
                            <DetailItem
                              icon={<Building2 size={16} />}
                              label="Department"
                              value={company.relationship_manager.department}
                            />
                          )}
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <UserCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                          <p className="text-slate-500 dark:text-slate-400">
                            No RM assigned
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* History Information - Compact Version */}
                  <Card
                    title="Change History"
                    icon={<History className="text-amber-500" />}
                  >
                    <div className="space-y-2">
                      {company.company_history &&
                      company.company_history.length > 0 ? (
                        <>
                          {/* History List */}
                          <div
                            className={`space-y-1 ${expandedHistory ? "" : "max-h-48 overflow-y-auto"}`}
                          >
                            {company.company_history.map(
                              (historyItem, index) => (
                                <motion.div
                                  key={historyItem.batch_id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="group"
                                >
                                  <button
                                    onClick={() =>
                                      setSelectedHistory(historyItem)
                                    }
                                    className="w-full text-left p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors duration-200"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`p-1 rounded ${getActionInfo(historyItem.action).bgColor}`}
                                        >
                                          <div
                                            className={`${getActionInfo(historyItem.action).color}`}
                                          >
                                            {
                                              getActionInfo(historyItem.action)
                                                .icon
                                            }
                                          </div>
                                        </div>
                                        <div className="text-left">
                                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {getActorName(
                                              historyItem.actor_type,
                                              historyItem.actor_id,
                                            )}
                                          </p>
                                          <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {renderCompactChanges(
                                              historyItem.changes,
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {new Date(
                                          historyItem.performed_at,
                                        ).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </button>
                                </motion.div>
                              ),
                            )}
                          </div>

                          {/* Show More/Less Toggle */}
                          {company.company_history.length > 3 && (
                            <button
                              onClick={() =>
                                setExpandedHistory(!expandedHistory)
                              }
                              className="w-full flex items-center justify-center gap-1 p-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            >
                              {expandedHistory ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  Show More ({
                                    company.company_history.length
                                  }{" "}
                                  records)
                                </>
                              )}
                            </button>
                          )}

                          {/* Summary */}
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-slate-600 dark:text-slate-400">
                                Total records:
                              </span>
                              <span className="font-medium">
                                {company.company_history.length}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-400">
                                Last updated:
                              </span>
                              <span className="font-medium">
                                {formatDate(
                                  company.company_history[0]?.performed_at,
                                )}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <History className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            No history records found
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Quick Summary */}
                  <Card
                    title="Quick Summary"
                    icon={<TrendingUp className="text-green-500" />}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Last Updated
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {formatDate(company.updated_at)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Created On
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {formatDate(company.created_at)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Location
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {company.addresses?.[0]?.city || "—"},{" "}
                          {company.addresses?.[0]?.state || ""}
                        </span>
                      </div>
                      {company.addresses?.[0]?.zip && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            ZIP Code
                          </span>
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {company.addresses[0]?.zip || "—"}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-800 px-6 py-4 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Last updated: {formatDate(company.updated_at)}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
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
          </motion.div>
        </div>
      )}
      {/* History Details Modal */}
      {selectedHistory && renderHistoryDetails()}
    </AnimatePresence>
  );
};

// Reusable Components
const Card = ({ title, icon, children }) => (
  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
      {icon}
      <span className="ml-2">{title}</span>
    </h4>
    {children}
  </div>
);

const DetailItem = ({ icon, label, value, type, valueIcon }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
      {icon}
      <span>{label}</span>
    </div>
    {type === "fixed" ? (
      <span
        className={`flex items-center gap-0 text-slate-900 dark:text-slate-100 font-medium ${
          label !== "Email" ? "capitalize" : ""
        } `}
      >
        {valueIcon && valueIcon}
        {value}
      </span>
    ) : (
      <span
        className={`flex items-center gap-0 text-slate-900 dark:text-slate-100 font-medium ${
          label !== "Email" ? "capitalize" : ""
        } `}
      >
        {value}
        {valueIcon && valueIcon}
      </span>
    )}
  </div>
);

export default CompanyViewModal;
