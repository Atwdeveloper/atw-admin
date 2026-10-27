"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DateRangeDropdown = ({
  dateRange,
  onDateRangeChange,
  presets,
  applyPreset,
  formatDateForDisplay,
  showDateDropdown,
  setShowDateDropdown,
  className = "",
}) => {
  const [showFromCalendar, setShowFromCalendar] = useState(false);
  const [showToCalendar, setShowToCalendar] = useState(false);
  const [tempFromDate, setTempFromDate] = useState(dateRange.from);
  const [tempToDate, setTempToDate] = useState(dateRange.to);
  const dropdownRef = useRef(null);
  const calendarRef = useRef(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const isOpen = showDateDropdown;
  // Sync temp dates with actual dateRange
  useEffect(() => {
    setTempFromDate(dateRange.from);
    setTempToDate(dateRange.to);
  }, [dateRange.from, dateRange.to]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDateDropdown(false);
        setShowFromCalendar(false);
        setShowToCalendar(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowFromCalendar(false);
        setShowToCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle preset selection
  const handlePresetSelect = (presetId) => {
    const presetList = presets;
    const preset = presetList.find((p) => p.id === presetId);

    if (!preset) return;

    if (presetId === "custom") {
      // For custom, just update the hook state
      applyPreset(presetId);

      // Notify parent that custom was selected (with current dates if any)
      if (onDateRangeChange) {
        onDateRangeChange({
          from: dateRange.from,
          to: dateRange.to,
          preset: "custom",
        });
      }
      return;
    }

    // For other presets, get the range
    const range = preset.action();

    // Update hook state
    applyPreset(presetId);

    // Notify parent with the new range
    if (onDateRangeChange) {
      onDateRangeChange({
        from: range.from,
        to: range.to,
        preset: presetId,
      });
    }

    setShowDateDropdown(false);
  };

  // Handle custom date change
  const handleCustomDateChange = (type, value) => {
    if (type === "from") {
      setTempFromDate(value);
    } else {
      setTempToDate(value);
    }
  };

  // Apply custom range
  const handleApplyCustomRange = () => {
    if (onDateRangeChange) {
      onDateRangeChange({
        from: tempFromDate,
        to: tempToDate,
        preset: "custom",
      });
    }
    setShowDateDropdown(false);
    setShowFromCalendar(false);
    setShowToCalendar(false);
  };

  // Clear custom range
  const handleClearCustomRange = () => {
    setTempFromDate("");
    setTempToDate("");
    if (onDateRangeChange) {
      onDateRangeChange({
        from: "",
        to: "",
        preset: "all",
      });
      setShowDateDropdown(false);
    }
  };

  // Render calendar day picker
  const renderCalendar = (type, currentDate) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const handleDaySelect = (day) => {
      const selectedDate = new Date(year, month, day);
      const formattedDate = `${selectedDate.getFullYear()}-${String(
        selectedDate.getMonth() + 1,
      ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      handleCustomDateChange(type, formattedDate);
      if (type === "from") {
        setShowFromCalendar(false);
      } else {
        setShowToCalendar(false);
      }
    };

    return (
      <div
        className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64"
        ref={calendarRef}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              if (month === 0) {
                setYear(year - 1);
                setMonth(11);
              } else {
                setMonth(month - 1);
              }
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="w-4 h-4 transform rotate-180" />
          </button>
          <div className="font-semibold">
            {monthNames[month]} {year}
          </div>
          <button
            onClick={() => {
              if (month === 11) {
                setYear(year + 1);
                setMonth(0);
              } else {
                setMonth(month + 1);
              }
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdayNames.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 py-1"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((dateObj, index) => {
            if (!dateObj) {
              return <div key={`empty-${index}`} className="h-8" />;
            }

            const day = dateObj.getDate();
            const isSelected =
              type === "from" && tempFromDate
                ? dateObj.toISOString().split("T")[0] === tempFromDate
                : type === "to" && tempToDate
                  ? dateObj.toISOString().split("T")[0] === tempToDate
                  : false;
            const isToday =
              dateObj.toDateString() === new Date().toDateString();

            return (
              <button
                key={`${year}-${month}-${day}`}
                onClick={() => handleDaySelect(day)}
                className={`
                  h-8 w-8 flex items-center justify-center text-sm rounded-full
                  ${isToday ? "border border-blue-500" : ""}
                  ${isSelected ? "bg-blue-600 text-white" : "hover:bg-gray-100"}
                  ${
                    dateObj.getMonth() !== month
                      ? "text-gray-400"
                      : "text-gray-800"
                  }
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Get display text for button
  const getButtonText = () => {
    if (dateRange.preset === "custom" && dateRange.from && dateRange.to) {
      return `${formatDateForDisplay(dateRange.from)} - ${formatDateForDisplay(dateRange.to)}`;
    }

    const activePreset = presets.find((p) => p.id === dateRange.preset);
    return activePreset ? activePreset.label : "Date of Registration";
  };

  return (
    <div
      ref={dropdownRef}
      className={`relative ${className}`}
      onBlur={() => setShowDateDropdown(false)}
    >
      {/* Main Dropdown Button */}
      <button
        // onClick={() => setShowDateDropdown(!isOpen)}
        onClick={() => setShowDateDropdown(!showDateDropdown)}
        className="flex items-center justify-between w-full px-4 py-1.5 text-left border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className=" text-sm font-medium text-gray-700">
            {getButtonText()}
          </span>
        </div>
        <ChevronRight
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
        />
      </button>

      {/* Dropdown Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-72 md:w-80 overflow-hidden"
          >
            {/* Preset Options */}
            <div className="max-h-80 overflow-y-auto">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id)}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0
                    ${dateRange.preset === preset.id ? "bg-blue-50" : ""}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${dateRange.preset === preset.id ? "bg-blue-600" : "bg-gray-300"}`}
                    />
                    <span
                      className={`text-sm ${dateRange.preset === preset.id ? "text-blue-700 font-medium" : "text-gray-700"}`}
                    >
                      {preset.label}
                    </span>
                  </div>
                  {dateRange.preset === preset.id && preset.id !== "custom" && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
              ))}
            </div>

            {/* Custom Range Section - Only shown when custom is selected AND dropdown is open */}
            {dateRange.preset === "custom" && (
              <div className="border-t border-gray-200 p-4 h-auto overflow-y-auto">
                <div className="space-y-4 ">
                  {/* From Date */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Date
                    </label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={16}
                      />
                      <input
                        type="text"
                        value={formatDateForDisplay(tempFromDate)}
                        onClick={() => {
                          setShowFromCalendar(!showFromCalendar);
                          setShowToCalendar(false);
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                        placeholder="Select from date"
                        readOnly
                      />
                      {tempFromDate && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCustomDateChange("from", "");
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>

                    {/* From Date Calendar */}
                    {showFromCalendar && (
                      <div className="absolute z-10 mt-1 left-0">
                        {renderCalendar("from")}
                      </div>
                    )}
                  </div>

                  {/* To Date */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To Date
                    </label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={16}
                      />
                      <input
                        type="text"
                        value={formatDateForDisplay(tempToDate)}
                        onClick={() => {
                          setShowToCalendar(!showToCalendar);
                          setShowFromCalendar(false);
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                        placeholder="Select to date"
                        readOnly
                      />
                      {tempToDate && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCustomDateChange("to", "");
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>

                    {/* To Date Calendar */}
                    {showToCalendar && (
                      <div className="absolute z-10 mt-1 left-0">
                        {renderCalendar("to")}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-4 border-t border-gray-200">
                    <button
                      onClick={handleClearCustomRange}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleApplyCustomRange}
                      className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateRangeDropdown;
