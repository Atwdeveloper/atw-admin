"use client";

import { useState, useCallback } from 'react';

export const useDateRangeFilter = () => {
  const [dateRange, setDateRange] = useState({
    from: '',
    to: '',
    preset: 'all'
  });

  // Helper to format date as YYYY-MM-DD
  const formatDate = useCallback((date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Helper to get date X days ago
  const getDaysAgo = useCallback((days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return formatDate(date);
  }, [formatDate]);

  // Helper to get today
  const getToday = useCallback(() => {
    return formatDate(new Date());
  }, [formatDate]);

  // Helper to get yesterday
  const getYesterday = useCallback(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDate(yesterday);
  }, [formatDate]);

  // Helper to get first/last day of month
  const getFirstDayOfMonth = useCallback((year, month) => {
    return formatDate(new Date(year, month, 1));
  }, [formatDate]);

  const getLastDayOfMonth = useCallback((year, month) => {
    return formatDate(new Date(year, month + 1, 0));
  }, [formatDate]);

  // Preset configurations
  const presets = useCallback(() => [
    { 
      id: 'all', 
      label: 'All Time', 
      action: () => {
        return { from: '', to: '' };
      }
    },
    { 
      id: 'today', 
      label: 'Today', 
      action: () => {
        const today = getToday();
        return { from: today, to: today };
      }
    },
    { 
      id: 'yesterday', 
      label: 'Yesterday', 
      action: () => {
        const yesterday = getYesterday();
        return { from: yesterday, to: yesterday };
      }
    },
    { 
      id: 'last7days', 
      label: 'Last 7 Days', 
      action: () => ({
        from: getDaysAgo(6),
        to: getToday()
      })
    },
    { 
      id: 'last30days', 
      label: 'Last 30 Days', 
      action: () => ({
        from: getDaysAgo(29),
        to: getToday()
      })
    },
    { 
      id: 'thismonth', 
      label: 'This Month', 
      action: () => {
        const now = new Date();
        return {
          from: getFirstDayOfMonth(now.getFullYear(), now.getMonth()),
          to: getLastDayOfMonth(now.getFullYear(), now.getMonth())
        };
      }
    },
    { 
      id: 'lastmonth', 
      label: 'Last Month', 
      action: () => {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
        return {
          from: getFirstDayOfMonth(lastMonth.getFullYear(), lastMonth.getMonth()),
          to: getLastDayOfMonth(lastMonth.getFullYear(), lastMonth.getMonth())
        };
      }
    },
    { 
      id: 'thisquarter', 
      label: 'This Quarter', 
      action: () => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const quarter = Math.floor(currentMonth / 3);
        const quarterStartMonth = quarter * 3;
        const quarterEndMonth = quarterStartMonth + 2;
        
        return {
          from: getFirstDayOfMonth(now.getFullYear(), quarterStartMonth),
          to: getLastDayOfMonth(now.getFullYear(), quarterEndMonth)
        };
      }
    },
    { 
      id: 'lastquarter', 
      label: 'Last Quarter', 
      action: () => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const quarter = Math.floor(currentMonth / 3);
        const lastQuarter = quarter - 1;
        
        let year = now.getFullYear();
        let quarterStartMonth = lastQuarter * 3;
        
        if (lastQuarter < 0) {
          year -= 1;
          quarterStartMonth = 9; // October (4th quarter of previous year)
        }
        
        const quarterEndMonth = quarterStartMonth + 2;
        
        return {
          from: getFirstDayOfMonth(year, quarterStartMonth),
          to: getLastDayOfMonth(year, quarterEndMonth)
        };
      }
    },
    { 
      id: 'thisyear', 
      label: 'This Year', 
      action: () => {
        const now = new Date();
        return {
          from: getFirstDayOfMonth(now.getFullYear(), 0),
          to: getLastDayOfMonth(now.getFullYear(), 11)
        };
      }
    },
    { 
      id: 'lastyear', 
      label: 'Last Year', 
      action: () => {
        const now = new Date();
        const lastYear = now.getFullYear() - 1;
        return {
          from: getFirstDayOfMonth(lastYear, 0),
          to: getLastDayOfMonth(lastYear, 11)
        };
      }
    },
    { 
      id: 'custom', 
      label: 'Custom Range', 
      action: null
    }
  ], [getToday, getYesterday, getDaysAgo, getFirstDayOfMonth, getLastDayOfMonth]);

  // Apply preset
  const applyPreset = useCallback((presetId) => {
    const presetList = presets();
    const preset = presetList.find(p => p.id === presetId);
    
    if (!preset) return;
    
    if (presetId === 'custom') {
      setDateRange(prev => ({
        ...prev,
        preset: 'custom'
      }));
      return;
    }
    
    const range = preset.action();
    setDateRange({
      from: range.from,
      to: range.to,
      preset: presetId
    });
  }, [presets]);

  // Set custom range
  const setCustomRange = useCallback((from, to) => {
    setDateRange({
      from,
      to,
      preset: 'custom'
    });
  }, []);

  // Clear date range
  const clearDateRange = useCallback(() => {
    setDateRange({
      from: '',
      to: '',
      preset: 'custom'
    });
  }, []);

  // Format date for display
  const formatDateForDisplay = useCallback((dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, []);

  // Get display label
  const getDisplayLabel = useCallback(() => {
    if (dateRange.preset === 'custom') {
      if (dateRange.from && dateRange.to) {
        return `${formatDateForDisplay(dateRange.from)} - ${formatDateForDisplay(dateRange.to)}`;
      }
      return 'Select Date Range';
    }
    
    const presetList = presets();
    const preset = presetList.find(p => p.id === dateRange.preset);
    return preset ? preset.label : 'Select Date Range';
  }, [dateRange, formatDateForDisplay, presets]);

  return {
    // State
    dateRange,
    
    // Actions
    applyPreset,
    setCustomRange,
    clearDateRange,
    
    // Getters
    getDisplayLabel,
    presets: presets(),
    formatDateForDisplay,
    
    // Status
    isDateRangeSet: dateRange.from && dateRange.to
  };
};