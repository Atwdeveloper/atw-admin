"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
  Building,
  Briefcase,
  FileText,
  Shield,
  CreditCard,
  Banknote,
  Home,
  Users,
  Package,
  Activity,
  IndianRupee,
  Trash2,
  Gift,
  TrendingUp,
  Star,
  Shirt,
  Clock,
  History,
  ChevronDown,
  ChevronUp,
  FileEdit,
  RefreshCw,
  Building2,
  Wrench,
} from "lucide-react";
import { useNavigate } from "@/lib/navigation";
import { useState } from "react";

const WorkerViewModal = ({
  worker,
  isOpen,
  onClose,
  onEdit,
  onToggleStatus,
  onDelete,
  canViewWallet,
}) => {
  const navigate = useNavigate();
  const [expandedHistory, setExpandedHistory] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);

  if (!worker) return null;

  // Helper function to format date
  const formatDate = (dateString, emptyLabel = "Not Provided") => {
    if (!dateString) return emptyLabel;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Date-only variant (no time) — for pure dates like Date of Birth, where a
  // time component is meaningless noise rather than useful information.
  const formatDateOnly = (dateString, emptyLabel = "Not Provided") => {
    if (!dateString) return emptyLabel;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to format currency
  const formatCurrency = (amount, bonusType = null) => {
    if (!amount) return "Not Provided";

    if (bonusType === "percentage") {
      return `${parseFloat(amount).toFixed(2)}%`;
    }

    if (bonusType === "amount") {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderRating = () => {
    const rating = worker.average_rating || 0;

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

        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {Number(rating).toFixed(1)}
        </span>

        {worker.review_count > 0 && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            ({worker.review_count} reviews)
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
                                {field
                                  .replace(/_id$/i, "")
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (char) =>
                                    char.toUpperCase(),
                                  )}
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
      {isOpen && worker && (
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
            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    {(worker.enroll_image || worker.photo) && (
                      <img
                        src={worker.enroll_image || worker.photo}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {[worker.first_name, worker.middle_name, worker.last_name]
                        .filter(Boolean)
                        .join(" ")}
                      {worker.worker_code ? ` - ${worker.worker_code}` : ""}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium">
                        {worker.industry}
                      </span>
                    </div>
                    {worker.rating !== undefined && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-lg">
                          <Star className="w-3 h-3" />
                          <span className="text-xs font-semibold">
                            {worker.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )}
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
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                  icon={<Mail className="text-blue-500" />}
                  label="Work Email"
                  value={worker.work_email || "Not Provided"}
                />
                <StatCard
                  icon={<Phone className="text-green-500" />}
                  label="Mobile"
                  value={worker.mobile_number || "Not Provided"}
                />
                <StatCard
                  icon={<IndianRupee className="text-amber-500" />}
                  label="Wallet Balance"
                  value={
                    canViewWallet ? (
                      <button
                        onClick={() =>
                          navigate(`/admin/worker/wallet/${worker.id}`)
                        }
                        className="text-amber-600 font-bold hover:underline"
                      >
                        {worker.wallet_balance || "0.00"}
                      </button>
                    ) : (
                      <span>{worker.wallet_balance || "0.00"}</span>
                    )
                  }
                />
                <StatCard
                  icon={<Activity className="text-purple-500" />}
                  label="Status"
                  value={worker.status === "active" ? "Active" : "Inactive"}
                  status={worker.status === "active"}
                />
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Basic Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information */}
                  <Card
                    title="Basic Information"
                    icon={<User className="text-indigo-500" />}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DetailItem
                        icon={<User size={16} />}
                        label="Full Name"
                        value={[
                          worker.first_name,
                          worker.middle_name,
                          worker.last_name,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      />
                      <DetailItem
                        icon={<Hash size={16} />}
                        label="Employee Code"
                        value={worker.worker_code || "Not Provided"}
                      />
                      <DetailItem
                        icon={<Calendar size={16} />}
                        label="Date of Registration"
                        value={formatDate(worker.created_at)}
                      />
                      <DetailItem
                        icon={<Calendar size={16} />}
                        label="Date of Joining"
                        value={formatDate(worker.date_of_joining, "Not yet joined")}
                      />
                      <DetailItem
                        icon={<Calendar size={16} />}
                        label="Date of Birth"
                        value={formatDateOnly(worker.date_of_birth)}
                      />
                      <DetailItem
                        icon={<Users size={16} />}
                        label="Gender"
                        value={worker.gender || "Not Provided"}
                      />
                      {/* <DetailItem
                        icon={<MapPin size={16} />}
                        label="Work Location"
                        value={worker.work_location || "Not Provided"}
                      /> */}
                      {/* Designation(s) - chips when there's more than one,
                          same pattern as Skills below. Falls back to the
                          older single `designation` string if the backend
                          hasn't been updated to send an array yet. */}
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                          <Briefcase size={16} />
                          <span>Designation</span>
                        </div>
                        {worker.designations && worker.designations.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {worker.designations.map((designation) => (
                              <span
                                key={designation.id}
                                className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium"
                              >
                                {designation.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-900 dark:text-slate-100 font-medium">
                            {worker.designation || "Not Provided"}
                          </span>
                        )}
                      </div>
                      {/* Skills - rendered as chips since it's an array */}
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                          <Wrench size={16} />
                          <span>Skills</span>
                        </div>
                        {worker.skills && worker.skills.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {worker.skills.map((skill) => (
                              <span
                                key={skill.id}
                                className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium"
                              >
                                {skill.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-900 dark:text-slate-100 font-medium">
                            Not Provided
                          </span>
                        )}
                      </div>
                      <DetailItem
                        icon={<Clock size={16} />}
                        label="Work Experience"
                        value={
                          worker.work_experience
                            ? `${worker.work_experience} ${
                                worker.work_experience === 1 ? "year" : "years"
                              }`
                            : "Not Provided"
                        }
                      />
                      <DetailItem
                        icon={<Shirt size={16} />}
                        label="Dress Size"
                        value={worker.dress_size || "Not Provided"}
                      />
                      <DetailItem label="Rating" value={renderRating()} />
                      <DetailItem
                        label="Last Working Day"
                        value={new Date().toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      />
                    </div>
                  </Card>

                  {/* Personal Details */}
                  <Card
                    title="Personal Details"
                    icon={<Home className="text-blue-500" />}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DetailItem
                        icon={<Users size={16} />}
                        label="Father's Name"
                        value={worker.father_name || "Not Provided"}
                      />
                      <DetailItem
                        icon={<FileText size={16} />}
                        label="PAN Number"
                        value={worker.pan_number || "Not Provided"}
                      />
                      <DetailItem
                        icon={<Hash size={16} />}
                        label="Aadhaar Number"
                        value={worker.aadhar_number || "Not Provided"}
                      />
                      <DetailItem
                        icon={<MapPin size={16} />}
                        label="Location"
                        value={
                          worker.city_name && worker.state_name
                            ? `${worker.city_name}, ${worker.state_name}`
                            : worker.city_name ||
                              worker.state_name ||
                              "Not Provided"
                        }
                      />{" "}
                      <div className="md:col-span-2">
                        <DetailItem
                          icon={<MapPin size={16} />}
                          label="Residential Address"
                          value={worker.address || "Not Provided"}
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Statutory Information */}
                  <Card
                    title="Statutory Information"
                    icon={<Shield className="text-orange-500" />}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DetailItem
                        icon={<Hash size={16} />}
                        label="UAN Number"
                        value={worker.uan_number || "Not Provided"}
                      />
                      <DetailItem
                        icon={<Hash size={16} />}
                        label="ESIC Number"
                        value={worker.esic_number || "Not Provided"}
                      />

                      {worker.bonus_type && worker.statutory_bonus && (
                        <DetailItem
                          icon={<Gift size={16} />}
                          label="Statutory Bonus"
                          value={`${formatCurrency(
                            worker.statutory_bonus,
                            worker.bonus_type,
                          )} ${
                            worker.bonus_frequency
                              ? ` (${
                                  worker.bonus_frequency
                                    .charAt(0)
                                    .toUpperCase() +
                                  worker.bonus_frequency.slice(1)
                                })`
                              : ""
                          }`}
                        />
                      )}
                    </div>
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Agent Information */}
                  {worker.agent_code && (
                    <Card
                      title="Agent Information"
                      icon={<Users className="text-indigo-500" />}
                    >
                      <div className="space-y-3">
                        <DetailItem
                          icon={<Hash size={16} />}
                          label="Agent Code"
                          value={worker.agent_code || "Not Provided"}
                        />
                        <DetailItem
                          icon={<User size={16} />}
                          label="Agent Name"
                          value={worker.agent_name || "Not Provided"}
                        />
                        <DetailItem
                          icon={<Mail size={16} />}
                          label="Agent Email"
                          value={worker.agent_email || "Not Provided"}
                        />
                        <DetailItem
                          icon={<Phone size={16} />}
                          label="Agent Mobile"
                          value={worker.agent_mobile || "Not Provided"}
                        />
                      </div>
                    </Card>
                  )}

                  {/* Working Address Card - NEW */}
                  {(worker.working_address ||
                    worker.working_zip ||
                    worker.current_state_id ||
                    worker.current_city_id) && (
                    <Card
                      title="Working Address"
                      icon={<MapPin className="text-teal-500" />}
                    >
                      <div className="space-y-3">
                        <DetailItem
                          icon={<MapPin size={16} />}
                          label="Working State"
                          value={
                            worker.current_state_name ||
                            (worker.current_state_id
                              ? `ID: ${worker.current_state_id}`
                              : "Not Provided")
                          }
                        />
                        <DetailItem
                          icon={<Building2 size={16} />}
                          label="Working City"
                          value={
                            worker.current_city_name ||
                            (worker.current_city_id
                              ? `ID: ${worker.current_city_id}`
                              : "Not Provided")
                          }
                        />
                        <DetailItem
                          icon={<Home size={16} />}
                          label="Working Address"
                          value={worker.working_address || "Not Provided"}
                        />
                        <DetailItem
                          icon={<Hash size={16} />}
                          label="Working Zip Code"
                          value={worker.working_zip || "Not Provided"}
                        />
                      </div>
                    </Card>
                  )}

                  {/* Reporting Manager Card - NEW */}
                  {worker.staff && (
                    <Card
                      title="Reporting Manager"
                      icon={<Users className="text-indigo-500" />}
                    >
                      <div className="space-y-3">
                        <DetailItem
                          icon={<User size={16} />}
                          label="Name"
                          value={worker.staff.name || "Not Provided"}
                        />
                        <DetailItem
                          icon={<Mail size={16} />}
                          label="Email"
                          value={worker.staff.email || "Not Provided"}
                        />
                        <DetailItem
                          icon={<Phone size={16} />}
                          label="Phone"
                          value={worker.staff.phone || "Not Provided"}
                        />
                        <DetailItem
                          icon={<Hash size={16} />}
                          label="Staff Code"
                          value={worker.staff.staff_code || "Not Provided"}
                        />
                      </div>
                    </Card>
                  )}

                  {/* Payment Information */}
                  <Card
                    title="Payment Information"
                    icon={<CreditCard className="text-purple-500" />}
                  >
                    <div className="space-y-3">
                      <DetailItem
                        icon={<Banknote size={16} />}
                        label="Payment Method"
                        value="Bank Transfer"
                      />

                      <>
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold text-slate-700 mb-2">
                            Primary Account Details
                          </h4>
                        </div>
                        <DetailItem
                          icon={<User size={16} />}
                          label="Account Holder"
                          value={worker.account_holder_name || "Not Provided"}
                        />
                        <DetailItem
                          icon={<Building size={16} />}
                          label="Bank Name"
                          value={worker.bank_name || "Not Provided"}
                        />
                        <DetailItem
                          icon={<CreditCard size={16} />}
                          label="Account Number"
                          value={
                            worker.account_number
                              ? `${worker.account_number}`
                              : "Not Provided"
                          }
                        />
                        <DetailItem
                          icon={<Hash size={16} />}
                          label="IFSC Code"
                          value={worker.ifsc_code || "Not Provided"}
                        />
                        <DetailItem
                          icon={<Package size={16} />}
                          label="Account Type"
                          value={
                            worker.account_type
                              ? worker.account_type.charAt(0).toUpperCase() +
                                worker.account_type.slice(1)
                              : "Not Provided"
                          }
                        />
                      </>
                    </div>
                  </Card>

                  {/* History Information - Compact Version */}
                  <Card
                    title="Change History"
                    icon={<History className="text-amber-500" />}
                  >
                    <div className="space-y-2">
                      {worker.worker_history &&
                      worker.worker_history.length > 0 ? (
                        <>
                          {/* History List */}
                          <div
                            className={`space-y-1 ${expandedHistory ? "" : "max-h-48 overflow-y-auto"}`}
                          >
                            {worker.worker_history.map((historyItem, index) => (
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
                            ))}
                          </div>

                          {/* Show More/Less Toggle */}
                          {worker.worker_history.length > 3 && (
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
                                  Show More ({worker.worker_history.length}{" "}
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
                                {worker.worker_history.length}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-400">
                                Last updated:
                              </span>
                              <span className="font-medium">
                                {formatDate(
                                  worker.worker_history[0]?.performed_at,
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
                          {formatDate(worker.updated_at)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Created On
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {formatDate(worker.created_at)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Location
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {worker.city_name}, {worker.state_name}
                        </span>
                      </div>
                      {worker.zip && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            ZIP Code
                          </span>
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {worker.zip}
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
                  Showing {worker.worker_history?.length || 0} history records
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/admin/worker/edit/${worker.id}`);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Details
                  </button>
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

const DetailItem = ({ icon, label, value }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
      {icon}
      <span>{label}</span>
    </div>
    <span className="text-slate-900 dark:text-slate-100 font-medium break-words">
      {value}
    </span>
  </div>
);

const StatCard = ({ icon, label, value, status }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
          {label}
        </p>
        <p
          className={`text-lg font-medium break-all ${
            status !== undefined
              ? status
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
              : "text-slate-900 dark:text-slate-100"
          }`}
        >
          {value}
        </p>
      </div>
      <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
        {icon}
      </div>
    </div>
  </div>
);

export default WorkerViewModal;
