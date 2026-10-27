import axiosInstance from "../axiosInstance";

export const getDocumentTypesAPI = (type) => {
  return axiosInstance.get("/documents-types", { params: { type } });
};

// Get uploaded documents list
export const getDocumentsAPI = (params) => {
  return axiosInstance.get("/admin/worker-documents", { params });
};

// Upload a new document
export const uploadDocumentAPI = (formData) => {
  return axiosInstance.post("/admin/upload-worker-document", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Delete a document
export const deleteDocumentAPI = (id) => {
  return axiosInstance.delete(`/admin/delete-worker-document/${id}`);
};
export const updateWorkerDocumentStatusAPI = (id, data) => {
  return axiosInstance.post(`/admin/update-worker-document-status/${id}`, data);
};
export const viewWorkerDocumentAPI = (id) => {
  return axiosInstance.get(`/worker-document/view/${id}`, {
    responseType: "blob",
  });
};

export const downloadWorkerDocumentAPI = (id) => {
  return axiosInstance.get(`/worker-document/download/${id}`, {
    responseType: "blob",
  });
};
