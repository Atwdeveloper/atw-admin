import axiosInstance from "../axiosInstance";

// Vendor APIs
export const getVendors = async (params = {}, options = {}) => {
  try {
    const response = await axiosInstance.get("/admin/vendors", {
      params,
      signal: options.signal,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getVendorById = async (vendorId) => {
  try {
    const response = await axiosInstance.get(`/admin/show-vendor/${vendorId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createVendor = async (vendorData) => {
  try {
    const response = await axiosInstance.post("/admin/add-vendors", vendorData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateVendor = async (vendorId, vendorData) => {
  try {
    const response = await axiosInstance.put(
      `/admin/update-vendor/${vendorId}`,
      vendorData,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteVendor = async (vendorId) => {
  try {
    const response = await axiosInstance.delete(
      `/admin/delete-vendor/${vendorId}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getVendorOrders = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/admin/vendor-orders", {
      params,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createVendorOrder = async (orderData) => {
  try {
    const response = await axiosInstance.post(
      "/admin/vendor-orders/assign",
      orderData,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateVendorOrderStatus = async (orderId, statusData) => {
  try {
    const response = await axiosInstance.patch(
      `/admin/vendor-orders/${orderId}/status`,
      statusData,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resendVendorEmail = async (orderId, emailData = {}) => {
  try {
    const response = await axiosInstance.post(
      `/vendor-orders/${orderId}/resend-email`,
      emailData,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getVendorPerformance = async (vendorId) => {
  try {
    const response = await axiosInstance.get(
      `/vendors/${vendorId}/performance`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Email Templates
export const getEmailTemplates = async () => {
  try {
    const response = await axiosInstance.get("/email-templates/vendor-order");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateEmailTemplate = async (templateData) => {
  try {
    const response = await axiosInstance.post(
      "/email-templates/vendor-order",
      templateData,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Locations
export const getWorkerLocations = async () => {
  try {
    const response = await axiosInstance.get("/locations/workers");
    return response.data;
  } catch (error) {
    throw error;
  }
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

export const toggleVendorStatusAPI = (id, isActive) => {
  return axiosInstance.patch(`/admin/toggle-vendor-status/${id}`, {
    is_active: isActive,
  });
};
