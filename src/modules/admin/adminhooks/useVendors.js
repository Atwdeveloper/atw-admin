"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import {
  getVendors,
  deleteVendor,
  getVendorById,
  toggleVendorStatusAPI,
} from "../../../api/admin/adminVendorAPI";
import { useDebounce } from "../../../common/hooks/useDebounce";

export const useVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  const defaultFilters = {
    search: "",
    state: "",
    state_id: "",
    city: "",
    city_id: "",
    status: "",
  };

  const [filters, setFilters] = useState(defaultFilters);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const debouncedFilters = useDebounce(filters, 500);

  const abortPreviousRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const fetchVendors = useCallback(
    async (appliedFilters = debouncedFilters) => {
      abortPreviousRequest();

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setLoading(true);
      try {
        const params = {
          page,
          limit,
          ...(appliedFilters.search && { search: appliedFilters.search }),
          ...(appliedFilters.state && { state: appliedFilters.state }),
          ...(appliedFilters.state_id && {
            state_id: appliedFilters.state_id,
          }),
          ...(appliedFilters.city && { city: appliedFilters.city }),
          ...(appliedFilters.city_id && { city_id: appliedFilters.city_id }),
          ...(appliedFilters.status && { status: appliedFilters.status }),
        };

        const response = await getVendors(params, { signal });
        if (!isMountedRef.current) return;
        if (signal.aborted) {
          return;
        }
        setVendors(response.data?.data || []);
        setTotalPages(response.data?.last_page || 1);
        setTotalItems(response.data?.total || 0);
      } catch (error) {
        if (!isMountedRef.current) return;

        // Check if error is from abort
        if (error.name === "AbortError") {
          return;
        }

        console.error("Error fetching vendors:", error);
      } finally {
        if (isMountedRef.current && !signal.aborted) {
          setLoading(false);
        }
      }
    },
    [page, limit, abortPreviousRequest],
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchVendors(debouncedFilters);
    return () => {
      isMountedRef.current = false;
      abortPreviousRequest();
    };
  }, [debouncedFilters, page]);

  const handleSearch = () => {
    setPage(1);
  };

  const handleClear = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const handleDeleteVendor = async (vendorId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This vendor and all associated orders will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await deleteVendor(vendorId);

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Vendor has been deleted.",
        timer: 2000,
        showConfirmButton: false,
      });

      fetchVendors(filters);
    } catch (error) {
      console.error("Error deleting vendor:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to delete vendor.",
        timer: 3000,
      });
    }
  };

  const fetchVendorById = async (vendorId) => {
    try {
      setLoading(true);
      const response = await getVendorById(vendorId);
      setSelectedVendor(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching vendor:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch vendor details.",
        timer: 3000,
        showConfirmButton: false,
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const isActive = currentStatus === "active";
    const actionText = isActive ? "deactivate" : "activate";

    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `This staff member will be ${actionText}d.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${actionText} it`,
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await toggleVendorStatusAPI(id, !isActive);

      if (response?.status === 200 || response?.status === 204) {
        setVendors((prev) =>
          prev.map((v) =>
            v.id === id
              ? { ...v, status: !isActive ? "active" : "inactive" }
              : v,
          ),
        );

        Swal.fire({
          icon: "success",
          title: "Success!",
          text: `Vendor has been ${!isActive ? "activated" : "deactivated"}.`,
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Could not update vendor status. Please try again.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong. Please try again.",
      });
    }
  };

  return {
    vendors,
    loading,
    page,
    limit,
    totalPages,
    totalItems,
    filters,
    selectedVendor,
    setPage,
    setFilters,
    setSelectedVendor,
    fetchVendors,
    handleSearch,
    handleClear,
    handleDeleteVendor,
    fetchVendorById,
    handleToggleStatus,
  };
};
