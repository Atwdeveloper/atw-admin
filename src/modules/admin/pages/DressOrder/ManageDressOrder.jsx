"use client";

import { motion } from "framer-motion";
import {
  Edit2,
  Trash2,
  Plus,
  Eye,
  Package,
  Shirt,
  CheckCircle,
  User,
  Filter,
  Download,
  ChevronRight,
  Send,
  CheckSquare,
  Square,
  MapPin,
} from "lucide-react";
import { useNavigate } from "@/lib/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  containerVariants,
  itemVariants,
  tableRowVariants,
} from "../../../../common/utils/motionVariants";
import DressOrderModal from "../../components/dressorder/DressOrderModal";
import { useDressOrders } from "../../adminhooks/useDressOrders";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import { useSortableData } from "../../../../common/hooks/useSortableData";
import SortableHeader from "../../../../common/components/SortableHeader";
import DateRangeDropdown from "../../../../common/components/DateRangeDropdown.jsx";
import { useDateRangeFilter } from "../../../../common/hooks/useDateRangeFilter";
import PushToVendorModal from "../../components/dressorder/PushToVendorModal";
import { useVendors } from "../../adminhooks/useVendors";
import {
  getStatesAPI,
  getCitiesByStateAPI,
} from "../../../../api/admin/adminStaffAPI";

