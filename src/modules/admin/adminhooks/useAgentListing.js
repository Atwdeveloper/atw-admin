"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getAgentsAPI,
  deleteAgentAPI,
  toggleAgentStatusAPI,
} from "../../../api/admin/adminAgentAPI";
import { useDebounce } from "../../../common/hooks/useDebounce";
import Swal from "sweetalert2";

export const useAgentListing = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const defaultFilters = {
    name: "",
    email: "",
    phone: "",
    agent_type: "",
    state_id: "",
    city_id: "",
  };

  const [filters, setFilters] = useState(defaultFilters);
  const debouncedFilters = useDebounce(filters, 800);

  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  const abortPreviousRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const fetchAgents = useCallback(
    async (appliedFilters = debouncedFilters) => {
      abortPreviousRequest();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      setLoading(true);

      const queryParams = { page, limit };

      if (appliedFilters.name) queryParams.name = appliedFilters.name;
      if (appliedFilters.email) queryParams.email = appliedFilters.email;
      if (appliedFilters.phone) queryParams.phone = appliedFilters.phone;
      if (appliedFilters.state_id)
        queryParams.state_id = appliedFilters.state_id;
      if (appliedFilters.city_id) queryParams.city_id = appliedFilters.city_id;

      // Send agent_type directly (no conversion needed)
      if (appliedFilters.agent_type) {
        queryParams.agent_type = appliedFilters.agent_type;
      }

      try {
        const response = await getAgentsAPI(queryParams, { signal });

        if (!isMountedRef.current) return;
        if (signal.aborted) return;

        const data = response?.data?.data?.data || [];
        setAgents(data);
        setTotalPages(response?.data?.data?.last_page || 1);
        setTotal(response?.data?.data?.total || 0);
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Failed to fetch agents:", error);
      } finally {
        if (isMountedRef.current && !signal.aborted) {
          setLoading(false);
        }
      }
    },
    [page, limit, abortPreviousRequest],
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchAgents(debouncedFilters);
    return () => {
      isMountedRef.current = false;
      abortPreviousRequest();
    };
  }, [page, debouncedFilters, fetchAgents]);

  const handleSearch = () => setPage(1);

  const handleClear = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This agent will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteAgentAPI(id);
      if (response?.status === 200 || response?.status === 204) {
        setAgents((prev) => prev.filter((agent) => agent.id !== id));
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Could not delete the agent.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong.",
      });
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const isActive = currentStatus === 1;
    const actionText = isActive ? "deactivate" : "activate";

    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `This agent will be ${actionText}d.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${actionText} it`,
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await toggleAgentStatusAPI(id, !isActive);
      if (response?.status === 200 || response?.status === 204) {
        const updatedStatus = response?.data?.data?.new_status;
        setAgents((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: updatedStatus } : a)),
        );
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: `Agent has been ${updatedStatus === 1 ? "activated" : "deactivated"}.`,
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong.",
      });
    }
  };

  return {
    agents,
    loading,
    page,
    total,
    totalPages,
    setPage,
    filters,
    setFilters,
    handleSearch,
    handleClear,
    handleDelete,
    handleToggleStatus,
  };
};
