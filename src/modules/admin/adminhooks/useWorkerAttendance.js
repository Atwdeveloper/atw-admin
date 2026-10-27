"use client";

import { useState, useEffect } from "react";
import { useDebounce } from "../../../common/hooks/useDebounce";
import { getWorkersAPI } from "../../../api/admin/adminWorkerAttendanceAPI";

export const useWorkerListing = (companyId) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalWorkers, setTotalWorkers] = useState(0);

  const defaultFilters = {
    name: "",
    vacancy_id: "",
    state_id: "",
    city_id: "",
    attendance_date: "",
  };

  const [filters, setFilters] = useState(defaultFilters);

  const debouncedFilters = useDebounce(filters, 800);

  const fetchWorkers = async (appliedFilters = debouncedFilters) => {
    // prevent api call without company id
    if (!companyId) return;

    setLoading(true);

    try {
      // include company_id in payload
      const apiFilters = {
        ...appliedFilters,
        company_id: companyId,
      };

      // remove empty values
      Object.keys(apiFilters).forEach((key) => {
        if (
          apiFilters[key] === "" ||
          apiFilters[key] === null ||
          apiFilters[key] === undefined
        ) {
          delete apiFilters[key];
        }
      });

      const response = await getWorkersAPI({
        page,
        limit,
        ...apiFilters,
      });

      let appsArray = [];
      let lastPage = 1;
      let total = 0;

      const data = response?.data;

      // structure 1
      if (data?.data && Array.isArray(data.data)) {
        appsArray = data.data.map((item) =>
          item.worker ? item : { worker: item },
        );

        lastPage = data.last_page || 1;
        total = data.total || 0;
      }

      // structure 2
      else if (data?.data?.data && Array.isArray(data.data.data)) {
        appsArray = data.data.data;

        lastPage = data.data.last_page || 1;
        total = data.data.total || 0;
      }

      // structure 3
      else if (data && Array.isArray(data)) {
        appsArray = data.map((item) => (item.worker ? item : { worker: item }));

        total = data.length;
        lastPage = 1;
      }

      setApplications(appsArray);
      setTotalPages(lastPage);
      setTotalWorkers(total);
    } catch (error) {
      console.error("Error fetching workers:", error);

      setApplications([]);
      setTotalPages(1);
      setTotalWorkers(0);
    } finally {
      setLoading(false);
    }
  };

  // page change
  useEffect(() => {
    if (companyId) {
      fetchWorkers();
    }
  }, [page, companyId]);

  // filters change
  useEffect(() => {
    if (companyId) {
      setPage(1);
      fetchWorkers(debouncedFilters);
    }
  }, [debouncedFilters, companyId]);

  // clear filters
  const handleClear = () => {
    const clearedFilters = {
      name: "",
      vacancy_id: "",
      state_id: "",
      city_id: "",
      attendance_date: "",
    };

    setFilters(clearedFilters);
    setPage(1);

    if (companyId) {
      fetchWorkers(clearedFilters);
    }
  };

  return {
    applications,
    loading,
    page,
    totalPages,
    totalWorkers,
    setPage,
    filters,
    setFilters,
    handleClear,
  };
};
