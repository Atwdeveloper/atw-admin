"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Briefcase, ScanFace, ScanSearch, Building2, Filter, CheckCircle, MapPin } from "lucide-react";
import Swal from "sweetalert2";
import FaceScanner from "../../../attendance/FaceScanner";
import WorkerViewModal from "../../components/worker/ViewWorkerModal";
import { getWorkerAPI, identifyFaceAPI, parseFaceIdentifyResult } from "../../../../api/adminV1/workerAPI";
import { apiError } from "../../../../api/javaApi";
import { useNavigate } from "@/lib/navigation";
import {
  containerVariants,
  itemVariants,
  tableRowVariants,
} from "../../../../common/utils/motionVariants";
import { useFaceEnrollListing } from "../../adminhooks/useFaceEnrollListing";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import { useDateRangeFilter } from "../../../../common/hooks/useDateRangeFilter";
import DateRangeDropdown from "../../../../common/components/DateRangeDropdown.jsx";
import SortableHeader from "../../../../common/components/SortableHeader";
import { MultiFilter, SelectFilter } from "../../components/worker/ListingFilters";
import WorkerFaceScanner, { confirmFaceConsent } from "../../components/worker/WorkerFaceScanner";
import { WORKER_STATUSES } from "../../../../api/adminV1/workerAPI";
import { STATUS_META, statusLabel, formatDate } from "../../utils/workerUtils";

const STATUS_FILTER_OPTIONS = [{ key: "", label: "All Status" }].concat(
  WORKER_STATUSES.map((s) => ({ key: s, label: statusLabel(s) })),
);

