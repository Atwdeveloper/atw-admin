import axiosInstance from "../axiosInstance";

export const getConversationsAPI = async (params = {}) => {
  const response = await axiosInstance.get("/messaging/conversations", { params });
  return response.data; 
};

export const getConversationAPI = async (conversationId) => {
  const response = await axiosInstance.get(`/messaging/conversations/${conversationId}`);
  return response.data; 
};

export const sendMessageAPI = async (payload) => {
  const response = await axiosInstance.post("/messaging/send", payload);
  return response.data;
};