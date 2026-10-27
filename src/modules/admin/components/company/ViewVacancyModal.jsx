"use client";

// components/VacancyViewModal.jsx
import { motion, AnimatePresence } from "framer-motion";

import {
  X,
  Briefcase,
  MapPin,
  Clock,
  Calendar,
  IndianRupee,
  Activity,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";

const VacancyViewModal = ({ vacancy, isOpen, onClose }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "Not Provided";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "—";
    // Assuming format "HH:mm:ss"
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const formatDateTime = (dateString) => {
    if (!dateString) return "Not Provided";
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const timePart = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${datePart}, ${timePart}`;
  };
  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle size={14} /> Active
          </span>
        );
      case "inactive":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            <XCircle size={14} /> Inactive
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <XCircle size={14} /> Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  const renderSchedules = (schedules) => {
    if (!schedules || schedules.length === 0) return "No schedule defined";
    return (
      <div className="space-y-2">
        {schedules.map((sch, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-700 p-2 rounded-lg text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium capitalize">{sch.mode}</span>
              {sch.start_date && (
                <span className="text-slate-500">
                  from {formatDate(sch.start_date)}
                </span>
              )}
              {sch.end_date && (
                <span className="text-slate-500">
                  to {formatDate(sch.end_date)}
                </span>
              )}
            </div>
            {sch.weekdays && sch.weekdays.length > 0 && (
              <div className="mt-1">
                Days:{" "}
                {sch.weekdays
                  .map(
                    (d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d],
                  )
                  .join(", ")}
              </div>
            )}
            {sch.dates && sch.dates.length > 0 && (
              <div className="mt-1">
                Specific dates: {sch.dates.map((d) => formatDate(d)).join(", ")}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderMealProvided = (value) => {
    return value == 1 ? (
      <span className="text-green-600 dark:text-green-400 font-medium">
        Yes
      </span>
    ) : (
      <span className="text-slate-400">No</span>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && vacancy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                    <Briefcase className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      VAC-{vacancy.id}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {vacancy.company_name || "Unknown Company"}
                      </span>
                      <span className="text-sm px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                        {vacancy.designation || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Job Details & Compensation */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Job Details Card */}
                  <Card
                    title="Job Details"
                    icon={<Briefcase className="text-indigo-500" />}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DetailItem
                        label="Designation"
                        value={vacancy.designation || "—"}
                      />
                      <DetailItem
                        label="Industry"
                        value={vacancy.industry || "—"}
                      />
                      {/* <DetailItem label="Number of Workers" value={vacancy.number_of_workers ?? "—"} />
                      <DetailItem
                        label="Status"
                        value={getStatusBadge(vacancy.status)}
                      /> */}
                    </div>
                  </Card>

                  {/* Compensation Card */}
                  <Card
                    title="Compensation"
                    icon={<IndianRupee className="text-amber-500" />}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DetailItem
                        label="Rate Type"
                        value={vacancy.rate_type || "—"}
                      />
                      <DetailItem
                        label="Base Rate"
                        value={vacancy.base_rate ?? "—"}
                      />
                    </div>
                  </Card>

                  {/* Shift & Schedule Card */}
                  <Card
                    title="Shift & Schedule"
                    icon={<Clock className="text-blue-500" />}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DetailItem
                        label="Shift Start"
                        value={formatTime(vacancy.shift_start_time)}
                      />
                      <DetailItem
                        label="Shift End"
                        value={formatTime(vacancy.shift_end_time)}
                      />
                      <DetailItem
                        label="Break Type"
                        value={vacancy.break_type || "—"}
                      />
                      {vacancy.break_duration_minutes !== null &&
                        vacancy.break_duration_minutes !== undefined && (
                          <DetailItem
                            label="Break Duration"
                            value={`${vacancy.break_duration_minutes} min`}
                          />
                        )}
                      <DetailItem
                        label="Meal Provided"
                        value={renderMealProvided(vacancy.meal_provided)}
                      />
                    </div>

                    {/* Schedules Section */}
                    {vacancy.schedules && vacancy.schedules.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1">
                          <Calendar size={16} /> Work Schedules
                        </h5>
                        {renderSchedules(vacancy.schedules)}
                      </div>
                    )}
                  </Card>

                  {/* Additional Notes */}
                  {vacancy.notes_to_workers && (
                    <Card
                      title="Notes to Workers"
                      icon={<FileText className="text-gray-500" />}
                    >
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {vacancy.notes_to_workers}
                      </p>
                    </Card>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Location Card */}
                  <Card
                    title="Location"
                    icon={<MapPin className="text-red-500" />}
                  >
                    <div className="space-y-3">
                      <DetailItem label="City" value={vacancy.city || "—"} />
                      <DetailItem label="State" value={vacancy.state || "—"} />
                    </div>
                  </Card>

                  {/* Quick Summary */}
                  <Card
                    title="Quick Summary"
                    icon={<Activity className="text-green-500" />}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Created On
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {formatDateTime(vacancy.created_at)}
                        </span>
                      </div>
                      {vacancy.schedules?.[0]?.end_date && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            Expired On
                          </span>
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {formatDate(vacancy.schedules[0].end_date)}
                            {","}
                            {formatTime(vacancy.shift_end_time)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Status
                        </span>
                        {getStatusBadge(vacancy.status)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Workers Needed
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {vacancy.number_of_workers ?? "—"}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-800 px-6 py-4 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Vacancy ID: VAC-{vacancy.id}
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Reusable Components (provided inside same file for simplicity)
const Card = ({ title, icon, children }) => (
  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
      {icon}
      <span className="ml-2">{title}</span>
    </h4>
    {children}
  </div>
);

const DetailItem = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <div className="text-sm text-slate-600 dark:text-slate-400">{label}</div>
    <div className="text-slate-900 dark:text-slate-100 font-medium">
      {value}
    </div>
  </div>
);

export default VacancyViewModal;
