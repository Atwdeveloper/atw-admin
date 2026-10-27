import axiosInstance from "../axiosInstance";

// Get dropdown data (states + skill categories) for the minimum wage form/filters
export const getMinimumWageInitAPI = async () => {
  const response = await axiosInstance.get("/admin/minimum-wage/init");
  return response.data;
};

// Bundled dropdown data for the Minimum Wage listing filters
export const getMinimumWageFilterOptionsAPI = async () => {
  const response = await axiosInstance.get("/admin/minimum-wage/filter-options");
  return response.data;
};

// List minimum wage rates with pagination and filters. state_ids/skill_category_ids
// are arrays (multi-select) sent as repeated state_id[]=.../skill_category_id[]=...
// query params, matching the backend's expected array format.
export const getMinimumWagesAPI = async ({
  page = 1,
  limit = 10,
  state_ids = [],
  skill_category_ids = [],
  status = "",
  sort_by = "",
  sort_dir = "",
} = {}) => {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  state_ids.forEach((id) => params.append("state_id[]", id));
  skill_category_ids.forEach((id) => params.append("skill_category_id[]", id));
  if (status) params.append("status", status);
  if (sort_by) params.append("sort_by", sort_by);
  if (sort_dir) params.append("sort_dir", sort_dir);
  const response = await axiosInstance.get("/admin/minimum-wage/list", {
    params,
  });
  return response.data;
};

// Create a new minimum wage rate
export const addMinimumWageAPI = async (payload) => {
  // payload: { state_id, skill_category_id, min_daily_rate }
  const response = await axiosInstance.post(
    "/admin/minimum-wage/create",
    payload,
  );
  return response.data;
};

// Get a single minimum wage rate by ID (for editing)
export const getMinimumWageByIdAPI = async (id) => {
  const response = await axiosInstance.get(`/admin/minimum-wage/rate/${id}`);
  return response.data;
};

// Update an existing minimum wage rate
export const updateMinimumWageAPI = async (id, payload) => {
  // payload: { state_id, skill_category_id, min_daily_rate }
  const response = await axiosInstance.put(
    `/admin/minimum-wage/update/${id}`,
    payload,
  );
  return response.data;
};

// Delete a minimum wage rate
export const deleteMinimumWageAPI = async (id) => {
  const response = await axiosInstance.delete(
    `/admin/minimum-wage/delete/${id}`,
  );
  return response.data;
};

// Toggle minimum wage rate status (active/inactive)
export const toggleMinimumWageStatusAPI = async (id) => {
  const response = await axiosInstance.patch(
    `/admin/minimum-wage/toggle-status/${id}`,
  );
  return response.data;
};

// Bulk delete selected minimum wage rates
export const bulkDeleteMinimumWagesAPI = async (ids) => {
  const response = await axiosInstance.post("/admin/minimum-wage/bulk-delete", {
    ids,
  });
  return response.data;
};

// Bulk activate/deactivate selected minimum wage rates
export const bulkToggleMinimumWageStatusAPI = async (ids, status) => {
  const response = await axiosInstance.post(
    "/admin/minimum-wage/bulk-toggle-status",
    { ids, status },
  );
  return response.data;
};
