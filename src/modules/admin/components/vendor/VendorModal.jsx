"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  X,
  Users,
  Mail,
  Phone,
  MapPin,
  Edit2,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  Hash,
  Building2,
  ClipboardList,
  FileText,
  Shield,
  User,
} from "lucide-react";

const VendorModal = ({ vendor, isOpen, onClose, onEdit, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "Not Provided";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      setIsDeleting(true);
      try {
        await onDelete();
        onClose();
      } catch (error) {
        console.error("Error deleting vendor:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && vendor && (
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
            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                    <Users className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
                      {/* {vendor.vendor_code} */}
                      {/* {" - "} */}
                      {vendor.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2"></div>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-6">
                  {/* Vendor Details */}
                  <Card
                    title="Vendor Information"
                    icon={<ClipboardList className="text-blue-500" />}
                  >
                    <div className="space-y-4">
                      <DetailItem
                        icon={<Hash className="w-4 h-4" />}
                        label="Vendor ID"
                        value={vendor.id}
                      />
                      <DetailItem
                        icon={<ClipboardList className="w-4 h-4" />}
                        label="Vendor Code"
                        value={vendor.vendor_code}
                      />
                      <DetailItem
                        icon={<Shield className="w-4 h-4" />}
                        label="Status"
                        value={
                          <span
                            className={`inline-flex items-center gap-2 ${
                              vendor.status === 1
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {vendor.status === 1 ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            {vendor.status === 1 ? "Active" : "Inactive"}
                          </span>
                        }
                      />
                    </div>
                  </Card>

                  {/* Contact Information */}
                  <Card
                    title="Contact Information"
                    icon={<User className="text-green-500" />}
                  >
                    <div className="space-y-4">
                      <DetailItem
                        icon={<Mail className="w-4 h-4" />}
                        label="Email Address"
                        value={
                          <a
                            href={`mailto:${vendor.email}`}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          >
                            {vendor.email}
                          </a>
                        }
                      />
                      <DetailItem
                        icon={<Phone className="w-4 h-4" />}
                        label="Phone Number"
                        value={
                          vendor.phone ? (
                            <a
                              href={`tel:${vendor.phone}`}
                              className="text-slate-900 dark:text-slate-100 hover:text-blue-600 transition-colors"
                            >
                              {vendor.phone}
                            </a>
                          ) : (
                            "Not Provided"
                          )
                        }
                      />
                    </div>
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Location Information */}
                  <Card
                    title="Location Information"
                    icon={<MapPin className="text-orange-500" />}
                  >
                    <div className="space-y-4">
                      <DetailItem
                        icon={<MapPin className="w-4 h-4" />}
                        label="Location"
                        value={vendor.location || "Not Provided"}
                      />
                      {vendor.address && (
                        <DetailItem
                          icon={<Building2 className="w-4 h-4" />}
                          label="Address"
                          value={vendor.address}
                        />
                      )}
                    </div>
                  </Card>

                  {/* System Information */}
                  <Card
                    title="System Information"
                    icon={<FileText className="text-purple-500" />}
                  >
                    <div className="space-y-4">
                      <DetailItem
                        icon={<Calendar className="w-4 h-4" />}
                        label="Date Created"
                        value={
                          <div className="flex flex-col gap-1">
                            <span>{formatDate(vendor.created_at)}</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              {formatTime(vendor.created_at)}
                            </span>
                          </div>
                        }
                      />
                      {vendor.updated_at &&
                        vendor.updated_at !== vendor.created_at && (
                          <DetailItem
                            icon={<Clock className="w-4 h-4" />}
                            label="Last Updated"
                            value={
                              <div className="flex flex-col gap-1">
                                <span>{formatDate(vendor.updated_at)}</span>
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                  {formatTime(vendor.updated_at)}
                                </span>
                              </div>
                            }
                          />
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
                  {vendor.updated_at && vendor.updated_at !== vendor.created_at
                    ? `Last updated: ${formatDate(vendor.updated_at)}`
                    : `Created on: ${formatDate(vendor.created_at)}`}
                </div>
                <div className="flex space-x-3">
                  {/* {onDelete && (
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 ${
                        isDeleting ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {isDeleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Delete Vendor
                        </>
                      )}
                    </button>
                  )} */}
                  {onEdit && (
                    <button
                      onClick={onEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Details
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  >
                    Close
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

// Reusable Components (same as CompanyViewModal)
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
    <div className="text-slate-900 dark:text-slate-100 font-medium">
      {value}
    </div>
  </div>
);

export default VendorModal;
