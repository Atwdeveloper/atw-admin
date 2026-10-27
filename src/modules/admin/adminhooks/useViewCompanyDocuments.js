"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "@/lib/navigation";
import Swal from "sweetalert2";

import {
  getDocumentsAPI,
  uploadDocumentAPI,
  deleteDocumentAPI,
  updateDocumentStatusAPI,
  viewCompanyDocumentAPI,
  downloadCompanyDocumentAPI,
} from "../../../api/admin/adminCompanyDocumentAPI";

export const useViewCompanyDocuments = () => {
  const params = useParams();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState(null); // document_type_id being uploaded
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    fileUrl: "",
    fileType: "",
    documentId: null,
  });

  const companyId = params.id;

  // Fetch all documents
  const fetchData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const docsRes = await getDocumentsAPI({
        company_id: companyId,
        limit: 1000, // get all
      });

      // Handle the API response structure

      const docs = docsRes?.data?.data || docsRes?.data || [];

      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load documents.",
      });
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleAdminPreview = async (id) => {
    try {
      const response = await viewCompanyDocumentAPI(id);

      const fileUrl = URL.createObjectURL(response.data);

      const contentType = response.headers["content-type"];

      let fileType = "other";

      if (contentType?.includes("image")) {
        fileType = "image";
      } else if (contentType?.includes("pdf")) {
        fileType = "pdf";
      }

      setPreviewModal({
        isOpen: true,
        fileUrl,
        fileType,
        documentId: id,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Unable to preview document.",
      });
    }
  };
  const handleAdminDownload = async (id) => {
    try {
      const response = await downloadCompanyDocumentAPI(id);

      const url = URL.createObjectURL(response.data);

      const link = document.createElement("a");

      link.href = url;
      link.download = `document-${id}`;

      document.body.appendChild(link);
      link.click();

      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Unable to download document.",
      });
    }
  };
  // Handle file upload (new or replace)
  const handleUpload = async (typeId, file) => {
    if (!file) return;

    setUploadingId(typeId);
    const formData = new FormData();
    formData.append("company_id", companyId);
    formData.append("documents[0][document_type_id]", typeId);
    formData.append("documents[0][file]", file);

    try {
      const response = await uploadDocumentAPI(formData);
      if (response?.status === 200 || response?.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Document uploaded successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        await fetchData(); // refresh list
      } else {
        throw new Error(response?.data?.message || "Upload failed");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: error.message || "Something went wrong.",
      });
    } finally {
      setUploadingId(null);
    }
  };

  // Handle delete
  const handleDelete = async (docId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This document will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteDocumentAPI(docId);
      if (response?.status === 200 || response?.status === 204) {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Document has been deleted.",
          timer: 1500,
          showConfirmButton: false,
        });
        await fetchData(); // refresh list
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not delete document.",
      });
    }
  };

  // Handle document status update (approve/reject)
  const handleStatusUpdate = async (docId, status) => {
    let remark = "";
    let apiStatus = status;
    let expiry_date = "";

    // Handle reject - custom popup with reason
    if (status === "reject") {
      const { value: formValues } = await Swal.fire({
        title:
          '<h2 class="text-2xl font-bold text-gray-800">Reject Document</h2>',

        html: `
      <div class="text-left w-full">

        <div class="mb-2">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Rejection Reason <span class="text-red-500">*</span>
          </label>

          <textarea
            id="swal-remark"
            placeholder="Enter rejection reason"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 
                   focus:outline-none focus:ring-2 focus:ring-red-400 
                   focus:border-red-400"
            rows="4"
          ></textarea>

          <p 
            id="remark-error" 
            class="text-red-500 text-xs mt-1 hidden"
          >
            Rejection reason is required
          </p>
        </div>
      </div>
    `,

        showCancelButton: true,
        confirmButtonText: "Reject",
        cancelButtonText: "Cancel",

        customClass: {
          popup: "rounded-2xl p-6",
          confirmButton:
            "bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg mx-2",
          cancelButton:
            "bg-gray-400 hover:bg-gray-500 text-white px-5 py-2 rounded-lg",
        },

        buttonsStyling: false,

        preConfirm: () => {
          const remark = document.getElementById("swal-remark").value.trim();

          const remarkError = document.getElementById("remark-error");

          const remarkField = document.getElementById("swal-remark");

          // Reset error
          remarkError.classList.add("hidden");
          remarkField.classList.remove("border-red-500");

          let hasError = false;

          // Validation
          if (!remark) {
            remarkError.classList.remove("hidden");
            remarkField.classList.add("border-red-500");
            hasError = true;
          }

          if (hasError) return false;

          return {
            remark,
          };
        },
      });

      if (!formValues) return;

      remark = formValues.remark;

      apiStatus = "rejected"; // API expects "rejected"
    }

    // Handle approve - require expiry date
    else if (status === "approve") {
      const { value: formValues } = await Swal.fire({
        title:
          '<h2 class="text-2xl font-bold text-gray-800">Approve Document</h2>',

        html: `
      <div class="text-left w-full">

        <div class="mb-2">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Expiry Date <span class="text-red-500">*</span>
          </label>

          <input
            type="date"
            id="swal-expiry-date"
            min="${new Date(Date.now() + 86400000).toISOString().split("T")[0]}"
            class="w-full border border-gray-300 rounded-lg px-3 py-2
                   focus:outline-none focus:ring-2 focus:ring-green-400
                   focus:border-green-400"
          />

          <p 
            id="date-error" 
            class="text-red-500 text-xs mt-1 hidden"
          >
            Expiry date is required
          </p>
        </div>
      </div>
    `,

        showCancelButton: true,
        confirmButtonText: "Approve",
        cancelButtonText: "Cancel",

        customClass: {
          popup: "rounded-2xl p-6",
          confirmButton:
            "bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg mx-2",
          cancelButton:
            "bg-gray-400 hover:bg-gray-500 text-white px-5 py-2 rounded-lg",
        },

        buttonsStyling: false,

        preConfirm: () => {
          const expiryDate = document.getElementById("swal-expiry-date").value;

          const dateError = document.getElementById("date-error");

          const dateField = document.getElementById("swal-expiry-date");

          // Reset error
          dateError.classList.add("hidden");
          dateField.classList.remove("border-red-500");

          let hasError = false;

          // Date validation
          if (!expiryDate) {
            dateError.classList.remove("hidden");
            dateField.classList.add("border-red-500");
            hasError = true;
          }

          if (hasError) return false;

          return {
            expiryDate,
          };
        },
      });

      if (!formValues) return;

      expiry_date = formValues.expiryDate;

      apiStatus = "approved";
    } else {
      console.error("Invalid status:", status);
      return;
    }

    try {
      // Make API call
      const response = await updateDocumentStatusAPI(
        docId,
        apiStatus,
        remark,
        expiry_date,
      );

      // Check if response is successful
      if (response && (response.status === 200 || response.status === 201)) {
        const message =
          apiStatus === "approved"
            ? "Document has been approved!"
            : `Document has been rejected!${remark ? ` Reason: ${remark}` : ""}`;

        Swal.fire({
          icon: "success",
          title: apiStatus === "approved" ? "Approved!" : "Rejected!",
          text: message,
          timer: 2000,
          showConfirmButton: false,
        });

        // Refresh the documents list
        await fetchData();
      } else {
        console.error("Unexpected response:", response);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Unexpected response from server",
        });
      }
    } catch (error) {
      console.error("API Error:", error);

      // Handle different error types
      let errorMessage = "Failed to update document status";

      if (error.response) {
        // Server responded with error status
        console.error("Error response:", error.response);
        errorMessage =
          error.response.data?.message ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request was made but no response received
        console.error("No response received:", error.request);
        errorMessage = "No response from server. Please check your connection.";
      } else {
        // Something else happened
        console.error("Request error:", error.message);
        errorMessage = error.message;
      }

      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
      });
    }
  };

  // Determine file type for preview
  const getFileTypeFromUrl = (url) => {
    const extension = url.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(extension))
      return "image";
    if (extension === "pdf") return "pdf";
    return "other";
  };

  // Open preview modal
  const openPreview = (fileUrl) => {
    const fileType = getFileTypeFromUrl(fileUrl);
    setPreviewModal({ isOpen: true, fileUrl, fileType });
  };

  // Close preview modal
  const closePreview = () => {
    setPreviewModal({ isOpen: false, fileUrl: "", fileType: "" });
  };

  return {
    loading,
    documents,
    uploadingId,
    previewModal,
    handleAdminPreview,
    handleAdminDownload,
    handleUpload,
    handleDelete,
    handleStatusUpdate,
    openPreview,
    closePreview,
    refresh: fetchData,
  };
};
