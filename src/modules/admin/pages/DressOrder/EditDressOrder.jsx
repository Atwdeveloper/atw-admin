"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "@/lib/navigation";
import {
  Save,
  Package,
  User,
  Hash,
  Shirt,
  RotateCcw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import { useDressOrders } from "../../adminhooks/useDressOrders";
import Loader from "../../../../common/components/Loader";
import useUnsavedChangesWarning from "../../../../common/hooks/useUnsavedChangesWarning";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";

const EditDressOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAdminPermissions();
  const canUpdateStatus = hasPermission("dress_orders", "manage_status");
  const { handleEditOrder, loading, getorderbyId } = useDressOrders({
    autoFetch: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialFormData = useRef(null);

  const [order, setOrder] = useState(null);
  const [formData, setFormData] = useState({
    order_number: "",
    worker_id: "",
    worker: {},
    ordered_size: "",
    dress_quantity: 1,
    status: "pending",
  });

  const [errors, setErrors] = useState({});
  const [isInitializing, setIsInitializing] = useState(true);

  // Dirty check – ignore submission & init
  const isFormDirty = useMemo(() => {
    if (!initialFormData.current || !formData || isSubmitting || isInitializing)
      return false;
    return JSON.stringify(formData) !== JSON.stringify(initialFormData.current);
  }, [formData, isSubmitting, isInitializing]);

  useUnsavedChangesWarning(
    isFormDirty && !isSubmitting,
    "You have unsaved changes. Are you sure you want to leave? All changes will be lost.",
  );

  // Fetch order data and map to form fields
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsInitializing(true);
        const response = await getorderbyId(id);
        if (response) {
          setOrder(response);
          const person = response.worker || response.agent || {};
          // Map API response to formData
          const formattedData = {
            order_number: response.order_number || "",
            // Worker ID comes from worker object

            worker_id: person.id || "",
            worker: person,
            ordered_size: response.ordered_size || person.dress_size || "",
            // worker_id: response.worker?.id || "",
            // // Store full worker object for display
            // worker: response.worker || {},
            // // Dress size: prefer order's ordered_size, else worker's ordered_size
            // ordered_size: response.ordered_size || response.worker?.ordered_size,
            dress_quantity: response.dress_quantity || 1,
            status: response.status || "pending",
          };

          setFormData(formattedData);
          initialFormData.current = JSON.parse(JSON.stringify(formattedData));
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load order data. Please try again.",
          timer: 3000,
        }).then(() => {
          navigate("/admin/dress-orders");
        });
      } finally {
        setIsInitializing(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  // Validation – now uses ordered_size
  const validateForm = () => {
    const newErrors = {};
    if (!formData.worker_id) newErrors.worker_id = "Worker is required";
    if (!formData.ordered_size) newErrors.ordered_size = "Please select size";
    if (!formData.dress_quantity || formData.dress_quantity < 1) {
      newErrors.dress_quantity = "Quantity must be at least 1";
    }
    if (formData.dress_quantity > 100) {
      newErrors.dress_quantity = "Quantity cannot exceed 100";
    }
    if (!formData.order_number.trim()) {
      newErrors.order_number = "Order number is required";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    const result = await handleEditOrder(id, formData);
    console.log(result);

    if (result.status === 200) {
      initialFormData.current = JSON.parse(JSON.stringify(formData));
      setIsSubmitting(false);
      Swal.fire({
        icon: "success",
        title: "Order Updated",
        text: "Dress order has been updated successfully.",
        timer: 1800,
        showConfirmButton: false,
      }).then(() => {
        navigate("/admin/dress-orders");
      });
    } else {
      Swal.fire({
        icon: "warning",
        title: "Order Failed",
        text: result.message || "Order can't be updated.",
        // timer: 1800,
        // showConfirmButton: false,
      });
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field, value) => {
    if (isSubmitting) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleReset = () => {
    if (isSubmitting || !initialFormData.current) return;
    setFormData({ ...initialFormData.current });
    setErrors({});
  };

  const handleBackButton = () => {
    navigate("/admin/dress-orders");
  };

  if (isInitializing) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader />
          <p className="text-gray-600 mt-4">Loading order data...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 text-red-500 mb-4">
            <Package className="w-full h-full" />
          </div>
          <p className="text-gray-600">Order not found</p>
          <button
            onClick={() => navigate("/admin/dress-orders")}
            disabled={isSubmitting}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex-1 bg-gray-50 p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div className="mb-4" variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Edit Dress Order
              </h1>
              <p className="text-gray-600 mt-1">
                Update order #{order.order_number}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Unsaved changes indicator */}
      {isFormDirty && !isSubmitting && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 font-medium">
              You have unsaved changes
            </span>
          </div>
        </motion.div>
      )}

      {/* Submitting indicator */}
      {isSubmitting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-800 font-medium">Updating order...</span>
          </div>
        </motion.div>
      )}

      {/* Form */}
      <motion.div
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
        variants={itemVariants}
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Order Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Order Number *
                </div>
              </label>
              <input
                type="text"
                value={formData.order_number}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono cursor-not-allowed bg-gray-50"
                placeholder="DO-00123"
              />
              {errors.order_number && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.order_number}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Status *
                </div>
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleFieldChange("status", e.target.value)}
                disabled={isSubmitting || !canUpdateStatus}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  !canUpdateStatus
                    ? "bg-gray-50 cursor-not-allowed text-gray-500 border-gray-200"
                    : "border-gray-300"
                }`}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Worker Info – FIXED */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {/* Worker ID */}
                  {order?.worker ? "Worker ID" : "Agent ID"}
                </div>
              </label>
              <input
                type="text"
                value={formData.worker_id} // ✅ now holds response.worker.id
                disabled
                className={`w-full px-4 py-3 border rounded-lg font-mono cursor-not-allowed bg-gray-50 ${
                  errors.worker_id ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Worker ID"
              />
              {errors.worker_id && (
                <p className="text-red-500 text-sm mt-1">{errors.worker_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 ">
                {/* Worker Name */}
                {order?.worker ? "Worker Name" : "Agent Name"}
              </label>
              <input
                type="text"
                value={formData.worker?.name || ""} // ✅ uses response.worker.name
                readOnly
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                placeholder="Worker name"
              />
            </div>
          </div>

          {/* Size & Quantity – using ordered_size */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Shirt className="w-4 h-4" />
                  Size *
                </div>
              </label>
              <div className="grid grid-cols-5 gap-2">
                {["S", "M", "L", "XL", "XXL"].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleFieldChange("ordered_size", size)}
                    disabled={isSubmitting}
                    className={`py-3 rounded-lg border text-center transition ${
                      formData.ordered_size === size
                        ? "bg-blue-100 border-blue-500 text-blue-700 font-semibold"
                        : "border-gray-300 hover:bg-gray-50"
                    } ${isSubmitting ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {errors.ordered_size && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.ordered_size}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    handleFieldChange(
                      "dress_quantity",
                      formData.dress_quantity - 1,
                    )
                  }
                  disabled={formData.dress_quantity <= 1 || isSubmitting}
                  className={`w-12 h-12 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 text-2xl ${
                    isSubmitting || formData.dress_quantity <= 1
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.dress_quantity}
                  onChange={(e) =>
                    handleFieldChange(
                      "dress_quantity",
                      parseInt(e.target.value) || 1,
                    )
                  }
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-3 border rounded-lg text-center text-2xl font-bold focus:ring-2 focus:ring-blue-500 ${
                    errors.dress_quantity ? "border-red-500" : "border-gray-300"
                  } ${isSubmitting ? "bg-gray-100 cursor-not-allowed" : ""}`}
                />
                <button
                  type="button"
                  onClick={() =>
                    handleFieldChange(
                      "dress_quantity",
                      formData.dress_quantity + 1,
                    )
                  }
                  disabled={formData.dress_quantity >= 100 || isSubmitting}
                  className={`w-12 h-12 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 text-2xl ${
                    isSubmitting || formData.dress_quantity >= 100
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  +
                </button>
              </div>
              {errors.dress_quantity && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.dress_quantity}
                </p>
              )}
            </div>
          </div>

          {/* Timestamps */}
          {order.created_at && (
            <div className="border-t pt-6 mb-8">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Order Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(order.created_at).toLocaleString()}
                  </span>
                </div>
                {/* <div>
                  <span className="text-gray-500">Last Updated:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(order.updated_at).toLocaleString()}
                  </span>
                </div> */}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={handleBackButton}
              disabled={loading || isSubmitting}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={!isFormDirty || isSubmitting}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              type="submit"
              disabled={loading || !isFormDirty || isSubmitting}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating Order...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isFormDirty ? "Update Order" : "No Changes"}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EditDressOrder;
