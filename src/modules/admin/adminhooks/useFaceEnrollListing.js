"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import { getWorkersAPI } from "../../../api/adminV1/workerAPI";
import { getIndustriesAPI, getDesignationsAPI, getDepartmentsAPI } from "../../../api/adminV1/masterdataAPI";
import { getStatesAPI, getCitiesAPI } from "../../../api/adminV1/geographyAPI";
import { apiError } from "../../../api/javaApi";
import { useDebounce } from "../../../common/hooks/useDebounce";
import { asList } from "../utils/workerUtils";

const PAGE_SIZE = 10;

export const defaultFaceEnrollFilters = {
  search: "",
  status: "",
  industryIds: [],
  designationIds: [],
  // NOTE: the worker list API doesn't filter by state/city yet — these are
  // sent as stateId/cityId and ignored until the backend adds them.
  stateIds: [],
  cityIds: [],
  registeredFrom: "",
  registeredTo: "",
};

// Face Enroll runs on the worker list (GET /admin/workers); each row's
// faceEnrolledAt says whether that worker has a face template on file.
export const useFaceEnrollListing = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1); // 1-based in the UI, 0-based on the API
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState(defaultFaceEnrollFilters);
  const debouncedFilters = useDebounce(filters, 600);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [filterOptions, setFilterOptions] = useState({ industries: [], designations: [], states: [], departments: [] });
  const [cities, setCities] = useState([]);
  const abortRef = useRef(null);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: "asc" };
    });
    setPage(1);
  };

  useEffect(() => {
    Promise.allSettled([getIndustriesAPI(), getDesignationsAPI(), getStatesAPI(), getDepartmentsAPI()]).then(
      ([ind, des, st, dep]) =>
        setFilterOptions({
          industries: ind.status === "fulfilled" ? asList(ind.value) : [],
          designations: des.status === "fulfilled" ? asList(des.value) : [],
          states: st.status === "fulfilled" ? asList(st.value) : [],
          // Only for the worker details modal (department name).
          departments: dep.status === "fulfilled" ? asList(dep.value) : [],
        }),
    );
  }, []);

  // City options = the cities of the selected states. Picked cities that no
  // longer belong to a selected state are dropped.
  const stateKey = filters.stateIds.join(",");
  useEffect(() => {
    let cancelled = false;
    const ids = stateKey ? stateKey.split(",") : [];
    if (ids.length === 0) {
      setCities([]);
      setFilters((prev) => (prev.cityIds.length ? { ...prev, cityIds: [] } : prev));
      return;
    }
    Promise.all(ids.map((id) => getCitiesAPI(id).catch(() => []))).then((lists) => {
      if (cancelled) return;
      const all = lists.flatMap(asList);
      const allowed = new Set(all.map((c) => c.id));
      setCities(all);
      setFilters((prev) =>
        prev.cityIds.every((id) => allowed.has(id)) ? prev : { ...prev, cityIds: prev.cityIds.filter((id) => allowed.has(id)) },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [stateKey]);

  const fetchWorkers = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    const f = debouncedFilters;
    try {
      const result = await getWorkersAPI(
        {
          search: f.search.trim() || undefined,
          status: f.status ? [f.status] : undefined,
          industryId: f.industryIds.length ? f.industryIds : undefined,
          designationId: f.designationIds.length ? f.designationIds : undefined,
          stateId: f.stateIds.length ? f.stateIds : undefined,
          cityId: f.cityIds.length ? f.cityIds : undefined,
          registeredFrom: f.registeredFrom || undefined,
          registeredTo: f.registeredTo || undefined,
          page: page - 1,
          size: PAGE_SIZE,
          sort: sortConfig.key ? `${sortConfig.key},${sortConfig.direction}` : undefined,
        },
        { signal: controller.signal },
      );
      setWorkers(asList(result?.content));
      setTotalRecords(result?.totalElements || 0);
      setTotalPages(Math.max(1, result?.totalPages || 1));
    } catch (error) {
      if (controller.signal.aborted || error?.code === "ERR_CANCELED") return;
      Swal.fire({ icon: "error", title: "Failed to load workers", text: apiError(error).message });
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [page, debouncedFilters, sortConfig]);

  useEffect(() => {
    fetchWorkers();
    return () => abortRef.current?.abort();
  }, [fetchWorkers]);

  // Any filter change goes back to page 1
  useEffect(() => {
    setPage(1);
  }, [debouncedFilters]);

  const handleClear = () => {
    setFilters(defaultFaceEnrollFilters);
    setPage(1);
  };

  // After a successful enroll, mark the row as enrolled in place.
  const markEnrolled = (workerId, enrollment) =>
    setWorkers((prev) =>
      prev.map((w) =>
        w.id === workerId ? { ...w, faceEnrolledAt: enrollment?.enrolledAt || new Date().toISOString() } : w,
      ),
    );

  return {
    workers,
    loading,
    page,
    setPage,
    totalPages,
    totalRecords,
    filters,
    setFilters,
    sortConfig,
    handleSort,
    handleClear,
    filterOptions,
    cities,
    markEnrolled,
  };
};
