import axiosInstance from "../axiosInstance";

// Get Workers List (search + pagination). `params` is a pre-built
// URLSearchParams (or plain object) — see buildApiParams in
// useWorkerListing.js for how multi-select filters and sorting get encoded.
export const getWorkersAPI = async (params, options = {}) => {
  const response = await axiosInstance.get("/admin/workers", {
    params,
    signal: options.signal,
  });

  return response.data;
};

// Add new worker
export const addWorkerAPI = async (workerData) => {
  const response = await axiosInstance.post("/admin/add-workers", workerData);
  return response.data;
};

// Admin-side mobile/Aadhaar OTP verification used to prefill the Add Worker
// form (AadhaarVerifyModal.jsx). Admin-authenticated, unlike the public
// worker self-registration endpoints these mirror.
export const sendWorkerMobileOtpAPI = async (mobile_number) => {
  const response = await axiosInstance.post("/admin/worker/send-mobile-otp", {
    mobile_number,
  });
  return response.data;
};

export const resendWorkerMobileOtpAPI = async (mobile_number) => {
  const response = await axiosInstance.post(
    "/admin/worker/resend-mobile-otp",
    { mobile_number },
  );
  return response.data;
};

export const verifyWorkerMobileOtpAPI = async (mobile_number, otp) => {
  const response = await axiosInstance.post(
    "/admin/worker/verify-mobile-otp",
    { mobile_number, otp },
  );
  return response.data;
};

export const sendWorkerAadhaarOtpAPI = async (aadhaar_number) => {
  const response = await axiosInstance.post(
    "/admin/worker/send-aadhaar-otp",
    { aadhaar_number },
  );
  return response.data;
};

export const resendWorkerAadhaarOtpAPI = async (aadhaar_number) => {
  const response = await axiosInstance.post(
    "/admin/worker/resend-aadhaar-otp",
    { aadhaar_number },
  );
  return response.data;
};

export const verifyWorkerAadhaarOtpAPI = async (otp, reference_id) => {
  const response = await axiosInstance.post(
    "/admin/worker/verify-aadhaar-otp",
    { otp, reference_id },
  );
  return response.data;
};
export const getStaffListAPI = async () => {
  const response = await axiosInstance.get("/admin/staff/all");
  return response.data;
};
// Get single worker details
export const getWorkerByIdAPI = async (id) => {
  const response = await axiosInstance.get(`/admin/get-worker/${id}`);
  return response.data;
};

// Update worker
export const updateWorkerAPI = async (id, workerData) => {
  const response = await axiosInstance.put(
    `/admin/update-worker/${id}`,
    workerData,
  );
  return response.data;
};

// Delete Worker
export const deleteWorkerAPI = async (id) => {
  const response = await axiosInstance.delete(`/admin/delete-worker/${id}`);
  return response.data;
};
export const getAgentsListAPI = async () => {
  const response = await axiosInstance.get("/admin/agents-list");
  return response.data;
};
// Toggle Worker Status
export const toggleWorkerStatusAPI = async (id, isActive) => {
  const response = await axiosInstance.post(
    `/admin/toggle-worker-status/${id}`,
  );
  return response.data;
};

