"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams, useLocation } from "@/lib/navigation";
import {
  Briefcase,
  Eye,
  CheckCircle,
  XCircle,
  Filter,
  Building2,
  MapPin,
  ChevronRight,
  Clock,
} from "lucide-react";

import Breadcrumb from "../../../../common/components/Breadcrumb";
import {
  containerVariants,
  itemVariants,
  tableRowVariants,
} from "../../../../common/utils/motionVariants";
import { useJobOpeningsList } from "../../adminhooks/useJobOpeningsList";
import {
  getIndustriesAPI,
  getDesignationsAPI,
  getStatesAPI,
  getCitiesAPI,
} from "../../../../api/company/companyVacancyAPI"; // reuse company APIs
import JobOpeningViewModal from "../../components/company/JobOpeningViewModal";
import Loader from "../../../../common/components/Loader";

const JobOpeningsList = ({}) => {
  const { id } = useParams(); // get companyId from URL
  const location = useLocation();
  const [companyName, setCompanyName] = useState(
    location.state?.companyName || "",
  );

  // Industry dropdown state
  const [industries, setIndustries] = useState([]);
  const [filteredIndustries, setFilteredIndustries] = useState([]);
  const [industrySearch, setIndustrySearch] = useState("");
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const industryRef = useRef(null);

  // Designation dropdown state
  const [designations, setDesignations] = useState([]);
  const [filteredDesignations, setFilteredDesignations] = useState([]);
  const [designationsLoading, setDesignationsLoading] = useState(false);
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);
  const designationRef = useRef(null);

  // State dropdown
  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const stateRef = useRef(null);

  // City dropdown
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const cityRef = useRef(null);

  // Selected location names for display
  const [selectedStateName, setSelectedStateName] = useState("");
  const [selectedCityName, setSelectedCityName] = useState("");

  // Status filter dropdown
  const [statusFilter, setStatusFilter] = useState("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusFilterRef = useRef(null);

  // Filter panel visibility
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Modal state
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hook for job openings data
  const {
    jobList,
    loading,
    page,
    totalPages,
    setPage,
    filters,
    setFilters,
    handleSearch,

    handleDelete,
    handleToggleStatus,
  } = useJobOpeningsList(id);

  // Rate type options for filter dropdown
  const rateTypeOptions = [
    { value: "", label: "Job Type" },
    { value: "salary", label: "Salary" },
    { value: "hourly", label: "Per Hour" },
    { value: "daily", label: "Daily" },
    { value: "pcs", label: "Per Pcs" },
    { value: "gram", label: "Per Gram" },
    { value: "kg", label: "Per KG" },
  ];

  // Status options
  const statusOptions = [
    { key: "all", label: "All Vacancies" },
    { key: "active", label: "Active" },
    { key: "inactive", label: "Inactive" },
  ];

  // Fetch industries
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const response = await getIndustriesAPI();
        const data = response.data?.data || [];
        setIndustries(data);
        setFilteredIndustries(data);
      } catch (error) {
        console.error("Error fetching industries:", error);
      }
    };
    fetchIndustries();
  }, []);

  // Fetch designations when industry changes
  useEffect(() => {
    const fetchDesignations = async () => {
      if (!filters.industry_id) {
        setDesignations([]);
        setFilteredDesignations([]);
        return;
      }
      setDesignationsLoading(true);
      try {
        const response = await getDesignationsAPI(filters.industry_id, {
          per_page: 1000,
        });
        const data = response.data?.data?.data || [];
        setDesignations(data);
        setFilteredDesignations(data);
      } catch (error) {
        console.error("Error fetching designations:", error);
        setDesignations([]);
        setFilteredDesignations([]);
      } finally {
        setDesignationsLoading(false);
      }
    };
    fetchDesignations();
  }, [filters.industry_id]);

  // Fetch states
  useEffect(() => {
    const fetchStates = async () => {
      setStatesLoading(true);
      try {
        const response = await getStatesAPI();
        const data = response.data?.data || [];
        setStates(data);
      } catch (error) {
        console.error("Error fetching states:", error);
      } finally {
        setStatesLoading(false);
      }
    };
    fetchStates();
  }, []);

  // Fetch cities when state changes
  useEffect(() => {
    const fetchCities = async () => {
      if (!filters.state_id) {
        setCities([]);
        return;
      }
      setCitiesLoading(true);
      try {
        const response = await getCitiesAPI(filters.state_id);
        const data = response.data?.data || [];
        setCities(data);
        // pre‑select city name if already set
        if (filters.city_id) {
          const city = data.find(
            (c) => c.id.toString() === filters.city_id.toString(),
          );
          if (city) setSelectedCityName(city.name);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
        setCities([]);
      } finally {
        setCitiesLoading(false);
      }
    };
    fetchCities();
  }, [filters.state_id]);

  // Update selected state name when filters.state_id changes
  useEffect(() => {
    if (filters.state_id) {
      const state = states.find(
        (s) => s.id.toString() === filters.state_id.toString(),
      );
      if (state) setSelectedStateName(state.name);
    } else {
      setSelectedStateName("");
      setSelectedCityName("");
    }
  }, [filters.state_id, states]);

  // Update selected city name when filters.city_id changes
  useEffect(() => {
    if (filters.city_id && cities.length > 0) {
      const city = cities.find(
        (c) => c.id.toString() === filters.city_id.toString(),
      );
      if (city) setSelectedCityName(city.name);
    } else {
      setSelectedCityName("");
    }
  }, [filters.city_id, cities]);

  // Sync status filter with filters object
  useEffect(() => {
    const newStatus = statusFilter === "all" ? "" : statusFilter;
    if (filters.status !== newStatus) {
      setFilters((prev) => ({ ...prev, status: newStatus }));
    }
  }, [statusFilter]);

  // Debounced search when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [
    filters.status,
    filters.industry_id,
    filters.designation_id,
    filters.rate_type,
    filters.state_id,
    filters.city_id,
  ]);

  // Click outside handlers for dropdowns
  const handleClickOutside = useCallback((event) => {
    if (industryRef.current && !industryRef.current.contains(event.target)) {
      setShowIndustryDropdown(false);
      setIndustrySearch("");
    }
    if (
      designationRef.current &&
      !designationRef.current.contains(event.target)
    ) {
      setShowDesignationDropdown(false);
    }
    if (stateRef.current && !stateRef.current.contains(event.target)) {
      setShowStateDropdown(false);
      setStateSearch("");
    }
    if (cityRef.current && !cityRef.current.contains(event.target)) {
      setShowCityDropdown(false);
      setCitySearch("");
    }
    if (
      statusFilterRef.current &&
      !statusFilterRef.current.contains(event.target)
    ) {
      setShowStatusDropdown(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  // Industry selection
  const handleIndustrySelect = (industry) => {
    setFilters({
      ...filters,
      industry_id: industry.id,
      designation_id: "", // clear dependent
    });
    setShowIndustryDropdown(false);
    setIndustrySearch("");
  };

  // Designation selection
  const handleDesignationSelect = (designationId, designationName) => {
    setFilters({ ...filters, designation_id: designationId });
    setShowDesignationDropdown(false);
  };

  // State selection
  const handleStateSelect = (state) => {
    setFilters({
      ...filters,
      state_id: state.id,
      city_id: "",
    });
    setSelectedStateName(state.name);
    setSelectedCityName("");
    setStateSearch("");
    setShowStateDropdown(false);
  };

  // City selection
  const handleCitySelect = (city) => {
    setFilters({ ...filters, city_id: city.id });
    setSelectedCityName(city.name);
    setCitySearch("");
    setShowCityDropdown(false);
  };

  // Rate type change
  const handleRateTypeChange = (e) => {
    setFilters({ ...filters, rate_type: e.target.value });
  };

  // Clear all filters
  const handleClearAll = () => {
    setFilters({
      industry_id: "",
      designation_id: "",
      rate_type: "",
      status: "",
      state_id: "",
      city_id: "",
    });
    setSelectedStateName("");
    setSelectedCityName("");
    setStatusFilter("all");
    setFiltersVisible(false);
    handleSearch();
  };

  // View modal handlers
  const handleView = (job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedJob(null);
    setIsModalOpen(false);
  };

  // Helper to format shift
  const formatShift = (job) => {
    if (job.shift_start_time && job.shift_end_time) {
      const start = job.shift_start_time.substring(0, 5);
      const end = job.shift_end_time.substring(0, 5);
      return `${start} - ${end}`;
    }
    return "N/A";
  };

  // Helper to format rate
  const formatRate = (job) => {
    if (!job.base_rate) return "N/A";
    const rateTypeMap = {
      salary: "/ month",
      hourly: "/ hour",
      daily: "/ day",
      pcs: "/ piece",
      gram: "/ gram",
      kg: "/ kg",
    };
    const suffix = rateTypeMap[job.rate_type] || "";
    return `₹${job.base_rate} ${suffix}`;
  };

  if (loading && jobList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
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
      <motion.div className="px-4 pt-4">
        <Breadcrumb
          items={[
            { label: "Companies", path: "/admin/company/listing" },
            {
              label: "Job Openings",
              path: `/admin/company/job-openings/${id}`,
            },
            { label: companyName || "Company" },
          ]}
        />
      </motion.div>
      {/* Search & Filter Card */}
      <motion.div
        className={`bg-white p-4 border border-gray-200 shadow-sm mx-4 ${
          filtersVisible ? "rounded-t-2xl border-b-0" : "mb-4 rounded-2xl"
        }`}
        variants={itemVariants}
      >
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center w-full">
          {/* Status filter dropdown */}
          <div
            ref={statusFilterRef}
            className="relative w-full md:w-auto mb-3 lg:mb-0"
          >
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="flex items-center justify-between space-x-4 text-2xl font-bold px-4 py-2 bg-white"
            >
              <span className="text-gray-800">
                {statusOptions.find((o) => o.key === statusFilter)?.label}
              </span>
              <ChevronRight
                className={`w-5 h-5 stroke-[3px] stroke-black transition-transform ${
                  showStatusDropdown ? "rotate-90" : ""
                }`}
              />
            </button>

            {showStatusDropdown && (
              <div className="absolute z-50 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {statusOptions.map((option) => (
                  <div
                    key={option.key}
                    onClick={() => {
                      setStatusFilter(option.key);
                      setShowStatusDropdown(false);
                    }}
                    className={`flex items-center justify-between px-4 py-2 cursor-pointer text-sm hover:bg-gray-100 ${
                      statusFilter === option.key
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    <span>{option.label}</span>
                    {statusFilter === option.key && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
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
          </div>
        </div>
      </motion.div>

      {/* Expanded Filters */}
      {filtersVisible && (
        <motion.div
          className="bg-white p-4 mb-4 mx-4 rounded-b-2xl border border-gray-200 shadow-sm"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">
                FILTER BY :
              </div>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear All
              </button>
            </div>

            <div className="flex flex-wrap gap-3 items-start">
              {/* Industry Dropdown */}
              <div
                ref={industryRef}
                className="relative w-48"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <Building2
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={
                      showIndustryDropdown
                        ? industrySearch
                        : filters.industry_id
                          ? industries.find((i) => i.id === filters.industry_id)
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
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 text-sm rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    placeholder="Industry..."
                  />
                </div>

                {showIndustryDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div
                      className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 ${
                        !filters.industry_id ? "bg-blue-50" : ""
                      }`}
                      onClick={() => {
                        setFilters({
                          ...filters,
                          industry_id: "",
                          designation_id: "",
                        });
                        setShowIndustryDropdown(false);
                      }}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">All Industries</span>
                        {!filters.industry_id && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </div>
                    {filteredIndustries
                      .filter(
                        (i) =>
                          !industrySearch ||
                          i.name
                            .toLowerCase()
                            .includes(industrySearch.toLowerCase()),
                      )
                      .map((industry) => (
                        <div
                          key={industry.id}
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                            filters.industry_id === industry.id
                              ? "bg-blue-50"
                              : ""
                          }`}
                          onClick={() => handleIndustrySelect(industry)}
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span>{industry.name}</span>
                            {filters.industry_id === industry.id && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    {industrySearch &&
                      filteredIndustries.filter((i) =>
                        i.name
                          .toLowerCase()
                          .includes(industrySearch.toLowerCase()),
                      ).length === 0 && (
                        <div className="px-3 py-2 text-gray-500 text-center">
                          No industries found
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Designation Dropdown */}
              <div
                ref={designationRef}
                className="relative w-48"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <Briefcase
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={
                      filters.designation_id
                        ? designations.find(
                            (d) => d.id.toString() === filters.designation_id,
                          )?.name || ""
                        : ""
                    }
                    onFocus={() => {
                      if (filters.industry_id) setShowDesignationDropdown(true);
                    }}
                    className={`w-full pl-10 pr-4 py-1.5 border border-gray-300 text-sm rounded-lg  focus:outline-none  ${
                      !filters.industry_id
                        ? "bg-gray-100 cursor-not-allowed"
                        : "bg-white focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    }`}
                    placeholder={
                      !filters.industry_id
                        ? "Select industry first"
                        : "Designation..."
                    }
                    readOnly
                  />
                  {designationsLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                {showDesignationDropdown && filters.industry_id && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {designationsLoading ? (
                      <div className="px-3 py-2 text-gray-500 text-center">
                        Loading...
                      </div>
                    ) : (
                      <>
                        <div
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 ${
                            !filters.designation_id ? "bg-blue-50" : ""
                          }`}
                          onClick={() => {
                            setFilters({ ...filters, designation_id: "" });
                            setShowDesignationDropdown(false);
                          }}
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                              All Designations
                            </span>
                            {!filters.designation_id && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </div>

                        {designations.length > 0 ? (
                          designations.map((des) => (
                            <div
                              key={des.id}
                              className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                filters.designation_id === des.id.toString()
                                  ? "bg-blue-50"
                                  : ""
                              }`}
                              onClick={() =>
                                handleDesignationSelect(
                                  des.id.toString(),
                                  des.name,
                                )
                              }
                            >
                              <div className="flex items-center justify-between text-sm">
                                <span>{des.name}</span>
                                {filters.designation_id ===
                                  des.id.toString() && (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-gray-500 text-center">
                            No designations
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Rate Type Dropdown */}
              <div className="relative w-36">
                <select
                  value={filters.rate_type || ""}
                  onChange={handleRateTypeChange}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {rateTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* State Dropdown */}
              <div
                ref={stateRef}
                className="relative w-40"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={showStateDropdown ? stateSearch : selectedStateName}
                    onChange={(e) => {
                      setStateSearch(e.target.value);
                      if (!showStateDropdown) setShowStateDropdown(true);
                    }}
                    onFocus={() => {
                      setStateSearch("");
                      setShowStateDropdown(true);
                    }}
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Search state"
                  />
                </div>

                {showStateDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {statesLoading ? (
                      <div className="px-3 py-2 text-gray-500 text-center">
                        Loading...
                      </div>
                    ) : states.length > 0 ? (
                      <>
                        <div
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 ${
                            !filters.state_id ? "bg-blue-50" : ""
                          }`}
                          onClick={() => {
                            setFilters({
                              ...filters,
                              state_id: "",
                              city_id: "",
                            });
                            setSelectedStateName("");
                            setSelectedCityName("");
                            setStateSearch("");
                            setShowStateDropdown(false);
                          }}
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">All States</span>
                            {!filters.state_id && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </div>

                        {states
                          .filter(
                            (s) =>
                              !stateSearch ||
                              s.name
                                .toLowerCase()
                                .includes(stateSearch.toLowerCase()),
                          )
                          .map((state) => (
                            <div
                              key={state.id}
                              className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                filters.state_id === state.id
                                  ? "bg-blue-50"
                                  : ""
                              }`}
                              onClick={() => handleStateSelect(state)}
                            >
                              <div className="flex items-center justify-between text-sm">
                                <span>{state.name}</span>
                                {filters.state_id === state.id && (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                )}
                              </div>
                            </div>
                          ))}

                        {stateSearch &&
                          states.filter((s) =>
                            s.name
                              .toLowerCase()
                              .includes(stateSearch.toLowerCase()),
                          ).length === 0 && (
                            <div className="px-3 py-2 text-gray-500 text-center border-t border-gray-200 text-sm">
                              No states found for "{stateSearch}"
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-center">
                        No states
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* City Dropdown */}
              <div
                ref={cityRef}
                className="relative w-40"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={showCityDropdown ? citySearch : selectedCityName}
                    onChange={(e) => {
                      setCitySearch(e.target.value);
                      if (!showCityDropdown) setShowCityDropdown(true);
                    }}
                    onFocus={() => {
                      if (filters.state_id) {
                        setCitySearch("");
                        setShowCityDropdown(true);
                      }
                    }}
                    disabled={!filters.state_id}
                    className={`w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none  ${
                      !filters.state_id
                        ? "bg-gray-100 cursor-not-allowed"
                        : "bg-white focus:ring-1 focus:ring-blue-500"
                    }`}
                    placeholder={
                      !filters.state_id ? "Select state first" : "Search city"
                    }
                  />
                  {citiesLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                {showCityDropdown && filters.state_id && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {citiesLoading ? (
                      <div className="px-3 py-2 text-gray-500 text-center">
                        Loading...
                      </div>
                    ) : cities.length > 0 ? (
                      <>
                        <div
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 ${
                            !filters.city_id ? "bg-blue-50" : ""
                          }`}
                          onClick={() => {
                            setFilters({ ...filters, city_id: "" });
                            setSelectedCityName("");
                            setCitySearch("");
                            setShowCityDropdown(false);
                          }}
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">All Cities</span>
                            {!filters.city_id && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </div>

                        {cities
                          .filter(
                            (c) =>
                              !citySearch ||
                              c.name
                                .toLowerCase()
                                .includes(citySearch.toLowerCase()),
                          )
                          .map((city) => (
                            <div
                              key={city.id}
                              className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                filters.city_id === city.id ? "bg-blue-50" : ""
                              }`}
                              onClick={() => handleCitySelect(city)}
                            >
                              <div className="flex items-center justify-between text-sm">
                                <span>{city.name}</span>
                                {filters.city_id === city.id && (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                )}
                              </div>
                            </div>
                          ))}

                        {citySearch &&
                          cities.filter((c) =>
                            c.name
                              .toLowerCase()
                              .includes(citySearch.toLowerCase()),
                          ).length === 0 && (
                            <div className="px-3 py-2 text-gray-500 text-center border-t border-gray-200 text-sm">
                              No cities found for "{citySearch}"
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-center">
                        No cities found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <motion.div
        className="bg-white rounded-[22px] border border-[#DDDDDD] shadow-sm overflow-hidden mx-4"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">
            Job Openings List
          </h2>
          <h2 className="flex items-center gap-1 text-lg font-medium text-gray-800">
            <span>Total :</span> {jobList?.length || 0}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  "Designation",
                  "Workers",
                  "Shift",
                  "Rate",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-600"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && jobList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : jobList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-500">
                    No job openings found
                  </td>
                </tr>
              ) : (
                jobList.map((job, index) => (
                  <motion.tr
                    key={job.id}
                    className="cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleView(job)}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {job.designation?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {job.number_of_workers}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatShift(job)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatRate(job)}
                    </td>
                    {/* <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          job.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {job.status === "active" ? "Active" : "Inactive"}
                        {job.status === "active" ? (
                          <CheckCircle className="w-3 h-3 ml-1" />
                        ) : (
                          <XCircle className="w-3 h-3 ml-1" />
                        )}
                      </span>
                    </td> */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          job.status === "active"
                            ? "bg-green-100 text-green-800"
                            : job.status === "expired"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {job.status === "active"
                          ? "Active"
                          : job.status === "expired"
                            ? "Expired"
                            : "Inactive"}

                        {job.status === "active" ? (
                          <CheckCircle className="w-3 h-3 ml-1" />
                        ) : job.status === "expired" ? (
                          <Clock className="w-3 h-3 ml-1" />
                        ) : (
                          <XCircle className="w-3 h-3 ml-1" />
                        )}
                      </span>
                    </td>
                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="px-6 py-4 cursor-auto"
                    >
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleView(job)}
                          className="text-gray-600 hover:text-blue-600"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div className="flex items-center justify-center space-x-2 mt-6">
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
        </motion.div>
      )}

      {/* View Modal */}
      <JobOpeningViewModal
        job={selectedJob}
        isOpen={isModalOpen}
        onClose={closeViewModal}
        onEdit={(job) => {
          closeViewModal();
          // navigate(`/admin/job-openings/edit/${job.id}`);
        }}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
      />
    </motion.div>
  );
};

export default JobOpeningsList;
