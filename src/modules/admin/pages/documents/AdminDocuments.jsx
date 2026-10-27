"use client";

import { motion } from "framer-motion";
import { useNavigate } from "@/lib/navigation";
import {
  FileText,
  Trash2,
  Upload,
  Download,
  X,
  File,
  FileAudio,
  FileVideo,
  FileArchive,
  FileSpreadsheet,
  Image,
  Plus,
  Shield,
} from "lucide-react";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import Loader from "../../../../common/components/Loader";
import { useAdminDocuments } from "../../adminhooks/useAdminDocuments";
import React, { useState, useEffect } from "react";
import { createDocumentTypeAPI } from "../../../../api/admin/adminDocumentAPI";
import Swal from "sweetalert2";

const AdminDocuments = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const canManage = hasPermission("configuration", "manage_documents");

  const {
    loading,
    documents,
    uploadingId,
    previewModal,
    handleUpload,
    handleDelete,
    openPreview,
    closePreview,
    refresh,
  } = useAdminDocuments();

  // State for document types (only fetched when needed for upload dropdown)
  const [documentTypes, setDocumentTypes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    // code: "",
    description: "",
    type: "admin",
    category: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch document types only for the "Add Document" dropdown
  const fetchDocumentTypes = async () => {
    try {
      // Use the admin document types endpoint (only for upload dropdown)
      const { getAdminDocumentTypesAPI } =
        await import("../../../../api/admin/adminDocumentAPI");
      const res = await getAdminDocumentTypesAPI({ type: "admin" });
      const types = res?.data?.data || res?.data || [];
      setDocumentTypes(Array.isArray(types) ? types : []);
    } catch (error) {
      console.error("Failed to fetch document types", error);
    }
  };

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  if (permissionsLoading) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center min-h-[80vh]">
        <Loader />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center min-h-[80vh]">
        <div className="bg-white rounded-lg p-8 text-center max-w-md shadow-sm border border-gray-100">
          <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access Document Configuration.
          </p>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const getFileIcon = (fileUrl) => {
    if (!fileUrl) return File;
    const extension = fileUrl.split(".").pop().toLowerCase();
    const iconMap = {
      jpg: Image,
      jpeg: Image,
      png: Image,
      gif: Image,
      svg: Image,
      webp: Image,
      pdf: FileText,
      doc: FileText,
      docx: FileText,
      txt: FileText,
      rtf: FileText,
      xls: FileSpreadsheet,
      xlsx: FileSpreadsheet,
      csv: FileSpreadsheet,
      mp3: FileAudio,
      wav: FileAudio,
      ogg: FileAudio,
      mp4: FileVideo,
      avi: FileVideo,
      mov: FileVideo,
      mkv: FileVideo,
      zip: FileArchive,
      rar: FileArchive,
      "7z": FileArchive,
      tar: FileArchive,
      gz: FileArchive,
    };
    return iconMap[extension] || File;
  };

  const triggerFileInput = (typeId) => {
    const input = document.createElement("input");

    input.type = "file";
    input.accept = ".pdf,.doc,.docx";

    input.onchange = (e) => {
      const file = e.target.files[0];

      if (!file) return;

      const allowedExtensions = ["pdf", "doc", "docx"];
      const fileExtension = file.name.split(".").pop().toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        Swal.fire({
          icon: "error",
          title: "Invalid File",
          text: "Only PDF, DOC, and DOCX files are allowed.",
        });

        return;
      }

      handleUpload(typeId, file);
    };

    input.click();
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      name: "",
      code: "",
      description: "",
      type: "admin",
      category: "",
    });
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };
  const handleTypeChange = (e) => {
    const type = e.target.value;
    setFormData((prev) => ({
      ...prev,
      type,
      category: type === "worker" ? prev.category : "",
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    // if (!formData.code.trim()) errors.code = "Code is required";
    if (formData.type === "worker" && !formData.category) {
      errors.category = "Category is required for worker documents";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await createDocumentTypeAPI({
        name: formData.name,
        description: formData.description,
        type: formData.type,
        category: formData.type === "worker" ? formData.category : null,
      });

      // ✅ CHECK RESPONSE HERE
      if (response?.status === 200 || response?.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Document type added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });

        refresh();
        fetchDocumentTypes();
        closeModal();
      } else {
        throw new Error(response?.data?.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Error creating document type:", error);

      if (error.response?.data?.errors) {
        const apiErrors = {};
        Object.entries(error.response.data.errors).forEach(
          ([key, messages]) => {
            apiErrors[key] = messages[0];
          },
        );
        setFormErrors(apiErrors);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            error.response?.data?.message ||
            error.message ||
            "Failed to create document type.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !documents.length) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <Loader />
      </div>
    );
  }
  const getUserTypeLabel = (type) => {
    const map = {
      admin: "Admin (company ATW)",
      worker: "Worker",
      company: "Company (KYC Doc)",
    };
    return (
      map[type] || (type ? type.charAt(0).toUpperCase() + type.slice(1) : "N/A")
    );
  };
  return (
    <motion.div
      className="flex-1 bg-gray-50 p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div
        className="bg-white rounded-2xl p-6 border border-gray-200 mb-6"
        variants={itemVariants}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-gray-800">
              Admin Documents
            </h1>
          </div>
          <div className="flex gap-3">
            {/* Upload button with dropdown to select document type */}
            <div className="relative"></div>
            <button
              onClick={openModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              <Plus size={18} />
              Add Document Type
            </button>
          </div>
        </div>
      </motion.div>

      {/* Uploaded Documents List */}
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
                  User Type
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  File
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-10 text-gray-500">
                    No documents uploaded yet
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
                      {doc.document_type || `Type ID: ${doc.document_type_id}`}
                    </td>
                    {/* <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {doc.type || "N/A"}
                      {doc.category && (
                        <div className="text-xs text-gray-500 capitalize mt-1">
                          {doc.category}
                        </div>
                      )}
                    </td> */}
                    {/* <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {doc.type
                        ? doc.type.charAt(0).toUpperCase() + doc.type.slice(1)
                        : "N/A"}
                      {doc.category && (
                        <div className="text-xs text-gray-500 capitalize mt-1">
                          {doc.category}
                        </div>
                      )}
                    </td> */}
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {getUserTypeLabel(doc.type)}
                      {doc.category && (
                        <div className="text-xs text-gray-500 capitalize mt-1">
                          {doc.category}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      <button
                        onClick={() => openPreview(doc.file_url)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        {React.createElement(getFileIcon(doc.file_url), {
                          size: 16,
                        })}
                        <span className="-mb-0.5">Preview</span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => triggerFileInput(doc.document_type_id)}
                          disabled={uploadingId === doc.document_type_id}
                          className="text-sm flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                          {uploadingId === doc.document_type_id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload size={16} />
                              Replace
                            </>
                          )}
                        </button>
                        {doc.type === "company" ||
                        doc.document_type_id === 1 ||
                        doc.document_type_id === 2 ? null : (
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="text-gray-500 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                      <span className="text-xs">
                        (only doc & pdf format){" "}
                        {doc.type === "company" && (
                          <div className="text-xs text-blue-600 mt-1">
                            Fixed for Company KYC.
                          </div>
                        )}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Preview Modal (unchanged) */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Document Preview</h3>
              <button
                onClick={closePreview}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
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
              ) : previewModal.fileType === "doc" ? (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(previewModal.fileUrl)}&embedded=true`}
                  title="DOC Preview"
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
            <div className="p-4 border-t flex justify-end">
              <a
                href={previewModal.fileUrl}
                download
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <Download size={16} />
                Download
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Add Document Type Modal (unchanged) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl max-w-md w-full"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Add New Document Type</h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., Signed Form-V"
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleTypeChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admin">Admin (Company ATW)</option>
                  {/* <option value="company">Admin - Company ATW Documents</option> */}
                  <option value="worker">Worker</option>
                </select>
              </div>
              {formData.type === "worker" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.category ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Category</option>
                    <option value="personal">Personal</option>
                    <option value="professional">Professional</option>
                  </select>
                  {formErrors.category && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.category}
                    </p>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Document Type"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminDocuments;
