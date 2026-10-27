"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getFaceEnrollWorkersAPI,
  getFaceEnrollFilterOptionsAPI,
  enrollWorkerFaceByAdminAPI,
} from "../../../api/admin/adminFaceEnrollAPI";
import { resolveEnrollResult } from "../../../common/utils/faceErrors";
import { useDebounce } from "../../../common/hooks/useDebounce";

export const useFaceEnrollListing = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  const defaultFilters = {
    worker_name: "",
    status: "",
    enrollment_status: "",
    registration_date_from: "",
    registration_date_to: "",
    industry_ids: [],
    designation_ids: [],
    state_ids: [],
    city_ids: [],
    agent_ids: [],
    rm_ids: [],
  };

  const [filters, setFilters] = useState(defaultFilters);
  const debouncedFilters = useDebounce(filters, 800);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: "asc" };
    });
    setPage(1);
  };

  // Filter dropdown data (designations, industries, states, cities, agents,
  // RMs) sourced from the one bundled /admin/face-enroll-filter-options call.
  const [filterOptions, setFilterOptions] = useState({
    designations: [],
    industries: [],
    states: [],
    cities: [],
    agents: [],
    rms: [],
  });
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false);

  const fetchFilterOptions = useCallback(async () => {
    setFilterOptionsLoading(true);
    try {
      const response = await getFaceEnrollFilterOptionsAPI();
      const data = response?.data || {};
      setFilterOptions({
        designations: data.designations || [],
        industries: data.industries || [],
        states: data.states || [],
        cities: data.cities || [],
        agents: data.agents || [],
        rms: data.rms || [],
      });
    } catch (error) {
      console.error("Failed to fetch face-enroll filter options:", error);
      setFilterOptions({
        designations: [],
        industries: [],
        states: [],
        cities: [],
        agents: [],
        rms: [],
      });
    } finally {
      setFilterOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  const abortPreviousRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Builds the /admin/face-enroll-workers query string. Array filters
  // (industry_ids, designation_ids, state_ids, city_ids, agent_ids, rm_ids)
  // are sent as repeated key[]=value params, matching the /admin/workers
  // convention this endpoint documents itself against.
  const buildApiParams = (appliedFilters) => {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("per_page", limit);
    if (appliedFilters.worker_name)
      params.append("worker_name", appliedFilters.worker_name);
    if (appliedFilters.status) params.append("status", appliedFilters.status);
    if (appliedFilters.enrollment_status)
      params.append("enrollment_status", appliedFilters.enrollment_status);
    if (appliedFilters.registration_date_from)
      params.append(
        "registration_date_from",
        appliedFilters.registration_date_from,
      );
    if (appliedFilters.registration_date_to)
      params.append("registration_date_to", appliedFilters.registration_date_to);
    (appliedFilters.designation_ids || []).forEach((id) =>
      params.append("designation_ids[]", id),
    );
    (appliedFilters.industry_ids || []).forEach((id) =>
      params.append("industry_ids[]", id),
    );
    (appliedFilters.state_ids || []).forEach((id) =>
      params.append("state_ids[]", id),
    );
    (appliedFilters.city_ids || []).forEach((id) =>
      params.append("city_ids[]", id),
    );
    (appliedFilters.agent_ids || []).forEach((id) =>
      params.append("agent_ids[]", id),
    );
    (appliedFilters.rm_ids || []).forEach((id) =>
      params.append("rm_ids[]", id),
    );
    if (sortConfig.key) {
      params.append("sort_by", sortConfig.key);
      params.append("sort_dir", sortConfig.direction);
    }
    return params;
  };

  const fetchWorkers = useCallback(
    async (appliedFilters = debouncedFilters) => {
      abortPreviousRequest();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      setLoading(true);
      try {
        const apiParams = buildApiParams(appliedFilters);
        const response = await getFaceEnrollWorkersAPI(apiParams, { signal });
        if (!isMountedRef.current) return;
        if (signal.aborted) return;
        const payload = response?.data || {};
        const data = payload.data || [];
        const total = payload.total || 0;
        const perPage = payload.per_page || limit;
        setWorkers(data);
        setTotalRecords(total);
        setTotalPages(Math.max(1, Math.ceil(total / perPage)));
      } catch (error) {
        if (!isMountedRef.current) return;
        if (error.name === "AbortError") return;
        console.error("Error fetching face-enroll workers:", error);
      } finally {
        if (isMountedRef.current && !signal.aborted) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, limit, sortConfig, abortPreviousRequest, debouncedFilters],
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchWorkers(debouncedFilters);
    return () => {
      isMountedRef.current = false;
      abortPreviousRequest();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedFilters, fetchWorkers]);

  const handleSearch = () => setPage(1);
  const handleClear = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  // Enrols/updates a worker's face on their behalf. Resolves the raw axios
  // response/error through the shared resolveEnrollResult helper (same
  // normalisation used by the worker's own self-enrolment flow). The listing
  // shows EVERY worker (not just pending ones), so on success the row is
  // updated in place with the new is_enrolled/enrolled_at/enroll_image
  // rather than removed — the same worker can be re-enrolled ("Update")
  // later without leaving and re-entering the list.
  const enrollWorker = async (workerId, imageBlob) => {
    try {
      const response = await enrollWorkerFaceByAdminAPI(workerId, imageBlob);
      const envelope = response?.data ?? response;
      const resolved = resolveEnrollResult(envelope);
      const payload = envelope?.data || {};

      if (resolved.success) {
        setWorkers((prev) =>
          prev.map((w) =>
            w.id === workerId
              ? {
                  ...w,
                  is_enrolled: true,
                  enrolled_at: payload.enrolled_at ?? w.enrolled_at,
                  enroll_image: payload.enroll_image ?? w.enroll_image,
                }
              : w,
          ),
        );
      }

      return { ...resolved, wasUpdate: Boolean(payload.was_update) };
    } catch (error) {
      return resolveEnrollResult(error);
    }
  };

  return {
    workers,
    loading,
    page,
    totalPages,
    totalRecords,
    setPage,
    defaultFilters,
    filters,
    setFilters,
    sortConfig,
    handleSort,
    handleSearch,
    handleClear,
    filterOptions,
    filterOptionsLoading,
    fetchFilterOptions,
    enrollWorker,
  };
};
