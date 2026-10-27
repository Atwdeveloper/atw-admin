"use client";

import { useState, useCallback } from "react";
import { getWorkerWalletSummaryAPI, getWorkerWalletHistoryAPI, updateWorkerWalletHoldAPI, releaseWorkerWalletHoldAPI, withdrawWorkerWalletAPI, updateWorkerWalletAutoWithdrawalAPI } from "../../../api/admin/adminWorkerAPI";
import { toast } from "react-hot-toast";

export const useAdminWorkerWallet = (workerId) => {
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  const fetchWalletSummary = useCallback(async (params = {}, silent = false) => {
    if (!workerId) return;
    setSummaryLoading(true);
    if (!silent) setLoading(true); // Global loading for initial fetch
    try {
      const response = await getWorkerWalletSummaryAPI(workerId, params);
      if (response?.status === 200) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error("Error fetching wallet summary:", error);
    } finally {
      setSummaryLoading(false);
      if (!silent) setLoading(false);
    }
  }, [workerId]);

  const fetchWalletHistory = useCallback(async (params = {}) => {
    if (!workerId) return;
    setHistoryLoading(true);
    try {
      const apiParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...params
      };
      const response = await getWorkerWalletHistoryAPI(workerId, apiParams);
      if (response?.status === 200) {
        setTransactions(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total,
          totalPages: response.data.last_page
        }));
      }
    } catch (error) {
      console.error("Error fetching wallet history:", error);
    } finally {
      setHistoryLoading(false);
    }
  }, [workerId, pagination.page, pagination.limit]);

  const updateWalletHold = useCallback(async (holdAmount, reason) => {
    if (!workerId) return { success: false, message: "No worker selected" };
    setLoading(true);
    try {
      const response = await updateWorkerWalletHoldAPI(workerId, holdAmount, reason);
      if (response?.status === 200) {
        toast.success("Hold created successfully!");
        await fetchWalletSummary();
        return { success: true, data: response.data };
      } else {
        toast.error(response?.message || "Failed to create hold");
        return { success: false, message: response?.message || "Failed to create hold" };
      }
    } catch (error) {
      console.error("Error creating wallet hold amount:", error);
      const errMsg = error.response?.data?.message || "Failed to create hold";
      toast.error(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  }, [workerId, fetchWalletSummary]);

  const releaseWalletHold = useCallback(async (holdId, action = "release") => {
    if (!workerId) return { success: false, message: "No worker selected" };
    setLoading(true);
    try {
      const response = await releaseWorkerWalletHoldAPI(holdId, action);
      if (response?.status === 200) {
        toast.success(action === "deduct" ? "Hold permanently deducted!" : "Hold released successfully!");
        await fetchWalletSummary();
        return { success: true, data: response.data };
      } else {
        toast.error(response?.message || `Failed to ${action} hold`);
        return { success: false, message: response?.message || `Failed to ${action} hold` };
      }
    } catch (error) {
      console.error(`Error ${action}ing wallet hold:`, error);
      const errMsg = error.response?.data?.message || `Failed to ${action} hold`;
      toast.error(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  }, [workerId, fetchWalletSummary]);

  const withdrawWorkerWallet = useCallback(async (amount) => {
    if (!workerId) return { success: false, message: "No worker selected" };
    setLoading(true);
    try {
      const response = await withdrawWorkerWalletAPI(workerId, amount);
      if (response?.status === 200) {
        toast.success("Withdrawal processed successfully!");
        await fetchWalletSummary();
        return { success: true, data: response.data };
      } else {
        toast.error(response?.message || "Failed to process withdrawal");
        return { success: false, message: response?.message || "Failed to process withdrawal" };
      }
    } catch (error) {
      console.error("Error processing worker withdrawal:", error);
      const errMsg = error.response?.data?.message || "Failed to process withdrawal";
      toast.error(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  }, [workerId, fetchWalletSummary]);

  const updateAutoWithdrawalSettings = useCallback(async (settings) => {
    if (!workerId) return { success: false, message: "No worker selected" };
    setLoading(true);
    try {
      const response = await updateWorkerWalletAutoWithdrawalAPI(workerId, settings);
      if (response?.status === 200) {
        toast.success("Auto-withdrawal settings updated successfully!");
        await fetchWalletSummary();
        return { success: true, data: response.data };
      } else {
        toast.error(response?.message || "Failed to update settings");
        return { success: false, message: response?.message || "Failed to update settings" };
      }
    } catch (error) {
      console.error("Error updating auto-withdrawal settings:", error);
      const errMsg = error.response?.data?.message || "Failed to update settings";
      toast.error(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  }, [workerId, fetchWalletSummary]);

  return {
    loading,
    summaryLoading,
    historyLoading,
    summary,
    transactions,
    pagination,
    setPagination,
    fetchWalletSummary,
    fetchWalletHistory,
    updateWalletHold,
    releaseWalletHold,
    withdrawWorkerWallet,
    updateAutoWithdrawalSettings
  };
};
