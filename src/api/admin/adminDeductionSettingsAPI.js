import axiosInstance from "../axiosInstance";

// Fetch all deduction components (employer & employee)
export const getDeductionComponentsAPI = async () => {
  const response = await axiosInstance.get("/admin/deductions/components");
  return response.data;
};

// Fetch default template values
export const getDefaultTemplateAPI = async () => {
  const response = await axiosInstance.get("/admin/deductions/default");
  return response.data;
};

// Update default template values
export const updateDefaultTemplateAPI = async (payload) => {
  const response = await axiosInstance.put("/admin/deductions/default", payload);
  return response.data;
};

// Fetch compliance rules (statutory caps)
export const getComplianceRulesAPI = async () => {
  const response = await axiosInstance.get("/admin/deductions/compliance-rules");
  return response.data;
};

// Update compliance rules
export const updateComplianceRulesAPI = async (payload) => {
  const response = await axiosInstance.put("/admin/deductions/compliance-rules", payload);
  return response.data;
};

// (Optional) Keep designations API if still needed elsewhere
export const getAllDesignationsAPI = async () => {
  const response = await axiosInstance.get("/admin/designations?per_page=100");
  return response.data;
};