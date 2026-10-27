"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { X, Send, Package, MapPin, Users, Loader } from "lucide-react";
import { useVendorOrders } from "../../adminhooks/useVendorOrders";

const PushToVendorModal = ({
  isOpen,
  onClose,
  selectedOrders,
  selectedOrdersByLocation,
  onAssign,
}) => {
  const [selectedVendors, setSelectedVendors] = useState({});
  const [assignLoading, setAssignLoading] = useState(false);
  const {
    fetchVendors,
    getVendorsByCity,
    loadingVendors,
    handleCreateVendorOrder,
    vendors,
  } = useVendorOrders();

  // Calculate summary
  const totalOrders = selectedOrders.length;
  const totalQuantity = selectedOrders.reduce(
    (sum, order) => sum + (order.dress_quantity || 0),
    0,
  );

  const sizeBreakdown = selectedOrders.reduce((acc, order) => {
    const size = order?.ordered_size || "Unknown";
    acc[size] = (acc[size] || 0) + (order.dress_quantity || 0);
    return acc;
  }, {});

  const locations = Object.keys(selectedOrdersByLocation);
  const hasMultipleLocations = locations.length > 1;

  // Helper to get city name from order data
  const getCityFromOrder = (order) => {
    return order?.worker?.city || order?.agent?.city || "";
  };

  // Fallback for display when city field is missing (uses location string)
  const getDisplayCity = (locationKey) => {
    const orders = selectedOrdersByLocation[locationKey];
    if (orders && orders.length > 0) {
      const city = getCityFromOrder(orders[0]);
      if (city) return city;
    }
    // Fallback to parsing location string
    return locationKey.split(",")[0].trim();
  };

  // Fetch vendors when modal opens
  useEffect(() => {
    const loadVendors = async () => {
      if (isOpen) {
        await fetchVendors();
      }
    };
    loadVendors();
  }, [isOpen, fetchVendors]);

  useEffect(() => {
    if (isOpen && !loadingVendors && vendors.length > 0) {
      setSelectedVendors((prev) => {
        const updated = { ...prev };

        locations.forEach((locationKey) => {
          // Only set default if NOT already selected
          if (!updated[locationKey]) {
            const ordersInLocation = selectedOrdersByLocation[locationKey];
            if (ordersInLocation && ordersInLocation.length > 0) {
              const cityName = getCityFromOrder(ordersInLocation[0]);
              if (cityName) {
                const vendorsForCity = getVendorsByCity(cityName);
                if (vendorsForCity.length > 0) {
                  updated[locationKey] = vendorsForCity[0];
                }
              }
            }
          }
        });

        return updated;
      });
    }
  }, [
    isOpen,
    locations,
    selectedOrdersByLocation,
    vendors,
    loadingVendors,
    getVendorsByCity,
  ]);

  const handleSubmit = async () => {
    // Check if all locations have a vendor selected
    const missingVendors = locations.filter(
      (location) => !selectedVendors[location],
    );
    if (missingVendors.length > 0) {
      alert(
        `Please select a vendor for ${missingVendors.map((l) => getDisplayCity(l)).join(", ")}`,
      );
      return;
    }

    setAssignLoading(true);
    try {
      const results = [];

      for (const location of locations) {
        const vendor = selectedVendors[location];
        const orderIds = selectedOrdersByLocation[location].map(
          (order) => order.id,
        );

        const orderData = {
          vendor_id: vendor.id,
          dress_order_ids: orderIds,
        };

        const result = await handleCreateVendorOrder(orderData);
        results.push({
          location,
          success: result.success,
          data: result.data,
          error: result.error,
        });

        if (!result.success) {
          console.error(
            `Failed to create vendor order for ${location}:`,
            result.error,
          );
        }
      }

      const allSuccessful = results.every((r) => r.success);
      const failedAssignments = results.filter((r) => !r.success);

      if (allSuccessful) {
        if (onAssign) {
          onAssign(results);
        }
        onClose();
      } else {
        const errorMessage =
          failedAssignments.length === 1
            ? `Failed to assign orders for ${getDisplayCity(failedAssignments[0].location)}. ${failedAssignments[0].error}`
            : `Failed to assign orders for ${failedAssignments.length} locations. Please try again.`;
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error in assigning to vendor:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setAssignLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
        className="bg-white relative rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Assign to Vendor
                </h2>
                <p className="text-blue-100">
                  Assign {totalOrders} orders to vendors
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
          {/* ORDER SUMMARY */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Selected Orders Summary
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-3xl font-bold text-gray-900">
                  {totalOrders}
                </div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-3xl font-bold text-gray-900">
                  {totalQuantity}
                </div>
                <div className="text-sm text-gray-600">Total Items</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600">Locations</div>
                <div className="font-medium text-gray-900">
                  {locations.map((l) => getDisplayCity(l)).join(", ")}
                </div>
              </div>
            </div>

            {hasMultipleLocations && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">
                    Orders from multiple cities
                  </span>
                </div>
                <p className="text-sm text-yellow-600 mt-1">
                  You need to select a vendor for each city
                </p>
              </div>
            )}

            {/* Size Breakdown */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Size Breakdown
              </h4>
              <div className="flex gap-2">
                {Object.entries(sizeBreakdown).map(([size, count]) => (
                  <div
                    key={size}
                    className="flex-1 bg-white p-3 rounded-lg border border-gray-200 text-center"
                  >
                    <div className="text-lg font-bold text-gray-900">
                      {count}
                    </div>
                    <div className="text-xs text-gray-600">{size}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* VENDOR SELECTION */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Select Vendor{hasMultipleLocations ? "s" : ""} by City
            </h3>

            {loadingVendors ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                <p className="text-gray-600">Loading vendors...</p>
                <p className="text-sm text-gray-500 mt-1">
                  Fetching vendor data for all locations
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {locations.map((locationKey) => {
                  const ordersInLocation =
                    selectedOrdersByLocation[locationKey];
                  const displayCity = getDisplayCity(locationKey);
                  const vendorsForCity = getVendorsByCity(displayCity);
                  const selectedVendor = selectedVendors[locationKey];

                  return (
                    <div
                      key={locationKey}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          {displayCity}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({ordersInLocation.length} orders)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {vendorsForCity.length > 0 ? (
                          vendorsForCity.map((vendor) => (
                            <div
                              key={vendor.id}
                              className={`p-3 border rounded-lg cursor-pointer transition ${
                                selectedVendor?.id === vendor.id
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:bg-gray-50"
                              }`}
                              onClick={() =>
                                setSelectedVendors((prev) => ({
                                  ...prev,
                                  [locationKey]: vendor,
                                }))
                              }
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {vendor.name ||
                                      vendor.vendor_name ||
                                      "Unnamed Vendor"}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {vendor.email || "No email"}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {vendor.phone || "No phone"}
                                  </p>
                                </div>
                                {selectedVendor?.id === vendor.id && (
                                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  </div>
                                )}
                              </div>
                              <div className="mt-2 text-xs text-gray-500">
                                <div>Location: {vendor.location}</div>
                                <div>Code: {vendor.vendor_code}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 text-center py-4 text-gray-500">
                            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>No vendors found for {displayCity}</p>
                            <p className="text-sm mt-1">
                              Vendors in {displayCity} might not be available in
                              your vendor list.
                            </p>
                          </div>
                        )}
                      </div>

                      {selectedVendor && vendorsForCity.length > 0 && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            Selected:{" "}
                            <span className="font-semibold">
                              {selectedVendor.name}
                            </span>{" "}
                            ({selectedVendor.vendor_code})
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            Will assign {ordersInLocation.length} orders to this
                            vendor
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={assignLoading}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              assignLoading ||
              loadingVendors ||
              Object.keys(selectedVendors).length !== locations.length
            }
            className={`px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition ${
              assignLoading ||
              loadingVendors ||
              Object.keys(selectedVendors).length !== locations.length
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {assignLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Assigning...
              </>
            ) : loadingVendors ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Loading Vendors...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                {hasMultipleLocations
                  ? `Assign ${locations.length} Locations`
                  : "Assign to Vendor"}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PushToVendorModal;
