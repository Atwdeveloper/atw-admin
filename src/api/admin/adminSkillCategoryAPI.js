import axiosInstance from "../axiosInstance";

// List skill categories with pagination, name and status filters
export const getSkillCategoriesAPI = async ({
  page = 1,
  per_page = 100,
  name = "",
  status = "",
  sort_by = "",
  sort_dir = "",
} = {}) => {
  const params = { page, per_page };
  if (name) params.name = name;
  if (status) params.status = status;
  if (sort_by) params.sort_by = sort_by;
  if (sort_dir) params.sort_dir = sort_dir;
  const response = await axiosInstance.get("/admin/skill-categories", {
    params,
  });
  return response.data;
};

// Add a new skill category
export const addSkillCategoryAPI = async (payload) => {
  // payload: { name, code, status }
  const response = await axiosInstance.post(
    "/admin/skill-categories",
    payload,
  );
  return response.data;
};

// Get a single skill category by ID (for viewing/editing)
export const getSkillCategoryByIdAPI = async (id) => {
  const response = await axiosInstance.get(`/admin/skill-categories/${id}`);
  return response.data;
};

// Update an existing skill category
export const updateSkillCategoryAPI = async (id, payload) => {
  // payload: { name, code, status }
  const response = await axiosInstance.put(
    `/admin/skill-categories/${id}`,
    payload,
  );
  return response.data;
};

// Delete a skill category
export const deleteSkillCategoryAPI = async (id) => {
  const response = await axiosInstance.delete(`/admin/skill-categories/${id}`);
  return response.data;
};

// Toggle skill category status (active/inactive)
export const toggleSkillCategoryStatusAPI = async (id) => {
  const response = await axiosInstance.post(
    `/admin/skill-categories-toggle-status/${id}`,
  );
  return response.data;
};

// Bulk delete selected skill categories
export const bulkDeleteSkillCategoriesAPI = async (ids) => {
  const response = await axiosInstance.post(
    "/admin/bulk-delete-skill-categories",
    { ids },
  );
  return response.data;
};

// Bulk activate/deactivate selected skill categories
export const bulkToggleSkillCategoryStatusAPI = async (ids, status) => {
  const response = await axiosInstance.post(
    "/admin/bulk-toggle-skill-category-status",
    { ids, status },
  );
  return response.data;
};
