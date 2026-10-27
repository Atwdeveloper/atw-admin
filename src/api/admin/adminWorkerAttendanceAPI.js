
import axiosInstance from "../axiosInstance";

export const getWorkersAPI = (params) => {
  return axiosInstance.get("/admin/applied-workers", { params });
};

export const signInAPI = (data) => {
  return axiosInstance.post("/admin/sign-in", data);
};

export const signOutAPI = (data) => {
  return axiosInstance.post("/admin/sign-out", data);
};

export const getStatesAPI = () => {
  return axiosInstance.get("/get-states");
};


export const getCitiesAPI = (stateId) => {
  return axiosInstance.post("/get-cities", { state_id: stateId });
};
export const getVacanciesAPI = (params) => {
  return axiosInstance.get("/company/vacancies", { params });
};

export const getActiveCompanyVacanciesAPI = (companyId) => {
  return axiosInstance.get("/activeCompnayVacancy", {
    params: {
      company_id: companyId,
    },
  });
};