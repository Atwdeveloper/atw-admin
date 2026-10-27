import axiosInstance from "../axiosInstance";

// Add Company (already present)
export const addCompanyAPI = async (payload) => {
  const response = await axiosInstance.post("/admin/add-company", payload);
  return response.data;
};

// Verify GST number (admin add-company GST lookup)
// Returns { success, message, data: { company_name, gst_number, pan_number, ... } }
export const verifyGstNumberAdminAPI = async (gstin) => {
  const response = await axiosInstance.post("/admin/verify-gst", { gstin });
  return response.data;
};
export const addAgentCommissionAPI = async (payload) => {
  const response = await axiosInstance.post(
    "/admin/add-agent-commission",
    payload,
  );
  return response.data;
};
export const updateAgentCommissionAPI = async (payload) => {
  const response = await axiosInstance.post(
    "/admin/update-agent-commission",
    payload,
  );
  return response.data;
};

export const getAgentsListAPI = async () => {
  const response = await axiosInstance.get("/admin/agents-list");
  return response.data;
};
//get staff list
export const getStaffListAPI = async () => {
  const response = await axiosInstance.get("/admin/staff/all");
  return response.data;
};

// Bundled dropdown data (industries, states, agents, RMs, etc.) for the
// Company Listing filters, in one call instead of several separate ones.
export const getCompanyFilterOptionsAPI = async () => {
  const response = await axiosInstance.get("/admin/company-filter-options");
  return response.data;
};
export const getCompaniesAPI = async (params = {}, options = {}) => {
  try {
    const response = await axiosInstance.get("/admin/companies", {
      params,
      signal: options.signal,
      ...options,
    });
    return response.data;
  } catch (error) {
    // Re-throw abort errors so they can be handled specially
    if (
      error.name === "AbortError" ||
      error.name === "CanceledError" ||
      error.code === "ERR_CANCELED"
    ) {
      throw error;
    }
    throw error;
  }
};

//fetch Industires
export const getIndustriesAPI = async () => {
  const response = await axiosInstance.get("/get-industries");
  return response.data;
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

// Delete Company
export const deleteCompanyAPI = async (id) => {
  const response = await axiosInstance.delete(`/admin/delete-company/${id}`);
  return response.data;
};

// Duplicate/Copy Company
export const toggleCompanyStatusAPI = async (id) => {
  const response = await axiosInstance.post(
    `/admin/toggle-company-status/${id}`,
  );
  return response.data;
};

export const getJobOpenings = async (companyId, filters) => {
  const response = await axiosInstance.get(
    `/admin/company-vacancies/${companyId}`,
    {
      params: filters,
    },
  );
  return response.data;
};

export const getCompanyDetailsAPI = async (companyId) => {
  const response = await axiosInstance.get(`/admin/edit-company/${companyId}`);
  return response.data;
};

export const editCompanyAPI = async (companyId, payload) => {
  const response = await axiosInstance.post(
    `/admin/edit-company/${companyId}`,
    payload,
  );
  return response.data;
};

// export const exportCompaniesAPI = async (filters) => {
//   try {
//     const response = await axiosInstance.get(
//       "/admin/export-companies",
//       {
//         params: filters,
//         responseType: "blob",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     return response;
//   } catch (error) {
//     throw error;
//   }
// };

export const exportCompaniesAPI = async (filters, options = {}) => {
  try {
    const response = await axiosInstance.get("/admin/export-companies", {
      params: filters,
      responseType: "blob",
      signal: options.signal, // Pass abort signal
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    return response;
  } catch (error) {
    // Re-throw abort errors
    if (
      error.name === "AbortError" ||
      error.name === "CanceledError" ||
      error.code === "ERR_CANCELED"
    ) {
      throw error;
    }
    throw error;
  }
};

// Register new company
export const registerCompany = async (companyData) => {
  try {
    const response = await axiosInstance.post("/auth/register", companyData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Verify email/activate account
export const activateAccount = async (token) => {
  try {
    const response = await axiosInstance.post("/auth/activate", { token });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Demo registration fallback
export const demoCompanyRegister = (companyData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate email check
      const existingEmails = ["existing@demo.com"];
      if (existingEmails.includes(companyData.email)) {
        reject({
          response: {
            data: {
              message: "Email already registered",
            },
          },
        });
      } else {
        // Generate unique code for demo
        const uniqueCode = "COMP" + Date.now().toString().slice(-8);

        resolve({
          success: true,
          data: {
            message:
              "Registration successful. Please check your email for activation link.",
            unique_code: uniqueCode,
            company_id: Date.now(),
            activation_token: "demo-token-" + Date.now(),
          },
        });
      }
    }, 1500);
  });
};

// Get Vacancy Listing
// export const getVacancyListingAPI = async (filters = {}) => {
//   const response = await axiosInstance.get("/admin/vacancy-listing", {
//     params: {
//       company_id: filters.company_id,
//       designation_id: filters.designation_id,
//       industry_id: filters.industry_id,
//       rate_type: filters.rate_type,
//     },
//   });

//   return response.data;
// };
export const getVacancyListingAPI = async (filters = {}) => {
  const params = {
    company_id: filters.company_id,
    designation_id: filters.designation_id,
    industry_id: filters.industry_id,
    rate_type: filters.rate_type,
    status: filters.status, // add status filter
  };

  // Optionally remove undefined/empty params
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

export const getCompaniesDropdown = async () => {
  const response = await axiosInstance.get("/admin/reports/companies/dropdown");
  return response.data;
};
export const bulkUploadCompanies = async (formData) => {
  const response = await axiosInstance.post(
    "/admin/bulk-upload-company",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};

// Bulk actions on selected companies
export const bulkToggleCompanyStatusAPI = async (ids, status) => {
  const response = await axiosInstance.post(
    "/admin/bulk-toggle-company-status",
    { ids, status },
  );
  return response.data;
};

export const bulkDeleteCompaniesAPI = async (ids) => {
  const response = await axiosInstance.post("/admin/bulk-delete-companies", {
    ids,
  });
  return response.data;
};

// Returns JSON company records for the selected ids — { status, data: [...] } —
// the frontend builds the actual Excel file client-side from this.
export const bulkExportSelectedCompaniesAPI = async (ids) => {
  const response = await axiosInstance.post(
    "/admin/export-selected-companies",
    { ids },
  );
  return response.data;
};
