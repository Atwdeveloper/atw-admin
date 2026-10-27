import axiosInstance from "../axiosInstance"; 

export const getAdminDashboardAPI = async () => {
  const response = await axiosInstance.get("/admin/dashboard");
  return response.data;
};

export const globalSearchAPI = async (search) => {
  const response = await axiosInstance.get("/admin/global-search", {
    params: { search },
  });
  return response.data;
};