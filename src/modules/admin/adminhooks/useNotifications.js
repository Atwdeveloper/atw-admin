"use client";

import { useState, useEffect } from "react";
import {
  getNotificationsAPI,
  markNotificationReadAPI,
  markAllNotificationsReadAPI,
  deleteNotificationAPI,
  clearOldNotificationsAPI,
  exportNotificationsAPI,
  viewChangesAPI,
  approveRequestAPI,
  rejectRequestAPI,
  deleteAllNotificationsAPI,
} from "../../../api/admin/adminNotificationsAPI";
import Swal from "sweetalert2";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    today: 0,
    highPriority: 0,
  });
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    unread: 0,
    companies: 0,
    workers: 0,
    jobs: 0,
    alerts: 0,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
    links: [],
  });

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const transformNotification = (apiNotif) => {
    let payload = {};
    try {
      payload = JSON.parse(apiNotif.payload || "{}");
    } catch (e) {
      console.warn("Invalid payload JSON", apiNotif.payload);
    }

    const companyName = payload.company_name || payload.companyName || null;
    const workerName = payload.worker_name || payload.workerName || null;
    const jobTitle = payload.job_title || payload.jobTitle || null;
    const amount = payload.amount ? `₹${payload.amount}` : null;

    // ✅ Extract approval_id (from payload or root)
    const approval_id = payload.approval_id || apiNotif.approval_id || null;
    // ✅ Extract approval status (pending, approved, rejected)
    const approvalStatus = apiNotif.status || null;

    let tabKey = "all";
    const type = apiNotif.type;
    if (type.includes("company")) tabKey = "companies";
    else if (type.includes("worker")) tabKey = "workers";
    else if (type.includes("job")) tabKey = "jobs";
    else if (type.includes("withdrawal") || type.includes("approval"))
      tabKey = "alerts";

    return {
      id: apiNotif.id,
      type: type,
      title: apiNotif.title,
      description: apiNotif.message,
      time: formatTime(apiNotif.created_at),
      read: apiNotif.read_at !== null,
      timestamp: apiNotif.created_at,
      companyName,
      workerName,
      jobTitle,
      amount,
      channels: ["platform"],
      priority: "medium",
      tabKey,
      approval_id,
      status: approvalStatus, // "pending", "approved", "rejected", or null
      module: payload.module || null,
      record_id: payload.record_id || null,
    };
  };

  const calculateAllStats = (notifList) => {
    const today = new Date().toDateString();
    const mainStats = {
      total: notifList.length,
      unread: notifList.filter((n) => !n.read).length,
      today: notifList.filter(
        (n) => new Date(n.timestamp).toDateString() === today,
      ).length,
      highPriority: 0,
    };
    const tabStats = {
      all: notifList.length,
      unread: notifList.filter((n) => !n.read).length,
      companies: notifList.filter((n) => n.tabKey === "companies").length,
      workers: notifList.filter((n) => n.tabKey === "workers").length,
      jobs: notifList.filter((n) => n.tabKey === "jobs").length,
      alerts: notifList.filter((n) => n.tabKey === "alerts").length,
    };
    return { mainStats, tabStats };
  };

  const fetchNotifications = async (page = 1) => {
    setLoading(true);
    try {
      const response = await getNotificationsAPI(page);
      const apiData = response?.data?.data || [];
      const paginationData = response?.data;

      setPagination({
        currentPage: paginationData.current_page,
        lastPage: paginationData.last_page,
        total: paginationData.total,
        perPage: paginationData.per_page,
        links: paginationData.links || [],
      });

      const transformed = apiData.map(transformNotification);
      const { mainStats, tabStats } = calculateAllStats(transformed);
      setNotifications(transformed);
      setStats(mainStats);
      setTabCounts(tabStats);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not load notifications. Please try again.",
      });
      setNotifications([]);
      setStats({ total: 0, unread: 0, today: 0, highPriority: 0 });
      setTabCounts({
        all: 0,
        unread: 0,
        companies: 0,
        workers: 0,
        jobs: 0,
        alerts: 0,
      });
      setPagination({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: 10,
        links: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (page) => {
    if (
      page >= 1 &&
      page <= pagination.lastPage &&
      page !== pagination.currentPage
    ) {
      fetchNotifications(page);
    }
  };

  const markAsRead = async (id) => {
    if (processingIds.has(id)) return;
    setProcessingIds((prev) => new Set(prev).add(id));
    try {
      await markNotificationReadAPI(id);
      const updated = notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      );
      const { mainStats, tabStats } = calculateAllStats(updated);
      setNotifications(updated);
      setStats(mainStats);
      setTabCounts(tabStats);
    } catch (error) {
      console.error("Failed to mark as read", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not mark notification as read.",
      });
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const markAllAsRead = async () => {
    const result = await Swal.fire({
      title: "Mark all as read?",
      text: "All notifications on this page will be marked as read.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, mark all",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      await markAllNotificationsReadAPI();
      const updated = notifications.map((n) => ({ ...n, read: true }));
      const { mainStats, tabStats } = calculateAllStats(updated);
      setNotifications(updated);
      setStats(mainStats);
      setTabCounts(tabStats);
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "All notifications marked as read.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Failed to mark all as read", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not mark all as read.",
      });
    }
  };

  const deleteNotification = async (id) => {
    if (processingIds.has(id)) return;
    setProcessingIds((prev) => new Set(prev).add(id));

    const result = await Swal.fire({
      title: "Delete notification?",
      text: "This notification will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      return;
    }

    try {
      await deleteNotificationAPI(id);
      const updated = notifications.filter((n) => n.id !== id);
      const { mainStats, tabStats } = calculateAllStats(updated);
      setNotifications(updated);
      setStats(mainStats);
      setTabCounts(tabStats);
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Notification has been deleted.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Failed to delete", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not delete notification.",
      });
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const clearOldNotifications = async () => {
    const result = await Swal.fire({
      title: "Clear old notifications?",
      text: "Notifications older than 30 days will be cleared.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, clear them",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;

    try {
      await clearOldNotificationsAPI();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const filtered = notifications.filter(
        (n) => new Date(n.timestamp) > thirtyDaysAgo,
      );
      const { mainStats, tabStats } = calculateAllStats(filtered);
      setNotifications(filtered);
      setStats(mainStats);
      setTabCounts(tabStats);
      Swal.fire({
        icon: "success",
        title: "Cleared!",
        text: "Old notifications have been cleared.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Failed to clear old notifications", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not clear old notifications.",
      });
    }
  };

  const exportNotifications = async () => {
    try {
      setLoading(true);
      const response = await exportNotificationsAPI();
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const contentDisposition = response.headers["content-disposition"];
      let filename = "notifications-export.csv";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match && match[1]) filename = match[1];
      }
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      Swal.fire({
        icon: "success",
        title: "Export Downloaded!",
        text: "Your notifications have been exported.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Export failed", error);
      Swal.fire({
        icon: "error",
        title: "Download Failed",
        text: "Could not download the export file.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Approval actions (using approval_id)
  const viewChanges = async (notification) => {
    if (!notification.approval_id) {
      Swal.fire(
        "Error",
        "No approval ID available for this notification.",
        "error",
      );
      return;
    }
    try {
      const response = await viewChangesAPI(notification.approval_id);
      const changes = response.data;
      if (!Array.isArray(changes) || changes.length === 0) {
        Swal.fire("Info", "No changes to display.", "info");
        return;
      }

      let tableRows = `
        <table style="width:100%; border-collapse: collapse; text-align: left;">
          <thead><tr style="background-color:#f3f4f6;"><th style="padding:8px;">Field</th><th style="padding:8px;">Old Value</th><th style="padding:8px;">New Value</th></tr></thead>
          <tbody>
      `;
      changes.forEach((item) => {
        const oldVal =
          item.old === null || item.old === undefined ? "—" : String(item.old);
        const newVal =
          item.new === null || item.new === undefined ? "—" : String(item.new);
        tableRows += `<tr><td style="padding:8px; font-weight:500;">${item.field}</td><td style="padding:8px;">${oldVal}</td><td style="padding:8px;">${newVal}</td></tr>`;
      });
      tableRows += `</tbody>${"</table>"}`;
      Swal.fire({
        title: `Changes for Approval #${notification.approval_id}`,
        html: `<div style="max-height:500px; overflow-y:auto;">${tableRows}</div>`,
        width: 800,
        confirmButtonText: "Close",
      });
    } catch (error) {
      console.error("View changes failed", error);
      Swal.fire("Error", "Could not load changes.", "error");
    }
  };

  const approveNotification = async (notification) => {
    if (!notification.approval_id) {
      Swal.fire("Error", "Missing approval ID.", "error");
      return;
    }
    if (processingIds.has(notification.id)) return;
    setProcessingIds((prev) => new Set(prev).add(notification.id));

    const result = await Swal.fire({
      title: "Approve Request?",
      text: `Approve this request?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, approve",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
      return;
    }

    try {
      await markNotificationReadAPI(notification.id);
      await approveRequestAPI(notification.approval_id);
      const updated = notifications.map((n) =>
        n.id === notification.id ? { ...n, read: true, status: "approved" } : n,
      );
      const { mainStats, tabStats } = calculateAllStats(updated);
      setNotifications(updated);
      setStats(mainStats);
      setTabCounts(tabStats);
      Swal.fire({
        icon: "success",
        title: "Approved!",
        text: "The request has been approved.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Approve failed", error);
      Swal.fire("Error", "Could not approve request.", "error");
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
    }
  };

  const rejectNotification = async (notification) => {
    if (!notification.approval_id) {
      Swal.fire("Error", "Missing approval ID.", "error");
      return;
    }
    if (processingIds.has(notification.id)) return;
    setProcessingIds((prev) => new Set(prev).add(notification.id));

    const result = await Swal.fire({
      title: "Reject Request?",
      text: `Reject this request?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, reject",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
      return;
    }

    try {
      await markNotificationReadAPI(notification.id);
      await rejectRequestAPI(notification.approval_id);
      const updated = notifications.map((n) =>
        n.id === notification.id ? { ...n, read: true, status: "rejected" } : n,
      );
      const { mainStats, tabStats } = calculateAllStats(updated);
      setNotifications(updated);
      setStats(mainStats);
      setTabCounts(tabStats);
      Swal.fire({
        icon: "success",
        title: "Rejected!",
        text: "The request has been rejected.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Reject failed", error);
      Swal.fire("Error", "Could not reject request.", "error");
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
    }
  };

  const deleteAllNotifications = async () => {
    const result = await Swal.fire({
      title: "Delete All Notifications?",
      text: "All notifications will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete All",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteAllNotificationsAPI();

      // UI ko locally update karo
      setNotifications([]);
      setStats({
        total: 0,
        unread: 0,
        today: 0,
        highPriority: 0,
      });
      setTabCounts({
        all: 0,
        unread: 0,
        companies: 0,
        workers: 0,
        jobs: 0,
        alerts: 0,
      });

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "All notifications have been deleted.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Delete all failed", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not delete notifications.",
      });
    }
  };

  useEffect(() => {
    fetchNotifications(1);
  }, []);

  return {
    notifications,
    loading,
    processingIds,
    stats,
    tabCounts,
    pagination,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    clearOldNotifications,
    exportNotifications,
    fetchNotifications,
    goToPage,
    viewChanges,
    approveNotification,
    rejectNotification,
  };
};
