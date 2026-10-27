import axiosInstance from "../axiosInstance";

export const getSiteSettingsAPI = async () => {
  const response = await axiosInstance.get("/admin/settings");
  return response.data;
};

export const updateSiteSettingsAPI = async (data) => {
  const response = await axiosInstance.post(
    "/admin/setting/update",
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};
