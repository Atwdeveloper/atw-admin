// modules/admin/api/reportsApi.js
import axiosInstance from "../axiosInstance";

// Job Vacancy & Fulfill Report
// export const getJobVacancyReport = async (params = {}) => {
//   const response = await axiosInstance.get("/admin/reports/job-vacancy", { params });
//   return response.data;
// };

// export const downloadJobVacancyReport = async (params = {}) => {
//   const response = await axiosInstance.get("/admin/reports/job-vacancy/download", {
//     params,
//     responseType: 'blob'
//   });
//   return response;
// };

// Earnings by Designations

export const getCompaniesByIndustryAPI = (params) => {
  return axiosInstance.get("/admin/reports/companies", { params });
};

export const getEarningsReport = async (params = {}) => {
  const response = await axiosInstance.get("/admin/reports/earnings", {
    params,
  });
  return response.data;
};

export const downloadEarningsReport = async (params = {}) => {
  const response = await axiosInstance.get("/admin/reports/earnings/download", {
    params,
    responseType: "blob",
  });
  return response;
};

// Job Reports
export const getJobReports = async (params = {}) => {
  const response = await axiosInstance.get("/admin/reports/jobs", { params });
  return response.data;
};

export const downloadJobReports = async (params = {}) => {
  const response = await axiosInstance.get("/admin/reports/jobs/download", {
    params,
    responseType: "blob",
  });
  return response;
};

// Worker Registration Reports
export const getWorkerRegistrationsReport = async (params = {}) => {
  const response = await axiosInstance.get(
    "/admin/reports/registrations/worker",
    { params },
  );
  return response.data;
};

export const downloadWorkerRegistrationsReport = async (params = {}) => {
  const response = await axiosInstance.get(
    "/admin/reports/registrations/worker/download",
    {
      params,
      responseType: "blob",
    },
  );
  return response;
};

// Company Registration Reports
export const getCompanyRegistrationsReport = async (params = {}) => {
  const response = await axiosInstance.get(
    "/admin/reports/registrations/company",
    { params },
  );
  return response.data;
};

export const downloadCompanyRegistrationsReport = async (params = {}) => {
  const response = await axiosInstance.get(
    "/admin/reports/registrations/company/download",
    {
      params,
      responseType: "blob",
    },
  );
  return response;
};

// Turnover Reports
export const getTurnoverReport = async (params = {}) => {
  const response = await axiosInstance.get("/admin/reports/turnover", {
    params,
  });
  return response.data;
};

export const downloadTurnoverReport = async (params = {}) => {
  const response = await axiosInstance.get("/admin/reports/turnover/download", {
    params,
    responseType: "blob",
  });
  return response;
};

// PF Reports
export const getPFReportPreview = async (params = {}) => {
  const response = await axiosInstance.get("/admin/reports/pf-report/preview", {
    params,
  });
  return response.data;
};

export const downloadPFReport = async (params = {}) => {
  const response = await axiosInstance.get("/admin/reports/pf-report", {
    params,
    responseType: "blob",
  });
  return response;
};

// ECR Reports
export const getECRReportPreview = async (params = {}) => {
  const response = await axiosInstance.get("/admin/reports/pf-ecr/preview", {
    params,
  });
  return response.data;
};

export const downloadECRReport = async (params = {}) => {
  const response = await axiosInstance.get("/admin/reports/pf-ecr", {
    params,
    responseType: "blob",
  });
  return response;
};

// ESIC Reports
export const getESICReportPreview = async (params = {}) => {
  const response = await axiosInstance.get(
    "/admin/reports/esic-report/preview",
    { params },
  );
  return response.data;
};

export const downloadESICReport = async (params = {}) => {
  const response = await axiosInstance.get("/admin/reports/esic-report", {
    params,
    responseType: "blob",
  });
  return response;
};

// Dropdown Options
export const getReportCompanies = async () => {
  const response = await axiosInstance.get("/admin/reports/companies");
  return response.data;
};

export const getReportDesignations = async () => {
  const response = await axiosInstance.get("/admin/reports/designations");
  return response.data;
};

export const getReportStates = async () => {
  const response = await axiosInstance.get("/admin/reports/states");
  return response.data;
};

export const getReportDistricts = async (stateId = null) => {
  const params = stateId ? { state_id: stateId } : {};
  const response = await axiosInstance.get("/admin/reports/districts", {
    params,
  });
  return response.data;
};

export const getReportIndustries = async () => {
  const response = await axiosInstance.get("/admin/reports/industries");
  return response.data;
};

// Report Types
export const getReportTypes = async () => {
  const response = await axiosInstance.get("/admin/reports/types");
  return response.data;
};
export const getComplianceDocuments = async (params = {}) => {
  const response = await axiosInstance.get(
    "/admin/reports/compliance-documents",
    { params },
  );
  return response.data;
};

