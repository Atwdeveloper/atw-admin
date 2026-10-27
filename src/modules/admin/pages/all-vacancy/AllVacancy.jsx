"use client";

import { motion } from "framer-motion";
import {
  Eye,
  Briefcase,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Users,
  Plus,
  Building2,
  MoreVertical,
} from "lucide-react";
import { useNavigate, useLocation } from "@/lib/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import { useVacancyListing } from "../../adminhooks/useVacancyListing";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import { useSortableData } from "../../../../common/hooks/useSortableData";
import SortableHeader from "../../../../common/components/SortableHeader";
import VacancyViewModal from "../../components/company/ViewVacancyModal";

const VacancyListing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  // Arriving from Company Listing's "Active Jobs" column pre-applies that company's filter
  const preAppliedCompanyId = location.state?.companyId
    ? String(location.state.companyId)
    : "";

  const {
    vacancies,
    loading,
    page,
    totalPages,
    totalRecords,
    setPage,
    filters,
    setFilters,
    companies,
    industries,
    designations,
    designationsLoading,
    handleSearch,
    handleClear,
    handleDelete,
    handleToggleStatus,
  } = useVacancyListing(
    preAppliedCompanyId ? { company_id: preAppliedCompanyId } : undefined,
  );

  const {
    sortedItems: sortedVacancies,
    sortConfig,
    requestSort,
  } = useSortableData(vacancies);

  // Modal state
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Per-row "more actions" dropdown menu
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Dropdown visibility & search states
  const [filtersVisible, setFiltersVisible] = useState(!!preAppliedCompanyId);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showRateDropdown, setShowRateDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusRef = useRef(null);

  const [companySearch, setCompanySearch] = useState("");
  const [designationSearch, setDesignationSearch] = useState("");
  const [industrySearch, setIndustrySearch] = useState("");

  const companyRef = useRef(null);
  const designationRef = useRef(null);
  const industryRef = useRef(null);
  const rateRef = useRef(null);
  const canViewVacancy = hasPermission("vacancy", "view");
  const canCreateVacancy = hasPermission("vacancy", "create");
  const canEditVacancy = hasPermission("vacancy", "edit");
  const canDeleteVacancy = hasPermission("vacancy", "delete");
  const canToggleVacancyStatus = hasPermission("vacancy", "toggle_status");
  const canViewAppliedWorkers = hasPermission(
    "vacancy",
    "view_applied_workers",
  );
  // const canExportVacancy = hasPermission("vacancy", "export");

  const rateTypes = [
    { label: "All Rate Types", value: "" },
    { label: "Salary(monthly)", value: "salary" },
    { label: "Daily", value: "daily" },
    { label: "Per Hour", value: "hourly" },
    { label: "Per Pcs", value: "pcs" },
    { label: "Per Gram", value: "gram" },
    { label: "Per KG", value: "kg" },
  ];

  const statusOptions = [
    { key: "all", label: "All Vacancies" },
    { key: "active", label: "Active Vacancies" },
    { key: "inactive", label: "Inactive Vacancies" },
    { key: "expired", label: "Expired Vacancies" },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={14} /> Active
          </span>
        );
      case "inactive":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircle size={14} /> Inactive
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <Clock size={14} /> Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status || "Unknown"}
          </span>
        );
    }
  };

  const isVacancyActive = (vacancy) => vacancy.status === "active";

  // Close dropdowns on outside click
  const handleClickOutside = useCallback((event) => {
    if (companyRef.current && !companyRef.current.contains(event.target)) {
      setShowCompanyDropdown(false);
      setCompanySearch("");
    }
    if (
      designationRef.current &&
      !designationRef.current.contains(event.target)
    ) {
      setShowDesignationDropdown(false);
      setDesignationSearch("");
    }
    if (industryRef.current && !industryRef.current.contains(event.target)) {
      setShowIndustryDropdown(false);
      setIndustrySearch("");
    }
    if (rateRef.current && !rateRef.current.contains(event.target)) {
      setShowRateDropdown(false);
    }
    if (statusRef.current && !statusRef.current.contains(event.target)) {
      setShowStatusDropdown(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  // Close the per-row "more actions" menu on outside click
  useEffect(() => {
    const handleActionMenuOutsideClick = (event) => {
      if (!event.target.closest(".action-menu-container")) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleActionMenuOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleActionMenuOutsideClick);
    };
  }, []);

  const getCurrentStatusLabel = () => {
    const currentValue = filters.status || "all";
    const option = statusOptions.find((opt) => opt.key === currentValue);
    return option ? option.label : "All Status";
  };

  const handleStatusChange = (statusKey) => {
    const newStatus = statusKey === "all" ? "" : statusKey;
    setFilters({ ...filters, status: newStatus });
    setShowStatusDropdown(false);
    handleSearch();
  };

  const handleEdit = (vacancy, event) => {
    event.stopPropagation();

    navigate(`/admin/vacancy/edit/${vacancy.id}`, {
      state: {
        companyName: vacancy.company_name,
      },
    });
  };
  if (!permissionsLoading && !canViewVacancy) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <Building2 className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view companies.
          </p>
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
    <motion.div
      className="flex-1 bg-gray-50"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* HEADER with Status Dropdown */}
      <motion.div
        className={`bg-white p-4 border border-gray-200 shadow-sm ${
          filtersVisible ? "rounded-t-2xl border-b-0" : "mb-4 rounded-2xl"
        }`}
        variants={itemVariants}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
          <div className="flex items-center gap-4">
            <div ref={statusRef} className="relative w-full md:w-auto">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="flex items-center justify-between space-x-4 text-2xl font-bold px-4 py-2 border border-gray-300 rounded-lg bg-white border-none hover:border-none"
              >
                <span className="text-gray-800">{getCurrentStatusLabel()}</span>
                <ChevronRight
                  className={`w-5 h-5 transition-transform ${
                    showStatusDropdown ? "rotate-90" : ""
                  }`}
                />
              </button>

              {showStatusDropdown && (
                <div className="absolute !w-64 z-50 mt-0 ml-2  bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {statusOptions.map((option) => (
                    <div
                      key={option.key}
                      onClick={() => handleStatusChange(option.key)}
                      className={`flex items-center justify-between px-4 py-2 cursor-pointer text-sm hover:bg-gray-100 ${
                        (filters.status || "all") === option.key
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      <span>{option.label}</span>
                      {(filters.status || "all") === option.key && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setFiltersVisible(!filtersVisible)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition ${
                filtersVisible
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            {canCreateVacancy && (
              <button
                onClick={() => navigate("/admin/vacancy/add")}
                className="flex items-center gap-2 px-4 py-2  text-white rounded-lg bg-blue-600 hover:bg-blue-700 0 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Vacancy</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* FILTER SECTION */}
      {filtersVisible && (
        <motion.div
          className="bg-white p-4 mb-4 rounded-b-2xl border border-gray-200 shadow-sm"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">
                FILTER BY :
              </div>
              <button
                onClick={() => {
                  handleClear();
                }}
                className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-3 items-start">
              {/* Company Dropdown */}
              <div ref={companyRef} className="relative w-56">
                <input
                  type="text"
                  placeholder="Search company..."
                  value={
                    showCompanyDropdown
                      ? companySearch
                      : filters.company_id
                        ? companies.find((c) => c.id == filters.company_id)
                            ?.company_name || ""
                        : ""
                  }
                  onChange={(e) => {
                    setCompanySearch(e.target.value);
                    if (!showCompanyDropdown) setShowCompanyDropdown(true);
                  }}
                  onFocus={() => {
                    setCompanySearch("");
                    setShowCompanyDropdown(true);
                  }}
                  className="w-full pl-3 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
                {showCompanyDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow max-h-60 overflow-y-auto">
                    <div
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setFilters({ ...filters, company_id: "" });
                        setShowCompanyDropdown(false);
                        handleSearch();
                      }}
                    >
                      All Companies
                    </div>
                    {companies
                      .filter(
                        (c) =>
                          !companySearch ||
                          c.company_name
                            ?.toLowerCase()
                            .includes(companySearch.toLowerCase()),
                      )
                      .map((c) => (
                        <div
                          key={c.id}
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                            filters.company_id == c.id ? "bg-blue-50" : ""
                          }`}
                          onClick={() => {
                            setFilters({ ...filters, company_id: c.id });
                            setShowCompanyDropdown(false);
                            handleSearch();
                          }}
                        >
                          {c.company_name}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Industry Dropdown */}
              <div ref={industryRef} className="relative w-48">
                <input
                  type="text"
                  placeholder="Search industry..."
                  value={
                    showIndustryDropdown
                      ? industrySearch
                      : filters.industry_id
                        ? industries.find((i) => i.id == filters.industry_id)
                            ?.name || ""
                        : ""
                  }
                  onChange={(e) => {
                    setIndustrySearch(e.target.value);
                    if (!showIndustryDropdown) setShowIndustryDropdown(true);
                  }}
                  onFocus={() => {
                    setIndustrySearch("");
                    setShowIndustryDropdown(true);
                  }}
                  className="w-full pl-3 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
                {showIndustryDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow max-h-60 overflow-y-auto">
                    <div
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setFilters({ ...filters, industry_id: "" });
                        setShowIndustryDropdown(false);
                        handleSearch();
                      }}
                    >
                      All Industries
                    </div>
                    {industries
                      .filter(
                        (i) =>
                          !industrySearch ||
                          i.name
                            ?.toLowerCase()
                            .includes(industrySearch.toLowerCase()),
                      )
                      .map((i) => (
                        <div
                          key={i.id}
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                            filters.industry_id == i.id ? "bg-blue-50" : ""
                          }`}
                          onClick={() => {
                            setFilters({ ...filters, industry_id: i.id });
                            setShowIndustryDropdown(false);
                            handleSearch();
                          }}
                        >
                          {i.name}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Designation Dropdown */}
              <div ref={designationRef} className="relative w-48">
                <input
                  type="text"
                  placeholder="Search designation..."
                  value={
                    showDesignationDropdown
                      ? designationSearch
                      : filters.designation_id
                        ? designations.find(
                            (d) => d.id == filters.designation_id,
                          )?.name || ""
                        : ""
                  }
                  onChange={(e) => {
                    setDesignationSearch(e.target.value);
                    if (!showDesignationDropdown)
                      setShowDesignationDropdown(true);
                  }}
                  onFocus={() => {
                    setDesignationSearch("");
                    setShowDesignationDropdown(true);
                  }}
                  className="w-full pl-3 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
                {showDesignationDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow max-h-60 overflow-y-auto">
                    {designationsLoading ? (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        Loading...
                      </div>
                    ) : (
                      <>
                        <div
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setFilters({ ...filters, designation_id: "" });
                            setShowDesignationDropdown(false);
                            handleSearch();
                          }}
                        >
                          All Designations
                        </div>
                        {designations
                          .filter(
                            (d) =>
                              !designationSearch ||
                              d.name
                                ?.toLowerCase()
                                .includes(designationSearch.toLowerCase()),
                          )
                          .map((d) => (
                            <div
                              key={d.id}
                              className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                                filters.designation_id == d.id
                                  ? "bg-blue-50"
                                  : ""
                              }`}
                              onClick={() => {
                                setFilters({
                                  ...filters,
                                  designation_id: d.id,
                                });
                                setShowDesignationDropdown(false);
                                handleSearch();
                              }}
                            >
                              {d.name}
                            </div>
                          ))}
                        {designationSearch &&
                          designations.filter((d) =>
                            d.name
                              ?.toLowerCase()
                              .includes(designationSearch.toLowerCase()),
                          ).length === 0 && (
                            <div className="px-3 py-2 text-gray-500 text-center text-sm">
                              No designations found
                            </div>
                          )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Rate Type Dropdown */}
              <div ref={rateRef} className="relative w-40">
                <div
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm cursor-pointer bg-white flex justify-between items-center"
                  onClick={() => setShowRateDropdown(!showRateDropdown)}
                >
                  <span>
                    {rateTypes.find((r) => r.value === filters.rate_type)
                      ?.label || "Rate Type"}
                  </span>
                  <ChevronDown size={16} />
                </div>
                {showRateDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow max-h-60 overflow-y-auto">
                    {rateTypes.map((r, idx) => (
                      <div
                        key={idx}
                        className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                          filters.rate_type === r.value ? "bg-blue-50" : ""
                        }`}
                        onClick={() => {
                          setFilters({ ...filters, rate_type: r.value });
                          setShowRateDropdown(false);
                          handleSearch();
                        }}
                      >
                        {r.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TABLE with Actions */}
      <motion.div
        className="bg-white rounded-[22px] border border-[#DDDDDD] shadow-sm overflow-hidden"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Vacancy List</h2>
          <h2 className="flex items-center gap-1 text-lg font-medium text-gray-800">
            <span>Total Vacancies : </span> {totalRecords}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortableHeader
                  label="Vacancy Code"
                  sortKey="id"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Company"
                  sortKey="company_name"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Designation"
                  sortKey="designation"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Industry"
                  sortKey="industry"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Rate Type"
                  sortKey="rate_type"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Location"
                  sortKey="location"
                  accessor={(v) => v.city || v.state || ""}
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Vacancies"
                  sortKey="number_of_workers"
                  accessor={(v) => v.number_of_workers ?? 0}
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Filled"
                  sortKey="filled_positions"
                  accessor={(v) => v.filled_positions ?? 0}
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Status"
                  sortKey="status"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : sortedVacancies.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-gray-500">
                    <div className="flex flex-col items-center">
                      <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-600 text-center">
                        No vacancies of this type are available for this
                        company.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedVacancies.map((vacancy, index) => (
                  <motion.tr
                    key={vacancy.id || index}
                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: { delay: index * 0.05 },
                      },
                    }}
                    onClick={() => {
                      setSelectedVacancy(vacancy);
                      setIsModalOpen(true);
                    }}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {`VAC-${vacancy.id}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {vacancy.company_name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {vacancy.designation || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-600">
                      {vacancy.industry || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm capitalize">
                      {vacancy.rate_type || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {vacancy.city && vacancy.state ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800">
                            {vacancy.city}
                          </span>

                          <span className="text-xs text-gray-500">
                            {vacancy.state}
                          </span>
                        </div>
                      ) : vacancy.city ? (
                        <span className="font-medium text-gray-800">
                          {vacancy.city}
                        </span>
                      ) : vacancy.state ? (
                        <span className="font-medium text-gray-800">
                          {vacancy.state}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {vacancy.number_of_workers ?? 0}
                    </td>
                    {/* <td className="px-6 py-4">
  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
    <Users size={14} className="text-blue-600" />

    <span className="text-sm font-semibold text-blue-700">
      {vacancy.filled_workers || 0}
    </span>

    <span className="text-xs text-gray-500">
      / {vacancy.number_of_workers || 0}
    </span>
  </div>
</td> */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-800">
                          {vacancy.filled_positions || 0} /{" "}
                          {vacancy.number_of_workers || 0}
                        </span>

                        <span className="text-xs text-green-600 font-medium">
                          {vacancy.number_of_workers
                            ? `${(
                                ((vacancy.filled_positions || 0) /
                                  vacancy.number_of_workers) *
                                100
                              ).toFixed(1)}% Filled`
                            : "0% Filled"}
                        </span>
                      </div>
                    </td>{" "}
                    <td className="px-6 py-4">
                      {getStatusBadge(vacancy.status)}
                    </td>
                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="px-6 py-4 cursor-auto"
                    >
                      <div className="relative inline-block action-menu-container">
                        <button
                          onClick={() =>
                            setOpenActionMenuId(
                              openActionMenuId === vacancy.id
                                ? null
                                : vacancy.id,
                            )
                          }
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                          title="Actions"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openActionMenuId === vacancy.id && (
                          <div className="absolute right-0 z-20 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden text-left">
                            <button
                              onClick={() => {
                                setOpenActionMenuId(null);
                                setSelectedVacancy(vacancy);
                                setIsModalOpen(true);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Eye size={16} />
                              View
                            </button>
                            {canEditVacancy && (
                              <button
                                onClick={(e) => {
                                  setOpenActionMenuId(null);
                                  handleEdit(vacancy, e);
                                }}
                                disabled={vacancy.status === "expired"}
                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm ${
                                  vacancy.status === "expired"
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-gray-700 hover:bg-gray-50"
                                }`}
                                title={
                                  vacancy.status === "expired"
                                    ? "Expired vacancy cannot be edited"
                                    : "Edit"
                                }
                              >
                                <Edit2 size={16} />
                                Edit
                              </button>
                            )}
                            {canViewAppliedWorkers && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  navigate(
                                    `/admin/vacancy/applied-workers/${vacancy.id}`,
                                    {
                                      state: {
                                        designationName: vacancy.designation,
                                        companyName: vacancy.company_name,
                                        companyCode: vacancy.company_code,
                                      },
                                    },
                                  );
                                }}
                                disabled={
                                  vacancy.status === "inactive" ||
                                  vacancy.status === "expired"
                                }
                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm ${
                                  vacancy.status === "inactive" ||
                                  vacancy.status === "expired"
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-gray-700 hover:bg-gray-50"
                                }`}
                                title={
                                  vacancy.status === "inactive"
                                    ? "Vacancy is inactive"
                                    : vacancy.status === "expired"
                                      ? "Vacancy is expired"
                                      : "Applied Workers"
                                }
                              >
                                <Users size={16} />
                                Applied Workers
                              </button>
                            )}
                            {canToggleVacancyStatus &&
                              vacancy.status?.toLowerCase().trim() !==
                                "expired" && (
                                <button
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleToggleStatus(
                                      vacancy.id,
                                      vacancy.status,
                                    );
                                  }}
                                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm border-t border-gray-100 ${
                                    isVacancyActive(vacancy)
                                      ? "text-red-600 hover:bg-red-50"
                                      : "text-green-600 hover:bg-green-50"
                                  }`}
                                >
                                  {isVacancyActive(vacancy) ? (
                                    <>
                                      <XCircle size={16} />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle size={16} />
                                      Activate
                                    </>
                                  )}
                                </button>
                              )}
                            {canDeleteVacancy && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  handleDelete(vacancy.id);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* PAGINATION */}
      {vacancies.length > 0 && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition ${
              page === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-black hover:text-white"
            }`}
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, idx) => {
            const p = idx + 1;
            if (
              p === 1 ||
              p === totalPages ||
              (p >= page - 1 && p <= page + 1)
            ) {
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border text-sm shadow-sm transition ${
                    page === p
                      ? "bg-black text-white"
                      : "bg-white hover:bg-black hover:text-white"
                  }`}
                >
                  {p}
                </button>
              );
            }
            if (p === page - 3 || p === page + 3) {
              return (
                <span key={p} className="px-2">
                  ...
                </span>
              );
            }
            return null;
          })}

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition ${
              page === totalPages
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-black hover:text-white"
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* VACANCY VIEW MODAL (pass callbacks) */}
      <VacancyViewModal
        vacancy={selectedVacancy}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEdit={() => {
          setIsModalOpen(false);
          if (selectedVacancy)
            navigate(`/admin/vacancy/edit/${selectedVacancy.id}`);
        }}
        onToggleStatus={(vacancyId, status) =>
          handleToggleStatus(vacancyId, status)
        }
        onDelete={(vacancyId) => handleDelete(vacancyId)}
      />
    </motion.div>
  );
};

export default VacancyListing;
