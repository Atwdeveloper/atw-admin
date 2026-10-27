"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Briefcase,
  Users,
  Clock,
  Coffee,
  IndianRupee,
  MapPin,
  Calendar,
} from "lucide-react";

const JobOpeningViewModal = ({
  job,
  isOpen,
  onClose,
  onEdit,
  onToggleStatus,
  onDelete,
}) => {
  if (!job) return null;

  const isActive = job.status === "active";
  const statusText = isActive ? "Active" : "Inactive";

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRateDisplay = () => {
    if (!job.base_rate) return "N/A";
    if (job.rate_type === "salary") {
      return `₹${job.base_rate} / month`;
    } else {
      const rateTypeMap = {
        hourly: "hour",
        daily: "day",
        pcs: "piece",
        gram: "gram",
        kg: "kg",
      };
      const unit = rateTypeMap[job.rate_type] || "";
      return `₹${job.base_rate} per ${unit}`;
    }
  };

  const getBreakDisplay = () => {
    if (job.break_type === "paid") {
      return `Paid (${job.break_duration_minutes} min)`;
    } else if (job.break_type === "unpaid") {
      return "Unpaid";
    } else {
      return "Not Applicable";
    }
  };

  const getJobTypeDisplay = () => {
    if (job.rate_type === "salary") return "Salary";
    const map = {
      hourly: "Per Hour",
      daily: "Daily",
      pcs: "Per Piece",
      gram: "Per Gram",
      kg: "Per KG",
    };
    return map[job.rate_type] || job.rate_type;
  };

  const schedules = job.schedules || [];
  const schedule = schedules[0]; // assuming one schedule per job

  const renderScheduleDetails = () => {
    if (!schedule)
      return <p className="text-sm text-gray-500">No schedule set</p>;

    if (schedule.mode === "dates") {
      let datesList = [];
      if (schedule.dates && Array.isArray(schedule.dates)) {
        if (
          schedule.dates.length > 0 &&
          typeof schedule.dates[0] === "string"
        ) {
          datesList = schedule.dates.map((d) =>
            formatShortDate(d.split("T")[0]),
          );
        } else {
          datesList = schedule.dates.map((d) => formatShortDate(d.date));
        }
      }

      if (datesList.length === 0) {
        return <p className="text-sm text-gray-500">No dates selected</p>;
      }

      return (
        <div className="flex flex-wrap gap-2 mt-1">
          {datesList.map((date, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200"
            >
              {date}
            </span>
          ))}
        </div>
      );
    } else if (schedule.mode === "weekly") {
      let weekdays = [];
      if (schedule.weekdays && Array.isArray(schedule.weekdays)) {
        if (
          schedule.weekdays.length > 0 &&
          typeof schedule.weekdays[0] === "number"
        ) {
          weekdays = schedule.weekdays;
        } else {
          weekdays = schedule.weekdays.map((w) => w.weekday).filter(Boolean);
        }
      }

      if (weekdays.length === 0) {
        return <p className="text-sm text-gray-500">No weekdays selected</p>;
      }

      const weekdayNames = weekdays.map((dayNum) => {
        const map = {
          1: "Mon",
          2: "Tue",
          3: "Wed",
          4: "Thu",
          5: "Fri",
          6: "Sat",
          7: "Sun",
        };
        return map[dayNum];
      });

      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {weekdayNames.map((day, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200"
              >
                {day}
              </span>
            ))}
          </div>
          {(schedule.start_date || schedule.end_date) && (
            <p className="text-xs text-gray-600 mt-1 flex justify-between">
              <span>
                {schedule.start_date &&
                  `From: ${formatShortDate(schedule.start_date)}`}
              </span>
              <span>
                {schedule.end_date &&
                  `Until: ${formatShortDate(schedule.end_date)}`}
              </span>
            </p>
          )}
        </div>
      );
    }

    return <p className="text-sm text-gray-500">Unknown schedule</p>;
  };

  return (
    <AnimatePresence>
      {isOpen && job && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Briefcase className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {job.designation?.name || "Job Opening"} #{job.id}
                    </h3>
                    <div className="flex items-center flex-wrap gap-2 mt-2">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {statusText}
                      </span>
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                  icon={<Users className="text-blue-500" />}
                  label="Workers Needed"
                  value={job.number_of_workers}
                />
                <StatCard
                  icon={<Clock className="text-green-500" />}
                  label="Shift"
                  value={`${job.shift_start_time?.substring(0, 5) || "?"} - ${job.shift_end_time?.substring(0, 5) || "?"}`}
                />
                <StatCard
                  icon={<IndianRupee className="text-orange-500" />}
                  label="Rate"
                  value={getRateDisplay()}
                />
                <StatCard
                  icon={<Coffee className="text-purple-500" />}
                  label="Breaks"
                  value={getBreakDisplay()}
                />
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <Card
                    title="Job Details"
                    icon={<Briefcase className="text-indigo-500" />}
                  >
                    <DetailItem
                      label="Designation"
                      value={job.designation?.name}
                    />
                    <DetailItem
                      label="Industry"
                      value={job.industry?.name || job.industry || "N/A"}
                    />
                    <DetailItem label="Job Type" value={getJobTypeDisplay()} />
                    <DetailItem
                      label="Workers Required"
                      value={job.number_of_workers}
                    />
                    <DetailItem
                      label="Shift Time"
                      value={`${job.shift_start_time?.substring(0, 5) || ""} - ${job.shift_end_time?.substring(0, 5) || ""}`}
                    />
                  </Card>

                  <Card
                    title="Location"
                    icon={<MapPin className="text-blue-500" />}
                  >
                    <DetailItem label="City" value={job.city?.name} />
                    <DetailItem label="State" value={job.state?.name} />
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <Card
                    title="Compensation"
                    icon={<IndianRupee className="text-green-500" />}
                  >
                    <DetailItem label="Base Rate" value={getRateDisplay()} />
                  </Card>

                  <Card
                    title="Perks & Conditions"
                    icon={<Coffee className="text-orange-500" />}
                  >
                    <DetailItem label="Breaks" value={getBreakDisplay()} />
                    <DetailItem
                      label="Meals"
                      value={job.meal_provided ? "Provided" : "Not Provided"}
                    />
                    <DetailItem
                      label="Notes"
                      value={job.notes_to_workers || "None"}
                    />
                  </Card>

                  <Card
                    title="Schedule"
                    icon={<Calendar className="text-purple-500" />}
                  >
                    {renderScheduleDetails()}
                  </Card>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Created: {formatDate(job.created_at)}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  {/* {onEdit && (
                    <button
                      onClick={() => {
                        onClose();
                        onEdit(job);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                  )} */}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Card = ({ title, icon, children }) => (
  <div className="bg-gray-50 rounded-xl p-5">
    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
      {icon}
      <span className="ml-2">{title}</span>
    </h4>
    <div className="space-y-3">{children}</div>
  </div>
);

const DetailItem = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-gray-900 font-medium">{value || "—"}</span>
  </div>
);

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white rounded-xl p-4 border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-lg font-medium text-gray-900">{value}</p>
      </div>
      <div className="p-2 bg-gray-100 rounded-lg">{icon}</div>
    </div>
  </div>
);

export default JobOpeningViewModal;
