import axiosInstance from "../axiosInstance";

// Get vacancy list
export const getVacanciesAPI = (params) => {
  return axiosInstance.get("/company/vacancies", { params });
};

// Get single vacancy
export const getVacancyAPI = (id) => {
  return axiosInstance.get(`/company/vacancies/${id}`);
};

// Create vacancy
export const createVacancyAPI = (data) => {
  return axiosInstance.post("/company/vacancies-add", data);
};

// Update vacancy
export const updateVacancyAPI = (id, data) => {
  return axiosInstance.put(`/company/vacancies/${id}`, data);
};

// Delete vacancy
export const deleteVacancyAPI = (id) => {
  return axiosInstance.delete(`/company/vacancies/${id}`);
};

// Toggle vacancy status
export const toggleVacancyStatusAPI = (id, isActive) => {
  return axiosInstance.get(`/company/vacancies/status/${id}`, {});
};

export const getStatesAPI = () => {
  return axiosInstance.get("/get-states");
};

// Fetch cities for a given state
export const getCitiesAPI = (stateId) => {
  return axiosInstance.post("/get-cities", { state_id: stateId });
};
export const getCitiesByStateAPI = (state_id) => {
  return axiosInstance.post("/get-cities", {
    state_id,
  });
};

// Update application status (shortlist, reject, etc.)
export const updateApplicationStatusAPI = (applicationId, status) => {
  return axiosInstance.patch(`/company/vacancies/change-application-status`, {
    application_id: applicationId,
    status: status,
  });
};

// export const getDesignationsAPI = (industryId) => {
//   return axiosInstance.get(`/designations-by-industry/${industryId}`);
// };
export const getDesignationsAPI = (industryId) => {
  return axiosInstance.get(`/designations-by-industry/${industryId}`, {
    params: {
      filter: "template",
    },
  });
};
export const getIndustriesAPI = () => {
  return axiosInstance.get("/get-industries");
};

export const getVacancyApplicationsAPI = (vacancyId) => {
  return axiosInstance.get(`/company/vacancies/applied-workers/${vacancyId}`);
};
export const getEligibleWorkersAPI = (vacancyId) => {
  return axiosInstance.get(`/company/vacancies/eligible-workers/${vacancyId}`);
};

export const assignWorkerAPI = (data) => {
  return axiosInstance.post(`/company/vacancies/assign-worker`, data);
};

// ✅ Onboarding API
export const onboardingAPI = (data) => {
  return axiosInstance.post("/company/onboarding", data);
};

// ✅ Termination API
export const terminationAPI = (data) => {
  return axiosInstance.post("/company/termination", data);
};
export const getVacancyAttendanceAPI = (vacancyId, params) => {
  return axiosInstance.get(`/company/vacancies/attendance/${vacancyId}`, {
    params,
  });
};

export const updateAttendanceAPI = (attendanceId, data) => {
  return axiosInstance.put(`/company/attendance/${attendanceId}`, data);
};

export const createFeedbackAPI = (data) => {
  return axiosInstance.post("/company/feedback", data);
};

export const getFeedbacksAPI = (workerId) => {
  return axiosInstance.get(`/company/feedbacks`, {
    params: { worker_id: workerId },
  });
};

export const deleteFeedbackAPI = (feedbackId) => {
  return axiosInstance.delete(`/company/feedback/${feedbackId}`);
};
export const viewWorkerDocumentAPI = (id) => {
  return axiosInstance.get(`/worker-document/view/${id}`, {
    responseType: "blob",
  });
};

export const downloadWorkerDocumentAPI = (id) => {
  return axiosInstance.get(`/worker-document/download/${id}`, {
    responseType: "blob",
  });
};
