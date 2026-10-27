import axiosInstance from "../axiosInstance";

// Get staff list
export const getStaffsAPI = (params,options = {}) => {
  return axiosInstance.get("/admin/admin-staff", { params,signal: options.signal });
};

// Get single staff
export const getStaffAPI = (id) => {
  return axiosInstance.get(`/admin/admin-staff/${id}`);
};

// Create staff
export const createStaffAPI = (data) => {
  return axiosInstance.post("/admin/admin-staff-add", data);
};

// Update staff
export const updateStaffAPI = (id, data) => {
  return axiosInstance.post(`/admin/admin-staff-update/${id}`, data);
};

// Delete staff
export const deleteStaffAPI = (id) => {
  return axiosInstance.delete(`/admin/admin-staff-delete/${id}`);
};

// Toggle staff status
export const toggleStaffStatusAPI = (id, isActive) => {
  return axiosInstance.post(`/admin/admin-staff-toggle-status/${id}`, { is_active: isActive });
};

// Get roles for dropdown
export const getRolesAPI = () => {
  return axiosInstance.get("/get-admin-permission-profiles");
};

// Get designations for dropdown
export const getDesignationsAPI = (industryId) => {
  return axiosInstance.get(`/designations-by-industry/${industryId}`);
};

// Add new designation
export const addDesignationAPI = (data) => {
  return axiosInstance.post("/admin/designations", data);
};

// Get departments for dropdown
export const getDepartmentsAPI = () => {
  return axiosInstance.get("/get-departments");
};

// Add new department
export const addDepartmentAPI = (data) => {
  return axiosInstance.post("/admin/departments", data);
};

// Get industries for dropdown
export const getIndustriesAPI = () => {
  return axiosInstance.get("/get-industries");
};

// Add states
export const getStatesAPI = () => {
  return axiosInstance.get("/get-states");
};

// Add cities by states
export const getCitiesByStateAPI = (state_id) => {
  return axiosInstance.post("/get-cities", {
     state_id,
  });
};

// Cities for one or more states (multi-select filters) — GET /get-cities?state_ids[]=...
export const getCitiesByStatesAPI = (stateIds = []) => {
  const params = new URLSearchParams();
  stateIds.forEach((id) => params.append("state_ids[]", id));
  return axiosInstance.get("/get-cities", { params });
};

//chech username is unique
export const checkUsernameAPI = (username) => {
  return axiosInstance.get(`/admin/check-username-unique/${username}`);
};