"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  MapPin,
  Briefcase,
  CreditCard,
  Shield,
  Hash,
  Home,
  FileText,
  Star,
} from "lucide-react";

const VacancyWorkerView = ({ worker, isOpen, onClose }) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const averageRating = worker.averageRating || 0;
  const feedbackComments = worker.feedbackComments || [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Worker Profile</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* Header with photo */}
            <div className="flex flex-col sm:flex-row gap-6 mb-8">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                  {worker.photo ? (
                    <img
                      src={worker.photo}
                      alt={worker.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    worker.fullName.charAt(0).toUpperCase()
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {worker.fullName}
                </h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Hash size={16} className="text-gray-400" />
                    <span className="text-gray-600">
                      Worker Code: {worker.workerCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home size={16} className="text-gray-400" />
                    <span className="text-gray-600">{worker.industry}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className="text-gray-400" />
                    <span className="text-gray-600">{worker.designation}</span>
                  </div>
                </div>

                {/* Rating and Feedback Section */}
                <div
                  className="relative mt-2 inline-flex items-center gap-1"
                  onMouseEnter={() => setShowFeedback(true)}
                  onMouseLeave={() => setShowFeedback(false)}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      className={`${
                        star <= averageRating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-sm font-medium text-gray-700 ml-1">
                    {averageRating > 0 ? averageRating.toFixed(1) : "No rating"}
                  </span>
                  {showFeedback && feedbackComments.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute bottom-full left-0 mb-2 w-48 bg-gray-800 text-white text-xs rounded-lg p-3 shadow-lg z-10"
                    >
                      <p className="font-semibold mb-1">Feedback:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {feedbackComments.map((comment, idx) => (
                          <li key={idx}>{comment}</li>
                        ))}
                      </ul>
                      <div className="absolute top-full left-4 w-2 h-2 bg-gray-800 transform rotate-45 -mt-1"></div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            {/* <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User size={18} className="text-blue-600" />
                Contact Information
              </h3>
       
            </div> */}

            {/* Personal Details */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DetailItem
                  label="Date of Birth"
                  value={formatDate(worker.personal?.date_of_birth)}
                />
                <DetailItem
                  label="Father's Name"
                  value={worker.personal?.father_name}
                />
                <DetailItem
                  label="PAN Number"
                  value={worker.personal?.pan_number}
                />
                <DetailItem
                  label="Aadhar Number"
                  value={worker.personal?.aadhar_number || "N/A"}
                />
                <DetailItem
                  label="Dress Size"
                  value={worker.personal?.dress_size || "N/A"}
                />
                <DetailItem label="Address" value={worker.personal?.address} />
                <DetailItem label="City" value={worker.personal?.city} />
                <DetailItem label="State" value={worker.personal?.state} />
                <DetailItem label="ZIP" value={worker.personal?.zip} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar size={18} className="text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">Experience</p>
                    <p className="font-medium">
                      {worker.experience || "0"} years
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            {worker.payment && Object.keys(worker.payment).length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard size={18} className="text-green-600" />
                  Payment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem
                    label="Payment Method"
                    value={worker.payment.payment_method}
                  />
                  <DetailItem
                    label="Account Holder"
                    value={worker.payment.account_holder_name}
                  />
                  <DetailItem
                    label="Bank Name"
                    value={worker.payment.bank_name}
                  />
                  <DetailItem
                    label="Account Number"
                    value={worker.payment.account_number}
                  />
                  <DetailItem
                    label="IFSC Code"
                    value={worker.payment.ifsc_code}
                  />
                  <DetailItem
                    label="Account Type"
                    value={worker.payment.account_type}
                  />
                </div>
              </div>
            )}
            {/* Approved Documents */}
            {worker.approved_documents?.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" />
                  Approved Documents
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {worker.approved_documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {doc.document_type}
                        </p>

                        <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                          Approved
                        </span>
                      </div>

                      {/* <a
            href={doc.file_url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >
            Download
          </a> */}
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Statutory Details */}
            {worker.statutory && Object.keys(worker.statutory).length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield size={18} className="text-purple-600" />
                  Statutory Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* <DetailItem
                    label="EPF Enabled"
                    value={worker.statutory.epf_enabled ? "Yes" : "No"}
                  /> */}
                  <DetailItem
                    label="UAN Number"
                    value={worker.statutory.uan_number || "N"}
                  />
                  {/* <DetailItem
                    label="EPS Contribution"
                    value={worker.statutory.eps_contribution || "N/A"}
                  />
                  <DetailItem
                    label="ESI Enabled"
                    value={worker.statutory.esi_enabled ? "Yes" : "No"}
                  /> */}
                  <DetailItem
                    label="ESIC Number"
                    value={worker.statutory.esic_number || "N/A"}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      {/* Preview Modal */}
      {previewDoc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl w-full max-w-5xl h-[90vh] overflow-hidden relative">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-lg">
                {previewDoc.document_type}
              </h2>

              <div className="flex items-center gap-3">
                <a
                  href={previewDoc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                >
                  Download
                </a>

                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* File Preview */}
            <iframe
              src={previewDoc.file_url}
              title="Preview"
              className="w-full h-[calc(100%-70px)]"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const DetailItem = ({ label, value }) => (
  <div className="p-3 bg-gray-50 rounded-lg">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="font-medium text-gray-800">{value || "N/A"}</p>
  </div>
);

export default VacancyWorkerView;
