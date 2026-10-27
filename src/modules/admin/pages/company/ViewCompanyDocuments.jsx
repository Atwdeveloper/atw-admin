"use client";

import { motion } from "framer-motion";

import {
  File,
  FileText,
  Download,
  X,
  FileAudio,
  FileVideo,
  FileArchive,
  FileSpreadsheet,
  Image,
  Check,
  XCircle,
} from "lucide-react";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import Loader from "../../../../common/components/Loader";
import { useViewCompanyDocuments } from "../../adminhooks/useViewCompanyDocuments";
import React from "react";
import Breadcrumb from "../../../../common/components/Breadcrumb";
import { useNavigate, useLocation, useParams } from "@/lib/navigation";

const ViewCompanyDocuments = () => {
  const navigate = useNavigate();

  const location = useLocation();
  const params = useParams();

  const [companyName, setCompanyName] = React.useState(
    location.state?.companyName || "",
  );

  const company = location.state?.company;

  const {
    loading,
    documents,
    uploadingId,
    previewModal,
    handleUpload,
    handleDelete,
    handleStatusUpdate,
    handleAdminPreview,
    handleAdminDownload,
    openPreview,
    closePreview,
  } = useViewCompanyDocuments();

  // Trigger file input for a specific document type
  const triggerFileInput = (typeId) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) handleUpload(typeId, file);
    };
    input.click();
  };
  const getFileIcon = (fileUrl) => {
    if (!fileUrl) return File;

    const extension = fileUrl.split(".").pop().toLowerCase();

    const iconMap = {
      // Images
      jpg: Image,
      jpeg: Image,
      png: Image,
      gif: Image,
      svg: Image,
      webp: Image,
      // Documents
      pdf: FileText,
      doc: FileText,
      docx: FileText,
      txt: FileText,
      rtf: FileText,
      // Spreadsheets
      xls: FileSpreadsheet,
      xlsx: FileSpreadsheet,
      csv: FileSpreadsheet,
      // Presentations
      ppt: File,
      pptx: File,
      // Audio
      mp3: FileAudio,
      wav: FileAudio,
      ogg: FileAudio,
      // Video
      mp4: FileVideo,
      avi: FileVideo,
      mov: FileVideo,
      mkv: FileVideo,
      // Archives
      zip: FileArchive,
      rar: FileArchive,
      "7z": FileArchive,
      tar: FileArchive,
      gz: FileArchive,
      // Default
    };

    return iconMap[extension] || File;
  };
  if (loading && !documents.length) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <motion.div
      className="flex-1 bg-gray-50 p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Breadcrumb
        items={[
          { label: "Companies", path: "/admin/company/listing" },
          {
            label: "Documents",
            path: `/admin/company/view-documents/${params.id}`,
          },
          { label: companyName },
        ]}
      />
      {/* Header */}
      <motion.div
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-gray-200 mb-6"
        variants={itemVariants}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                Company Documents (KYC) {/* Company Info Badge */}
                <span className="px-3 py-1 text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                  {companyName}
                </span>
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <p className="text-gray-600">Manage all required documents</p>
            </div>
          </div>
          {/* Company ID */}
          <p className="text-sm text-gray-500 mt-1">
            Company ID:
            <span className="font-semibold text-gray-700 ml-1">
              {company?.company_code || "N/A"}
            </span>
          </p>
        </div>
      </motion.div>

      {/* Documents List */}
      <motion.div
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        variants={itemVariants}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Document Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  File
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Expiry Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-500">
                    No documents found
                  </td>
                </tr>
              ) : (
                documents.map((doc, index) => (
                  <motion.tr
                    key={doc.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {doc.document_type.name}
                      {doc.document_type.code && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({doc.document_type.code})
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          doc.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : doc.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {doc.status === "approved"
                          ? "Approved"
                          : doc.status === "rejected"
                            ? "Rejected"
                            : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {doc.file_url ? (
                        <button
                          // onClick={() => openPreview(doc.file_url)}
                          onClick={() => handleAdminPreview(doc.id)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          {React.createElement(getFileIcon(doc.file_url), {
                            size: 16,
                          })}
                          <span className="-mb-0.5">Preview</span>
                        </button>
                      ) : (
                        <span className="text-gray-400">No file</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {doc.expiry_date ? (
                        new Date(doc.expiry_date).toLocaleDateString()
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* Approve button */}
                        {/* <button
                          onClick={() => handleStatusUpdate(doc.id, "approve")}
                          className="text-sm flex items-center gap-1 px-3 py-1.5 rounded-md bg-green-50 text-green-700 hover:bg-green-100"
                          title="Approve"
                        >
                          <Check size={16} />
                          Approve
                        </button> */}
                        {doc.status !== "approved" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(doc.id, "approve")
                            }
                            className="text-sm flex items-center gap-1 px-3 py-1.5 rounded-md bg-green-50 text-green-700 hover:bg-green-100"
                            title="Approve"
                          >
                            <Check size={16} />
                            Approve
                          </button>
                        )}

                        {/* Reject button */}
                        {/* Reject button */}
                        {doc.status !== "rejected" && (
                          <button
                            onClick={() => handleStatusUpdate(doc.id, "reject")}
                            className="text-sm flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-50 text-red-700 hover:bg-red-100"
                            title="Reject"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        )}
                      </div>
                      <span className="text-xs">
                        (pdf, jpg, jpeg, png, webp)
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Preview Modal */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Document Preview</h3>
              <button
                onClick={closePreview}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-4">
              {previewModal.fileType === "image" ? (
                <img
                  src={previewModal.fileUrl}
                  alt="Preview"
                  className="max-w-full max-h-[70vh] mx-auto object-contain"
                />
              ) : previewModal.fileType === "pdf" ? (
                <iframe
                  src={`${previewModal.fileUrl}#view=FitH`}
                  title="PDF Preview"
                  className="w-full h-[70vh]"
                />
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-600 mb-4">
                    Preview not available for this file type.
                  </p>
                  <a
                    href={previewModal.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800"
                  >
                    <Download size={18} />
                    Download File
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex justify-end">
              {/* <a
                href={previewModal.fileUrl}
                download
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <Download size={16} />
                Download
              </a> */}
              <button
                onClick={() => handleAdminDownload(previewModal.documentId)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ViewCompanyDocuments;
