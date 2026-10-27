"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "@/lib/navigation";
import {
  Users,
  Edit2,
  Trash2,
  Eye,
  Mail,
  Phone,
  Filter,
  MapPin,
  Plus,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useVendors } from "../../adminhooks/useVendors";
import {
  containerVariants,
  itemVariants,
  tableRowVariants,
} from "../../../../common/utils/motionVariants";
import VendorModal from "../../components/vendor/VendorModal";
import {
  getStatesAPI,
  getCitiesByStateAPI,
} from "../../../../api/admin/adminStaffAPI";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import { useSortableData } from "../../../../common/hooks/useSortableData";
import Loader from "../../../../common/components/Loader";
import SortableHeader from "../../../../common/components/SortableHeader";

const VendorManagement = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  const [showVendorModal, setShowVendorModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [vendorType, setVendorType] = useState("all");

  const stateRef = useRef(null);
  const cityRef = useRef(null);

  const {
    vendors,
    loading,
    page,
    totalPages,
    totalItems,
    filters,
    setPage,
    setFilters,
    handleSearch,
    handleClear: clearVendorFilters,
    handleDeleteVendor,
    handleToggleStatus,
  } = useVendors();

  const {
    sortedItems: sortedVendors,
    sortConfig,
    requestSort,
  } = useSortableData(vendors);

  // Permission flags
  const canView = hasPermission("vendor", "view");
  const canCreate = hasPermission("vendor", "create");
  const canEdit = hasPermission("vendor", "edit");
  const canDelete = hasPermission("vendor", "delete");
  const canToggleStatus = hasPermission("vendor", "toggle_status");

  const vendorTypeOptions = [
    { key: "all", label: "All Vendors" },
    { key: "true", label: "Active Vendors" },
    { key: "false", label: "Inactive Vendors" },
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

  const openVendorModal = (vendor = null) => {
    setSelectedVendor(vendor);
    setShowVendorModal(true);
  };

  const closeVendorModal = () => {
    setShowVendorModal(false);
    setSelectedVendor(null);
  };

  const handleEditVendor = (vendor) => {
    navigate(`/admin/vendor/edit/${vendor.id}`);
  };

  const handleDelete = async (vendorId) => {
    await handleDeleteVendor(vendorId);
  };

  const handleAddVendor = () => {
    navigate("/admin/vendor/add");
  };

  const getStatusColor = (status) => {
    return status === 1
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  const handleClear = () => {
    clearVendorFilters();
    setVendorType("all");
    setFilters({
      ...filters,
      search: "",
      state: "",
      state_id: "",
      city: "",
      city_id: "",
      status: "",
    });
  };

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
          <Users className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view vendors.
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
                {vendorTypeOptions.find((o) => o.key === vendorType)?.label}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Vendor Name Filter */}
            <input
              type="text"
              placeholder="Search by vendor name..."
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

            {canCreate && (
              <button
                onClick={handleAddVendor}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add New Vendor</span>
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
              {/* Vendor Type Filter */}
              <div className="relative w-48">
                <select
                  value={vendorType}
                  onChange={(e) => {
                    setVendorType(e.target.value);
                    setFilters({
                      ...filters,
                      status:
                        e.target.value === "all"
                          ? undefined
                          : e.target.value === "true"
                            ? "1"
                            : "0",
                    });
                  }}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {vendorTypeOptions.map((option) => (
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

      {/* MAIN TABLE */}
      <motion.div
        className="bg-white rounded-[22px] border border-[#DDDDDD] shadow-sm overflow-hidden"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Vendor List</h2>
          <h2 className="flex items-center justify-between gap-1 text-lg font-medium text-gray-800">
            <p>Total Vendors : </p> {totalItems}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortableHeader
                  label="Vendor Name & Code"
                  sortKey="name"
                  accessor={(v) => v.name}
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Contact Information"
                  sortKey="email"
                  accessor={(v) => v.email || v.phone || ""}
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Location"
                  sortKey="location"
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
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : sortedVendors.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-500">
                    <div className="flex flex-col items-center">
                      <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-600">
                        No vendors found.
                      </p>
                      <p className="text-sm mt-1 text-gray-400">
                        Create your first vendor by clicking "Add New Vendor"
                        above.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedVendors.map((vendor, index) => (
                  <motion.tr
                    key={`${vendor.id}-${index}`}
                    className="cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    onClick={() => openVendorModal(vendor)}
                  >
                    <td className="px-6 cursor-pointer py-4 text-sm text-gray-900 font-medium">
                      {vendor.name} - {vendor.vendor_code}
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span>{vendor.email || "N/A"}</span>
                        </div>
                        {vendor.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{vendor.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {vendor.location || "N/A"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          vendor.status,
                        )}`}
                      >
                        {vendor.status === 1 ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="px-6 py-4 cursor-auto"
                    >
                      <div className="flex gap-3">
                        <button
                          onClick={() => openVendorModal(vendor)}
                          className="text-gray-600 hover:text-green-600"
                          title="View Vendor"
                        >
                          <Eye size={18} />
                        </button>

                        {canEdit && (
                          <button
                            onClick={() => handleEditVendor(vendor)}
                            className="text-gray-600 hover:text-blue-600"
                            title="Edit Vendor"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => handleDelete(vendor.id)}
                            className="text-gray-600 hover:text-red-600"
                            title="Delete Vendor"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}

                        {canToggleStatus && (
                          <button
                            onClick={() =>
                              handleToggleStatus(vendor.id, vendor.status)
                            }
                            className={`px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1
                              ${
                                vendor.status === 1
                                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                                  : "bg-green-100 text-green-700 hover:bg-green-200"
                              }
                            `}
                            title={
                              vendor.status === 1
                                ? "Deactivate Vendor"
                                : "Activate Vendor"
                            }
                          >
                            {vendor.status === 1 ? (
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
      {vendors.length > 0 && (
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

      {/* VENDOR DETAILS MODAL */}
      {showVendorModal && (
        <VendorModal
          vendor={selectedVendor}
          isOpen={showVendorModal}
          onClose={closeVendorModal}
          onEdit={canEdit ? () => handleEditVendor(selectedVendor) : undefined}
          onDelete={
            canDelete ? () => handleDelete(selectedVendor?.id) : undefined
          }
        />
      )}
    </motion.div>
  );
};

export default VendorManagement;
