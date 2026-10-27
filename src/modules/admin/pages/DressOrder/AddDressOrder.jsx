"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "@/lib/navigation";
import {
  Save,
  User,
  Shirt,
  RotateCcw,
  Search,
  AlertCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import { useDressOrders } from "../../adminhooks/useDressOrders";
import useUnsavedChangesWarning from "../../../../common/hooks/useUnsavedChangesWarning";
import Loader from "../../../../common/components/Loader";

const AddDressOrder = () => {
  const navigate = useNavigate();
  const { handleAddOrder, loading, getWorkersForDressOrders, workers } =
    useDressOrders({ autoFetch: false });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormData = useRef({
    worker_id: "",
    worker_name: "",
    ordered_size: "",
    dress_quantity: 1,
  });

  const [formData, setFormData] = useState(initialFormData.current);
  const [searchTerm, setSearchTerm] = useState("");
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [errors, setErrors] = useState({});

  // Compute if form is dirty
  const isFormDirty = useMemo(() => {
    if (!initialFormData.current || !formData || isSubmitting) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialFormData.current);
  }, [formData, isSubmitting]);

  // Use the unsaved changes warning hook
  useUnsavedChangesWarning(
    isFormDirty && !isSubmitting,
    "You have unsaved changes. Are you sure you want to leave? All changes will be lost.",
  );

  // Filter workers based on search term
  useEffect(() => {
    if (!isSubmitting) {
      if (searchTerm.trim() === "") {
        setFilteredWorkers(workers);
      } else {
        const filtered = workers.filter(
          (worker) =>
            worker.worker_name
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            worker.worker_code
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()),
        );
        setFilteredWorkers(filtered);
      }
    }
  }, [searchTerm, workers, isSubmitting]);

  // Initialize workers on component mount
  useEffect(() => {
    getWorkersForDressOrders({ active: true });
  }, []);

  // Handle click outside dropdown
  useEffect(() => {
    if (!isSubmitting) {
      const handleClickOutside = (e) => {
        if (!e.target.closest(".worker-dropdown-container")) {
          setShowWorkerDropdown(false);
        }
      };
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isSubmitting]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.worker_id) newErrors.worker_id = "Please select a worker";
    if (!formData.ordered_size) newErrors.ordered_size = "Please select size";
    if (!formData.dress_quantity || formData.dress_quantity < 1) {
      newErrors.dress_quantity = "Quantity must be at least 1";
    }
    return newErrors;
  };

  // Handle back button
  const handleBackButton = useCallback(() => {
    navigate("/admin/dress-orders");
  }, [navigate]);

  // Handle worker search
  const handleWorkerSearch = (e) => {
    if (isSubmitting) return;
    const value = e.target.value;
    setSearchTerm(value);
    setShowWorkerDropdown(true);
  };

  // Handle worker selection
  const handleWorkerSelect = (worker) => {
    if (isSubmitting) return;
    setFormData({
      ...formData,
      worker_id: worker.worker_id,
      worker_name: worker.worker_name,
      ordered_size: worker.worker_dress_size || "",
    });
    setSearchTerm(`${worker.worker_name} (${worker.worker_code})`);
    setShowWorkerDropdown(false);
    setErrors({ ...errors, worker_id: "" });
  };

  // Handle size selection
  const handleSizeSelect = (ordered_size) => {
    if (isSubmitting) return;
    setFormData({ ...formData, ordered_size });
    setErrors({ ...errors, ordered_size: "" });
  };

  // Handle quantity change
  const handleQuantityChange = (value) => {
    if (isSubmitting) return;
    const dress_quantity = Math.max(1, value);
    setFormData({ ...formData, dress_quantity });
    setErrors({ ...errors, dress_quantity: "" });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    const result = await handleAddOrder(formData);

    if (result.success) {
      initialFormData.current = JSON.parse(JSON.stringify(formData));
      setIsSubmitting(false);

      Swal.fire({
        icon: "success",
        title: "Order Created",
        text: "Dress order has been created successfully.",
        timer: 1800,
        showConfirmButton: false,
      }).then(() => {
        navigate("/admin/dress-orders");
      });
    } else {
      setIsSubmitting(false);
    }
  };

  // Handle reset form
  const handleReset = () => {
    if (isSubmitting) return;
    setFormData(initialFormData.current);
    setSearchTerm("");
    setErrors({});
    setShowWorkerDropdown(false);
  };

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader />
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
      {/* HEADER */}
      <motion.div className="mb-4" variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Add New Dress Order
              </h1>
              <p className="text-gray-600 mt-1">
                Create a new uniform order for workers
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Unsaved Changes Indicator */}
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
            <span className="text-blue-800 font-medium">Creating order...</span>
          </div>
        </motion.div>
      )}

      {/* FORM */}
      <motion.div
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
        variants={itemVariants}
      >
        <form onSubmit={handleSubmit}>
          {/* WORKER SELECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="worker-dropdown-container">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Select Worker <span className="text-red-500">*</span>
                </div>
              </label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleWorkerSearch}
                    onClick={() => {
                      if (!isSubmitting) setShowWorkerDropdown(true);
                    }}
                    disabled={isSubmitting}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.worker_id ? "border-red-500" : "border-gray-300"
                    } ${isSubmitting ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    placeholder="Search worker by name or code..."
                  />
                </div>
                {!isSubmitting &&
                  showWorkerDropdown &&
                  filteredWorkers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredWorkers.map((worker) => (
                        <div
                          key={worker.worker_id}
                          onClick={() => handleWorkerSelect(worker)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">
                            {worker.worker_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Code: {worker.worker_code}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
              {errors.worker_id && (
                <p className="text-red-500 text-sm mt-1">{errors.worker_id}</p>
              )}
            </div>
            {/* 
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Worker
              </label>
              <input
                type="text"
                value={formData.worker_name}
                readOnly
                disabled={isSubmitting}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg ${
                  isSubmitting ? "bg-gray-100" : "bg-gray-50"
                }`}
                placeholder="No worker selected"
              />
              <p className="text-sm text-gray-500 mt-2">
                {formData.worker_id ? `Worker ID: ${formData.worker_id}` : "Select a worker from the dropdown"}
              </p>
            </div> */}
          </div>

          {/* SIZE & QUANTITY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Shirt className="w-4 h-4" />
                  Size *
                </div>
              </label>
              <div className="grid grid-cols-5 gap-2">
                {["S", "M", "L", "XL", "XXL"].map((ordered_size) => (
                  <button
                    key={ordered_size}
                    type="button"
                    onClick={() => handleSizeSelect(ordered_size)}
                    disabled={isSubmitting}
                    className={`py-3 rounded-lg border text-center transition ${
                      formData.ordered_size === ordered_size
                        ? "bg-blue-100 border-blue-500 text-blue-700 font-semibold"
                        : "border-gray-300 hover:bg-gray-50"
                    } ${isSubmitting ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    {ordered_size}
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
                    handleQuantityChange(formData.dress_quantity - 1)
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
                  onChange={(e) => {
                    if (isSubmitting) return;
                    const val = parseInt(e.target.value) || 1;
                    handleQuantityChange(val);
                  }}
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isSubmitting ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() =>
                    handleQuantityChange(formData.dress_quantity + 1)
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
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>Min: 1</span>
                <span>Max: 100</span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={handleReset}
              disabled={!isFormDirty || isSubmitting}
              className={`px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2 transition ${
                !isFormDirty || isSubmitting
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              Reset Form
            </button>
            <button
              type="submit"
              disabled={loading || !isFormDirty || isSubmitting}
              className={`px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition ${
                loading || !isFormDirty || isSubmitting
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Order...
                </>
              ) : loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Create Dress Order
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* SIZE GUIDE */}
      <motion.div
        className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        variants={itemVariants}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Size Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { size: "S", chest: '36"', length: '28"', fit: "Small" },
            { size: "M", chest: '38"', length: '29"', fit: "Medium" },
            { size: "L", chest: '40"', length: '30"', fit: "Large" },
            { size: "XL", chest: '42"', length: '31"', fit: "Extra Large" },
            { size: "XXL", chest: '44"', length: '32"', fit: "Double XL" },
          ].map((item) => (
            <div
              key={item.size}
              className={`p-4 rounded-lg border text-center ${
                formData.ordered_size === item.size
                  ? "bg-blue-50 border-blue-300 shadow-sm"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {item.size}
              </div>
              <div className="text-sm text-gray-600">Chest: {item.chest}</div>
              <div className="text-sm text-gray-600">Length: {item.length}</div>
              <div className="text-xs text-gray-500 mt-2">{item.fit}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddDressOrder;
