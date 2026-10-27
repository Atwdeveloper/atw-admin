"use client";

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "@/lib/navigation";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import {
  Users,
  TrendingUp,
  Building2,
  Search,
  Filter,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Eye,
  Briefcase,
  MapPin,
  Receipt,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useInvoicingDashboard } from "../../adminhooks/useInvoicingDashboard";
import Swal from "sweetalert2";
import axiosInstance from "../../../../api/axiosInstance";
import Breadcrumb from "../../../../common/components/Breadcrumb";

// ---------- Motion Variants ----------
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

// ---------- Constants ----------
const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val || 0);

// const tabs = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly", "Custom Range"];
const tabs = ["Monthly", "Custom Range"];
const IconMap = { Receipt, TrendingUp, CheckCircle, AlertCircle, Clock };

// ---------- Custom Dropdown Component ----------
const CustomDropdown = ({
  icon: Icon,
  value,
  options,
  onChange,
  placeholder,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options?.find(
    (opt) => opt.id.toString() === value?.toString(),
  );
  const displayValue = isOpen
    ? search
    : selectedOption
      ? selectedOption.name
      : "";

  const filteredOptions =
    options?.filter((opt) =>
      opt.name.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  return (
    <div
      ref={wrapperRef}
      className="relative w-48"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="relative">
        <Icon
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={16}
        />
        <input
          type="text"
          value={displayValue}
          disabled={disabled}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (disabled) return;
            setSearch("");
            setIsOpen(true);
          }}
          className={`w-full pl-10 pr-8 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}`}
          placeholder={placeholder}
        />
        <ChevronRight
          className={`w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform ${isOpen ? "-rotate-90" : "rotate-90"}`}
        />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div
            className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 ${!value ? "bg-blue-50" : ""}`}
            onClick={() => {
              onChange("");
              setIsOpen(false);
              setSearch("");
            }}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                {placeholder.replace("Search ", "All ")}
              </span>
              {!value && <CheckCircle className="w-4 h-4 text-green-600" />}
            </div>
          </div>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div
                key={opt.id}
                className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${value?.toString() === opt.id.toString() ? "bg-blue-50" : ""}`}
                onClick={() => {
                  onChange(opt.id);
                  setIsOpen(false);
                  setSearch("");
                }}
              >
                <div className="flex items-center justify-between text-sm">
                  <span>{opt.name}</span>
                  {value?.toString() === opt.id.toString() && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-400 text-center">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CompanyPaymentDetails = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const { loading, data, filters, updateFilter, refresh } =
    useInvoicingDashboard();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  if (permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="text-gray-600 animate-pulse font-medium">
          Loading Permissions...
        </div>
      </div>
    );
  }

  if (!hasPermission("reports", "invoice_reports")) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-lg p-8 text-center max-w-md shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view Invoice Reports.
          </p>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleViewInvoice = async (invoiceId, invoiceNo) => {
    Swal.fire({
      title: "Loading...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await axiosInstance.get(
        `/admin/invoicing-dashboard/invoice/${invoiceId}`,
      );
      Swal.close();

      if (response.data.status === 200) {
        const details = response.data.data;

        const itemsHtml =
          details.items && details.items.length > 0
            ? `
                <div class="border-t pt-3 mt-3">
                    <p class="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-widest">Service Breakdown</p>
                    <div class="space-y-3">
                        ${details.items
                          .map(
                            (item) => `
                            <div class="flex justify-between items-start">
                                <div>
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <p class="text-sm font-bold text-gray-800">${item.designation_name || "General Service"}</p>
                                        ${
                                          item.vacancy_workers_needed
                                            ? `
                                            <span class="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                Vacancy: ${item.vacancy_workers_needed} Workers • ${item.vacancy_rate_details}
                                            </span>
                                        `
                                            : ""
                                        }
                                    </div>
                                    <p class="text-xs text-gray-500 uppercase">${item.worker_count} Workers • ${item.total_days_worked} Days</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-sm font-semibold text-gray-700">₹${item.total_ctc?.toLocaleString()}</p>
                                </div>
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                </div>
            `
            : "";

        Swal.fire({
          title: `Invoice #${details.invoice_number}`,
          html: `
            <div class="text-left space-y-4 font-sans">
              <div class="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div>
                    <p class="text-xs text-gray-400 uppercase font-semibold tracking-tighter">Billing Period</p>
                    <p class="font-bold text-sm text-gray-800">${new Date(details.month_year).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
                </div>
                <div class="text-right">
                    <p class="text-xs text-gray-400 uppercase font-semibold tracking-tighter">Status</p>
                    <span class="px-2 py-0.5 text-xs font-semibold uppercase rounded-lg ${details.status === "paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}">${details.status}</span>
                </div>
              </div>

              <div class="space-y-1">
                <p class="text-xs text-gray-400 uppercase font-semibold tracking-tighter">Billed To</p>
                <p class="text-sm font-bold text-gray-900">${details.company?.company_name}</p>
                <p class="text-xs text-gray-500">${details.company?.addresses?.[0]?.city?.name || ""}, ${details.company?.addresses?.[0]?.state?.name || ""}</p>
              </div>

              ${itemsHtml}
              
              <div class="border-t pt-3 space-y-2">
                <div class="flex justify-between text-xs text-gray-500"><span>Gross Subtotal</span><span class="font-bold">₹${details.total_gross?.toLocaleString()}</span></div>
                <div class="flex justify-between text-xs text-gray-500"><span>Employer PF</span><span class="font-bold">₹${(details.total_pf ?? 0).toLocaleString()}</span></div>
                <div class="flex justify-between text-xs text-gray-500"><span>Employer ESI</span><span class="font-bold">₹${(details.total_esi ?? 0).toLocaleString()}</span></div>
                <div class="flex justify-between text-xs text-gray-500"><span>Employer Gratuity</span><span class="font-bold">₹${(details.total_gratuity ?? 0).toLocaleString()}</span></div>
                <div class="flex justify-between text-xs text-gray-500"><span>Service Charge</span><span class="font-bold">₹${details.service_charge_amount?.toLocaleString()}</span></div>
                <div class="flex justify-between text-xs text-gray-500"><span>GST (18%)</span><span class="font-bold">₹${details.tax_amount?.toLocaleString()}</span></div>
                <div class="flex justify-between font-semibold text-blue-600 pt-3 mt-1 border-t text-lg"><span>Grand Total</span><span>₹${details.total_amount?.toLocaleString()}</span></div>
              </div>
            </div>
          `,
          showCloseButton: true,
          showConfirmButton: false,
          width: "500px",
          customClass: {
            container: "font-sans",
            popup: "rounded-[2rem]",
            title: "text-2xl font-semibold",
          },
        });
      }
    } catch (err) {
      Swal.fire("Error", "Failed to fetch invoice details", "error");
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Backend paginated ledger
  const paginatedLedger = data?.ledger || [];
  const pagination = data?.pagination || {
    current_page: 1,
    last_page: 1,
    total: 0,
  };
  const currentPage = pagination.current_page;
  const totalPages = pagination.last_page;
  const totalItems = pagination.total;
  const startIndex = (currentPage - 1) * (filters.limit || 10);
  const endIndex = startIndex + paginatedLedger.length;

  return (
    <div className="min-h-screen bg-gray-50/50 w-full px-4 md:px-8 py-6">
      <div className="mx-auto space-y-6">
        {/* Header & Filters Wrapper */}
        {/* Header & Filters Wrapper */}
        <div className="flex flex-col">
          {/* Header & Breadcrumbs */}
          <motion.div
            className={`bg-white p-4 border border-gray-200 shadow-sm ${
              showFilters ? "rounded-t-2xl border-b-0" : "mb-4 rounded-2xl"
            }`}
            variants={itemVariants}
          >
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
              {/* Left Section */}
              <div className="space-y-1 w-full xl:w-auto">
                <Breadcrumb
                  items={[
                    { label: "Reports", path: "/admin/reports" },
                    { label: "Invoice Report" },
                  ]}
                />

                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  Invoice Report
                </h1>

                <p className="text-gray-500 font-medium ml-1">
                  Management of Invoices & Financial Operations
                </p>
              </div>

              {/* Right Section */}
              <div className="flex flex-col items-start xl:items-end gap-3 w-full xl:w-auto">
                {/* Date Range Text */}
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-left xl:text-right w-full">
                  {data?.activeRange?.start && data?.activeRange?.end
                    ? `${new Date(data.activeRange.start).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                        },
                      )} - ${new Date(data.activeRange.end).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}`
                    : `${filters.period} - May 2026`}
                </p>

                {/* Controls Wrapper */}
                <div className="flex flex-wrap  items-start xl:items-center gap-3 w-full">
                  {/* Custom Date Range */}
                  {filters.period === "Custom Range" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm w-full lg:w-auto"
                    >
                      {/* Start Date */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 w-full sm:w-auto">
                        <Calendar className="w-4 h-4 text-gray-400" />

                        <input
                          type="date"
                          value={filters.start_date}
                          onChange={(e) =>
                            updateFilter("start_date", e.target.value)
                          }
                          className="bg-transparent text-sm font-medium text-gray-700 outline-none w-full"
                        />
                      </div>

                      <span className="text-xs font-semibold text-gray-500 uppercase hidden sm:block">
                        to
                      </span>

                      {/* End Date */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 w-full sm:w-auto">
                        <Calendar className="w-4 h-4 text-gray-400" />

                        <input
                          type="date"
                          value={filters.end_date}
                          onChange={(e) =>
                            updateFilter("end_date", e.target.value)
                          }
                          className="bg-transparent text-sm font-medium text-gray-700 outline-none w-full"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Tabs */}
                  <div className="flex flex-wrap sm:flex-nowrap bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-full lg:w-auto">
                    {tabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => updateFilter("period", tab)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex-1 lg:flex-none whitespace-nowrap ${
                          filters.period === tab
                            ? "bg-blue-600 text-white shadow-md"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full md:w-64 hidden md:block">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={16}
                    />

                    <input
                      type="text"
                      placeholder="Search invoice..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          updateFilter("search", searchTerm);
                          updateFilter("page", 1);
                        }
                      }}
                      className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Filter Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                      showFilters
                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                    }`}
                  >
                    <Filter className="w-4 h-4" />

                    <span className="hidden sm:inline text-sm">Filters</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filters Section */}
          {showFilters && (
            <motion.div
              className="bg-white p-4 rounded-b-2xl border border-gray-200 shadow-sm"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex flex-col gap-4">
                {/* Top Row */}
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700">
                    FILTER BY :
                  </div>

                  <button
                    onClick={() => {
                      updateFilter("company_id", "");
                      updateFilter("state_id", "");
                      updateFilter("city_id", "");
                      updateFilter("industry_id", "");
                      updateFilter("designation_id", "");
                      updateFilter("agent_id", "");
                      updateFilter("search", "");
                      updateFilter("page", 1);
                      setSearchTerm("");
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Clear All
                  </button>
                </div>

                {/* Filter Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                  {/* Customer Filter */}
                  <CustomDropdown
                    icon={Building2}
                    value={filters.company_id}
                    options={data?.filterOptions?.customers}
                    onChange={(val) => updateFilter("company_id", val)}
                    placeholder="Search Customers"
                  />

                  {/* State Filter */}
                  <CustomDropdown
                    icon={MapPin}
                    value={filters.state_id}
                    options={data?.filterOptions?.states}
                    onChange={(val) => {
                      updateFilter("state_id", val);
                      updateFilter("city_id", "");
                    }}
                    placeholder="Search States"
                  />

                  {/* City Filter */}
                  <CustomDropdown
                    icon={MapPin}
                    value={filters.city_id}
                    options={data?.filterOptions?.cities}
                    onChange={(val) => updateFilter("city_id", val)}
                    placeholder={
                      filters.state_id ? "Search Cities" : "Select State First"
                    }
                    disabled={!filters.state_id}
                  />

                  {/* Industry Filter */}
                  <CustomDropdown
                    icon={Building2}
                    value={filters.industry_id}
                    options={data?.filterOptions?.industries}
                    onChange={(val) => {
                      updateFilter("industry_id", val);
                      updateFilter("designation_id", "");
                    }}
                    placeholder="Search Industries"
                  />

                  {/* Designation Filter */}
                  <CustomDropdown
                    icon={Briefcase}
                    value={filters.designation_id}
                    options={data?.filterOptions?.designations}
                    onChange={(val) => updateFilter("designation_id", val)}
                    placeholder={
                      filters.industry_id
                        ? "Search Designations"
                        : "Select Industry First"
                    }
                    disabled={!filters.industry_id}
                  />

                  {/* Agent Filter */}
                  <CustomDropdown
                    icon={Users}
                    value={filters.agent_id}
                    options={data?.filterOptions?.agents}
                    onChange={(val) => updateFilter("agent_id", val)}
                    placeholder="Search Agents"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Section: KPIs */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Key Performance Indicators
            <div className="flex-1 h-[1px] bg-gradient-to-r from-gray-200 to-transparent ml-2" />
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {data?.kpis?.map((stat, idx) => {
              const Icon = IconMap[stat.icon] || Receipt;
              return (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <Icon
                      className={`w-4 h-4 ${stat.alert ? "text-red-400" : "text-blue-400"}`}
                    />
                  </div>
                  <p
                    className={`text-2xl font-semibold ${stat.alert ? "text-red-600" : "text-gray-900"}`}
                  >
                    {stat.value}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* Section: Invoice List */}
        <section className="space-y-4">
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-[22px] shadow-sm border border-[#DDDDDD] overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">
                Invoice List
              </h2>
              <h2 className="flex items-center justify-between gap-1 text-sm font-medium text-gray-500">
                Showing {totalItems > 0 ? startIndex + 1 : 0} - {endIndex} of{" "}
                {totalItems} Invoices
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Invoice No</th>
                    <th className="px-6 py-4">Month</th>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">State</th>
                    <th className="px-6 py-4">City</th>
                    <th className="px-6 py-4">Industry</th>
                    <th className="px-6 py-4 text-right">Revenue (₹)</th>
                    <th className="px-6 py-4 text-right">GST (₹)</th>
                    <th className="px-6 py-4 text-right">GST + Total (₹)</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4">Agent</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedLedger.map((item, idx) => (
                    <tr
                      key={idx}
                      className="group hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewInvoice(item.id, item.inv)}
                          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-all text-sm focus:outline-none text-left"
                        >
                          {item.inv}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-500">
                        {item.month}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800 leading-tight">
                            {item.co}
                          </span>
                          {item.co_code && (
                            <span className="text-xs font-semibold text-blue-500 uppercase tracking-tight">
                              {item.co_code}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-500">
                        {item.st}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-500">
                        {item.ct}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-tight">
                        {item.ind}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-lg font-semibold text-gray-800 leading-none">
                            ₹
                          </span>
                          <span className="text-lg font-semibold text-gray-800 leading-none">
                            {item.rev}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-lg font-semibold text-gray-800 leading-none">
                            ₹
                          </span>
                          <span className="text-lg font-semibold text-gray-800 leading-none">
                            {item.gst || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-lg font-semibold text-gray-800 leading-none">
                            ₹
                          </span>
                          <span className="text-lg font-semibold text-gray-800 leading-none">
                            {item.gst_total || item.rev}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${
                            item.status.toLowerCase() === "paid"
                              ? "bg-green-50 text-green-700 border-green-100"
                              : "bg-red-50 text-red-700 border-red-100"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-700 leading-tight">
                            {item.agent}
                          </span>
                          {item.agent_code && (
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-tight">
                              {item.agent_code}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleViewInvoice(item.id, item.inv)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all group-hover:scale-110"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {paginatedLedger.length === 0 && (
                <div className="p-12 text-center text-gray-400 font-medium italic">
                  No invoices found for the selected period.
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 bg-gray-50/50">
                <button
                  onClick={() =>
                    updateFilter("page", Math.max(currentPage - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-white text-sm font-semibold text-gray-600 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-sm font-semibold text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    updateFilter("page", Math.min(currentPage + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-white text-sm font-semibold text-gray-600 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default CompanyPaymentDetails;