// Export workers
export const exportWorkersAPI = async (filters) => {
  const response = await axiosInstance.get("/admin/export-workers", {
    params: filters,
    responseType: "blob",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response;
};

// Bulk delete selected workers
export const bulkDeleteWorkersAPI = async (ids) => {
  const response = await axiosInstance.post("/admin/bulk-delete-workers", {
    ids,
  });
  return response.data;
};

// Bulk activate/deactivate selected workers
export const bulkToggleWorkerStatusAPI = async (ids, status) => {
  const response = await axiosInstance.post(
    "/admin/bulk-toggle-worker-status",
    { ids, status },
  );
  return response.data;
};

// Export only the selected workers (JSON, not a file) — the actual .xlsx is
// built client-side from this, matching bulkExportSelectedCompaniesAPI.
export const bulkExportSelectedWorkersAPI = async (ids) => {
  const response = await axiosInstance.post("/admin/export-selected-workers", {
    ids,
  });
  return response.data;
};

// Bundled dropdown data (industries, designations, states, cities, agents,
// RMs) for the Worker listing filters — one call instead of several.
export const getWorkerFilterOptionsAPI = async () => {
  const response = await axiosInstance.get("/admin/worker-filter-options");
  return response.data;
};

// Bulk upload workers
export const bulkUploadWorkersAPI = async (formData) => {
  const response = await axiosInstance.post(
    "/admin/workers/bulk-upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

// Designation APIs
// export const getDesignationsAPI = async (industryId) => {
//   const response = await axiosInstance.get(`/designations-by-industry/${industryId}`);
//   return response.data;
// };
export const getDesignationsAPI = async (industryId, params = {}) => {
  const response = await axiosInstance.get(
    `/designations-by-industry/${industryId}`,
    { params },
  );

  return response.data;
};
// Full, unfiltered designation list — used when no industry is selected,
// since industry and designation are independent filters on this form.
// Same endpoint the Designation Listing (management) screen uses.
export const getAllDesignationsAPI = async (params = {}) => {
  const response = await axiosInstance.get("/admin/designations", { params });
  return response.data;
};
export const addDesignationAPI = async (data) => {
  const response = await axiosInstance.post("/admin/designations", data);
  return response.data;
};

// Department APIs
export const getDepartmentsAPI = async () => {
  const response = await axiosInstance.get("/get-departments");
  return response.data;
};

export const addDepartmentAPI = async (data) => {
  const response = await axiosInstance.post("/add-department", data);
  return response.data;
};

// Industry APIs
export const getIndustriesAPI = async () => {
  const response = await axiosInstance.get("/get-industries");
  return response.data;
};

// State and City APIs
export const getStatesAPI = async () => {
  const response = await axiosInstance.get("/get-states");
  return response.data;
};

export const getCitiesByStateAPI = async (state_id) => {
  const response = await axiosInstance.post("/get-cities", {
    state_id,
  });
  return response.data;
};
export const verifyBankAccountAPI = async (data) => {
  const response = await axiosInstance.post("/admin/verify-bank-account", data);
  return response.data;
};

export const getWorkerWalletSummaryAPI = async (workerId, params) => {
  const response = await axiosInstance.get(
    `/admin/worker/wallet-summary/${workerId}`,
    { params },
  );
  return response.data;
};

export const getWorkerWalletHistoryAPI = async (workerId, params) => {
  const response = await axiosInstance.get(
    `/admin/worker/wallet-history/${workerId}`,
    { params },
  );
  return response.data;
};

export const updateWorkerWalletHoldAPI = async (
  workerId,
  holdAmount,
  reason,
) => {
  const response = await axiosInstance.post(
    `/admin/worker/wallet-hold/${workerId}`,
    { hold_amount: holdAmount, reason },
  );
  return response.data;
};

export const releaseWorkerWalletHoldAPI = async (
  holdId,
  action = "release",
) => {
  const response = await axiosInstance.post(
    `/admin/worker/wallet-hold/release/${holdId}`,
    { action },
  );
  return response.data;
};
export const getSkillsByDesignation = async (designationId) => {
  const response = await axiosInstance.get(
    `/admin/skills-by-designation/${designationId}?status=1`
  );
  return response.data;
};

export const withdrawWorkerWalletAPI = async (workerId, amount) => {
  const response = await axiosInstance.post(
    `/admin/worker/wallet-withdraw/${workerId}`,
    { amount },
  );
  return response.data;
};

export const updateWorkerWalletAutoWithdrawalAPI = async (
  workerId,
  settings,
) => {
  const response = await axiosInstance.post(
    `/admin/worker/wallet-auto-withdrawal/${workerId}`,
    settings,
  );
  return response.data;
};
export const getWorkerCommentsAPI = async (workerId) => {
  const response = await axiosInstance.get(
    `/admin/worker-feedback/${workerId}`,
  );
  return response.data;
};

export const deleteWorkerCommentAPI = async (commentId) => {
  const response = await axiosInstance.delete(
    `/admin/delete-feedback/${commentId}`,
  );
  return response.data;
};
export const bulkUploadWorkers = async (formData) => {
  const response = await axiosInstance.post(
    "/admin/bulk-upload-worker",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};
export const getAgentsAPI = async () => {
  const response = await axiosInstance.get("/admin/agents-list");
  return response.data;
};
