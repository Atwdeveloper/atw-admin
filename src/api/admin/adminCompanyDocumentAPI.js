import axiosInstance from "../axiosInstance";

// Get document types (for dropdown)
// export const getDocumentTypesAPI = () => {
//   return axiosInstance.get("/documents-types");
// };
export const getDocumentTypesAPI = (params) => {
  return axiosInstance.get("/documents-types", { params });
};

// Get uploaded documents list
export const getDocumentsAPI = (params) => {
  return axiosInstance.get("/admin/company-documents", { params });
};

// Upload a new document
export const uploadDocumentAPI = (formData) => {
  return axiosInstance.post("/admin/upload-company-document", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
export const viewCompanyDocumentAPI = (id) => {
  return axiosInstance.get(`/company-document/view/${id}`, {
    responseType: "blob",
  });
};

export const downloadCompanyDocumentAPI = (id) => {
  return axiosInstance.get(`/company-document/download/${id}`, {
    responseType: "blob",
  });
};
// Optional: Delete a document (if API supports)
export const deleteDocumentAPI = (id) => {
  return axiosInstance.delete(`/admin/delete-company-document/${id}`);
};

export const updateDocumentStatusAPI = (
  id,
  status,
  remark,
  expiry_date = "",
) => {
  return axiosInstance.post(`/admin/update-company-document-status/${id}`, {
    status,
    remark,
    expiry_date,
  });
};
