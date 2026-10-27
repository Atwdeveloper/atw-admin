import axiosInstance from "../axiosInstance";

export const getDressOrders = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/admin/dress-orders-index", {
      params,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDressOrderById = async (orderId) => {
  try {
    const response = await axiosInstance.get(
      `/admin/dress-order-detail/${orderId}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createDressOrder = async (orderData) => {
  try {
    const response = await axiosInstance.post(
      "/admin/dress-order-store",
      orderData,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateDressOrder = async (orderId, orderData) => {
  try {
    const response = await axiosInstance.put(
      `/admin/dress-order-update/${orderId}`,
      orderData,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteDressOrder = async (orderId) => {
  try {
    const response = await axiosInstance.delete(
      `/admin/dress-order-delete/${orderId}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateDressOrderStatus = async (orderId, statusData) => {
  try {
    const response = await axiosInstance.patch(
      `/admin/dress-order-status/${orderId}`,
      statusData,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getWorkersForDressOrder = async (params = {}) => {
  try {
    const response = await axiosInstance.get(
      "/admin/dress-orders-workers-list",
      { params },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// New methods for vendor assignment
export const getUnassignedDressOrders = async (params = {}) => {
  try {
    const response = await axiosInstance.get("/dress-orders/unassigned", {
      params,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const assignOrdersToVendor = async (assignmentData) => {
  try {
    const response = await axiosInstance.post(
      "/dress-orders/assign-vendor",
      assignmentData,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const bulkUpdateDressOrderStatus = async (orderIds, statusData) => {
  try {
    const response = await axiosInstance.patch("/dress-orders/bulk-status", {
      order_ids: orderIds,
      ...statusData,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