const FaceEnrollListing = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  // The list itself is the worker list, so it needs workers.view too.
  const canView = hasPermission("faceauth", "view") && hasPermission("workers", "view");
  const canEnroll = hasPermission("faceauth", "enroll");
  const canIdentify = hasPermission("faceauth", "identify");

  const {
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
  } = useFaceEnrollListing();

  const { dateRange, applyPreset, setCustomRange, presets, formatDateForDisplay } = useDateRangeFilter();
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  // The worker currently being enrolled — drives the FaceScanner overlay.
  const [enrollingWorker, setEnrollingWorker] = useState(null);
  // Identify Face: scanner open, and the worker whose details are shown after a match.
  const [identifying, setIdentifying] = useState(false);
  const [viewWorkerId, setViewWorkerId] = useState(null);
  const scannerOpen = !!enrollingWorker || identifying;

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const handleDateRangeChange = (range) => {
    if (range.preset === "custom") setCustomRange(range.from, range.to);
    else applyPreset(range.preset);
    setFilters((prev) => ({ ...prev, registeredFrom: range.from || "", registeredTo: range.to || "" }));
  };

  const handleClearAll = () => {
    handleClear();
    applyPreset("all");
  };

  // The camera overlay is rendered in place over this listing, so it pushes
  // a dummy history entry — the browser Back button then just closes the
  // scanner instead of leaving the page.
  const closingViaPopStateRef = useRef(false);

  const openEnrollModal = async (worker) => {
    const name = `${worker.firstName} ${worker.lastName}`;
    if (!(await confirmFaceConsent(name, !!worker.faceEnrolledAt))) return;
    window.history.pushState({ faceEnrollModal: true }, "");
    setEnrollingWorker(worker);
  };

  // Closes whichever scanner is open (enroll or identify).
  const closeEnrollModal = () => {
    setEnrollingWorker(null);
    setIdentifying(false);
    if (!closingViaPopStateRef.current && window.history.state?.faceEnrollModal) {
      window.history.back();
    }
  };

  useEffect(() => {
    if (!scannerOpen) return;
    const handlePopState = () => {
      closingViaPopStateRef.current = true;
      setEnrollingWorker(null);
      setIdentifying(false);
      closingViaPopStateRef.current = false;
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [scannerOpen]);

  const openIdentify = () => {
    window.history.pushState({ faceEnrollModal: true }, "");
    setIdentifying(true);
  };

  const escapeHtml = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // Identify: a rejected photo (422 quality/liveness) is retried from the
  // live camera; otherwise the scanner closes and the result is shown.
  const handleIdentifyCapture = async (blob) => {
    let result;
    try {
      result = parseFaceIdentifyResult(await identifyFaceAPI(blob));
    } catch (error) {
      const err = apiError(error, "Could not identify the face. Please try again.");
      if (err.code === "BUSINESS_RULE_VIOLATION" || err.code === "NETWORK_ERROR") {
        return { success: false, message: err.message, retryable: true };
      }
      closeEnrollModal();
      if (err.code === "RESOURCE_NOT_FOUND") result = { matched: false };
      else {
        Swal.fire({ icon: "error", title: "Identification failed", text: err.message });
        return { success: true };
      }
    }

    closeEnrollModal();
    if (!result.matched) {
      Swal.fire({
        icon: "warning",
        title: "No match found",
        text: "This face doesn't match any enrolled worker.",
      });
      return { success: true };
    }

    let worker = null;
    try {
      worker = await getWorkerAPI(result.workerId);
    } catch {
      /* fall back to showing just the id */
    }
    const name = worker ? [worker.firstName, worker.middleName, worker.lastName].filter(Boolean).join(" ") : "";
    const photo = worker?.profilePhotoUrl || worker?.faceEnrollment?.photoUrl;
    const confirm = await Swal.fire({
      icon: "success",
      title: "Worker identified",
      html: `
        <div class="flex flex-col items-center gap-2">
          ${photo ? `<img src="${escapeHtml(photo)}" alt="" class="w-20 h-20 rounded-xl object-cover border" />` : ""}
          <p class="text-lg font-semibold m-0">${escapeHtml(name || "Worker")}</p>
          ${worker ? `<p class="text-sm text-gray-600 m-0">${escapeHtml(worker.workerCode)} · ${escapeHtml(worker.mobileNumber)} · ${escapeHtml(statusLabel(worker.status))}</p>` : `<p class="text-xs text-gray-500 m-0">ID: ${escapeHtml(result.workerId)}</p>`}
          ${result.confidence != null ? `<p class="text-xs text-gray-500 m-0">Match confidence: ${Math.round(Number(result.confidence) * (Number(result.confidence) <= 1 ? 100 : 1))}%</p>` : ""}
        </div>`,
      showCancelButton: true,
      confirmButtonText: "View Details",
      cancelButtonText: "Close",
      confirmButtonColor: "#2563eb",
    });
    if (confirm.isConfirmed) setViewWorkerId(result.workerId);
    return { success: true };
  };

  if (!permissionsLoading && !canView) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <ScanFace className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to view face enrollment.</p>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="flex-1 bg-gray-50" initial="hidden" animate="visible" variants={containerVariants}>
      {/* HEADER */}
      <motion.div
        className={`bg-white p-4 border border-gray-200 shadow-sm ${filtersVisible ? "rounded-t-2xl border-b-0" : "mb-4 rounded-2xl"}`}
        variants={itemVariants}
      >
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl md:text-2xl !font-bold text-gray-800 truncate">Face Enroll</span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold whitespace-nowrap">
              <ScanFace className="w-3.5 h-3.5" />
              {totalRecords} Workers
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search name, code, mobile, email..."
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              className="w-full sm:w-64 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={() => setFiltersVisible(!filtersVisible)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition ${filtersVisible ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"}`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            {canIdentify && (
              <button
                onClick={openIdentify}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition"
              >
                <ScanSearch className="w-4 h-4" />
                <span className="hidden sm:inline">Identify Face</span>
                <span className="sm:hidden">Identify</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* FILTERS */}
      {filtersVisible && (
        <motion.div
          className="bg-white p-4 mb-4 rounded-b-2xl border border-gray-200 shadow-sm"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">FILTER BY :</div>
              <button
                onClick={handleClearAll}
                className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-3 items-start">
              <div className="relative w-56">
                <DateRangeDropdown
                  showDateDropdown={showDateDropdown}
                  setShowDateDropdown={setShowDateDropdown}
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                  presets={presets}
                  applyPreset={applyPreset}
                  formatDateForDisplay={formatDateForDisplay}
                />
              </div>
              <SelectFilter
                options={STATUS_FILTER_OPTIONS}
                value={filters.status}
                onChange={(v) => setFilter("status", v)}
              />
              <MultiFilter
                icon={Building2}
                placeholder="Search industry"
                options={filterOptions.industries}
                selected={filters.industryIds}
                onChange={(v) => setFilter("industryIds", v)}
              />
              <MultiFilter
                icon={Briefcase}
                placeholder="Search designation"
                options={filterOptions.designations}
                selected={filters.designationIds}
                onChange={(v) => setFilter("designationIds", v)}
              />
              <MultiFilter
                icon={MapPin}
                placeholder="Search state"
                options={filterOptions.states}
                selected={filters.stateIds}
                onChange={(v) => setFilter("stateIds", v)}
              />
              <MultiFilter
                icon={MapPin}
                placeholder={filters.stateIds.length ? "Search city" : "Select state first"}
                options={cities}
                selected={filters.cityIds}
                onChange={(v) => setFilter("cityIds", v)}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* TABLE */}
      <motion.div className="bg-white rounded-[22px] border border-[#DDDDDD] shadow-sm overflow-hidden" variants={itemVariants}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortableHeader label="Worker Name & Code" sortKey="firstName" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader label="Mobile" sortKey="mobileNumber" sortConfig={sortConfig} onSort={handleSort} />
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Designation</th>
                <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Face Enrollment</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : workers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    <div className="flex flex-col items-center">
                      <ScanFace className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-600">No workers found.</p>
                      <p className="text-sm mt-1 text-gray-400">Try adjusting your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                workers.map((worker, index) => (
                  <motion.tr
                    key={worker.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {worker.firstName} {worker.lastName} - {worker.workerCode}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{worker.mobileNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{worker.primaryDesignationName || "N/A"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_META[worker.status]?.className || "bg-gray-100 text-gray-700"}`}
                      >
                        {statusLabel(worker.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {worker.faceEnrolledAt ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex w-fit items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Enrolled
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(worker.faceEnrolledAt)}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Not Enrolled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {canEnroll ? (
                        <button
                          onClick={() => openEnrollModal(worker)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition ${worker.faceEnrolledAt ? "bg-gray-700 hover:bg-gray-800" : "bg-blue-600 hover:bg-blue-700"}`}
                        >
                          <ScanFace className="w-4 h-4" />
                          {worker.faceEnrolledAt ? "Update Face" : "Enroll Face"}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">No permission</span>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* PAGINATION */}
      {workers.length > 0 && (
        <motion.div className="flex items-center justify-center space-x-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition ${page === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-black hover:text-white"}`}
          >
            Prev
          </button>
          {[...Array(totalPages)].map((_, index) => {
            const p = index + 1;
            if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border text-sm shadow-sm transition ${page === p ? "bg-black text-white" : "bg-white hover:bg-black hover:text-white"}`}
                >
                  {p}
                </button>
              );
            }
            if (p === page - 3 || p === page + 3)
              return (
                <span key={p} className="px-2">
                  ...
                </span>
              );
            return null;
          })}
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition ${page === totalPages ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-black hover:text-white"}`}
          >
            Next
          </button>
        </motion.div>
      )}

      {/* ENROLL FACE */}
      {enrollingWorker && (
        <WorkerFaceScanner
          worker={enrollingWorker}
          workerName={`${enrollingWorker.firstName} ${enrollingWorker.lastName}`}
          reEnroll={!!enrollingWorker.faceEnrolledAt}
          onClose={closeEnrollModal}
          onEnrolled={(enrollment) => markEnrolled(enrollingWorker.id, enrollment)}
        />
      )}

      {/* IDENTIFY FACE */}
      {identifying && (
        <FaceScanner
          onCapture={handleIdentifyCapture}
          onClose={closeEnrollModal}
          challenge={false}
          labels={{
            submitting: "Identifying worker…",
            success: "Done ✓",
            failure: "We couldn't identify that photo. Please try again.",
          }}
        />
      )}

      <WorkerViewModal
        workerId={viewWorkerId}
        isOpen={!!viewWorkerId}
        onClose={() => setViewWorkerId(null)}
        departments={filterOptions.departments}
        industries={filterOptions.industries}
      />
    </motion.div>
  );
};

export default FaceEnrollListing;
