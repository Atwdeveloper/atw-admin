"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "@/lib/navigation";
import Swal from "sweetalert2";
import {
  getDocumentTypesAPI,
  getDocumentsAPI,
  uploadDocumentAPI,
  deleteDocumentAPI,
  updateWorkerDocumentStatusAPI,
  viewWorkerDocumentAPI,
  downloadWorkerDocumentAPI,
} from "../../../api/admin/adminWorkerDocumentAPI";

export const useViewWorkerDocuments = () => {
  const params = useParams();

  const [documentTypes, setDocumentTypes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);

  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    fileUrl: "",
    fileType: "",
    documentId: null,
  });

  const workerId = params.id;

  const fetchData = useCallback(async () => {
    if (!workerId) return;

    setLoading(true);

    try {
      const [typesRes, docsRes] = await Promise.all([
        getDocumentTypesAPI("worker"),
        getDocumentsAPI({
          worker_id: workerId,
        }),
      ]);

      const rawTypes = typesRes?.data?.data || [];

      const filteredTypes = rawTypes.filter((type) => {
        const normName = type.name?.trim().toLowerCase();

        return normName !== "pay slip" && normName !== "annual salary report";
      });

      setDocumentTypes(filteredTypes);

      const docs = docsRes?.data?.data?.data || docsRes?.data?.data || [];

      setDocuments(docs);
    } catch (error) {
      console.error("Error fetching worker documents:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load worker documents.",
      });
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const combinedData = documentTypes.map((type) => ({
    type,
    document:
      documents.find(
        (doc) => Number(doc.document_type_id) === Number(type.id),
      ) || null,
  }));

  const handleUpload = async (typeId, file) => {
    if (!file || !workerId) return;

    setUploadingId(typeId);

    const formData = new FormData();

    formData.append("worker_id", workerId);
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

        await fetchData();
      } else {
        throw new Error(response?.data?.message || "Upload failed");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text:
          error?.response?.data?.message ||
          error.message ||
          "Something went wrong.",
      });
    } finally {
      setUploadingId(null);
    }
  };
  const handleWorkerPreview = async (id) => {
    try {
      const response = await viewWorkerDocumentAPI(id);

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

  const handleWorkerDownload = async (id) => {
    try {
      const response = await downloadWorkerDocumentAPI(id);

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
        text: error?.response?.data?.message || "Could not delete document.",
      });
    }
  };

  const handleDocumentStatus = async (docId, status) => {
    try {
      const response = await updateWorkerDocumentStatusAPI(docId, {
        status,
      });

      if (response?.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: `Document ${status} successfully.`,
          timer: 1500,
          showConfirmButton: false,
        });

        await fetchData();
      } else {
        throw new Error("Status update failed");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error?.response?.data?.message || "Failed to update document status.",
      });
    }
  };

  const getFileTypeFromUrl = (url) => {
    const extension = url.split(".").pop().toLowerCase();

    if (
      ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(extension)
    ) {
      return "image";
    }

    if (extension === "pdf") {
      return "pdf";
    }

    return "other";
  };
  const openPreview = (fileUrl, documentId = null) => {
    const fileType = getFileTypeFromUrl(fileUrl);

    setPreviewModal({
      isOpen: true,
      fileUrl,
      fileType,
      documentId,
    });
  };
  const closePreview = () => {
    setPreviewModal({
      isOpen: false,
      fileUrl: "",
      fileType: "",
      documentId: null,
    });
  };

  return {
    loading,
    combinedData,
    uploadingId,
    previewModal,
    handleUpload,
    handleDelete,
    handleDocumentStatus,
    openPreview,
    closePreview,
    handleWorkerPreview,
    handleWorkerDownload,
    refresh: fetchData,
  };
};
