"use client";

import { motion } from "framer-motion";
import { X, Package, MapPin, Users, Phone } from "lucide-react";

const VendorOrderModal = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  // Status options only for display (colors and labels)
  const statusOptions = [
    { value: "sent", label: "Sent", color: "bg-blue-100 text-blue-800" },
    {
      value: "acknowledged",
      label: "Acknowledged",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "in_production",
      label: "In Production",
      color: "bg-purple-100 text-purple-800",
    },
    {
      value: "ready_for_delivery",
      label: "Ready for Delivery",
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      value: "delivered",
      label: "Delivered",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "cancelled",
      label: "Cancelled",
      color: "bg-red-100 text-red-800",
    },
  ];

  const getStatusLabel = (status) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option ? option.label : status;
  };

  const getStatusColor = (status) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option ? option.color : "bg-gray-100 text-gray-800";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl"
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Vendor Order</h2>
                <p className="text-blue-100 font-medium">
                  {order.vendor_order_number}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all hover:scale-105"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="flex flex-col gap-6">
            {/* STATUS & ORDER NUMBER - Static fields layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Status Field */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Order Status
                </p>
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(
                    order.status,
                  )}`}
                >
                  {getStatusLabel(order.status)}
                </div>
              </div>

              {/* Order Number Field */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Order Number
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {order.dress_order?.order_number || "-"}
                </p>
              </div>
            </div>

            {/* VENDOR & ORDER INFO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* VENDOR CARD */}
              <div className="bg-blue-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Vendor Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Vendor Name
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {order.vendor?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <p className="text-gray-900">{order.vendor?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">
                      {order.vendor?.phone || "N/A"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{order.vendor?.location}</p>
                  </div>
                </div>
              </div>

              {/* ORDER SUMMARY CARD */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-600" />
                  Order Summary
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Quantity
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {order.dress_order?.dress_quantity || 0} T-shirts
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Size</p>
                    <p className="font-semibold text-gray-900">
                      {order.dress_order?.ordered_size || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t p-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Vendor Order ID: {order.id}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VendorOrderModal;
