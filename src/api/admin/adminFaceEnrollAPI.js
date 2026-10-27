import axiosInstance from "../axiosInstance";

// Paginated/filtered/sorted list of workers who have not completed face
// enrollment yet. `params` is a pre-built URLSearchParams (or plain object) —
// see buildApiParams in useFaceEnrollListing.js for how multi-select filters
// and sorting get encoded, matching the /admin/workers convention.
export const getFaceEnrollWorkersAPI = async (params, options = {}) => {
  const response = await axiosInstance.get("/admin/face-enroll-workers", {
    params,
    signal: options.signal,
  });
  return response.data;
};

// Bundled dropdown data (designations, industries, states, cities, agents,
// RMs) for the Face Enroll listing filters — one call instead of several.
export const getFaceEnrollFilterOptionsAPI = async () => {
  const response = await axiosInstance.get("/admin/face-enroll-filter-options");
  return response.data;
};

// The worker being enrolled is identified by the :id in the URL (an admin
// acting on the worker's behalf), unlike the worker's own self-enrollment
// endpoint which relies on the bearer token instead.
const faceFormData = (imageBlob) => {
  const formData = new FormData();
  formData.append("image", imageBlob, "face.jpg");
  return formData;
};

export const enrollWorkerFaceByAdminAPI = (workerId, imageBlob) => {
  return axiosInstance.post(
    `/admin/face-enroll-workers/${workerId}/enroll`,
    faceFormData(imageBlob),
    { headers: { "Content-Type": "multipart/form-data" } },
  );
};
