import axiosInstance from "../axiosInstance";
export const createVacancyAPI = (data) => {
  return axiosInstance.post("/admin/vacancy-add", data);
};
export const getVacancyAPI = (id) => {
  return axiosInstance.get(`/admin/vacancies/${id}`);
};

// Update vacancy
export const updateVacancyAPI = (id, data) => {
  return axiosInstance.put(`/admin/vacancy-update/${id}`, data);
};

// Delete vacancy
export const deleteVacancyAPI = (id) => {
  return axiosInstance.delete(`/admin/vacancy-delete/${id}`);
};

// Toggle vacancy status
// export const toggleVacancyStatusAPI = (id, isActive) => {
//   return axiosInstance.get(`/admin/vacancy-status/${id}`, {});
// };
export const toggleVacancyStatusAPI = (id, status) => {
  return axiosInstance.post(`/admin/vacancy-status/${id}`, { status: status });
  // or axiosInstance.put(...)
};
export const getCompaniesDropdown = async () => {
  const response = await axiosInstance.get("/admin/reports/companies/dropdown");
  return response.data;
};
// export const getDesignationsByCompanyDropdown = async (companyId) => {
//   const response = await axiosInstance.get("/admin/reports/designations/dropdown", {
//     params: { company_id: companyId },
//   });
//   return response.data;
// };
export const getDesignationsByCompanyDropdown = async (companyId) => {
  const response = await axiosInstance.get(
    "/admin/reports/designations/dropdown",
    {
      params: {
        company_id: companyId,
        filter: "template",
      },
    },
  );
  return response.data;
};
// export const getVacancyListingAPI = async (filters = {}) => {
//   const params = {
//     company_id: filters.company_id,
//     designation_id: filters.designation_id,
//     industry_id: filters.industry_id,
//     rate_type: filters.rate_type,
//     status: filters.status, // add status filter
//   };

//   // Optionally remove undefined/empty params
//   Object.keys(params).forEach(key => {
//     if (params[key] === undefined || params[key] === "") {
//       delete params[key];
//     }
//   });

//   const response = await axiosInstance.get("/admin/vacancy-listing", { params });
//   return response.data;
// };

export const getSkillsByDesignation = (designationId) => {
  return axiosInstance.get(
    `/admin/skills-by-designation/${designationId}?status=1`
  );
};
export const getVacancyListingAPI = async (filters = {}) => {
  const params = {
    company_id: filters.company_id,
    designation_id: filters.designation_id,
    industry_id: filters.industry_id,
    rate_type: filters.rate_type,
    status: filters.status,

    // ADD THESE
    page: filters.page,
    limit: filters.limit,
  };

  Object.keys(params).forEach((key) => {
    if (params[key] === undefined || params[key] === "") {
      delete params[key];
    }
  });

  const response = await axiosInstance.get("/admin/vacancy-listing", {
    params,
  });

  return response.data;
};
export const getIndustriesAPI = async () => {
  const response = await axiosInstance.get("/get-industries");
  return response.data;
};
export const getDesignationsAPI = async (industryId, params = {}) => {
  const response = await axiosInstance.get(
    `/designations-by-industry/${industryId}`,
    { params },
  );

  return response.data;
};
export const getVacancyApplicationsAPI = (vacancyId) => {
  return axiosInstance.get(`/admin/vacancies/applied-workers/${vacancyId}`);
};
export const getEligibleWorkersAPI = (vacancyId) => {
  return axiosInstance.get(`/admin/vacancies/eligible-workers/${vacancyId}`);
};

export const assignWorkerAPI = (data) => {
  return axiosInstance.post(`/admin/vacancies/assign-worker`, data);
};
export const onboardingAPI = (data) => {
  return axiosInstance.post("/admin/onboarding", data);
};

// ✅ Termination API
export const terminationAPI = (data) => {
  return axiosInstance.post("/admin/termination", data);
};

//// extra
export const getVacancyAttendanceAPI = (vacancyId, params) => {
  return axiosInstance.get(`/admin/vacancies/attendance/${vacancyId}`, {
    params,
  });
};

export const updateAttendanceAPI = (attendanceId, data) => {
  return axiosInstance.put(`/admin/attendance/${attendanceId}`, data);
};

export const createFeedbackAPI = (data) => {
  return axiosInstance.post("/admin/feedback", data);
};

export const getFeedbacksAPI = (workerId) => {
  return axiosInstance.get(`/company/feedbacks`, {
    params: { worker_id: workerId },
  });
};

export const deleteFeedbackAPI = (feedbackId) => {
  return axiosInstance.delete(`/company/feedback/${feedbackId}`);
};
export const updateApplicationStatusAPI = (applicationId, status) => {
  return axiosInstance.patch(`/company/vacancies/change-application-status`, {
    application_id: applicationId,
    status: status,
  });
};
