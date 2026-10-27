"use client";

// hooks/useTeams.js
import { useState, useEffect, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import { useDebounce } from "../../../common/hooks/useDebounce";
import {
  getTeams,
  getTeamById,
  deleteTeam,
  updateTeam,
  createTeam,
  getTeamLeads,
  getStatesAPI,
  getexistingTeamLeads,
} from "../../../api/admin/adminTeamAPI";

export const useTeams = (options = { autoFetch: true }) => {
  const [teams, setTeams] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [existingteamLeads, setExisingTeamLeads] = useState([]);
  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [loading, setLoading] = useState(options.autoFetch);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    name: "",
    team_lead: "",
    team_code: "",
  });
  const teamsAbortRef = useRef(null);
  const teamLeadsAbortRef = useRef(null);
  const statesAbortRef = useRef(null);

  const debouncedFilters = useDebounce(filters, 500);

  useEffect(() => {
    return () => {
      if (teamsAbortRef.current) teamsAbortRef.current.abort();
      if (teamLeadsAbortRef.current) teamLeadsAbortRef.current.abort();
      if (statesAbortRef.current) statesAbortRef.current.abort();
    };
  }, []);

  // Fetch states
  const fetchStates = useCallback(async () => {
    if (statesAbortRef.current) statesAbortRef.current.abort();
    const controller = new AbortController();
    statesAbortRef.current = controller;
    setStatesLoading(true);
    try {
      const response = await getStatesAPI(controller.signal);
      setStates(response.data || []);
    } catch (error) {
      if (error.name === "AbortError" || error.name === "CanceledError") return;
      console.error("Error fetching states:", error);
    } finally {
      if (statesAbortRef.current === controller) setStatesLoading(false);
    }
  }, []);

  // Fetch teams
  const fetchTeams = useCallback(async () => {
    if (teamsAbortRef.current) teamsAbortRef.current.abort();
    const controller = new AbortController();
    teamsAbortRef.current = controller;
    setLoading(true);
    try {
      const response = await getTeams(
        {
          page,
          limit,
          name: debouncedFilters.name,
          team_lead: debouncedFilters.team_lead,
          team_code: debouncedFilters.team_code,
        },
        controller.signal,
      );
      setTeams(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
      setTotalItems(response.data.total || 0);
    } catch (error) {
      if (error.name === "AbortError" || error.name === "CanceledError") return;
      console.error("Error fetching teams:", error);
    } finally {
      if (teamsAbortRef.current === controller) setLoading(false);
    }
  }, [page, limit, debouncedFilters]);

  useEffect(() => {
    if (options.autoFetch) fetchTeams();
  }, [fetchTeams, options.autoFetch]);

  useEffect(() => {
    fetchStates(); // load states once
  }, [fetchStates]);

  // Team leads
  const getTeamLeadsList = async (search = "", limit = 50) => {
    if (teamLeadsAbortRef.current) teamLeadsAbortRef.current.abort();
    const controller = new AbortController();
    teamLeadsAbortRef.current = controller;
    setLoading(true);
    try {
      const data = await getTeamLeads(search, limit, controller.signal);
      setTeamLeads(data.data || []);
    } catch (error) {
      if (error.name === "AbortError" || error.name === "CanceledError") return;
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch team leads.",
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      if (teamLeadsAbortRef.current === controller) setLoading(false);
    }
  };

  const getexistingTeamLeadsList = async () => {
    setLoading(true);
    try {
      const response = await getexistingTeamLeads();
      setExisingTeamLeads(response.data.data || []);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch team leads.",
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeam = async (teamData) => {
    try {
      setLoading(true);
      await createTeam(teamData);
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Team has been created successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
      fetchTeams();
      return { success: true };
    } catch (error) {
      console.error("Error adding team:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to create team.",
        timer: 3000,
      });
      return { success: false, error: "Failed to create team." };
    } finally {
      setLoading(false);
    }
  };

  const handleEditTeam = async (teamId, teamData) => {
    try {
      setLoading(true);
      await updateTeam(teamId, teamData);
      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "Team has been updated successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
      fetchTeams();
      return { success: true };
    } catch (error) {
      console.error("Error editing team:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update team.",
        timer: 3000,
      });
      return { success: false, error: "Failed to update team." };
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (teamId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This team will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    if (!result.isConfirmed) return;
    try {
      setLoading(true);
      await deleteTeam(teamId);
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Team deleted successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
      fetchTeams();
    } catch (error) {
      console.error("Error deleting team:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete the team.",
        timer: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const getTeamByIdData = async (teamId) => {
    try {
      setLoading(true);
      const response = await getTeamById(teamId);
      return { data: response.data };
    } catch (error) {
      console.error("Error fetching team:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Search / clear helpers (used in listing page)
  const handleSearch = () => setPage(1);
  const handleClear = () => {
    setFilters({ name: "", team_lead: "", team_code: "" });
    setPage(1);
  };

  return {
    teams,
    loading,
    page,
    limit,
    totalPages,
    totalItems,
    filters,
    teamLeads,
    existingteamLeads,
    states,
    statesLoading,
    setTeamLeads,
    setPage,
    setLimit,
    setFilters,
    handleSearch,
    handleClear,
    handleDelete,
    getTeamLeadsList,
    getexistingTeamLeadsList,
    handleAddTeam,
    handleEditTeam,
    getTeamByIdData,
    fetchTeams,
    fetchStates,
  };
};
