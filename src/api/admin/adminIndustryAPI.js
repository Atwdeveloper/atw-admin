import axiosInstance from "../axiosInstance";

// List industries with pagination, search, status filter, and sorting
export const getIndustriesAPI = async ({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  sort_by = "",
  sort_dir = "",
} = {}) => {
  const params = { page, per_page: limit };
  if (search) params.name = search;
  if (status) params.status = status;
  if (sort_by) params.sort_by = sort_by;
  if (sort_dir) params.sort_dir = sort_dir;
  const response = await axiosInstance.get("/admin/industries", { params });
  return response.data; // response structure: { status, data: { current_page, data: [...], total, last_page, ... }, message }
};

// Add a new industry
export const addIndustryAPI = async (payload) => {
  // payload: { name, code }
  const response = await axiosInstance.post("/admin/industries", payload);
  return response.data;
};

// Update an existing industry
export const updateIndustryAPI = async (id, payload) => {
  // payload: { name, code } or FormData (when uploading an image)
  if (payload instanceof FormData) {
    payload.append("_method", "PUT");
    const response = await axiosInstance.post(`/admin/industries/${id}`, payload);
    return response.data;
  }
  const response = await axiosInstance.put(`/admin/industries/${id}`, payload);
  return response.data;
};

// Delete an industry
export const deleteIndustryAPI = async (id) => {
  const response = await axiosInstance.delete(`/admin/industries/${id}`);
  return response.data;
};

// Toggle industry status (active/inactive)
export const toggleIndustryStatusAPI = async (id) => {
  const response = await axiosInstance.patch(`/admin/industries-toggle-status/${id}`);
  return response.data;
};

// Get a single industry by ID (for editing)
export const getIndustryByIdAPI = async (id) => {
  const response = await axiosInstance.get(`/admin/industries/${id}`);
  return response.data;
};

// Bulk delete selected industries
export const bulkDeleteIndustriesAPI = async (ids) => {
  const response = await axiosInstance.post("/admin/bulk-delete-industries", {
    ids,
  });
  return response.data;
};

// Bulk activate/deactivate selected industries
export const bulkToggleIndustryStatusAPI = async (ids, status) => {
  const response = await axiosInstance.post(
    "/admin/bulk-toggle-industry-status",
    { ids, status },
  );
  return response.data;
};