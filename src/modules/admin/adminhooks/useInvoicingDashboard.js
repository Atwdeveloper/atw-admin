"use client";

import { useState, useCallback, useEffect } from "react";
import axiosInstance from "../../../api/axiosInstance";
import { toast } from "react-hot-toast";

export const useInvoicingDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    period: "Monthly",
    start_date: "",
    end_date: "",
    company_id: "",
    status: "",
    state_id: "",
    city_id: "",
    industry_id: "",
    designation_id: "",
    agent_id: "",
    page: 1,
    limit: 10,
    search: "",
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        period: filters.period,
        start_date: filters.start_date,
        end_date: filters.end_date,
        company_id: filters.company_id,
        status: filters.status,
        state_id: filters.state_id,
        city_id: filters.city_id,
        industry_id: filters.industry_id,
        designation_id: filters.designation_id,
        agent_id: filters.agent_id,
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
      };

      // Remove empty params
      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });

      const response = await axiosInstance.get("/admin/invoicing-dashboard", {
        params,
      });

      if (response.data.status === 200) {
        setData(response.data.data);
        setError(null);
      } else {
        throw new Error(response.data.message || "Failed to fetch data");
      }
    } catch (err) {
      console.error("Invoicing Dashboard Error:", err);
      setError(err.message);
      toast.error(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return {
    loading,
    data,
    error,
    filters,
    updateFilter,
    refresh: fetchDashboardData,
  };
};
