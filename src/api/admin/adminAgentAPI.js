import axiosInstance from "../axiosInstance";

// Get agent list
export const getAgentsAPI = (params, options = {}) => {
  return axiosInstance.get("/admin/agents", { params, signal: options.signal });
};

// Get single agent
export const getAgentAPI = (id) => {
  return axiosInstance.get(`/admin/agents/${id}`);
};

// Create agent
export const createAgentAPI = (data) => {
  return axiosInstance.post("/admin/add-agent", data);
};

export const updateAgentAPI = (id, data) => {
  return axiosInstance.post(`/admin/edit-agent/${id}`, data);
};

// Delete agent
export const deleteAgentAPI = (id) => {
  return axiosInstance.delete(`/admin/delete-agent/${id}`);
};

// Toggle agent status
export const toggleAgentStatusAPI = (id, isActive) => {
  return axiosInstance.post(`/admin/toggle-agent-status/${id}`, { is_active: isActive });
};

// Get states for dropdown
export const getStatesAPI = () => {
  return axiosInstance.get("/get-states");
};

// Get cities by state
export const getCitiesByStateAPI = (state_id) => {
  return axiosInstance.post("/get-cities", { state_id });
};
export const getDepartmentsAPI = async () => {
  const response = await axiosInstance.get("/get-departments");
  return response.data;
};


export const getDesignationsAPI = (industryId) => {
  return axiosInstance.get(`/designations-by-industry/${industryId}`);
};
// Get industries
export const getIndustriesAPI = async () => {
  const response = await axiosInstance.get("/get-industries");
  return response.data;
};