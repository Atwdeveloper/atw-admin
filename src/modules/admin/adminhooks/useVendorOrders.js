"use client";

// hooks/useVendorOrders.js - Updated version
import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import {
  getVendorOrders,
  createVendorOrder,
  updateVendorOrderStatus,
  getVendors, // Make sure this is imported
} from "../../../api/admin/adminVendorAPI";
import { useDebounce } from "../../../common/hooks/useDebounce";
import {
  getStatesAPI,
  getCitiesByStateAPI,
} from "../../../api/admin/adminStaffAPI";

export const useVendorOrders = (options = { autoFetch: true }) => {
  const [vendorOrders, setVendorOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    vendor_id: "",
    status: "",
    state: "",
    state_id: "",
    city: "",
    city_id: "",
    search: "",
    date_from: "",
    date_to: "",
  });

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [vendors, setVendors] = useState([]); // Added vendors state
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const debouncedFilters = useDebounce(filters, 500);

  // Fetch states
  const fetchStates = useCallback(async () => {
    try {
      const response = await getStatesAPI();
      setStates(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch states:", error);
      setStates([]);
    }
  }, []);

  // Fetch cities by state
  const fetchCitiesByState = useCallback(async (stateId) => {
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
  }, []);

  // Fetch vendors
  const fetchVendors = useCallback(async (params = {}) => {
    setLoadingVendors(true);
    try {
      const response = await getVendors(params);
      setVendors(response.data?.data || []);
      return response.data?.data || [];
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setVendors([]);
      return [];
    } finally {
      setLoadingVendors(false);
    }
  }, []);

  // Get vendors by city
  // In useVendorOrders hook
  const getVendorsByCity = useCallback(
    (cityOrLocation) => {
      if (!cityOrLocation || !vendors.length) return [];

      // Extract just the city name (remove state if present)
      // Handles formats like: "Jaipur", "Jaipur, Rajasthan", "Chittorgarh, Rajasthan"
      const cityName = cityOrLocation.split(",")[0].trim().toLowerCase();

      return vendors.filter((vendor) => {
        // Compare with vendor.city (case-insensitive)
        const vendorCity = vendor.city?.toLowerCase() || "";
        return vendorCity === cityName;
      });
    },
    [vendors],
  );

  useEffect(() => {
    fetchStates();
  }, []);

  // Fetch cities when state_id changes
  useEffect(() => {
    if (filters.state_id) {
      fetchCitiesByState(filters.state_id);
    } else {
      setCities([]);
    }
  }, [filters.state_id, fetchCitiesByState]);

  const fetchVendorOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        ...(debouncedFilters.vendor_id && {
          vendor_id: debouncedFilters.vendor_id,
        }),
        ...(debouncedFilters.status && { status: debouncedFilters.status }),
        ...(debouncedFilters.state && { state: debouncedFilters.state }),
        ...(debouncedFilters.state_id && {
          state_id: debouncedFilters.state_id,
        }),
        ...(debouncedFilters.city && { city: debouncedFilters.city }),
        ...(debouncedFilters.city_id && { city_id: debouncedFilters.city_id }),
        ...(debouncedFilters.search && { search: debouncedFilters.search }),
        ...(debouncedFilters.date_from && {
          date_from: debouncedFilters.date_from,
        }),
        ...(debouncedFilters.date_to && { date_to: debouncedFilters.date_to }),
      };

      const response = await getVendorOrders(params);
      setVendorOrders(response.data?.data || []);
      setTotalPages(response.data?.last_page || 1);
      setTotalItems(response.data?.total || 0);
    } catch (error) {
      console.error("Error fetching vendor orders:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch vendor orders. Please try again.",
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedFilters]);

  useEffect(() => {
    if (options.autoFetch) {
      fetchVendorOrders();
    }
  }, [fetchVendorOrders, options.autoFetch]);

  const handleSearch = () => {
    setPage(1);
    fetchVendorOrders();
  };

  const handleClear = () => {
    setFilters({
      vendor_id: "",
      status: "",
      state: "",
      state_id: "",
      city: "",
      city_id: "",
      search: "",
      date_from: "",
      date_to: "",
    });
    setPage(1);
  };

  const handleStateSelect = async (state) => {
    setFilters({
      ...filters,
      state: state.name,
      state_id: state.id,
      city: "",
      city_id: "",
    });
    await fetchCitiesByState(state.id);
  };

  const handleCitySelect = (city) => {
    setFilters({
      ...filters,
      city: city.name,
      city_id: city.id,
    });
  };

  const handleCreateVendorOrder = async (orderData) => {
    try {
      setLoading(true);
      const response = await createVendorOrder(orderData);

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Vendor order has been created successfully.",
        timer: 2000,
        showConfirmButton: false,
      });

      fetchVendorOrders();
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error creating vendor order:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to create vendor order.",
        timer: 3000,
      });

      return {
        success: false,
        error:
          error.response?.data?.message || "Failed to create vendor order.",
      };
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, statusData) => {
    try {
      await updateVendorOrderStatus(orderId, statusData);

      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "Vendor order status has been updated.",
        timer: 2000,
        showConfirmButton: false,
      });

      fetchVendorOrders();
    } catch (error) {
      console.error("Error updating vendor order status:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.message ||
          "Failed to update vendor order status.",
        timer: 3000,
      });
    }
  };

  return {
    vendorOrders,
    loading,
    page,
    limit,
    totalPages,
    totalItems,
    filters,
    states,
    cities,
    loadingCities,
    vendors,
    loadingVendors,
    selectedOrder,
    setPage,
    setFilters,
    setSelectedOrder,
    fetchVendorOrders,
    fetchVendors,
    getVendorsByCity,
    handleSearch,
    handleClear,
    handleStateSelect,
    handleCitySelect,
    handleCreateVendorOrder,
    handleUpdateOrderStatus,
  };
};
