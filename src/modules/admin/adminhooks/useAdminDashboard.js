"use client";

import { useState, useEffect } from "react";
import { getAdminDashboardAPI } from "../../../api/admin/adminDashboardAPI";

const useAdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await getAdminDashboardAPI();
        const dashboardData = response.data; // API returns { status, data, message }
        const transformed = transformDashboardData(dashboardData);
        setData(transformed);
        setError(null);
      } catch (err) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return { data, loading, error };
};

const transformDashboardData = (apiData) => {
  // Stats cards (4 main totals)
  const stats = [
    {
      title: "Number of Jobs",
      value: apiData.totals?.vacancies ?? 0,
      bg: "bg-[#F0F4FD] dark:bg-[#0f1f38]",
      border: "border-[#A5B6DC] dark:border-[#24405f]",
      color: "text-[#033A78] dark:text-[#7ab3f5]",
      img: "/images/admin/No_of_Jobs.png",
    },
    {
      title: "Number of Workers",
      value: apiData.totals?.workers ?? 0,
      bg: "bg-[#FCF8ED] dark:bg-[#2a2511]",
      border: "border-[#E9DBB3] dark:border-[#4d431c]",
      color: "text-[#BD8A00] dark:text-[#f3c34d]",
      img: "/images/admin/No_of_Workers.png",
    },

    {
      title: "Number of Companies",
      value: apiData.totals?.companies ?? 0,
      bg: "bg-[#E9ECFF] dark:bg-[#1a1d36]",
      border: "border-[#A4AAD0] dark:border-[#363a63]",
      color: "text-[#2F2A2A] dark:text-[#c7cbf5]",
      img: "/images/admin/No_of_Companies.png",
    },
    {
      key: "agents",
      title: "Number of Agents",
      value: apiData.totals?.agents ?? 0,
      route: "/admin/agents",
      bg: "bg-[#E8F8F5] dark:bg-[#0f2a26]",
      border: "border-[#A3D9C9] dark:border-[#1f4d45]",
      color: "text-[#0F766E] dark:text-[#4fd1c5]",
      img: "/images/admin/No_of_Department.png",
    },
  ];

  // ✅ Directly use the charts object from the API
  const charts = apiData.charts || {};
  const barChartData = charts.bar_chart || []; // array of { date, vacancies }
  const lineChartData = charts.line_chart || []; // array of { date, companies, workers }

  // Other data (unchanged)
  const statusBreakdown = apiData.status_breakdown || {};
  const dressOrdersByStatus = apiData.dress_orders_by_status || {};
  const vacanciesByStatus = apiData.vacancies_by_status || {};
  const recent = apiData.recent || {};

  return {
    stats,
    barChartData,
    lineChartData,
    statusBreakdown,
    dressOrdersByStatus,
    vacanciesByStatus,
    recent,
    raw: apiData,
  };
};

export default useAdminDashboard;
