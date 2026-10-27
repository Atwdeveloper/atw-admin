import axiosInstance from "../axiosInstance";

// Bundled dropdown data (e.g. industries) for the Designation listing filters
export const getDesignationFilterOptionsAPI = async () => {
  const response = await axiosInstance.get("/admin/designation-filter-options");
  return response.data;
};

// Get all designations (unscoped) with pagination, search, status, industry
// (multi-select), skill category, and sorting
export const getDesignationsAPI = async ({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  industry_ids = [],
  skill_category_id = "",
  sort_by = "",
  sort_dir = "",
} = {}) => {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("per_page", limit);
  if (search) params.append("search", search);
  if (status) params.append("status", status);
  industry_ids.forEach((id) => params.append("industry_ids[]", id));
  if (skill_category_id) params.append("skill_category_id", skill_category_id);
  if (sort_by) params.append("sort_by", sort_by);
  if (sort_dir) params.append("sort_dir", sort_dir);
  const response = await axiosInstance.get(`/admin/designations`, { params });
  return response.data;
};

// Get designations by industry with pagination, search, status filter
export const getDesignationsByIndustryAPI = async (industryId, { page = 1, limit = 10, search = "", status = "" } = {}) => {
  const params = { page, limit };
  if (search) params.search = search;
  if (status) params.status = status;
  const response = await axiosInstance.get(`/admin/designations-by-industry/${industryId}`, { params });
  return response.data;
};

// Get a single designation by ID (for editing)
export const getDesignationByIdAPI = async (designationId) => {
  const response = await axiosInstance.get(`/admin/designations/${designationId}`);
  return response.data;
};

// Add a new designation to an industry
export const addDesignationAPI = async (payload) => {
  // payload: { name, description, status } (status optional, defaults to active)
  const response = await axiosInstance.post(`/admin/designations`, payload);
  return response.data;
};

// Update a designation
export const updateDesignationAPI = async (designationId, payload) => {
  if (payload instanceof FormData) {
    payload.append("_method", "PUT");
    const response = await axiosInstance.post(
      `/admin/designations/${designationId}`,
      payload,
    );
    return response.data;
  }
  const response = await axiosInstance.put(`/admin/designations/${designationId}`, payload);
  return response.data;
};

// Add a new designation scoped to a specific industry (used from the
// Industry > Designations drill-down flow)
export const addDesignationByIndustryAPI = async (industryId, payload) => {
  // payload: { name, skill_category_id, status }
  const response = await axiosInstance.post(
    `/admin/industries/${industryId}/designations`,
    payload,
  );
  return response.data;
};

// Update a designation scoped to a specific industry (used from the
// Industry > Designations drill-down flow)
export const updateDesignationByIndustryAPI = async (
  industryId,
  designationId,
  payload,
) => {
  // payload: { name, skill_category_id, status } or FormData (when uploading an image)
  if (payload instanceof FormData) {
    payload.append("_method", "PUT");
    const response = await axiosInstance.post(
      `/admin/industries/${industryId}/designations/${designationId}`,
      payload,
    );
    return response.data;
  }
  const response = await axiosInstance.put(
    `/admin/industries/${industryId}/designations/${designationId}`,
    payload,
  );
  return response.data;
};

// Delete a designation
export const deleteDesignationAPI = async (designationId) => {
  const response = await axiosInstance.delete(`/admin/designations/${designationId}`);
  return response.data;
};

// Toggle designation status (active/inactive)
export const toggleDesignationStatusAPI = async (designationId) => {
  const response = await axiosInstance.post(`/admin/designations-toggle-status/${designationId}`);
  return response.data;
};

// Bulk delete selected designations
export const bulkDeleteDesignationsAPI = async (ids) => {
  const response = await axiosInstance.post("/admin/bulk-delete-designations", {
    ids,
  });
  return response.data;
};

// Bulk activate/deactivate selected designations
export const bulkToggleDesignationStatusAPI = async (ids, status) => {
  const response = await axiosInstance.post(
    "/admin/bulk-toggle-designation-status",
    { ids, status },
  );
  return response.data;
};