export const uploadComplianceDocument = async (formData) => {
  const response = await axiosInstance.post(
    "/admin/reports/compliance-documents",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

export const deleteComplianceDocument = async (id) => {
  const response = await axiosInstance.delete(
    `/admin/reports/compliance-documents/${id}`,
  );
  return response.data;
};
//all reports api

export const getIndustriesAPI = () => {
  return axiosInstance.get("/get-industries");
};
export const getDesignationsAPI = (industryId) => {
  return axiosInstance.get(`/designations-by-industry/${industryId}`);
};
export const getDesignationsByIndustryAPI = async (industryId) => {
  const response = await axiosInstance.get(
    `/designations-by-industry/${industryId}`,
  );
  return response.data;
};
export const getCompaniesDropdown = async () => {
  const response = await axiosInstance.get("/admin/reports/companies/dropdown");
  return response.data; // expected: { success: true, data: [{ id, name }] }
};

export const getJobVacancyReport = async (params) => {
  // params: { page, limit, start_date, end_date, company_id, industry_id, ... }
  const response = await axiosInstance.get("/admin/reports/vacancies", {
    params,
  });
  return response.data;
};

// export const downloadJobVacancyReport = async (params) => {
//   const response = await axiosInstance.get("/admin/reports/vacancies", {
//     params,
//     responseType: "blob",
//   });
//   return response; // Axios response wrapper, .data is the Blob
// };
export const downloadJobVacancyReport = async (params) => {
  const response = await axiosInstance.get(
    "/admin/reports/vacancies",
    {
      params,
    }
  );

  return response;
};
export const getStatesAPI = () => {
  return axiosInstance.get("/get-states");
};

export const getCitiesByStateAPI = (state_id) => {
  return axiosInstance.post("/get-cities", {
    state_id,
  });
};

export const getCompanyRegistrationReport = async (params) => {
  const response = await axiosInstance.get("/admin/reports/companies", {
    params,
  });
  return response.data;
};

export const downloadCompanyRegistrationReport = async (params) => {
  const response = await axiosInstance.get("/admin/reports/companies", {
    params,
    // responseType: "blob",
  });
  return response;
};

export const getWorkerRegistrationReport = async (params) => {
  const response = await axiosInstance.get("/admin/reports/workers", {
    params,
  });
  return response.data;
};

export const downloadWorkerRegistrationReport = async (params) => {
  const response = await axiosInstance.get("/admin/reports/workers", {
    params,
    // responseType: "blob",
  });
  return response;
};

// ============ WORKER DROPDOWN ============
export const getWorkersDropdown = async () => {
  const response = await axiosInstance.get("/admin/reports/workers/dropdown");
  return response.data;
};

export const getEarningsByDesignationReport = async (params) => {
  const response = await axiosInstance.get(
    "/admin/reports/earnings-by-designation",
    { params },
  );
  return response.data;
};

export const downloadEarningsByDesignationReport = async (params) => {
  const response = await axiosInstance.get(
    "/admin/reports/earnings-by-designation",
    {
      params,
      // responseType: "blob",
    },
  );
  return response;
};

export const getDesignationsByCompanyDropdown = async (companyId) => {
  const response = await axiosInstance.get(
    "/admin/reports/designations/dropdown",
    {
      params: { company_id: companyId },
    },
  );
  return response.data;
};

export const getWorkerWalletTransactionsReport = async (params) => {
  const response = await axiosInstance.get(
    "/admin/reports/worker-wallet-transactions",
    { params },
  );
  return response.data;
};

export const getWorkerPayoutReport = async (params) => {
  const response = await axiosInstance.get("/admin/reports/worker-payouts", {
    params,
  });
  return response.data;
};

export const getWorkerWalletEntriesReport = async (params) => {
  const response = await axiosInstance.get(
    "/admin/reports/worker-wallet-entries",
    { params },
  );
  return response.data;
};

// Fetch Worker Wallet Profile
export const fetchWorkerWalletProfile = async (workerId) => {
  const response = await axiosInstance.get(
    `/admin/reports/worker-wallet-profile/${workerId}`,
  );
  return response.data;
};

// Salary Sheets API
export const getSalarySheetsAPI = async (params = {}) => {
  const response = await axiosInstance.get("/admin/reports/salary-sheets", {
    params,
  });
  return response.data;
};

export const exportSalarySheetAPI = async (params = {}) => {
  const response = await axiosInstance.get("/admin/reports/salary-sheets/export", {
    params,
    responseType: "blob",
  });
  return response;
};
export const downloadWorkerWalletTransactionsReport = async (params) => {
  const response = await axiosInstance.get(
    "/admin/reports/worker-wallet-transactions",
    {
      params,
    },
  );

  return response;
};
export const downloadWorkerWalletEntriesReport = async (params) => {
  const response = await axiosInstance.get(
    "/admin/reports/worker-wallet-entries",
    { params }
  );

  return response.data;
};

export const downloadWorkerPayoutReport = async (params) => {
  const response = await axiosInstance.get(
    "/admin/reports/worker-payouts",
    {
      params,
    }
  );

  return response.data;
};