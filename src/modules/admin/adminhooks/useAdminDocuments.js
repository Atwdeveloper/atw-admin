"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import {
  getDocumentsAPI,
  uploadDocumentAPI,
  deleteDocumentAPI,
} from "../../../api/admin/adminDocumentAPI";

export const useAdminDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    fileUrl: "",
    fileType: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const docsRes = await getDocumentsAPI({ limit: 1000 });
      const docs = docsRes?.data?.data?.data || docsRes?.data?.data || [];
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load documents.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpload = async (typeId, file) => {
    if (!file) return;

    setUploadingId(typeId);
    const formData = new FormData();
    formData.append("document_type_id", typeId);
    formData.append("file", file);

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
        await fetchData();
      } else {
        throw new Error(response.data.message || "Upload failed");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: error.response?.data?.message || "Something went wrong.",
      });
    } finally {
      setUploadingId(null);
    }
  };

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
        await fetchData();
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

  const getFileTypeFromUrl = (url) => {
    if (!url) return "other";

    const extension = url.split(".").pop().toLowerCase();

    if (extension === "pdf") {
      return "pdf";
    }

    if (["doc", "docx"].includes(extension)) {
      return "doc";
    }

    return "other";
  };

  const openPreview = (fileUrl) => {
    if (!fileUrl) {
      Swal.fire({
        icon: "warning",
        title: "No Document Found",
        text: "Please upload your document first.",
      });

      return;
    }

    const fileType = getFileTypeFromUrl(fileUrl);

    setPreviewModal({
      isOpen: true,
      fileUrl,
      fileType,
    });
  };

  const closePreview = () => {
    setPreviewModal({ isOpen: false, fileUrl: "", fileType: "" });
  };

  return {
    loading,
    documents,
    uploadingId,
    previewModal,
    handleUpload,
    handleDelete,
    openPreview,
    closePreview,
    refresh: fetchData,
  };
};
