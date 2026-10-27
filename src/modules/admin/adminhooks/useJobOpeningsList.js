"use client";

import { useState, useEffect } from "react";
import { useDebounce } from "../../../common/hooks/useDebounce";
import Swal from "sweetalert2";
import { getJobOpenings } from "../../../api/admin/adminCompanyAPI";

// Placeholder API functions (replace with real endpoints)
const deleteJobOpeningAPI = async (id) => {
  // Mock delete

  return { status: 200 };
};

const toggleJobOpeningStatusAPI = async (id, newStatus) => {
  // Mock toggle

  return { status: 200 };
};

export const useJobOpeningsList = (companyId) => {
  const [filters, setFilters] = useState({
    industry_id: "",
    designation_id: "",
    rate_type: "",
    status: "",
    state_id: "",
    city_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [jobList, setJobList] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  const debouncedFilters = useDebounce(filters, 800);

  // Prepare filters for API (remove empty values)
  const prepareFiltersForApi = (rawFilters) => {
    const apiFilters = {};
    Object.keys(rawFilters).forEach((key) => {
      if (rawFilters[key] !== undefined && rawFilters[key] !== "") {
        apiFilters[key] = rawFilters[key];
      }
    });
    // Convert status to boolean if needed (assuming backend expects true/false)
    if (apiFilters.status === "active") {
      apiFilters.status = true;
    } else if (apiFilters.status === "inactive") {
      apiFilters.status = false;
    } else {
      delete apiFilters.status;
    }
    return apiFilters;
  };

  const fetchJobOpenings = async (appliedFilters = debouncedFilters) => {
    if (!companyId) {
      console.warn("No company ID provided");
      setJobList([]);
      setTotalPages(1);
      return;
    }

    setLoading(true);
    try {
      const apiFilters = prepareFiltersForApi(appliedFilters);
      const params = {
        page,
        limit,
        ...apiFilters,
      };

      const response = await getJobOpenings(companyId, params);
      // Assuming response structure: { data: { data: [], current_page, last_page, ... } }
      const data = response?.data?.data?.data || response?.data?.data || [];
      const lastPage =
        response?.data?.last_page || response?.data?.data?.last_page || 1;

      setJobList(data);
      setTotalPages(lastPage);
    } catch (error) {
      console.error("Error fetching job openings:", error);
      Swal.fire("Error", "Failed to fetch job openings", "error");
      setJobList([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on page change
  useEffect(() => {
    // if (companyId) {
    fetchJobOpenings();
    // }
  }, []);

  // Fetch on filter change (debounced)
  useEffect(() => {
    if (companyId) {
      setPage(1); // reset to first page on filter change
      fetchJobOpenings(debouncedFilters);
    }
  }, [debouncedFilters]);

  const handleSearch = () => {
    setPage(1);
    fetchJobOpenings();
  };

  const handleClear = () => {
    setFilters({
      industry_id: "",
      designation_id: "",
      rate_type: "",
      status: "",
      state_id: "",
      city_id: "",
    });
    setPage(1);
    fetchJobOpenings({});
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This job opening will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteJobOpeningAPI(id);
      if (response?.status === 200 || response?.status === 204) {
        setJobList((prev) => prev.filter((j) => j.id !== id));
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Job opening has been deleted.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Could not delete job opening.",
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
    const isActive = currentStatus === "active";
    const action = isActive ? "deactivate" : "activate";

    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `This job opening will be ${action}d.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${action} it`,
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await toggleJobOpeningStatusAPI(id, !isActive);
      if (response?.status === 200 || response?.status === 204) {
        setJobList((prev) =>
          prev.map((j) =>
            j.id === id
              ? { ...j, status: !isActive ? "active" : "inactive" }
              : j,
          ),
        );
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: `Job opening ${!isActive ? "activated" : "deactivated"}.`,
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Could not update status.",
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
    filters,
    setFilters,
    jobList,
    loading,
    page,
    totalPages,
    setPage,
    handleSearch,
    handleClear,
    handleDelete,
    handleToggleStatus,
  };
};
