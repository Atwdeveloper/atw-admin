"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import {
  getCurrentMinimumWageRatesAPI,
  getMinimumWageFilterOptionsAPI,
  getSkillCategoriesAPI,
  setMinimumWageRateStatusAPI,
  bulkMinimumWageRateStatusAPI,
} from "../../../api/adminV1/masterdataAPI";
import { getStatesAPI } from "../../../api/adminV1/geographyAPI";
import { apiError } from "../../../api/javaApi";
import { showBulkResult } from "../utils/bulkResult";
import { readFilterOptions } from "../utils/filterOptions";

const PAGE_SIZE = 10;
// Only these fields are sortable server-side (anything else is a 400).
const SORTABLE = ["effectiveFrom", "minDailyRate", "status", "createdAt"];
const EMPTY_FILTERS = { stateIds: [], skillCategoryIds: [], status: "" };

// Server-paged list of the rate currently in force per state + skill category
// (GET .../minimum-wage-rates/current). A row's full version history is the
// drill-down in the view modal. Filters by any number of states / skill
// categories / statuses.
export const useMinimumWageManagement = () => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1); // 1-based in the UI, 0-based on the API
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    if (!SORTABLE.includes(key)) return;
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: "asc" };
    });
    setPage(1);
  };

  const [states, setStates] = useState([]);
  const [skillCategories, setSkillCategories] = useState([]);
  const [initLoading, setInitLoading] = useState(true);

  // States + skill categories for the filter dropdowns: only those that have
  // rates (filter-options), falling back to the full lists if it's unavailable.
  const fetchInit = useCallback(async () => {
    setInitLoading(true);
    try {
      const opts = await getMinimumWageFilterOptionsAPI().catch(() => null);
      const scopedStates = readFilterOptions(opts, "states");
      const scopedCategories = readFilterOptions(opts, "skillCategories");
      const [stateList, categoryList] = await Promise.all([
        scopedStates || getStatesAPI(),
        scopedCategories || getSkillCategoriesAPI(),
      ]);
      setStates(stateList || []);
      setSkillCategories(categoryList || []);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to load filter options",
        text: apiError(error).message,
      });
    } finally {
      setInitLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInit();
  }, [fetchInit]);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCurrentMinimumWageRatesAPI({
        page: page - 1,
        size: PAGE_SIZE,
        stateIds: filters.stateIds,
        skillCategoryIds: filters.skillCategoryIds,
        statuses: filters.status ? [filters.status] : undefined,
        sort: sortConfig.key ? `${sortConfig.key},${sortConfig.direction}` : undefined,
      });
      // Paged like the history list; tolerate a plain array too.
      const content = Array.isArray(result) ? result : result?.content || [];
      setRates(content);
      setTotalPages(Math.max(1, result?.totalPages || 1));
      setTotalRecords(result?.totalElements ?? content.length);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to load minimum wage rates",
        text: apiError(error).message,
      });
    } finally {
      setLoading(false);
    }
  }, [page, filters, sortConfig]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Selection is tied to the current page/filters — reset it whenever either changes
  useEffect(() => {
    setSelectedIds([]);
  }, [page, filters, sortConfig]);

  const toggleSelectRate = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.length === rates.length ? [] : rates.map((r) => r.id),
    );
  };

  // Changing a filter goes back to the first page
  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const handleClear = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    const activating = currentStatus !== "ACTIVE";
    const action = activating ? "activate" : "deactivate";
    const result = await Swal.fire({
      title: `Are you sure?`,
      text: activating
        ? "Do you want to activate this minimum wage rate?"
        : "Deactivating retracts this rate version. It stays in the history, and its effective date can be reused for a corrected rate.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${action} it!`,
    });

    if (!result.isConfirmed) return;

    try {
      await setMinimumWageRateStatusAPI(id, activating ? "ACTIVE" : "INACTIVE");
      Swal.fire("Success!", `Minimum wage rate ${action}d successfully.`, "success");
      fetchRates();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Action failed",
        text: apiError(error).message,
      });
    }
  };

  const handleBulkStatusChange = async (activate) => {
    if (selectedIds.length === 0) return;
    const actionText = activate ? "activate" : "deactivate";
    const count = selectedIds.length;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `${count} selected rate${count > 1 ? "s" : ""} will be ${actionText}d.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${actionText}`,
      cancelButtonText: "Cancel",
      confirmButtonColor: activate ? "#16a34a" : "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    const nameOf = (id) => {
      const r = rates.find((x) => x.id === id);
      return r ? `${r.stateName} / ${r.skillCategoryName} (${r.effectiveFrom})` : `#${id}`;
    };

    try {
      // Each id is processed independently, e.g. activating two versions with
      // the same date reports the second as a failure.
      const res = await bulkMinimumWageRateStatusAPI(
        [...selectedIds],
        activate ? "ACTIVE" : "INACTIVE",
      );
      showBulkResult({ result: res, noun: "rate", verb: `${actionText}d`, nameOf });
      setSelectedIds([]);
      fetchRates();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Action failed", text: apiError(error).message });
    }
  };

  const handleBulkActivate = () => handleBulkStatusChange(true);
  const handleBulkDeactivate = () => handleBulkStatusChange(false);

  return {
    rates,
    loading,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
    totalRecords,
    filters,
    updateFilter,
    setPage,
    handleClear,
    handleToggleStatus,
    refresh: fetchRates,
    states,
    skillCategories,
    initLoading,
    selectedIds,
    toggleSelectRate,
    toggleSelectAll,
    handleBulkActivate,
    handleBulkDeactivate,
    sortConfig,
    handleSort,
  };
};
