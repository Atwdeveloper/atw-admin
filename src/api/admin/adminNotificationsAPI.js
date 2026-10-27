import axiosInstance from "../axiosInstance";

// // Fetch all notifications (paginated)
// export const getNotificationsAPI = async (page = 1) => {
//   const response = await axiosInstance.get(`/notifications?page=${page}`);
//   return response.data;
// };
export const getNotificationsAPI = async (page = 1, type = null) => {
  let url = `/notifications?page=${page}`;

  if (type) {
    url += `&type=${type}`;
  }

  const response = await axiosInstance.get(url);
  return response.data;
};
// Mark single notification as read
export const markNotificationReadAPI = async (id) => {
  const response = await axiosInstance.post(
    `/notifications/${id}/mark-as-read`,
  );
  return response.data;
};

// Mark all notifications as read
export const markAllNotificationsReadAPI = async () => {
  const response = await axiosInstance.post("/notifications/mark-all-as-read");
  return response.data;
};

// Delete a notification
export const deleteNotificationAPI = async (id) => {
  const response = await axiosInstance.delete(`/notifications/${id}`);
  return response.data;
};

export const deleteAllNotificationsAPI = async () => {
  return axiosInstance.delete("deletenotifications/admin/all");
};

// Clear old notifications (custom endpoint – adjust if needed)
export const clearOldNotificationsAPI = async () => {
  const response = await axiosInstance.delete("/notifications/clear-old");
  return response.data;
};

// Get unread count for header badge
export const getUnreadCountAPI = async () => {
  const response = await axiosInstance.get("/notifications/unread-count");
  return response.data;
};

// Export notifications (CSV/Excel)
export const exportNotificationsAPI = async () => {
  const response = await axiosInstance.get("/notifications/export", {
    responseType: "blob",
  });
  return response;
};

// export const viewChangesAPI = async (module, record_id) => {
//   const response = await axiosInstance.post("/admin/view-changes", {
//     module,
//     record_id,
//   });
//   return response.data;
// };

// // Approve request
// export const approveRequestAPI = async (module, record_id) => {
//   const response = await axiosInstance.post("/admin/approval-action", {
//     module,
//     record_id,
//     action: "approve",
//   });
//   return response.data;
// };

// // Reject request
// export const rejectRequestAPI = async (module, record_id) => {
//   const response = await axiosInstance.post("/admin/approval-action", {
//     module,
//     record_id,
//     action: "reject",
//   });
//   return response.data;
// };

export const viewChangesAPI = async (approval_id) => {
  const response = await axiosInstance.post("/admin/view-changes", {
    approval_id,
  });
  return response.data;
};

export const approveRequestAPI = async (approval_id) => {
  const response = await axiosInstance.post("/admin/approval-action", {
    approval_id,
    action: "approve",
  });
  return response.data;
};

export const rejectRequestAPI = async (approval_id) => {
  const response = await axiosInstance.post("/admin/approval-action", {
    approval_id,
    action: "reject",
  });
  return response.data;
};

// import axiosInstance from "../axiosInstance";

// /*
// |--------------------------------------------------------------------------
// | 🔔 NOTIFICATION APIs
// |--------------------------------------------------------------------------
// */

// // Get notifications (normal + approval)
// export const getNotificationsAPI = async (page = 1, type = null) => {
//   let url = `/notifications?page=${page}`;

//   if (type) {
//     url += `&type=${type}`; // 🔥 support: approval / unread
//   }

//   const response = await axiosInstance.get(url);
//   return response.data;
// };

// // Mark single notification as read
// export const markNotificationReadAPI = async (id) => {
//   const response = await axiosInstance.post(`/notifications/${id}/mark-as-read`);
//   return response.data;
// };

// // Mark all notifications as read
// export const markAllNotificationsReadAPI = async () => {
//   const response = await axiosInstance.post("/notifications/mark-all-as-read");
//   return response.data;
// };

// // Delete notification
// export const deleteNotificationAPI = async (id) => {
//   const response = await axiosInstance.delete(`/notifications/${id}`);
//   return response.data;
// };

// // Get unread count (badge)
// export const getUnreadCountAPI = async () => {
//   const response = await axiosInstance.get("/notifications/unread-count");
//   return response.data;
// };

// /*
// |--------------------------------------------------------------------------
// | 🔥 APPROVAL APIs (Worker + Company)
// |--------------------------------------------------------------------------
// */

// // View changes (old vs new)
// export const viewChangesAPI = async (module, record_id) => {
//   const response = await axiosInstance.post("/admin/view-changes", {
//     module,
//     record_id,
//   });
//   return response.data;
// };

// // Approve request
// export const approveRequestAPI = async (module, record_id) => {
//   const response = await axiosInstance.post("/admin/approval-action", {
//     module,
//     record_id,
//     action: "approve",
//   });
//   return response.data;
// };

// // Reject request
// export const rejectRequestAPI = async (module, record_id) => {
//   const response = await axiosInstance.post("/admin/approval-action", {
//     module,
//     record_id,
//     action: "reject",
//   });
//   return response.data;
// };
