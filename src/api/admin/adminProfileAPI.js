import axiosInstance from "../axiosInstance";

// Change Password
export const changePasswordAPI = async (body) => {
  const response = await axiosInstance.post("/admin/change-password", body);
  return response.data;
};

// Change Username
export const changeUsernameAPI = async (body) => {
  const response = await axiosInstance.post("/admin/change-username", body);
  return response.data;
};

export const changeEmailAPI = async (body) => {
  return axiosInstance.post("/admin/change-email", body);
};

// Get user profile
export const getProfileAPI = async () => {
  try {
    const response = await axiosInstance.get("/admin/staff-profile");
    return response;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
};

// Update profile
export const updateProfileAPI = async (data) => {
  try {
    const response = await axiosInstance.post("/admin/update-staff-profile", data);
    return response;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};



export const getStatesAPI = () => {
  return axiosInstance.get("/get-states");
};

// Add cities by states
export const getCitiesAPI = (state_id) => {
  return axiosInstance.post("/get-cities", {
     state_id,
  });
};

// Check username availability
export const checkUsernameAPI = async (username) => {
  try {
    const response = await axiosInstance.post("/api/check-username", { username });
    return response;
  } catch (error) {
    console.error("Error checking username:", error);
    throw error;
  }
};

