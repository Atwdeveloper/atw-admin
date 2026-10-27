// api/admin/adminTeamAPI.js
import axiosInstance from "../axiosInstance";

// Get Teams with filters + pagination (supports abort)
export const getTeams = async (
  { 
    page = 1, 
    limit = 10,
    name = '',
    team_lead = '',
    team_code = '',
  },
  signal 
) => {
  const response = await axiosInstance.get("/admin/admin-teams", {
    params: {
      page,
      limit,
      name,
      team_lead,
      team_code,
    },
    signal, 
  });

  return response.data;
};

// Get single team details
export const getTeamById = async (id, signal) => {
  const response = await axiosInstance.get(
    `/admin/admin-team/${id}`,
    { signal }
  );
  return response.data;
};

// Delete Team
export const deleteTeam = async (id) => {
  const response = await axiosInstance.delete(
    `/admin/admin-team-delete/${id}`
  );
  return response.data;
};

// Update Team
export const updateTeam = async (id, teamData) => {
  const response = await axiosInstance.post(
    `/admin/admin-team-update/${id}`,
    teamData
  );
  return response.data;
};

// Create new team
export const createTeam = async (teamData) => {
  const response = await axiosInstance.post(
    "/admin/admin-team-add",
    teamData
  );
  return response.data;
};

// Get team leads list (supports abort)
export const getTeamLeads = async (
  search = '',
  limit = 50,
  signal // 👈 optional
) => {
  const response = await axiosInstance.get(
    "/admin/admin-unassigned-staff",
    {
      params: { search, limit },
      signal,
    }
  );
  return response.data;
};

export const getexistingTeamLeads = async () => {
  const response = await axiosInstance.get("admin/admin-team-leads");
  return response;
}
export const getStatesAPI = async () => {
  const response = await axiosInstance.get("/get-states");
  return response.data;
};