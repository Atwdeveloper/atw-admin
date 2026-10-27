"use client";

// modules/admin/components/DressOrderModal.jsx

import { motion } from "framer-motion";
import {
  X,
  Package,
  User,
  Hash,
  Shirt,
  Calendar,
  CheckCircle,
} from "lucide-react";

const DressOrderModal = ({
  order,
  isOpen,
  onClose,
  canUpdateStatus = false,
}) => {
  if (!order || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">
                  Dress Order Details
                </h2>

                <p className="text-amber-100">
                  Order #{order?.order_number || "-"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* ORDER INFO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              {/* ORDER NUMBER */}
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Order Number
                </label>

                <div className="flex items-center gap-2 mt-1">
                  <Hash className="w-4 h-4 text-amber-600" />

                  <span className="text-lg font-semibold text-gray-900">
                    {order?.order_number || "-"}
                  </span>
                </div>
              </div>

              {/* STATUS */}
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Status
                </label>

                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-3 py-1 capitalize rounded-full text-sm font-medium ${
                      order?.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : order?.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : order?.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order?.status === "processing"
                              ? "bg-blue-100 text-blue-800"
                              : order?.status === "new"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {order?.status === "delivered"
                      ? "Delivered"
                      : order?.status || "unknown"}
                  </span>
                </div>
              </div>

              {/* ORDER DATE */}
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Order Date
                </label>

                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-gray-400" />

                  <span className="text-gray-900">
                    {order?.created_at
                      ? new Date(order.created_at).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="space-y-4">
              {/* SIZE */}
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Size
                </label>

                <div className="flex items-center gap-2 mt-1">
                  <Shirt className="w-5 h-5 text-blue-600" />

                  <span className="text-2xl font-bold text-gray-900">
                    {order?.ordered_size || "-"}
                  </span>

                  <span className="text-sm text-gray-500">
                    ({getSizeDescription(order?.ordered_size)})
                  </span>
                </div>
              </div>

              {/* QUANTITY */}
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Quantity
                </label>

                <div className="mt-1">
                  <span className="text-3xl font-bold text-amber-700">
                    {order?.dress_quantity || 0}
                  </span>

                  <span className="text-lg text-gray-600 ml-2">T-shirts</span>
                </div>
              </div>
            </div>
          </div>

          {/* WORKER INFO */}
          {/* PERSON INFO */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-600" />
              {order?.type === "agent"
                ? "Agent Information"
                : "Worker Information"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {order?.type === "agent" ? "Agent Name" : "Worker Name"}
                </label>

                <p className="text-gray-900 font-medium mt-1">
                  {order?.type === "agent"
                    ? order?.agent?.name || "Not Assigned"
                    : order?.worker?.name || "Not Assigned"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  {order?.type === "agent" ? "Agent ID" : "Worker ID"}
                </label>

                <p className="font-mono text-gray-900 mt-1">
                  {order?.type === "agent"
                    ? order?.agent?.id || "-"
                    : order?.worker?.id || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* VENDOR INFO */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-600" />
              Vendor Information
            </h3>

            {order?.vendors?.length ? (
              order.vendors.map((v, index) => (
                <div
                  key={v?.vendor_id || index}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3"
                >
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Vendor Name
                    </label>

                    <p className="text-gray-900 font-medium mt-1">
                      {v?.name || "Unknown Vendor"}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Vendor ID
                    </label>

                    <p className="font-mono text-gray-900 mt-1">
                      {v?.vendor_id || "-"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No vendor assigned</p>
            )}
          </div>

          {/* TIMESTAMPS */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-3">
              Timestamps
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Created:</span>

                <span className="ml-2 text-gray-900">
                  {order?.created_at
                    ? new Date(order.created_at).toLocaleString()
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            Close
          </button>

          {canUpdateStatus && order?.status === "new" && (
            <button
              onClick={() => {
                onClose();
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Mark as Received
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Helper function
const getSizeDescription = (size) => {
  const sizes = {
    S: 'Small (Chest: 36", Length: 28")',
    M: 'Medium (Chest: 38", Length: 29")',
    L: 'Large (Chest: 40", Length: 30")',
    XL: 'Extra Large (Chest: 42", Length: 31")',
    XXL: 'Double XL (Chest: 44", Length: 32")',
  };

  return sizes[size] || "Standard size";
};

export default DressOrderModal;
