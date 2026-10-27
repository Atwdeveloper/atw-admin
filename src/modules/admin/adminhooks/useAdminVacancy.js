"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import {
  getVacancyApplicationsAPI,
  updateApplicationStatusAPI,
  onboardingAPI,
  terminationAPI,
} from "../../../api/admin/adminVacancyAPI";

export const useAdminVacancyApplications = (vacancyId) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [actionLoadingMap, setActionLoadingMap] = useState({});
  const [counts, setCounts] = useState({
    total_workers: 0,
    applied_workers: 0,
    joined_workers: 0,
    terminated_workers: 0,
  });
  const setActionLoading = (workerId, action, isLoading) => {
    setActionLoadingMap((prev) => ({
      ...prev,
      [`${workerId}-${action}`]: isLoading,
    }));
  };

  const isActionLoading = (workerId, action) => {
    return actionLoadingMap[`${workerId}-${action}`] || false;
  };

  const fetchApplications = useCallback(async () => {
    if (!vacancyId) return;
    setLoading(true);
    try {
      const response = await getVacancyApplicationsAPI(vacancyId);
      setCounts(response.data?.data?.counts || {});
      // const appsData = response.data?.data?.data || [];
      const appsData = response.data?.data?.workers?.data || [];
      const transformed = appsData
        .filter((item) => item.worker !== null && item.worker !== undefined)
        .map((item) => ({
          id: item.application_id,
          status: item.status,
          appliedAt: item.applied_at,
          onBoardingStatus: item.on_boarding_status,
          onBoardingDatetime: item.on_boarding_datetime,
          terminationStatus: item.termination_status,
          terminationDatetime: item.termination_datetime,
          worker: {
            id: item.worker.id,
            workerCode: item.worker.worker_code,
            fullName: item.worker.full_name,
            firstName: item.worker.first_name,
            middleName: item.worker.middle_name,
            lastName: item.worker.last_name,
            mobile: item.worker.mobile_number,
            email: item.worker.work_email,
            gender: item.worker.gender,
            photo: item.worker.photo,
            experience: item.worker.experience,
            designation: item.worker.designation?.name || "N/A",
            department: item.worker.department?.name || "N/A",
            industry: item.worker.industry?.name || "N/A",
            personal: item.worker.personal_detail || {},
            // payment: item.worker.payment_detail || {},
            payment:
              item.worker.payment_detail?.[0] ||
              item.worker.payment_detail ||
              {},
            statutory: item.worker.statutory_detail || {},
            workLocation: item.worker.work_location,
            averageRating: item.worker.average_rating || 0,
            feedbackComments: item.worker.feedback_comments || [],
            approved_documents: item.worker.approved_documents || [],
          },
          vacancy: {
            id: item.vacancy?.id,
            company_id: item.vacancy?.company_id,
            rate_type: item.vacancy?.rate_type,
            shift_start_time: item.vacancy?.shift_start_time,
            shift_end_time: item.vacancy?.shift_end_time,
            schedules: item.vacancy?.schedules || [],
          },
        }));
      setApplications(transformed);
    } catch (error) {
      console.error("Error fetching applications:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load applications.",
      });
    } finally {
      setLoading(false);
    }
  }, [vacancyId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const updateStatus = async (applicationId, newStatus) => {
    setUpdating(true);
    try {
      await updateApplicationStatusAPI(applicationId, newStatus);
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app,
        ),
      );
      Swal.fire({
        icon: "success",
        title: "Status Updated",
        text: `Application marked as ${newStatus}.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || "Failed to update status.",
      });
    } finally {
      setUpdating(false);
    }
  };

  const onboardWorker = async (workerId) => {
    setActionLoading(workerId, "join", true);
    try {
      await onboardingAPI({
        worker_id: workerId,
        vacancy_id: vacancyId,
      });
      Swal.fire({
        icon: "success",
        title: "Worker Onboarded",
        text: "Worker has been successfully onboarded.",
        timer: 2000,
        showConfirmButton: false,
      });
      await fetchApplications();
      return true;
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Onboarding Failed",
        text: error?.response?.data?.message || "Failed to onboard worker.",
      });
      return false;
    } finally {
      setActionLoading(workerId, "join", false);
    }
  };

  const terminateWorker = async (workerId) => {
    setActionLoading(workerId, "left", true);

    try {
      const response = await terminationAPI({
        worker_id: workerId,
        vacancy_id: vacancyId,
      });

      if (response?.data?.status === 500) {
        Swal.fire({
          icon: "warning",
          title: "Termination Failed",
          text: response.data.message,
        });

        return false;
      }

      if (response?.status === 200 || response?.data?.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Worker Terminated",
          text: "Worker has been successfully terminated.",
          timer: 2000,
          showConfirmButton: false,
        });

        await fetchApplications();
        return true;
      }

      return false;
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Termination Failed",
        text: error?.response?.data?.message || "Failed to terminate worker.",
      });

      return false;
    } finally {
      setActionLoading(workerId, "left", false);
    }
  };
  return {
    applications,
    loading,
    counts,
    updating,
    refresh: fetchApplications,
    updateStatus,
    onboardWorker,
    terminateWorker,
    isActionLoading,
  };
};
