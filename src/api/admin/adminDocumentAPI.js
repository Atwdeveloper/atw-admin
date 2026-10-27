import axiosInstance from "../axiosInstance";

export const getDocumentTypesAPI = (params) => {
  return axiosInstance.get("/documents-types", { params });
};

// Get uploaded documents list
export const getDocumentsAPI = (params) => {
  return axiosInstance.get("/admin/documents", { params });
};

// Upload a new document
export const uploadDocumentAPI = (formData) => {
  return axiosInstance.post("/admin/upload-document", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Optional: Delete a document (if API supports)
export const deleteDocumentAPI = (id) => {
  return axiosInstance.delete(`/admin/document-delete/${id}`);
};


export const createDocumentTypeAPI = (data) => {
  return axiosInstance.post("/admin/document-types", data);
};