"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "@/lib/navigation";
import {
  Package,
  Filter,
  Eye,
  RefreshCw,
  Mail,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { useVendorOrders } from "../../adminhooks/useVendorOrders";
import {
  containerVariants,
  itemVariants,
  tableRowVariants,
} from "../../../../common/utils/motionVariants";
import VendorOrderModal from "../../components/vendor/VendorOrderModal.jsx";
import DateRangeDropdown from "../../../../common/components/DateRangeDropdown.jsx";
import { useDateRangeFilter } from "../../../../common/hooks/useDateRangeFilter";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import Loader from "../../../../common/components/Loader";

const VendorOrders = () => {
  const navigate = useNavigate(); // ✅ defined
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  const {
    vendorOrders,
    loading,
    page,
    totalPages,
    totalItems,
    filters,
    states,
    cities,
    loadingCities,
    setPage,
    setFilters,
    handleSearch,
    handleClear: clearVendorOrderFilters,
    handleStateSelect,
    handleCitySelect,
    handleUpdateOrderStatus,
    handleResendEmail,
    setSelectedOrder,
  } = useVendorOrders({ autoFetch: true });

  const {
    dateRange,
    applyPreset,
    setCustomRange,
    presets,
    formatDateForDisplay,
  } = useDateRangeFilter();

  // Permission flags
  const canView = hasPermission("vendor_orders", "view");
  const canUpdate = hasPermission("vendor_orders", "update_status");

  const [selectedVendorOrder, setSelectedVendorOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [orderType, setOrderType] = useState("all");
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const stateRef = useRef(null);
  const cityRef = useRef(null);

  const orderTypeOptions = [
    { key: "all", label: "All Orders" },
    { key: "sent", label: "Sent Orders" },
    { key: "acknowledged", label: "Acknowledged" },
    { key: "in_production", label: "In Production" },
    { key: "ready_for_delivery", label: "Ready for Delivery" },
    { key: "delivered", label: "Delivered" },
    { key: "cancelled", label: "Cancelled" },
  ];

  const handleDateRangeChange = (range) => {
    if (range.preset === "custom") {
      setCustomRange(range.from, range.to);
    } else {
      applyPreset(range.preset);
    }

    setFilters((prev) => ({
      ...prev,
      date_from: range.from || "",
      date_to: range.to || "",
    }));

    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const openViewModal = (order) => {
    setSelectedVendorOrder(order);
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedVendorOrder(null);
    setIsModalOpen(false);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    if (canUpdate) {
      await handleUpdateOrderStatus(orderId, { status: newStatus });
    }
  };

  const handleResend = async (orderId) => {
    if (canUpdate) {
      await handleResendEmail(orderId);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "sent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "acknowledged":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "in_production":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      case "ready_for_delivery":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "sent":
        return <Mail className="w-3 h-3" />;
      case "acknowledged":
        return <CheckCircle2 className="w-3 h-3" />;
      case "in_production":
        return <RefreshCw className="w-3 h-3" />;
      case "ready_for_delivery":
        return <Package className="w-3 h-3" />;
      case "delivered":
        return <CheckCircle className="w-3 h-3" />;
      case "cancelled":
        return <XCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      sent: "Sent",
      acknowledged: "Acknowledged",
      in_production: "In Production",
      ready_for_delivery: "Ready for Delivery",
      delivered: "Delivered",
      cancelled: "Cancelled",
    };
    return statusMap[status] || status;
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      sent: "acknowledged",
      acknowledged: "in_production",
      in_production: "ready_for_delivery",
      ready_for_delivery: "delivered",
    };
    return statusFlow[currentStatus];
  };

  const handleClear = () => {
    clearVendorOrderFilters();
    setOrderType("all");
    setFilters({
      ...filters,
      status: "",
      state: "",
      state_id: "",
      city: "",
      city_id: "",
      date_from: "",
      date_to: "",
    });
    setStateSearch("");
    setCitySearch("");
  };

  const handleClickOutside = useCallback((event) => {
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <Package className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view vendor orders.
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
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
          <div className="relative w-full md:w-auto">
            <div className="flex items-center space-x-4 text-2xl !font-bold px-4 py-2">
              <span className="text-gray-800">
                {orderTypeOptions.find((o) => o.key === orderType)?.label}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search vendor orders..."
              value={filters.search || ""}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="w-full sm:w-64 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            {!filtersVisible && filters.search && (
              <button
                onClick={handleClear}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear All
              </button>
            )}
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

      {/* FILTER SECTION */}
      {filtersVisible && (
        <motion.div
          className="bg-white p-4 mb-4 rounded-b-2xl border border-gray-200 shadow-sm"
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
                onClick={handleClear}
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

              <div className="relative w-48">
                <select
                  value={orderType}
                  onChange={(e) => {
                    setOrderType(e.target.value);
                    setFilters({
                      ...filters,
                      status: e.target.value === "all" ? "" : e.target.value,
                    });
                  }}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {orderTypeOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* State Filter Dropdown */}
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

                {showStateDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {states.length > 0 ? (
                      <>
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
                                setShowStateDropdown(false);
                                setStateSearch("");
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

                {showCityDropdown && filters.state_id && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {cities.length > 0 ? (
                      <>
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
                                setShowCityDropdown(false);
                                setCitySearch("");
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

      {/* MAIN TABLE */}
      <motion.div
        className="bg-white rounded-[22px] border border-[#DDDDDD] shadow-sm overflow-hidden"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Vendor Orders</h2>
          <h2 className="flex items-center justify-between gap-1 text-lg font-medium text-gray-800">
            <p>Total Orders : </p> {totalItems}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  "Order Number",
                  "Vendor Details",
                  "Location",
                  "Order Items",
                  "Status",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-600"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : vendorOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-500">
                    <div className="flex flex-col items-center">
                      <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-600">
                        No vendor orders found.
                      </p>
                      <p className="text-sm mt-1 text-gray-400">
                        No orders have been sent to vendors yet.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                vendorOrders.map((order, index) => (
                  <motion.tr
                    key={`${order.id}-${index}`}
                    className="cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    onClick={() => openViewModal(order)}
                  >
                    <td className="px-6 cursor-pointer py-4 text-sm text-gray-900 font-medium">
                      {order.dress_order.order_number}
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span>{order.vendor?.name || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span>{order.vendor?.email || "N/A"}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{order.vendor?.location || "N/A"}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="font-medium">
                        {order.dress_order.dress_quantity || 0} items
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {canUpdate && order.status !== "delivered" ? (
                        <select
                          value={order.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value)
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border outline-none cursor-pointer ${getStatusColor(
                            order.status,
                          )}`}
                        >
                          <option value="assigned">Assigned</option>
                          <option value="in_production">In Production</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(
                            order.status,
                          )}`}
                        >
                          {getStatusText(order.status)}
                        </span>
                      )}
                    </td>

                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="px-6 py-4 cursor-auto"
                    >
                      <div className="flex gap-3">
                        <button
                          onClick={() => openViewModal(order)}
                          className="text-gray-600 hover:text-green-600"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>

                        {canUpdate && (
                          <>
                            {/* Uncomment if resend email feature is needed */}
                            {/* <button
                              onClick={() => handleResend(order.id)}
                              className="text-gray-600 hover:text-yellow-600"
                              title="Resend Email"
                            >
                              <Mail size={18} />
                            </button> */}
                            {/* Uncomment if quick status update button is needed */}
                            {/* {order.status !== "delivered" &&
                              order.status !== "cancelled" &&
                              getNextStatus(order.status) && (
                                <button
                                  onClick={() => {
                                    const nextStatus = getNextStatus(order.status);
                                    if (nextStatus) {
                                      handleStatusChange(order.id, nextStatus);
                                    }
                                  }}
                                  className="text-gray-600 hover:text-blue-600"
                                  title="Update Status"
                                >
                                  <RefreshCw size={18} />
                                </button>
                              )} */}
                          </>
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
      {vendorOrders.length > 0 && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition 
              ${
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
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border text-sm shadow-sm transition
                    ${
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
            className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition 
              ${
                page === totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-black hover:text-white"
              }`}
          >
            Next
          </button>
        </div>
      )}

      {/* VENDOR ORDER MODAL */}
      <AnimatePresence>
        {isModalOpen && selectedVendorOrder && (
          <VendorOrderModal
            order={selectedVendorOrder}
            isOpen={isModalOpen}
            onClose={closeViewModal}
            onStatusUpdate={canUpdate ? handleStatusChange : undefined}
            onResendEmail={canUpdate ? handleResend : undefined}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VendorOrders;
