"use client";

import { motion } from "framer-motion";
import { useNavigate } from "@/lib/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  UserCircle,
  Filter,
  ChevronRight,
  MapPin,
  MoreVertical,
} from "lucide-react";
import {
  containerVariants,
  itemVariants,
  tableRowVariants,
} from "../../../../common/utils/motionVariants";
import { useAgentListing } from "../../adminhooks/useAgentListing";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import { useSortableData } from "../../../../common/hooks/useSortableData";
import SortableHeader from "../../../../common/components/SortableHeader";
import ViewAgentModal from "../../components/agent/ViewAgentModal";
import {
  getStatesAPI,
  getCitiesByStateAPI,
} from "../../../../api/admin/adminStaffAPI";

const AgentListing = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  const {
    agents,
    loading,
    page,
    total,
    totalPages = 1,
    setPage,
    filters,
    setFilters,
    handleSearch,
    handleClear,
    handleDelete,
    handleToggleStatus,
  } = useAgentListing();

  const { sortedItems: sortedAgents, sortConfig, requestSort } =
    useSortableData(agents);

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Agent type dropdown
  const [showAgentTypeDropdown, setShowAgentTypeDropdown] = useState(false);
  const [agentType, setAgentType] = useState("all");

  // State & City filters
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  // Refs
  const agentTypeRef = useRef(null);
  const stateRef = useRef(null);
  const cityRef = useRef(null);

  // Dropdown options with API values (1, 0, incomplete)
  const agentTypeOptions = [
    { key: "all", label: "All Agents" },
    { key: "1", label: "Active Agents" },
    { key: "0", label: "Inactive Agents" },
    { key: "incomplete", label: "Incomplete Agents" },
  ];

  // Outside click handler
  const handleClickOutside = useCallback((event) => {
    if (agentTypeRef.current && !agentTypeRef.current.contains(event.target)) {
      setShowAgentTypeDropdown(false);
    }
    if (stateRef.current && !stateRef.current.contains(event.target)) {
      setShowStateDropdown(false);
      setStateSearch("");
    }
    if (cityRef.current && !cityRef.current.contains(event.target)) {
      setShowCityDropdown(false);
      setCitySearch("");
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

  // Sync agentType when filters.agent_type changes externally (e.g., clear)
  useEffect(() => {
    if (filters.agent_type === "1") setAgentType("1");
    else if (filters.agent_type === "0") setAgentType("0");
    else if (filters.agent_type === "incomplete") setAgentType("incomplete");
    else setAgentType("all");
  }, [filters.agent_type]);

  // Fetch States & Cities (unchanged)
  const fetchStates = async () => {
    try {
      const response = await getStatesAPI();
      setStates(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch states:", error);
      setStates([]);
    }
  };

  const fetchCitiesByState = async (stateId) => {
    if (!stateId) {
      setCities([]);
      return;
    }
    try {
      setLoadingCities(true);
      const response = await getCitiesByStateAPI(stateId);
      setCities(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch cities:", error);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  useEffect(() => {
    if (filters.state_id) {
      fetchCitiesByState(filters.state_id);
    } else {
      setCities([]);
    }
  }, [filters.state_id]);

  // UI handlers
  const openViewModal = (agent) => {
    setSelectedAgent(agent);
    setIsModalOpen(true);
  };
  const closeViewModal = () => {
    setSelectedAgent(null);
    setIsModalOpen(false);
  };

  const handleClearAll = () => {
    handleClear();
    setAgentType("all");
  };

  const handleStateSelect = async (state) => {
    setFilters((prev) => ({
      ...prev,
      state_id: state.id,
      city_id: "",
    }));
    setStateSearch("");
    setShowStateDropdown(false);
    await fetchCitiesByState(state.id);
  };

  const handleCitySelect = (city) => {
    setFilters((prev) => ({
      ...prev,
      city_id: city.id,
    }));
    setCitySearch("");
    setShowCityDropdown(false);
  };
  const closeAllDropdowns = () => {
    setShowStateDropdown(false);
  };
  // Permissions
  const canView = hasPermission("agent", "view");
  const canCreate = hasPermission("agent", "create");
  const canEdit = hasPermission("agent", "edit");
  const canDelete = hasPermission("agent", "delete");
  const canExport = hasPermission("agent", "export");
  const canToggleStatus = hasPermission("agent", "toggle_status");

  if (!permissionsLoading && !canView) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <UserCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view agents.
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
      {/* HEADER WITH FILTER TOGGLE */}
      <motion.div
        className={`bg-white p-4 border border-gray-200 shadow-sm ${
          filtersVisible ? "rounded-t-2xl border-b-0" : "mb-4 rounded-2xl"
        }`}
        variants={itemVariants}
      >
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
          {/* Agent Type Dropdown */}
          <div ref={agentTypeRef} className="relative w-full md:w-auto">
            <button
              onClick={() => setShowAgentTypeDropdown(!showAgentTypeDropdown)}
              className="flex w-full md:w-auto items-center justify-between gap-4 text-xl md:text-2xl font-bold px-4 py-2 rounded-lg bg-white"
            >
              <span className="text-gray-800 truncate">
                {agentTypeOptions.find((o) => o.key === agentType)?.label}
              </span>
              <ChevronRight
                className={`w-5 h-5 !stroke-[3px] stroke-black transition-transform ${
                  showAgentTypeDropdown ? "rotate-90" : ""
                }`}
              />
            </button>

            {showAgentTypeDropdown && (
              <div className="absolute left-0 mt-2 w-full sm:w-56 md:w-64 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {agentTypeOptions.map((option) => (
                  <div
                    key={option.key}
                    onClick={() => {
                      setAgentType(option.key);
                      setShowAgentTypeDropdown(false);
                      // Update filter with the API value ("1", "0", "incomplete" or "")
                      setFilters((prev) => ({
                        ...prev,
                        agent_type: option.key === "all" ? "" : option.key,
                      }));
                      setTimeout(handleSearch, 100);
                    }}
                    className={`flex items-center justify-between px-4 py-2 cursor-pointer text-sm
                      hover:bg-gray-100
                      ${
                        agentType === option.key
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-700"
                      }
                    `}
                  >
                    <span>{option.label}</span>
                    {agentType === option.key && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={filters.name || ""}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              className="w-full sm:w-64 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />

            {!filtersVisible && filters.name && (
              <button
                onClick={handleClearAll}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear All
              </button>
            )}

            <button
              onClick={() => setFiltersVisible(!filtersVisible)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition
                ${
                  filtersVisible
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                }
              `}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>

            {/* {canExport && (
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            )} */}

            {canCreate && (
              <button
                onClick={() => navigate("/admin/agent/add")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add New Agent</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* FILTER SECTION (State / City) – unchanged */}
      {filtersVisible && (
        <motion.div
          className="bg-white p-4 mb-4 rounded-b-2xl border border-gray-200 shadow-sm"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          {/* ... rest of the filter section (state/city) remains exactly as before */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">
                FILTER BY :
              </div>
              <button
                onClick={handleClearAll}
                className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-3 items-start">
              {/* State Filter */}
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
                    value={
                      showStateDropdown
                        ? stateSearch
                        : states.find((s) => s.id == filters.state_id)?.name ||
                          ""
                    }
                    onChange={(e) => {
                      setStateSearch(e.target.value);

                      closeAllDropdowns();
                      setShowStateDropdown(true);
                    }}
                    onFocus={() => {
                      setShowCityDropdown(false); // city band
                      setStateSearch("");
                      setShowStateDropdown(true);
                    }}
                    placeholder="Search state"
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {showStateDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div
                      className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 ${
                        !filters.state_id ? "bg-blue-50" : ""
                      }`}
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          state_id: "",
                          city_id: "",
                        }));
                        setStateSearch("");
                        setShowStateDropdown(false);
                        setCities([]);
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
                            ?.toLowerCase()
                            .includes(stateSearch.toLowerCase()),
                      )
                      .map((state) => (
                        <div
                          key={state.id}
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                            filters.state_id === state.id ? "bg-blue-50" : ""
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
                          ?.toLowerCase()
                          .includes(stateSearch.toLowerCase()),
                      ).length === 0 && (
                        <div className="px-3 py-2 text-gray-500 text-center border-t border-gray-200 text-sm">
                          No states found for "{stateSearch}"
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* City Filter */}
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
                    value={
                      showCityDropdown
                        ? citySearch
                        : cities.find((c) => c.id == filters.city_id)?.name ||
                          ""
                    }
                    onChange={(e) => {
                      setStateSearch(e.target.value);

                      closeAllDropdowns();
                      setShowStateDropdown(true);
                    }}
                    onFocus={() => {
                      if (filters.state_id) {
                        setCitySearch("");
                        setShowCityDropdown(true);
                      }
                    }}
                    disabled={!filters.state_id}
                    className={`w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      !filters.state_id ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                    placeholder={
                      !filters.state_id ? "Select state first" : "Search city"
                    }
                  />
                  {loadingCities && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                {showCityDropdown && filters.state_id && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div
                      className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 ${
                        !filters.city_id ? "bg-blue-50" : ""
                      }`}
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, city_id: "" }));
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
                            ?.toLowerCase()
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
                          ?.toLowerCase()
                          .includes(citySearch.toLowerCase()),
                      ).length === 0 && (
                        <div className="px-3 py-2 text-gray-500 text-center border-t border-gray-200 text-sm">
                          No cities found for "{citySearch}"
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TABLE */}
      <motion.div
        className="bg-white rounded-[22px] border border-[#DDDDDD] shadow-sm overflow-hidden"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Agents List</h2>
          <span className="text-lg font-medium text-gray-800">
            Total Agents: {total || 0}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortableHeader
                  label="Agent Code"
                  sortKey="agent_code"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Name"
                  sortKey="name"
                  accessor={(a) =>
                    [a.first_name, a.middle_name, a.last_name]
                      .filter(Boolean)
                      .join(" ")
                  }
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Email"
                  sortKey="email"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Phone"
                  sortKey="phone"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Location"
                  sortKey="location"
                  accessor={(a) =>
                    a.current_city_name && a.current_state_name
                      ? `${a.current_city_name}, ${a.current_state_name}`
                      : a.current_city_name || a.current_state_name || ""
                  }
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
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : !sortedAgents || sortedAgents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-500">
                    <div className="flex flex-col items-center">
                      <UserCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-600">
                        No agents found.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedAgents.map((agent, index) => (
                  <motion.tr
                    key={agent.id}
                    className="cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    onClick={() => openViewModal(agent)}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {agent.agent_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {[agent.first_name, agent.middle_name, agent.last_name]
                        .filter(Boolean)
                        .join(" ")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {agent.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {agent.phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {agent.current_city_name && agent.current_state_name
                        ? `${agent.current_city_name}, ${agent.current_state_name}`
                        : agent.current_city_name ||
                          agent.current_state_name ||
                          "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          agent.status === 1
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {agent.status === 1 ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 cursor-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative inline-block action-menu-container">
                        <button
                          onClick={() =>
                            setOpenActionMenuId(
                              openActionMenuId === agent.id ? null : agent.id,
                            )
                          }
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                          title="Actions"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openActionMenuId === agent.id && (
                          <div className="absolute right-0 z-20 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden text-left">
                            {canView && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  openViewModal(agent);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Eye size={16} />
                                View
                              </button>
                            )}
                            {canEdit && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  navigate(`/admin/agent/edit/${agent.id}`);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit2 size={16} />
                                Edit
                              </button>
                            )}
                            {canToggleStatus && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  handleToggleStatus(agent.id, agent.status);
                                }}
                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm border-t border-gray-100 ${
                                  agent.status === 1
                                    ? "text-red-600 hover:bg-red-50"
                                    : "text-green-600 hover:bg-green-50"
                                }`}
                              >
                                {agent.status === 1 ? (
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
                            {canDelete && (
                              <button
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  handleDelete(agent.id);
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
      {agents && agents.length > 0 && (
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

          {[...Array(totalPages)].map((_, index) => {
            const p = index + 1;
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
      {canView && (
        <ViewAgentModal
          agent={selectedAgent}
          isOpen={isModalOpen}
          onClose={closeViewModal}
        />
      )}
    </motion.div>
  );
};

export default AgentListing;
