"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Fingerprint,
  FileText,
  Home,
  Briefcase,
  Users,
  Shield,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "@/lib/navigation";

const ViewAgentModal = ({ agent, isOpen, onClose }) => {
  const navigate = useNavigate();
  if (!agent) return null;

  const formatDate = (date) => {
    if (!date) return "Not Provided";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const fullName = [agent.first_name, agent.middle_name, agent.last_name]
    .filter(Boolean)
    .join(" ");

  const getChargeTypeLabel = (type) => {
    if (type === "percentage") return "Percentage (%)";
    if (type === "fixed") return "Fixed (₹)";
    return type || "Not Provided";
  };

  const formatCharge = (value, type) => {
    if (!value && value !== 0) return "Not Provided";
    if (type === "percentage") return `${value}%`;
    return `₹${value}`;
  };

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
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-200 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {fullName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          agent.status === 1
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {agent.status === 1 ? "Active" : "Inactive"}
                      </span>
                      {agent.agent_code && (
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Code: {agent.agent_code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Personal Details */}
              <Card
                title="Personal Details"
                icon={<User className="text-indigo-500" />}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem
                    icon={<User size={16} />}
                    label="Full Name"
                    value={fullName}
                  />
                  <DetailItem
                    icon={<Mail size={16} />}
                    label="Email"
                    value={agent.email || "Not Provided"}
                  />
                  <DetailItem
                    icon={<Phone size={16} />}
                    label="Phone"
                    value={agent.phone || "Not Provided"}
                  />
                  <DetailItem
                    icon={<Users size={16} />}
                    label="Gender"
                    value={agent.gender || "Not Provided"}
                  />
                  <DetailItem
                    icon={<Calendar size={16} />}
                    label="Date of Birth"
                    value={formatDate(agent.date_of_birth)}
                  />
                  {/* <DetailItem icon={<Calendar size={16} />} label="Date of Joining" value={formatDate(agent.date_of_joining)} /> */}
                  <DetailItem
                    icon={<Users size={16} />}
                    label="Father's Name"
                    value={agent.father_name || "Not Provided"}
                  />
                </div>
              </Card>

              {/* Address Details */}
              <Card
                title="Address Details"
                icon={<Home className="text-green-500" />}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem
                    icon={<MapPin size={16} />}
                    label="Location"
                    value={agent.agent_location || "Not Provided"}
                  />
                  <DetailItem
                    icon={<MapPin size={16} />}
                    label="State"
                    value={agent.state_name || "Not Provided"}
                  />
                  <DetailItem
                    icon={<MapPin size={16} />}
                    label="City"
                    value={agent.city_name || "Not Provided"}
                  />
                </div>
              </Card>

              {/* Working Details (NEW) */}
              <Card
                title="Working Details"
                icon={<Briefcase className="text-amber-500" />}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem
                    icon={<MapPin size={16} />}
                    label="Work Location"
                    value={agent.work_location || "Not Provided"}
                  />
                  <DetailItem
                    icon={<MapPin size={16} />}
                    label="Current State"
                    value={agent.current_state_name || "Not Provided"}
                  />
                  <DetailItem
                    icon={<MapPin size={16} />}
                    label="Current City"
                    value={agent.current_city_name || "Not Provided"}
                  />
                  <DetailItem
                    icon={<Briefcase size={16} />}
                    label="Work Experience"
                    value={
                      agent.work_experience
                        ? `${agent.work_experience} years`
                        : "Not Provided"
                    }
                  />
                  <DetailItem
                    icon={<User size={16} />}
                    label="Dress Size"
                    value={agent.dress_size || "Not Provided"}
                  />
                </div>
              </Card>

              {/* KYC Details */}
              <Card
                title="KYC Details"
                icon={<Shield className="text-orange-500" />}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem
                    icon={<Fingerprint size={16} />}
                    label="Aadhar Number"
                    value={agent.aadhar_number || "Not Provided"}
                  />
                  <DetailItem
                    icon={<FileText size={16} />}
                    label="PAN Number"
                    value={agent.pan_number || "Not Provided"}
                  />
                </div>
              </Card>

              {/* Compensation Details */}
              <Card
                title="Onboarding Commissions"
                icon={<DollarSign className="text-emerald-500" />}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem
                    label="Company Onboarding Commission"
                    value={formatCharge(
                      agent.agent_charge,
                      agent.agent_charge_type,
                    )}
                  />
                  <DetailItem
                    label="Company Commission Type"
                    value={getChargeTypeLabel(agent.agent_charge_type)}
                  />
                  <DetailItem
                    label="Worker Onboarding Commission"
                    value={formatCharge(
                      agent.worker_charge,
                      agent.worker_charge_type,
                    )}
                  />
                  <DetailItem
                    label="Worker  Commission Type"
                    value={getChargeTypeLabel(agent.worker_charge_type)}
                  />
                </div>
              </Card>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-200 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  Last updated: {formatDate(agent.updated_at)}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/admin/agent/edit/${agent.id}`);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Edit Details
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Reusable components
const Card = ({ title, icon, children }) => (
  <div className="bg-slate-50 rounded-xl p-6">
    <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
      {icon}
      <span>{title}</span>
    </h4>
    {children}
  </div>
);

const DetailItem = ({ icon, label, value }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2 text-sm text-slate-600">
      {icon}
      <span>{label}</span>
    </div>
    <span className="text-slate-900 font-medium break-words">{value}</span>
  </div>
);

export default ViewAgentModal;
