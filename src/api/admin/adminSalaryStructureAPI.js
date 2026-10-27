import axiosInstance from "../axiosInstance";

// Get initialization data (earning components, deduction components, designations, deduction templates)
export const getSalaryInitAPI = async () => {
  const response = await axiosInstance.get("/admin/salary/init");
  return response.data;
};

// Get all salary structures (templates)
export const getSalaryStructuresAPI = async (params = {}) => {
  const response = await axiosInstance.get("/admin/salary/list", { params });
  return response.data;
};

// Get a single salary structure template details
export const getSalaryStructureDetailsAPI = async (id) => {
  const response = await axiosInstance.get(`/admin/salary/template/${id}`);
  return response.data;
};

// Create new salary structure
export const createSalaryStructureAPI = async (payload) => {
  const response = await axiosInstance.post("/admin/salary/create", payload);
  return response.data;
};

// Update salary structure
export const updateSalaryStructureAPI = async (id, payload) => {
  const response = await axiosInstance.put(`/admin/salary/update/${id}`, payload);
  return response.data;
};

// Delete salary structure
export const deleteSalaryStructureAPI = async (id) => {
  const response = await axiosInstance.delete(`/admin/salary/delete/${id}`);
  return response.data;
};

// Activate / Deactivate
export const activateSalaryStructureAPI = async (id) => {
  const response = await axiosInstance.patch(`/admin/salary/activate/${id}`);
  return response.data;
};

export const deactivateSalaryStructureAPI = async (id) => {
  const response = await axiosInstance.patch(`/admin/salary/deactivate/${id}`);
  return response.data;
};

// Fetch deduction templates list (for dropdown)
export const getDeductionTemplatesAPI = async () => {
  const response = await axiosInstance.get("/admin/salary/deduction-templates");
  return response.data;
};
// Fetch deduction templates list (for dropdown)
export const getDeductionTemplateFromDesignationsAPI = async (id) => {
  const response = await axiosInstance.get(`/admin/salary/designation/${id}`);
  return response.data;
};

// Designation APIs
export const getDesignationsByIndustryAPI = (industryId) => {
  return axiosInstance.get(`/designations-by-industry/${industryId}`);
};

export const addDesignationAPI = (data) => {
  return axiosInstance.post("/designations", data);
};

export const getIndustriesAPI = () => {
  return axiosInstance.get("/get-industries");
};
