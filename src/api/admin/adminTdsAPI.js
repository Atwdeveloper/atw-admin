import axiosInstance from "../axiosInstance";

// Get all TDS rules (with optional params like pagination, search)
export const getTdsListAPI = async (params = {}) => {
  const response = await axiosInstance.get("/admin/tds/list", { params });
  return response.data;
};

// Get a single TDS rule details
export const getTdsDetailsAPI = async (id) => {
  const response = await axiosInstance.get(`/admin/tds/${id}`);
  return response.data;
};

// Create new TDS rule
export const createTdsAPI = async (payload) => {
  const response = await axiosInstance.post("/admin/tds/create", payload);
  return response.data;
};

// Update TDS rule
export const updateTdsAPI = async (id, payload) => {
  const response = await axiosInstance.put(`/admin/tds/update/${id}`, payload);
  return response.data;
};

// Delete TDS rule
export const deleteTdsAPI = async (id) => {
  const response = await axiosInstance.delete(`/admin/tds/delete/${id}`);
  return response.data;
};

// Activate / Deactivate TDS rule
export const activateTdsAPI = async (id) => {
  const response = await axiosInstance.patch(`/admin/tds/activate/${id}`);
  return response.data;
};

export const deactivateTdsAPI = async (id) => {
  const response = await axiosInstance.patch(`/admin/tds/deactivate/${id}`);
  return response.data;
};

// Get TDS slabs for a particular TDS rule (if needed)
export const getTdsSlabsAPI = async (tdsId) => {
  const response = await axiosInstance.get(`/admin/tds/${tdsId}/slabs`);
  return response.data;
};