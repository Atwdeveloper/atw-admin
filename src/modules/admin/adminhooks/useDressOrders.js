"use client";

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import {
  getDressOrders,
  deleteDressOrder,
  updateDressOrderStatus,
  createDressOrder,
  updateDressOrder,
  getDressOrderById,
  getWorkersForDressOrder,
  // assignOrdersToVendor,   // keep for future use
  bulkUpdateDressOrderStatus,
} from "../../../api/admin/adminDressOrderAPI";
import { useDebounce } from "../../../common/hooks/useDebounce";

export const useDressOrders = (options = { autoFetch: true }) => {
  const [orders, setOrders] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    order_number: "",
    worker_name: "",
    worker_id: "",
    status: "",
    search: "",
    ordered_size: "",
    dor_from: "",
    dor_to: "",
    assigned: "unassigned",
  });

  const [selectedOrders, setSelectedOrders] = useState([]);
  const [unassignedOrders, setUnassignedOrders] = useState([]);

  const debouncedFilters = useDebounce(filters, 500);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getDressOrders({
        page,
        limit,
        ...debouncedFilters,
      });

      setOrders(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
      setTotalItems(response.data.total || 0);
    } catch (error) {
      console.error("Error fetching dress orders:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch dress orders. Please try again.",
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedFilters]);

  useEffect(() => {
    if (options.autoFetch) {
      fetchOrders();
    }
  }, [fetchOrders, options.autoFetch]);

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
  };

  const handleClear = () => {
    setFilters({
      order_number: "",
      worker_name: "",
      worker_id: "",
      status: "",
      search: "",
      ordered_size: "",
      dor_from: "",
      dor_to: "",
      assigned: "unassigned",
    });
    setPage(1);
  };

  const handleDelete = async (orderId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
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
      await deleteDressOrder(orderId);

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "The dress order has been deleted.",
        timer: 2000,
        showConfirmButton: false,
      });

      fetchOrders();
      setSelectedOrders((prev) => prev.filter((id) => id !== orderId));
    } catch (error) {
      console.error("Error deleting order:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.message || "Failed to delete the dress order.",
        timer: 3000,
      });
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateDressOrderStatus(orderId, { status: newStatus });

      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "Order status has been updated.",
        timer: 2000,
        showConfirmButton: false,
      });

      fetchOrders();
    } catch (error) {
      console.error("Error updating status:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to update order status.",
        timer: 3000,
      });
    }
  };

  const getWorkersForDressOrders = async (params = {}) => {
    try {
      const response = await getWorkersForDressOrder(params);
      setWorkers(response.data || []);
    } catch (error) {
      console.error("Error fetching workers:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch workers. Please try again.",
        timer: 3000,
        showConfirmButton: false,
      });
    }
  };

  const handleAddOrder = async (orderData) => {
    try {
      setLoading(true);
      await createDressOrder(orderData);

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Dress order has been created successfully.",
        timer: 2000,
        showConfirmButton: false,
      });

      fetchOrders();
      return { success: true };
    } catch (error) {
      console.error("Error adding order:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to create dress order.",
        timer: 3000,
      });
      return {
        success: false,
        error: error.response?.data?.message || "Failed to create dress order.",
      };
    } finally {
      setLoading(false);
    }
  };

  const handleEditOrder = async (orderId, orderData) => {
    try {
      setLoading(true);
      const response = await updateDressOrder(orderId, orderData);

      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "Dress order has been updated successfully.",
        timer: 2000,
        showConfirmButton: false,
      });

      fetchOrders();
      return response;
    } catch (error) {
      console.error("Error editing order:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to update dress order.",
        timer: 3000,
      });
      return {
        success: false,
        error: error.response?.data?.message || "Failed to update dress order.",
      };
    } finally {
      setLoading(false);
    }
  };

  const getorderbyId = async (orderId) => {
    try {
      setLoading(true);
      const res = await getDressOrderById(orderId);
      return res.data;
    } catch (error) {
      console.error("Error fetching order:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Vendor assignment methods (commented out – keep for future)
  // const handleAssignToVendor = async (vendorAssignmentData) => { ... };

  const handleBulkStatusUpdate = async (orderIds, newStatus, notes = "") => {
    try {
      await bulkUpdateDressOrderStatus(orderIds, { status: newStatus, notes });

      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: `${orderIds.length} orders have been updated.`,
        timer: 2000,
        showConfirmButton: false,
      });

      fetchOrders();
      setSelectedOrders([]);
    } catch (error) {
      console.error("Error bulk updating status:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to update orders.",
        timer: 3000,
      });
    }
  };

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders((prev) => {
      if (prev.includes(orderId)) {
        return prev.filter((id) => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const selectAllOrders = (orderIds) => {
    setSelectedOrders(orderIds);
  };

  const clearSelectedOrders = () => {
    setSelectedOrders([]);
  };

  // Helper computed values
  const selectedOrdersData = orders.filter((order) =>
    selectedOrders.includes(order.id),
  );

  const canAssignToVendor =
    selectedOrders.length > 0 &&
    selectedOrdersData.every((order) =>
      ["pending", "new"].includes(order.status),
    );

  const selectedOrdersByLocation = selectedOrdersData.reduce((acc, order) => {
    const location = order.worker?.location || "Unknown";
    if (!acc[location]) acc[location] = [];
    acc[location].push(order);
    return acc;
  }, {});

  return {
    orders,
    loading,
    page,
    limit,
    totalPages,
    totalItems,
    filters,
    workers,
    selectedOrders,
    unassignedOrders,
    selectedOrdersData,
    selectedOrdersByLocation,
    canAssignToVendor,
    setWorkers,
    setPage,
    setLimit,
    setFilters,
    handleSearch,
    handleClear,
    handleDelete,
    handleStatusUpdate,
    getWorkersForDressOrders,
    handleAddOrder,
    handleEditOrder,
    getorderbyId,
    // handleAssignToVendor,
    handleBulkStatusUpdate,
    toggleOrderSelection,
    selectAllOrders,
    clearSelectedOrders,
  };
};