const ManageDressOrders = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  const {
    orders,
    loading,
    page,
    totalItems,
    totalPages,
    filters,
    defaultFilters,
    setPage,
    setFilters,
    handleSearch,

    handleDelete,
    handleStatusUpdate,
    selectedOrders,
    selectedOrdersData,
    selectedOrdersByLocation,

    toggleOrderSelection,
    selectAllOrders,
    clearSelectedOrders,
    // handleAssignToVendor,
  } = useDressOrders({ autoFetch: true });

  const { vendors } = useVendors();

  const {
    dateRange,
    applyPreset,
    setCustomRange,
    presets,
    formatDateForDisplay,
  } = useDateRangeFilter();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPushToVendorModalOpen, setIsPushToVendorModalOpen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [statusType, setStatusType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("unassigned");
  const [vendorsByLocation, setVendorsByLocation] = useState({});
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  // State and City Filter States
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  const statusRef = useRef(null);
  const stateRef = useRef(null);
  const cityRef = useRef(null);

  const statusOptions = [
    { key: "all", label: "All Orders" },
    { key: "pending", label: "Pending Orders" },
    { key: "processing", label: "Processing Orders" },
    { key: "delivered", label: "Delivered Orders" },
    { key: "cancelled", label: "Cancelled Orders" },
  ];

  // Fetch states
  const fetchStates = async () => {
    try {
      const response = await getStatesAPI();
      setStates(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch states:", error);
      setStates([]);
    }
  };

  // Fetch cities by state
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

  // Handle state selection
  const handleStateSelect = async (state) => {
    setFilters({
      ...filters,
      state: state.name,
      state_id: state.id,
      city: "",
      city_id: "",
    });
    setStateSearch("");
    setShowStateDropdown(false);
    await fetchCitiesByState(state.id);
  };

  // Handle city selection
  const handleCitySelect = (city) => {
    setFilters({
      ...filters,
      city: city.name,
      city_id: city.id,
    });
    setCitySearch("");
    setShowCityDropdown(false);
  };

  // Handle click outside
  const handleClickOutside = useCallback((event) => {
    if (statusRef.current && !statusRef.current.contains(event.target)) {
      setShowStatusDropdown(false);
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
    fetchStates();
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  // Fetch cities when state_id changes
  useEffect(() => {
    if (filters.state_id) {
      fetchCitiesByState(filters.state_id);
    } else {
      setCities([]);
    }
  }, [filters.state_id]);

  useEffect(() => {
    if (selectedOrders.length > 0) {
      // Group selected orders by location and fetch vendors for each location
      const locations = Object.keys(selectedOrdersByLocation);
      locations.forEach(async (location) => {
        if (!vendorsByLocation[location]) {
          const vendorsForLocation = vendors;
          setVendorsByLocation((prev) => ({
            ...prev,
            [location]: vendorsForLocation,
          }));
        }
      });
    }
  }, [selectedOrders, selectedOrdersByLocation]);

  const handleDateRangeChange = (range) => {
    if (range.preset === "custom") {
      setCustomRange(range.from, range.to);
    } else {
      applyPreset(range.preset);
    }

    setFilters((prev) => ({
      ...prev,
      dor_from: range.from || "",
      dor_to: range.to || "",
    }));

    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    await handleStatusUpdate(orderId, newStatus);
  };

  const openViewModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedOrder(null);
    setIsModalOpen(false);
  };

  const openPushToVendorModal = () => {
    setIsPushToVendorModalOpen(true);
  };

  const closePushToVendorModal = () => {
    setIsPushToVendorModalOpen(false);
  };

  const handleExportClick = async () => {
    try {
      setIsExporting(true);
      // Add export functionality here
      // await handleExportDownload();
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      ...defaultFilters,
      assigned:
        activeTab === "unassigned"
          ? "unassigned"
          : activeTab === "assigned"
            ? "assigned"
            : "all",
      state: "",
      state_id: "",
      city: "",
      city_id: "",
    });
    setSearchQuery("");
    setStatusType("all");
    clearSelectedOrders();

    // Reset state and city filters
    setStateSearch("");
    setCitySearch("");

    // Reset date range
    const allPreset = presets.find((p) => p.id === "all");
    if (allPreset) {
      const range = allPreset.action();
      applyPreset("all");
      setFilters((prev) => ({
        ...prev,
        dor_from: range.from || "",
        dor_to: range.to || "",
        order_number: "",
      }));
    }

    setPage(1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    clearSelectedOrders();
    setFilters((prev) => ({
      ...prev,
      assigned:
        tab === "unassigned"
          ? "unassigned"
          : tab === "assigned"
            ? "assigned"
            : "all",
    }));
    setPage(1);
  };

  // const getFullName = (worker) => {
  //   if (!worker) return "";
  //   const { first_name, middle_name, last_name } = worker;
  //   return [first_name, middle_name, last_name]
  //     .filter(Boolean)
  //     .join(" ");
  // };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "new":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredOrders = orders;

  const { sortedItems: sortedOrders, sortConfig, requestSort } =
    useSortableData(filteredOrders);

  const allOrderIds = filteredOrders.map((order) => order.id);
  const isAllSelected =
    selectedOrders.length > 0 &&
    selectedOrders.every((id) => allOrderIds.includes(id));

  // Check permissions
  const canView = hasPermission("dress_orders", "view");
  const canCreate = hasPermission("dress_orders", "create");
  const canEdit = hasPermission("dress_orders", "edit");
  const canDelete = hasPermission("dress_orders", "delete");
  const canUpdateStatus = hasPermission("dress_orders", "manage_status");
  const canExport = hasPermission("dress_orders", "export");
  // const canAssignVendor = hasPermission("dress_orders", "assign_vendor");

  if (!permissionsLoading && !canView) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <Package className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view dress orders.
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
      className="flex-1 bg-gray-50 "
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div ref={statusRef} className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="flex items-center justify-between space-x-4 text-2xl !font-bold px-4 py-2 border border-gray-300 rounded-lg bg-white border-none hover:border-none"
            >
              <span className="text-gray-800">
                {statusOptions.find((o) => o.key === statusType)?.label}
              </span>
              <ChevronRight
                className={`w-5 h-5 !stroke-[3px] stroke-black transition-transform ${
                  showStatusDropdown ? "rotate-90" : ""
                }`}
              />
            </button>

            {showStatusDropdown && (
              <div className="absolute !w-64 z-50 mt-0 ml-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {statusOptions.map((option) => (
                  <div
                    key={option.key}
                    onClick={() => {
                      setStatusType(option.key);
                      setShowStatusDropdown(false);
                      setFilters((prev) => ({
                        ...prev,
                        status: option.key === "all" ? "" : option.key,
                      }));
                      setTimeout(() => {
                        handleSearch();
                      }, 100);
                    }}
                    className={`flex items-center justify-between px-4 py-2 cursor-pointer text-sm hover:bg-gray-100 ${
                      statusType === option.key
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    <span>{option.label}</span>
                    {statusType === option.key && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-52">
              <div className="relative">
                <input
                  type="text"
                  value={filters.order_number || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, order_number: e.target.value })
                  }
                  className="w-full px-3 p-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search by order number"
                />
              </div>
            </div>

            {!filtersVisible && filters.order_number !== "" && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear All
              </button>
            )}

            <button
              onClick={() => setFiltersVisible(!filtersVisible)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg font-medium transition ${
                filtersVisible
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>

            {canExport && (
              <button
                onClick={handleExportClick}
                disabled={isExporting || loading}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition ${
                  isExporting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Export as CSV</span>
                  </>
                )}
              </button>
            )}

            {canCreate && (
              <button
                onClick={() => navigate("/admin/dress-orders/add")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add New Order</span>
                <span className="sm:hidden">Add</span>
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
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">
                FILTER BY :
              </div>
              <button
                onClick={handleClearFilters}
                className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Date Range Filter */}
              <div className="relative">
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

              {/* Order Number Filter */}
              {/* <div className="relative w-full">
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={filters.order_number || ""}
                    onChange={(e) => setFilters({ ...filters, order_number: e.target.value })}
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Order number"
                  />
                </div>
              </div> */}

              {/* Worker Name Filter */}
              <div className="relative w-full">
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={filters.worker_name || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, worker_name: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search by name"
                  />
                </div>
              </div>

              {/* Size Filter */}
              <div className="relative w-full">
                <select
                  value={filters.ordered_size || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, ordered_size: e.target.value })
                  }
                  className="w-full px-4 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Sizes</option>
                  <option value="S">Small (S)</option>
                  <option value="M">Medium (M)</option>
                  <option value="L">Large (L)</option>
                  <option value="XL">Extra Large (XL)</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>

              {/* State Filter Dropdown */}
              <div
                ref={stateRef}
                className="relative w-full"
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
                      showStateDropdown ? stateSearch : filters.state || ""
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      setStateSearch(value);
                      if (!showStateDropdown) {
                        setShowStateDropdown(true);
                      }
                    }}
                    onFocus={() => {
                      setStateSearch("");
                      setShowStateDropdown(true);
                    }}
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search state"
                  />
                </div>

                {/* State Dropdown */}
                {showStateDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {states.length > 0 ? (
                      <>
                        {/* "All States" option */}
                        <div
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 ${
                            !filters.state_id ? "bg-blue-50" : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilters({
                              ...filters,
                              state: "",
                              state_id: "",
                              city: "",
                              city_id: "",
                            });
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

                        {/* State list */}
                        {states
                          .filter(
                            (state) =>
                              !stateSearch ||
                              state.name
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStateSelect(state);
                              }}
                            >
                              <div className="flex items-center justify-between text-sm">
                                <span>{state.name}</span>
                                {filters.state_id === state.id && (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                )}
                              </div>
                            </div>
                          ))}

                        {/* Show message if no states match search */}
                        {stateSearch &&
                          states.filter((state) =>
                            state.name
                              .toLowerCase()
                              .includes(stateSearch.toLowerCase()),
                          ).length === 0 && (
                            <div className="px-3 py-2 text-gray-500 text-center border-t border-gray-200 text-sm">
                              No states found for "{stateSearch}"
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-center text-sm">
                        Loading states...
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* City Filter Dropdown */}
              <div
                ref={cityRef}
                className="relative w-full"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={showCityDropdown ? citySearch : filters.city || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCitySearch(value);
                      if (!showCityDropdown) {
                        setShowCityDropdown(true);
                      }
                    }}
                    onFocus={() => {
                      if (filters.state_id) {
                        setCitySearch("");
                        setShowCityDropdown(true);
                      }
                    }}
                    disabled={!filters.state_id}
                    className={`w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
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

                {/* City Dropdown */}
                {showCityDropdown && filters.state_id && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {cities.length > 0 ? (
                      <>
                        {/* "All Cities" option */}
                        <div
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 ${
                            !filters.city_id ? "bg-blue-50" : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilters({
                              ...filters,
                              city: "",
                              city_id: "",
                            });
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

                        {/* City list */}
                        {cities
                          .filter(
                            (city) =>
                              !citySearch ||
                              city.name
                                .toLowerCase()
                                .includes(citySearch.toLowerCase()),
                          )
                          .map((city) => (
                            <div
                              key={city.id}
                              className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                filters.city_id === city.id ? "bg-blue-50" : ""
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCitySelect(city);
                              }}
                            >
                              <div className="flex items-center justify-between text-sm">
                                <span>{city.name}</span>
                                {filters.city_id === city.id && (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                )}
                              </div>
                            </div>
                          ))}

                        {/* Show message if no cities match search */}
                        {citySearch &&
                          cities.filter((city) =>
                            city.name
                              .toLowerCase()
                              .includes(citySearch.toLowerCase()),
                          ).length === 0 && (
                            <div className="px-3 py-2 text-gray-500 text-center border-t border-gray-200 text-sm">
                              No cities found for "{citySearch}"
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-center text-sm">
                        {loadingCities
                          ? "Loading cities..."
                          : "No cities found for this state"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TABS AND BULK ACTIONS */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Tabs */}
          <div className="flex space-x-1">
            <button
              onClick={() => handleTabChange("unassigned")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                activeTab === "unassigned"
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "text-gray-600 hover:bg-gray-100 border border-transparent"
              }`}
            >
              Unassigned to Vendor
            </button>
            <button
              onClick={() => handleTabChange("assigned")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                activeTab === "assigned"
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "text-gray-600 hover:bg-gray-100 border border-transparent"
              }`}
            >
              Assigned to Vendor
            </button>
            <button
              onClick={() => handleTabChange("all")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                activeTab === "all"
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "text-gray-600 hover:bg-gray-100 border border-transparent"
              }`}
            >
              All Orders
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedOrders.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {selectedOrders.length} selected
              </span>

              <button
                onClick={openPushToVendorModal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm"
              >
                <Send className="w-4 h-4" />
                Push to Vendor
              </button>

              {/* {canUpdateStatus && (
                <button
                  onClick={() => {
                    // Handle bulk status update
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Update Status
                </button>
              )} */}

              <button
                onClick={clearSelectedOrders}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      </div>

      {/* LOCATION FILTER FOR BULK ASSIGNMENT */}
      {selectedOrders.length > 0 &&
        Object.keys(selectedOrdersByLocation).length > 1 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <span className="font-medium">
                Orders from multiple locations:
              </span>
              <span>{Object.keys(selectedOrdersByLocation).join(", ")}</span>
            </div>
            <p className="text-sm text-yellow-600 mt-1">
              You may want to filter by location before assigning to vendor
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.keys(selectedOrdersByLocation).map((location) => (
                <button
                  key={location}
                  onClick={() => {
                    // Select only orders from this location
                    const locationOrderIds = selectedOrdersByLocation[
                      location
                    ].map((o) => o.id);
                    selectAllOrders(locationOrderIds);
                  }}
                  className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200"
                >
                  {location} ({selectedOrdersByLocation[location].length})
                </button>
              ))}
            </div>
          </div>
        )}

      {/* MAIN TABLE */}
      <motion.div
        className="bg-white rounded-[22px] border border-[#DDDDDD] shadow-sm overflow-hidden"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">
            Dress Order List
          </h2>
          <div className="flex items-center justify-between gap-1 text-lg font-medium text-gray-800">
            <p>Total Orders : </p> {totalItems}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {activeTab === "unassigned" && (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    <div className="flex items-center">
                      {isAllSelected ? (
                        <CheckSquare
                          className="w-4 h-4 text-blue-600 cursor-pointer"
                          onClick={() => clearSelectedOrders()}
                        />
                      ) : (
                        <Square
                          className="w-4 h-4 text-gray-400 cursor-pointer"
                          onClick={() => selectAllOrders(allOrderIds)}
                        />
                      )}
                    </div>
                  </th>
                )}
                <SortableHeader
                  label="Order No."
                  sortKey="order_number"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Worker"
                  sortKey="worker_name"
                  accessor={(o) => o.worker?.name || o.agent?.name || ""}
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Location"
                  sortKey="location"
                  accessor={(o) =>
                    o.worker
                      ? `${o.worker.city || ""}, ${o.worker.state || ""}`
                      : o.agent
                        ? `${o.agent.city || ""}, ${o.agent.state || ""}`
                        : ""
                  }
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Size"
                  sortKey="ordered_size"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Quantity"
                  sortKey="dress_quantity"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Status"
                  sortKey="status"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Created Date"
                  sortKey="created_at"
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
                  <td colSpan="9" className="text-center py-8 text-gray-500">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-gray-500">
                    <div className="flex flex-col items-center">
                      <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-600">
                        No dress orders found.
                      </p>
                      <p className="text-sm mt-1 text-gray-400">
                        {activeTab === "unassigned"
                          ? "All orders have been assigned to vendors."
                          : activeTab === "assigned"
                            ? "No orders have been assigned to vendors yet."
                            : 'Create your first order by clicking "Add New Order" above.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedOrders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                  >
                    {activeTab === "unassigned" && (
                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => toggleOrderSelection(order.id)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                      </td>
                    )}

                    <td className="px-6 cursor-pointer  py-4 text-sm text-gray-900 font-medium">
                      <div
                        className="flex items-center gap-2"
                        onClick={() => openViewModal(order)}
                      >
                        {order.order_number}
                      </div>
                    </td>

                    <td
                      className="px-6 py-4"
                      onClick={() => openViewModal(order)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center">
                          {order.type === "agent" ? (
                            <User className="p-2 w-8 h-8 rounded-full bg-blue-100 text-blue-700" />
                          ) : (
                            <User className="p-2 w-8 h-8 rounded-full bg-amber-100 text-amber-700" />
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 block">
                            {/* {order.worker.name}
                             */}
                            {order.worker?.name || order.agent?.name || "N/A"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td
                      className="px-6 py-4 text-sm text-gray-600"
                      onClick={() => openViewModal(order)}
                    >
                      {/* {order.worker?.location || "Unknown"} */}
                      {order.worker
                        ? `${order.worker.city || ""}, ${order.worker.state || ""}`
                        : order.agent
                          ? `${order.agent.city || ""}, ${order.agent.state || ""}`
                          : "Unknown"}
                    </td>

                    <td
                      className="px-6 py-4"
                      onClick={() => openViewModal(order)}
                    >
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        <Shirt className="w-3 h-3 mr-1" />
                        {order.ordered_size}
                      </span>
                    </td>

                    <td
                      className="px-6 py-4"
                      onClick={() => openViewModal(order)}
                    >
                      <span className="font-semibold text-gray-900">
                        {order.dress_quantity}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        T-shirts
                      </span>
                    </td>

                    <td
                      className="px-6 py-4"
                      onClick={() => openViewModal(order)}
                    >
                      <span
                        className={`inline-flex items-center px-3 py-1 capitalize rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                      >
                        {order.status === "delivered"
                          ? "Delivered"
                          : order.status}
                      </span>
                      {order.vendor_order_id && (
                        <div className="text-xs text-gray-500 mt-1">
                          Assigned to vendor
                        </div>
                      )}
                    </td>

                    <td
                      className="px-6 py-4 text-sm text-gray-600"
                      onClick={() => openViewModal(order)}
                    >
                      {new Date(order.created_at).toLocaleDateString()}
                      <div className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        {canView && (
                          <button
                            onClick={() => openViewModal(order)}
                            className="text-gray-600 hover:text-green-600"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                        )}

                        {canEdit && (
                          <button
                            onClick={() =>
                              navigate(`/admin/dress-orders/edit/${order.id}`)
                            }
                            className="text-gray-600 hover:text-blue-600"
                            title="Edit Order"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}

                        {canUpdateStatus && order.status === "new" && (
                          <button
                            onClick={() =>
                              handleStatusChange(order.id, "received")
                            }
                            className="px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 bg-green-100 text-green-700 hover:bg-green-200"
                            title="Mark as Received"
                          >
                            <CheckCircle size={16} />
                            Receive
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="text-gray-600 hover:text-red-600"
                            title="Delete Order"
                          >
                            <Trash2 size={18} />
                          </button>
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
      {filteredOrders.length > 0 && (
        <motion.div className="flex items-center justify-center space-x-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition 
              ${page === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-black hover:text-white"}`}
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
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border text-sm shadow-sm transition
                    ${page === p ? "bg-black text-white" : "bg-white hover:bg-black hover:text-white"}`}
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
            className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition 
              ${page === totalPages ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-black hover:text-white"}`}
          >
            Next
          </button>
        </motion.div>
      )}

      {/* VIEW MODAL */}
      {canView && (
        <DressOrderModal
          order={selectedOrder}
          isOpen={isModalOpen}
          onClose={closeViewModal}
          canUpdateStatus={canUpdateStatus}
        />
      )}

      {/* PUSH TO VENDOR MODAL */}
      {canView && (
        <PushToVendorModal
          isOpen={isPushToVendorModalOpen}
          onClose={closePushToVendorModal}
          selectedOrders={selectedOrdersData}
          selectedOrdersByLocation={selectedOrdersByLocation}
          vendorsByLocation={vendorsByLocation}
          // onAssign={handleAssignToVendor}
        />
      )}
    </motion.div>
  );
};

export default ManageDressOrders;
