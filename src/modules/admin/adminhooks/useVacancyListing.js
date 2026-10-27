"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDebounce } from "../../../common/hooks/useDebounce";
import Swal from "sweetalert2";
import {
  getVacancyListingAPI,
  getCompaniesDropdown,
  getIndustriesAPI,
  getDesignationsAPI,
  deleteVacancyAPI,
  toggleVacancyStatusAPI,
} from "../../../api/admin/adminVacancyAPI";

export const useVacancyListing = (initialFilters = {}) => {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Dropdown data
  const [companies, setCompanies] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [designationsLoading, setDesignationsLoading] = useState(false);

  const defaultFilters = {
    company_id: "",
    designation_id: "",
    industry_id: "",
    rate_type: "",
    status: "",
  };

  const [filters, setFilters] = useState({
    ...defaultFilters,
    ...initialFilters,
  });
  const debouncedFilters = useDebounce(filters, 800);

  const abortPreviousRequest = useCallback(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
  }, []);

  const fetchVacancies = useCallback(
    async (currentFilters) => {
      abortPreviousRequest();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      setLoading(true);

      try {
        const params = { ...currentFilters, page, limit };
        const response = await getVacancyListingAPI(params, { signal });
        if (!isMountedRef.current || signal.aborted) return;

        const data = response?.data?.data || response?.data || [];
        setVacancies(data);
        setTotalPages(response?.data?.last_page || 1);
        setTotalRecords(response?.data?.total || 0);
      } catch (error) {
        if (!isMountedRef.current || error.name === "AbortError") return;
        console.error("Failed to fetch vacancies:", error);
        setVacancies([]);
      } finally {
        if (isMountedRef.current && !signal.aborted) setLoading(false);
      }
    },
    [page, limit, abortPreviousRequest],
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchVacancies(debouncedFilters);
    return () => {
      isMountedRef.current = false;
      abortPreviousRequest();
    };
  }, [page, debouncedFilters, fetchVacancies]);

  // Load companies & industries
  useEffect(() => {
    const loadStaticDropdowns = async () => {
      try {
        const [compRes, indRes] = await Promise.all([
          getCompaniesDropdown(),
          getIndustriesAPI(),
        ]);
        setCompanies(compRes?.data || []);
        setIndustries(indRes?.data || []);
      } catch (e) {
        console.error("Failed to fetch companies/industries", e);
      }
    };
    loadStaticDropdowns();
  }, []);

  // Load designations when industry changes
  useEffect(() => {
    const loadDesignations = async () => {
      if (!filters.industry_id) {
        setDesignations([]);
        return;
      }
      setDesignationsLoading(true);
      try {
        const response = await getDesignationsAPI(filters.industry_id);
        setDesignations(response?.data?.data || response?.data || []);
      } catch (e) {
        console.error("Failed to fetch designations", e);
        setDesignations([]);
      } finally {
        setDesignationsLoading(false);
      }
    };
    loadDesignations();
  }, [filters.industry_id]);

  const handleSearch = () => setPage(1);
  const handleClear = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const refreshList = () => fetchVacancies(debouncedFilters);

  // const handleDelete = async (vacancyId) => {
  //   const result = await Swal.fire({
  //     title: "Are you sure?",
  //     text: "You won't be able to revert this!",
  //     icon: "warning",
  //     showCancelButton: true,
  //     confirmButtonColor: "#d33",
  //     cancelButtonColor: "#3085d6",
  //     confirmButtonText: "Yes, delete it!",
  //   });
  //   if (result.isConfirmed) {
  //     try {

  //       await deleteVacancyAPI(vacancyId);
  //       Swal.fire("Deleted!", "Vacancy has been deleted.", "success");
  //       refreshList();
  //     } catch (error) {
  //       console.error("Delete error:", error);
  //       Swal.fire("Error", "Failed to delete vacancy.", "error");
  //     }
  //   }
  // };
  const handleDelete = async (vacancyId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteVacancyAPI(vacancyId);

      // HANDLE BACKEND ERROR
      if (response?.data?.status === 500) {
        Swal.fire({
          icon: "warning",
          title: "Error",
          text: response?.data?.message || "Delete failed",
        });

        return;
      }

      // SUCCESS
      if (response?.status === 200 || response?.status === 204) {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Vacancy has been deleted.",
        });

        refreshList();
      }
    } catch (error) {
      console.error("Delete error:", error);

      Swal.fire({
        icon: "error",
        title: error?.response?.data?.message || "Failed to delete vacancy.",
      });
    }
  };

  const handleToggleStatus = async (vacancyId, currentStatus) => {
    const newIsActive = currentStatus === "active" ? "inactive" : "active";
    const actionText = newIsActive === "active" ? "activate" : "deactivate";
    const result = await Swal.fire({
      title: `Confirm ${actionText}`,
      text: `Are you sure you want to ${actionText} this vacancy?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `Yes, ${actionText}`,
    });
    if (result.isConfirmed) {
      try {
        const response = await toggleVacancyStatusAPI(vacancyId, newIsActive);

        // Backend validation error
        if (response?.data?.status === 500) {
          Swal.fire({
            icon: "warning",
            title: "Warning",
            text: response?.data?.message || `Failed to ${actionText} vacancy.`,
          });

          return;
        }

        // Success
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: `Vacancy has been ${actionText}d.`,
        });

        refreshList();
      } catch (error) {
        console.error("Status toggle error:", error);

        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            error?.response?.data?.message ||
            `Failed to ${actionText} vacancy.`,
        });
      }
    }
  };

  return {
    vacancies,
    loading,
    page,
    setPage,
    totalPages,
    totalRecords,
    filters,
    setFilters,
    companies,
    industries,
    designations,
    designationsLoading,
    handleSearch,
    handleClear,
    handleDelete,
    handleToggleStatus,
  };
};
