"use client";

import { motion } from "framer-motion";

import { useLocation, useParams } from "@/lib/navigation";
import {
  FileText,
  Trash2,
  Upload,
  Download,
  X,
  FileArchive,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  Image,
  Briefcase,
  User,
} from "lucide-react";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import Loader from "../../../../common/components/Loader";
import { useViewWorkerDocuments } from "../../adminhooks/useViewWorkerDocuments";
import React, { useState } from "react";
import Breadcrumb from "../../../../common/components/Breadcrumb";
const ViewWorkerDocuments = () => {
  const {
    loading,
    combinedData,
    uploadingId,
    previewModal,
    handleUpload,
    handleDelete,
    handleDocumentStatus,
    openPreview,
    handleWorkerPreview,
    handleWorkerDownload,
    closePreview,
  } = useViewWorkerDocuments();

  const [activeTab, setActiveTab] = useState("professional");
  const location = useLocation();
  const params = useParams();

  const [workerName, setWorkerName] = useState(
    location.state?.workerName || "",
  );
  // Filter combinedData by category
  const professionalDocs = combinedData.filter(
    (item) => item.type?.category === "professional",
  );
  const personalDocs = combinedData.filter(
    (item) => item.type?.category === "personal",
  );

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
  // useEffect(() => {
  //   if (workerName) return;

  //   const fetchWorker = async () => {
  //     try {
  //       // create this API if not available
  //       const res = await getWorkerByIdAPI(params.id);
  //       setWorkerName(res?.data?.data?.worker_name || "Worker");
  //     } catch (err) {
  //       console.error(err);
  //       setWorkerName("Worker");
  //     }
  //   };

  //   fetchWorker();
  // }, [params.id]);
  const getFileIcon = (fileUrl) => {
    if (!fileUrl) return FileText;
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
      ppt: FileText,
      pptx: FileText,
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
    return iconMap[extension] || FileText;
  };

  if (loading && !combinedData.length) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col bg-gray-50 p-4 w-full items-center min-h-[70vh]"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Breadcrumb
        items={[
          { label: "All Workers", path: "/admin/worker/listing" },
          {
            label: "Documents",
            path: `/admin/worker/view-documents/${params.id}`,
          },
          { label: workerName || "Worker" },
        ]}
      />

      {/* Header */}
      <motion.div
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-gray-200 mb-6 w-full"
        variants={itemVariants}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-gray-800">
              Worker Documents
            </h1>
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <p className="text-gray-600">Manage all required documents</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="w-full mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("professional")}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "professional"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Briefcase size={18} />
              Professional Documents ({professionalDocs.length})
            </button>
            <button
              onClick={() => setActiveTab("personal")}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "personal"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <User size={18} />
              Personal Documents ({personalDocs.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Professional Documents Tab */}
      {activeTab === "professional" && (
        <motion.div
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
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
                </tr>
              </thead>
              <tbody>
                {professionalDocs.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-10 text-gray-500">
                      No professional document types found
                    </td>
                  </tr>
                ) : (
                  professionalDocs.map((item, index) => (
                    <motion.tr
                      key={item.type.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {item.type.name}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {item.document ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Uploaded
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Missing
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {item.document ? (
                          <button
                            // onClick={() => openPreview(item.document.file_url)}
                            onClick={() =>
                              handleWorkerPreview(item.document.id)
                            }
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            {React.createElement(
                              getFileIcon(item.document.file_url),
                              { size: 16 },
                            )}
                            <span>Preview</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => triggerFileInput(item.type.id)}
                            disabled={uploadingId === item.type.id}
                            className="text-green-600 hover:text-green-800 flex items-center gap-1"
                          >
                            <Upload size={16} />
                            <span>Upload</span>
                          </button>
                        )}
                        <span className="text-xs text-gray-400">
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
      )}

      {/* Personal Documents Tab */}
      {activeTab === "personal" && (
        <motion.div
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full"
          initial="hidden"
          animate="visible"
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {personalDocs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-gray-500">
                      No personal document types found
                    </td>
                  </tr>
                ) : (
                  personalDocs.map((item, index) => (
                    <motion.tr
                      key={item.type.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {item.type.name}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {item.document ? (
                          item.document.status === "approved" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Approved
                            </span>
                          ) : item.document.status === "rejected" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Missing
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {item.document ? (
                          <button
                            // onClick={() => openPreview(item.document.file_url)}
                            onClick={() =>
                              handleWorkerPreview(item.document.id)
                            }
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            {React.createElement(
                              getFileIcon(item.document.file_url),
                              { size: 16 },
                            )}
                            <span>Preview</span>
                          </button>
                        ) : (
                          <span className="text-gray-400">No file</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Upload / Replace */}
                          <button
                            onClick={() => triggerFileInput(item.type.id)}
                            disabled={uploadingId === item.type.id}
                            className={`text-sm flex items-center gap-1 px-3 py-1.5 rounded-md ${
                              item.document
                                ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                : "bg-green-50 text-green-700 hover:bg-green-100"
                            }`}
                          >
                            {uploadingId === item.type.id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload size={16} />
                                {item.document ? "Replace" : "Upload"}
                              </>
                            )}
                          </button>

                          {/* Delete */}
                          {item.document && (
                            <button
                              onClick={() => handleDelete(item.document.id)}
                              className="text-gray-500 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}

                          {/* Approve Button */}
                          {item.document &&
                            item.document.status !== "approved" && (
                              <button
                                onClick={() =>
                                  handleDocumentStatus(
                                    item.document.id,
                                    "approved",
                                  )
                                }
                                className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-md text-sm"
                              >
                                Approve
                              </button>
                            )}

                          {/* Reject Button */}
                          {item.document &&
                            item.document.status === "approved" && (
                              <button
                                onClick={() =>
                                  handleDocumentStatus(
                                    item.document.id,
                                    "rejected",
                                  )
                                }
                                className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-md text-sm"
                              >
                                Reject
                              </button>
                            )}
                        </div>

                        <span className="text-xs text-gray-400">
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
      )}

      {/* Preview Modal */}
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
                    <Download size={18} /> Download File
                  </a>
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end">
              {/* <a
                href={previewModal.fileUrl}
                download
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <Download size={16} /> Download
              </a> */}
              <button
                onClick={() => handleWorkerDownload(previewModal.documentId)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <Download size={16} /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ViewWorkerDocuments;
