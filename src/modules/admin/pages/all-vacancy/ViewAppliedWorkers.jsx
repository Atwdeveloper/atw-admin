"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate, useLocation } from "@/lib/navigation";
import {
  Users,
  Calendar,
  UserX,
  UserCheck,
  Loader,
  FileText,
  Eye,
  MapPin,
  Briefcase,
  Award,
  LogIn,
  LogOut,
  Plus,
  Search,
  UserCheck2,
  X,
  ClipboardList,
  Edit,
} from "lucide-react";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import { useAdminVacancyApplications } from "../../adminhooks/useAdminVacancy";
import {
  getEligibleWorkersAPI,
  assignWorkerAPI,
  getVacancyAttendanceAPI,
  updateAttendanceAPI,
  createFeedbackAPI,
} from "../../../../api/admin/adminVacancyAPI";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import LoaderComponent from "../../../../common/components/Loader";
import VacancyWorkerView from "../../components/vacancy/VacancyWorkerView";
import Breadcrumb from "../../../../common/components/Breadcrumb";
import Swal from "sweetalert2";

const AdminViewAppliedWorkers = () => {
  const { vacancyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const designationName = location.state?.designationName;
  const { companyName, companyCode } = location.state || {};
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  const canAddWorker = hasPermission("vacancy", "add_worker");

  const canManageWorkerStatus = hasPermission(
    "vacancy",
    "manage_worker_status",
  );

  const canManageAttendance = hasPermission("vacancy", "attendance");
  const {
    applications,
    loading,
    counts,
    updating,
    updateStatus,
    onboardWorker,
    terminateWorker,
    isActionLoading,
    refresh,
  } = useAdminVacancyApplications(vacancyId);

  // Filter state
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showWorkerModal, setShowWorkerModal] = useState(false);

  // Add worker modal
  const [showEligibleModal, setShowEligibleModal] = useState(false);
  const [allEligibleWorkers, setAllEligibleWorkers] = useState([]);
  const [filteredEligibleWorkers, setFilteredEligibleWorkers] = useState([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Feedback modal (for termination with feedback)
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    workerId: null,
    companyId: null,
    vacancyId: vacancyId,
    workerName: "",
  });
  const [feedbackForm, setFeedbackForm] = useState({ rating: 0, comment: "" });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Attendance modal
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [selectedAttendanceWorkerId, setSelectedAttendanceWorkerId] =
    useState(null);

  // const statusOptions = ["all", "applied", "accepted", "rejected", "cancelled"];
  const statusOptions = ["all", "joined", "not joined", "terminated"];

  // const filteredApps =
  //   filterStatus === "all"
  //     ? applications
  //     : applications.filter((app) => app.status === filterStatus);
  const filteredApps = applications.filter((app) => {
    if (filterStatus === "all") return true;

    if (filterStatus === "joined") {
      return (
        app.onBoardingStatus === "joined" && app.terminationStatus === null
      );
    }

    if (filterStatus === "not joined") {
      return (
        app.status === "accepted" &&
        app.onBoardingStatus === null &&
        app.terminationStatus === null
      );
    }

    if (filterStatus === "terminated") {
      return app.terminationStatus !== null;
    }

    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewProfile = (worker) => {
    setSelectedWorker(worker);
    setShowWorkerModal(true);
  };

  // ---------- Eligible workers ----------
  const fetchEligibleWorkers = async () => {
    if (!vacancyId) return;
    setLoadingEligible(true);
    setShowSearch(false);
    try {
      const response = await getEligibleWorkersAPI(vacancyId);
      const workers = response.data.data || [];
      setAllEligibleWorkers(workers);
      setFilteredEligibleWorkers([]);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load eligible workers.",
      });
    } finally {
      setLoadingEligible(false);
      setShowSearch(true);
    }
  };

  const openEligibleModal = () => {
    setShowEligibleModal(true);
    setSelectedWorkers([]);
    setSearchTerm("");
    setAllEligibleWorkers([]);
    setFilteredEligibleWorkers([]);
    fetchEligibleWorkers();
  };

  useEffect(() => {
    if (!searchTerm || searchTerm.length < 3) {
      setFilteredEligibleWorkers([]);
      return;
    }
    const searchLower = searchTerm.toLowerCase();
    const filtered = allEligibleWorkers.filter(
      (worker) =>
        worker.worker_code?.toLowerCase().includes(searchLower) ||
        worker.full_name?.toLowerCase().includes(searchLower) ||
        worker.first_name?.toLowerCase().includes(searchLower) ||
        worker.last_name?.toLowerCase().includes(searchLower),
    );
    setFilteredEligibleWorkers(filtered);
  }, [searchTerm, allEligibleWorkers]);

  const toggleWorkerSelection = (workerId) => {
    setSelectedWorkers((prev) =>
      prev.includes(workerId)
        ? prev.filter((id) => id !== workerId)
        : [...prev, workerId],
    );
  };

  const handleAssignWorkers = async () => {
    if (selectedWorkers.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No workers selected",
        text: "Please select at least one worker.",
      });
      return;
    }
    try {
      setLoadingEligible(true);
      await assignWorkerAPI({
        vacancy_id: vacancyId,
        worker_ids: selectedWorkers,
      });
      Swal.fire({
        icon: "success",
        title: "Workers Assigned",
        text: "Selected workers have been added.",
        timer: 1500,
        showConfirmButton: false,
      });
      setShowEligibleModal(false);
      refresh();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || "Failed to assign workers.",
      });
    } finally {
      setLoadingEligible(false);
    }
  };
  const formatDateInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };
  // ---------- Attendance ----------
  const fetchAttendanceLogs = async (
    workerId = null,
    fDate = "",
    tDate = "",
  ) => {
    setLoadingAttendance(true);
    try {
      const params = {};
      if (fDate) params.from_date = fDate;
      if (tDate) params.to_date = tDate;
      if (workerId) params.worker_id = workerId;
      const response = await getVacancyAttendanceAPI(vacancyId, params);
      setAttendanceLogs(response.data.data.data || []);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load attendance logs.",
      });
    } finally {
      setLoadingAttendance(false);
    }
  };

  // const openAttendanceModal = (workerId = null) => {
  //   setSelectedAttendanceWorkerId(workerId);
  //   setShowAttendanceModal(true);
  //   if (workerId) {
  //     const fifteenDaysAgo = new Date();
  //     fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
  //     const f = fifteenDaysAgo.toISOString().split("T")[0];
  //     const t = new Date().toISOString().split("T")[0];
  //     setFromDate(f);
  //     setToDate(t);
  //     fetchAttendanceLogs(workerId, f, t);
  //   } else {
  //     const today = new Date().toISOString().split("T")[0];
  //     setFromDate(today);
  //     setToDate(today);
  //     fetchAttendanceLogs(null, today, today);
  //   }
  // };
  const openAttendanceModal = (workerId = null, vacancyStartDate = null) => {
    setSelectedAttendanceWorkerId(workerId);
    setShowAttendanceModal(true);

    const today = new Date();

    const f = vacancyStartDate
      ? vacancyStartDate
      : formatDateInput(new Date(today.getFullYear(), today.getMonth(), 1));

    const t = formatDateInput(
      new Date(today.getFullYear(), today.getMonth() + 1, 0),
    );

    setFromDate(f);
    setToDate(t);

    fetchAttendanceLogs(workerId, f, t);
  };
  const handleUpdateAttendance = async (id, data) => {
    try {
      await updateAttendanceAPI(id, data);
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Attendance updated.",
        timer: 1500,
        showConfirmButton: false,
      });
      setEditingAttendance(null);
      fetchAttendanceLogs(selectedAttendanceWorkerId, fromDate, toDate);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to update attendance.",
      });
    }
  };

  const openFeedbackModal = (workerId, workerName, companyId) => {
    setFeedbackData({
      workerId,
      vacancyId,
      companyId,
      workerName,
    });

    setFeedbackForm({
      rating: 0,
      comment: "",
    });

    setFeedbackModal(true);
  };

  const handleFeedbackSubmit = async () => {
    if (feedbackForm.rating < 1 || feedbackForm.rating > 5) {
      Swal.fire({
        icon: "warning",
        title: "Error",
        text: "Please select a rating between 1 and 5",
      });
      return;
    }

    setSubmittingFeedback(true);

    try {
      await createFeedbackAPI({
        company_id: feedbackData.companyId,
        worker_id: feedbackData.workerId,
        vacancy_id: feedbackData.vacancyId,
        rating: feedbackForm.rating,
        comment: feedbackForm.comment || "",
      });

      const terminated = await terminateWorker(feedbackData.workerId);

      if (!terminated) {
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Feedback Submitted & Worker Terminated",
        text: "Worker has been terminated successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      setFeedbackModal(false);

      setFeedbackForm({
        rating: 0,
        comment: "",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || "Failed to submit feedback.",
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };
  // -------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoaderComponent />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gray-50 w-full px-4 sm:px-6 md:px-8 py-6"
    >
      <Breadcrumb
        homePath="/admin/dashboard"
        items={[
          {
            label: designationName || "Designation",
            path: "/admin/vacancy-listing",
          },
          { label: "Applied Workers" },
        ]}
      />

      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            Applied Workers
            <span className="px-3 py-1 text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
              {companyName || "Company Name"}
            </span>
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="px-3 py-1 text-s font-medium bg-gray-100 text-gray-700 rounded-full">
              Vacancy ID: {vacancyId}
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-col">
          {/* Company ID */}
          <p className="text-sm text-gray-500 mt-1 text-end">
            Company Code:
            <span className="font-semibold text-gray-700 ml-1">
              {companyCode || "N/A"}
            </span>
          </p>
          {canAddWorker && (
            <button
              onClick={openEligibleModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center"
            >
              <Plus size={16} /> Add Worker
            </button>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
      >
        <StatCard
          title="Total Workers"
          value={counts?.total_workers ?? 0}
          icon={<Users className="text-blue-600" size={20} />}
          bg="bg-blue-50"
          border="border-blue-200"
          color="text-blue-700"
        />
        <StatCard
          title="Joined Workers"
          value={counts?.joined_workers ?? 0}
          icon={<LogIn className="text-green-600" size={20} />}
          bg="bg-green-50"
          border="border-green-200"
          color="text-green-700"
        />
        <StatCard
          title="Applied Workers"
          value={counts?.applied_workers ?? 0}
          icon={<UserCheck2 className="text-amber-600" size={20} />}
          bg="bg-amber-50"
          border="border-amber-200"
          color="text-amber-700"
        />
        <StatCard
          title="Terminated Workers"
          value={counts?.terminated_workers ?? 0}
          icon={<LogOut className="text-red-600" size={20} />}
          bg="bg-red-50"
          border="border-red-200"
          color="text-red-700"
        />{" "}
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium text-sm capitalize transition-colors ${
                filterStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Applications List */}
      <motion.div variants={itemVariants} className="space-y-4">
        {filteredApps.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="text-gray-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No applications found
            </h3>
            <p className="text-gray-600">
              {filterStatus === "all"
                ? "No workers have applied yet for this vacancy."
                : `No applications with status "${filterStatus}".`}
            </p>
          </div>
        ) : (
          filteredApps.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onUpdateStatus={updateStatus}
              updating={updating}
              onViewProfile={() => handleViewProfile(app.worker)}
              formatDate={formatDate}
              onJoin={() => app.worker && onboardWorker(app.worker.id)}
              // onLeft={() =>
              //   app.worker &&
              //   openFeedbackModal(app.worker.id, app.worker.fullName)
              // }
              // onLeft={() => app.worker && terminateWorker(app.worker.id)}
              onLeft={() =>
                app.worker &&
                openFeedbackModal(
                  app.worker.id,
                  app.worker.fullName || app.worker.full_name,
                  app.vacancy?.company_id,
                )
              }
              isJoining={
                app.worker ? isActionLoading(app.worker.id, "join") : false
              }
              isLeaving={
                app.worker ? isActionLoading(app.worker.id, "left") : false
              }
              onAttendance={
                app.worker
                  ? () =>
                      openAttendanceModal(
                        app.worker.id,
                        app.vacancy?.schedules?.[0]?.start_date,
                      )
                  : null
              }
              canManageWorkerStatus={canManageWorkerStatus}
              canManageAttendance={canManageAttendance}
            />
          ))
        )}
      </motion.div>

      {/* Worker Detail Modal */}
      {selectedWorker && (
        <VacancyWorkerView
          worker={selectedWorker}
          isOpen={showWorkerModal}
          onClose={() => setShowWorkerModal(false)}
        />
      )}

      {/* Add Worker Modal */}
      {showEligibleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                Add Eligible Workers
              </h2>
              <button
                onClick={() => setShowEligibleModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              {showSearch && (
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search by worker code or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 relative min-h-[400px]">
              {loadingEligible ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                  <LoaderComponent />
                </div>
              ) : filteredEligibleWorkers.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                  <Users size={48} className="mb-4 opacity-30" />
                  <p className="text-center">
                    {!showSearch
                      ? "Loading workers..."
                      : searchTerm.length < 3
                        ? "Please enter at least 3 characters to search for workers whose designation matches this job."
                        : "No workers match your search."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEligibleWorkers.map((worker) => (
                    <motion.div
                      key={worker.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`relative border rounded-xl p-4 cursor-pointer transition-all ${
                        selectedWorkers.includes(worker.id)
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-blue-300 bg-white"
                      }`}
                      onClick={() => toggleWorkerSelection(worker.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                          {worker.photo ? (
                            <img
                              src={worker.photo}
                              alt={worker.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>
                              {worker.full_name?.charAt(0).toUpperCase() || "?"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900 truncate">
                                {worker.full_name}
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {worker.worker_code}
                              </p>
                            </div>
                            <div className="ml-2">
                              <input
                                type="checkbox"
                                checked={selectedWorkers.includes(worker.id)}
                                onChange={() =>
                                  toggleWorkerSelection(worker.id)
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300"
                              />
                            </div>
                          </div>
                          {(worker.designation || worker.department) && (
                            <p className="text-xs text-gray-600 mt-1 truncate">
                              {worker.designation?.name || worker.designation}
                              {worker.department &&
                                ` • ${worker.department?.name || worker.department}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowEligibleModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignWorkers}
                disabled={selectedWorkers.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Plus size={16} /> Add Selected ({selectedWorkers.length})
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Attendance Management Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Attendance Management
                </h2>
                <p className="text-sm text-gray-500">
                  Manage daily attendance for vacancy workers
                </p>
              </div>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 bg-gray-50 border-b flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    From:
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      fetchAttendanceLogs(
                        selectedAttendanceWorkerId,
                        e.target.value,
                        toDate,
                      );
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    To:
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      fetchAttendanceLogs(
                        selectedAttendanceWorkerId,
                        fromDate,
                        e.target.value,
                      );
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                {(fromDate || toDate) && (
                  <button
                    onClick={() => {
                      setFromDate("");
                      setToDate("");
                      fetchAttendanceLogs(selectedAttendanceWorkerId, "", "");
                    }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Found {attendanceLogs.length} records
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loadingAttendance ? (
                <div className="flex items-center justify-center h-64">
                  <LoaderComponent />
                </div>
              ) : attendanceLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <Calendar size={48} className="mb-4 opacity-30" />
                  <p>No attendance records found for this date.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-sm uppercase">
                        <th className="px-4 py-3 font-semibold border-b">
                          Date
                        </th>
                        <th className="px-4 py-3 font-semibold border-b">
                          Worker
                        </th>
                        <th className="px-4 py-3 font-semibold border-b">
                          Status
                        </th>
                        <th className="px-4 py-3 font-semibold border-b">
                          Sign In
                        </th>
                        <th className="px-4 py-3 font-semibold border-b">
                          Sign Out
                        </th>
                        <th className="px-4 py-3 font-semibold border-b">
                          Quantity
                        </th>
                        <th className="px-4 py-3 font-semibold border-b text-center">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {attendanceLogs.map((log) => {
                        const isWithin15Days =
                          (new Date() - new Date(log.attendance_date)) /
                            (1000 * 60 * 60 * 24) <=
                          15;
                        return (
                          <tr
                            key={log.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-4 text-sm font-medium text-gray-700">
                              {new Date(log.attendance_date).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-medium text-gray-900">
                                {log.worker?.first_name} {log.worker?.last_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {log.worker?.worker_code}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  log.status === "present"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {log.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              {log.sign_in
                                ? new Date(log.sign_in).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "-"}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              {log.sign_out
                                ? new Date(log.sign_out).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )
                                : "-"}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              {log.production?.quantity || "-"}
                            </td>
                            <td className="px-4 py-4 text-center">
                              {isWithin15Days && !log.sign_out ? (
                                <button
                                  onClick={() => setEditingAttendance(log)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit Attendance"
                                >
                                  <Edit size={18} />
                                </button>
                              ) : log.sign_out ? (
                                <span className="text-xs text-gray-400 italic">
                                  Signed Out
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 italic">
                                  Locked (&gt;15d)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Attendance Sub-Modal */}
      {editingAttendance && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl w-full max-w-md shadow-2xl"
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">
                Edit Attendance
              </h3>
              <p className="text-sm text-gray-500">
                Worker: {editingAttendance.worker?.first_name}{" "}
                {editingAttendance.worker?.last_name}
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = {
                  status: formData.get("status"),
                  sign_in: formData.get("sign_in")
                    ? `${editingAttendance.attendance_date.split("T")[0]} ${formData.get("sign_in")}:00`
                    : null,
                  sign_out: editingAttendance.sign_out,
                  quantity: editingAttendance.production?.quantity || null,
                  company_id: editingAttendance.company_id,
                };
                handleUpdateAttendance(editingAttendance.id, data);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={editingAttendance.status}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sign In Time
                </label>
                <input
                  type="time"
                  name="sign_in"
                  defaultValue={
                    editingAttendance.sign_in
                      ? new Date(editingAttendance.sign_in)
                          .toTimeString()
                          .slice(0, 5)
                      : ""
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingAttendance(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-md shadow-2xl"
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">
                Leave Feedback for {feedbackData.workerName}
              </h3>
              <p className="text-sm text-gray-500">
                Please rate the worker before termination.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating (1–5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setFeedbackForm((prev) => ({ ...prev, rating: star }))
                      }
                      className={`w-10 h-10 rounded-full text-xl ${
                        feedbackForm.rating >= star
                          ? "bg-yellow-400 text-white"
                          : "bg-gray-200 text-gray-400"
                      } hover:bg-yellow-300 transition-colors`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comment (optional)
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={feedbackForm.comment}
                  onChange={(e) =>
                    setFeedbackForm((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  placeholder="Any additional feedback..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setFeedbackModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFeedbackSubmit}
                disabled={feedbackForm.rating === 0 || submittingFeedback}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submittingFeedback ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  "Submit & Terminate"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

const StatCard = ({ title, value, icon, bg, border, color }) => (
  <div
    className={`${bg} rounded-xl p-4 border ${border} flex items-center justify-between`}
  >
    <div>
      <p className="text-gray-600 text-xs">{title}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
    <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
  </div>
);

const ApplicationCard = ({
  application,
  onUpdateStatus,
  updating,
  onViewProfile,
  formatDate,
  onJoin,
  onLeft,
  isJoining,
  isLeaving,
  onAttendance,
  canManageWorkerStatus,
  canManageAttendance,
}) => {
  const statusColors = {
    applied: "bg-amber-50 text-amber-700 border-amber-200",
    accepted: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    cancelled: "bg-gray-50 text-gray-700 border-gray-200",
  };

  const statusLabels = {
    applied: "Applied",
    accepted: "Applied",
    rejected: "Rejected",
    cancelled: "Cancelled",
  };

  const showJoinedBadge =
    application.status === "accepted" &&
    application.onBoardingStatus === "joined" &&
    application.terminationStatus === null;
  const showTerminatedBadge = application.terminationStatus !== null;
  const showNotJoinedBadge =
    application.status === "accepted" &&
    application.onBoardingStatus === null &&
    application.terminationStatus === null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {application.worker?.photo ? (
                  <img
                    src={application.worker.photo}
                    alt={application.worker?.fullName || "Worker"}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>
                    {application.worker?.fullName?.charAt(0)?.toUpperCase() ||
                      "?"}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {application.worker.fullName}
                  </h3>

                  {/* ✅ Sirf ek chip */}
                  {showTerminatedBadge ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                      Terminated
                    </span>
                  ) : showJoinedBadge ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                      Joined
                    </span>
                  ) : showNotJoinedBadge ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                      Not Joined
                    </span>
                  ) : (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        statusColors[application.status] ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {statusLabels[application.status] || application.status}
                    </span>
                  )}
                </div>

                {/* Baaki sab same */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} className="text-gray-400" />
                    <span className="text-gray-600">
                      {application.worker.designation}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award size={14} className="text-gray-400" />
                    <span className="text-gray-600">
                      Exp:{" "}
                      {application.worker.experience
                        ? `${application.worker.experience} yrs`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-gray-600">
                      Applied: {formatDate(application.appliedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="text-gray-600">
                      {[
                        application.worker.personal?.current_city,
                        application.worker.personal?.current_state,
                      ]
                        .filter(Boolean)
                        .join(", ") || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-green-500" />
                    <span className="text-gray-600">
                      Joined:{" "}
                      {application.onBoardingDatetime
                        ? formatDate(application.onBoardingDatetime)
                        : "N/A"}
                    </span>
                  </div>
                  {application.terminationStatus && (
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-red-500" />
                      <span className="text-gray-600">
                        Terminated:{" "}
                        {application.terminationDatetime
                          ? formatDate(application.terminationDatetime)
                          : "N/A"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-2 md:flex-col md:w-48">
            {application.status === "applied" && (
              <>
                <button
                  onClick={() => onUpdateStatus(application.id, "accepted")}
                  disabled={updating}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  <UserCheck size={16} /> Accept
                </button>
                <button
                  onClick={() => onUpdateStatus(application.id, "rejected")}
                  disabled={updating}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  <UserX size={16} /> Reject
                </button>
              </>
            )}

            {application.status === "accepted" && (
              <>
                {application.terminationStatus !== null ? (
                  <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    <LogOut size={16} /> Left (Terminated)
                  </div>
                ) : (
                  <>
                    {canManageWorkerStatus &&
                      application.onBoardingStatus === null && (
                        <button
                          onClick={onJoin}
                          disabled={isJoining || isLeaving}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                          {isJoining ? (
                            <Loader size={16} className="animate-spin" />
                          ) : (
                            <LogIn size={16} />
                          )}
                          Join
                        </button>
                      )}
                    {application.onBoardingStatus === "joined" && (
                      <>
                        {canManageAttendance && onAttendance && (
                          <button
                            onClick={onAttendance}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-all"
                          >
                            <ClipboardList size={16} /> Attendance
                          </button>
                        )}
                        {canManageWorkerStatus && (
                          <button
                            onClick={onLeft}
                            disabled={isLeaving || isJoining}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                          >
                            {isLeaving ? (
                              <Loader size={16} className="animate-spin" />
                            ) : (
                              <LogOut size={16} />
                            )}
                            Left
                          </button>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}

            <button
              onClick={onViewProfile}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium"
            >
              <Eye size={16} /> View Profile
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminViewAppliedWorkers;
