"use client";

// EditVendor.jsx
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "@/lib/navigation";
import {
  Save,
  Users,
  Mail,
  Phone,
  MapPin,
  Home,
  AlertCircle,
  Search,
  CheckCircle,
  Building2,
  Edit,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import { useVendorForm } from "../../adminhooks/useVendorForm";
import Loader from "../../../../common/components/Loader";
import useUnsavedChangesWarning from "../../../../common/hooks/useUnsavedChangesWarning";

const EditVendor = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get vendor ID from URL

  // Use the vendor form hook with edit mode
  const {
    formData,
    errors,
    formLoading,
    isSubmitting,
    states,
    cities,
    filteredStates,
    filteredCities,
    loadingCities,
    handleFieldChange,
    handleStateSelect,
    handleStateSearch,
    handleCitySelect,
    handleCitySearch,
    handleSubmit,
    resetForm,
    isFormDirty,
    mode,
    initialData,
  } = useVendorForm("edit", id);

  // UI state for dropdowns
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const stateRef = useRef(null);
  const cityRef = useRef(null);
  const phonePattern = /^[6-9]\d{9}$/;
  // Use the unsaved changes warning hook
  useUnsavedChangesWarning(
    isFormDirty && !isSubmitting,
    "You have unsaved changes. Are you sure you want to leave? All changes will be lost.",
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (stateRef.current && !stateRef.current.contains(event.target)) {
        setShowStateDropdown(false);
      }
      if (cityRef.current && !cityRef.current.contains(event.target)) {
        setShowCityDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle back button
  const handleBackButton = () => {
    navigate("/admin/vendor/listing");
  };

  // Form submission handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!phonePattern.test(formData.phone)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Phone Number",
        text: "Phone number must be 10 digits and start with 6, 7, 8 or 9.",
      });
      return;
    }
    const result = await handleSubmit();

    if (result.status === 200) {
      navigate("/admin/vendor/listing");
    }
  };

  // Handle input helpers
  const handlePhoneChange = (e) => {
    if (isSubmitting) return;
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    handleFieldChange("phone", value);
  };

  if (formLoading) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-gray-600">Loading vendor details...</p>
        </div>
      </div>
    );
  }

  // If vendor not found
  // if (!formData.name && !formLoading && initialData === null) {
  //   return (
  //     <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center min-h-screen">
  //       <div className="text-center max-w-md">
  //         <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
  //           <Users className="w-10 h-10 text-red-600" />
  //         </div>
  //         <h2 className="text-2xl font-bold text-gray-800 mb-2">Vendor Not Found</h2>
  //         <p className="text-gray-600 mb-6">The vendor you're trying to edit doesn't exist or has been removed.</p>
  //         <button
  //           onClick={() => navigate('/admin/vendors')}
  //           className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
  //         >
  //           <ArrowLeft className="inline-block w-5 h-5 mr-2" />
  //           Back to Vendors
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

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
              <h1 className="text-3xl font-bold text-gray-800">Edit Vendor</h1>
              <p className="text-gray-600 mt-1">Update vendor details</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center">
              <Edit className="w-8 h-8 text-blue-600" />
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800 font-medium">
                You have unsaved changes
              </span>
            </div>
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
            <span className="text-blue-800 font-medium">
              Updating vendor...
            </span>
          </div>
        </motion.div>
      )}

      {/* FORM */}
      <motion.div
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
        variants={itemVariants}
      >
        <form onSubmit={handleFormSubmit}>
          <div className="space-y-8">
            {/* BASIC INFORMATION SECTION */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* VENDOR NAME */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Vendor Name{" "}
                      <span className="text-sm text-red-500">*</span>{" "}
                    </div>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    disabled={isSubmitting}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    } ${isSubmitting ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    placeholder="Enter vendor name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* EMAIL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      Email Address{" "}
                      <span className="text-sm text-red-500">*</span>{" "}
                    </div>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    disabled={isSubmitting}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    } ${isSubmitting ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    placeholder="vendor@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* PHONE */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </div>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    disabled={isSubmitting}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.phone ? "border-red-500" : "border-gray-300"
                    } ${isSubmitting ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    placeholder="9876543210"
                    maxLength="10"
                  />
                  {formData.phone && !phonePattern.test(formData.phone) && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Invalid number — must be 10 digits and start with 6–9
                    </p>
                  )}

                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* ADDRESS */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-1">
                      <Home className="w-4 h-4" />
                      Address{" "}
                      <span className="text-sm text-red-500">*</span>{" "}
                    </div>
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      handleFieldChange("address", e.target.value)
                    }
                    disabled={isSubmitting}
                    rows={3}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.address ? "border-red-500" : "border-gray-300"
                    } ${isSubmitting ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    placeholder="Full business address"
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* LOCATION SECTION */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-200">
                Location Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* STATE DROPDOWN */}
                <div ref={stateRef} className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      State <span className="text-sm text-red-500">*</span>
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleStateSearch(e.target.value)}
                      onFocus={() =>
                        !isSubmitting && setShowStateDropdown(true)
                      }
                      disabled={isSubmitting}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.state_id ? "border-red-500" : "border-gray-300"
                      } ${isSubmitting ? "bg-gray-100 cursor-not-allowed" : ""}`}
                      placeholder="Search or select state"
                    />
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                  </div>
                  {errors.state_id && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.state_id}
                    </p>
                  )}

                  {/* State Dropdown */}
                  {showStateDropdown && !isSubmitting && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredStates.length > 0 ? (
                        filteredStates.map((state) => (
                          <div
                            key={state.id}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => {
                              handleStateSelect(state);
                              setShowStateDropdown(false);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span>{state.name}</span>
                              {state.id === formData.state_id && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500">
                          No states found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* CITY DROPDOWN */}
                <div ref={cityRef} className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      City <span className="text-sm text-red-500">*</span>{" "}
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleCitySearch(e.target.value)}
                      onFocus={() => {
                        if (formData.state_id && !isSubmitting) {
                          setShowCityDropdown(true);
                        }
                      }}
                      disabled={isSubmitting || !formData.state_id}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.city_id ? "border-red-500" : "border-gray-300"
                      } ${
                        !formData.state_id || isSubmitting
                          ? "bg-gray-100 cursor-not-allowed"
                          : ""
                      }`}
                      placeholder={
                        !formData.state_id
                          ? "Select state first"
                          : "Search or select city"
                      }
                    />
                    {loadingCities ? (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                    )}
                  </div>
                  {errors.city_id && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.city_id}
                    </p>
                  )}

                  {!formData.state_id && !isSubmitting && (
                    <p className="text-sm text-gray-500 mt-1">
                      Please select a state first
                    </p>
                  )}

                  {/* City Dropdown */}
                  {showCityDropdown && formData.state_id && !isSubmitting && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredCities.length > 0 ? (
                        filteredCities.map((city) => (
                          <div
                            key={city.id}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => {
                              handleCitySelect(city);
                              setShowCityDropdown(false);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span>{city.name}</span>
                              {city.id === formData.city_id && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500">
                          No cities found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* LOCATION (READ-ONLY) */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Location (Auto-generated)
                    </div>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    placeholder="Location will be auto-generated from state and city"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This field is automatically generated from the selected
                    state and city
                  </p>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <div>
                {initialData && (
                  <div className="text-sm text-gray-500">
                    <p>
                      Last updated:{" "}
                      {initialData.updated_at
                        ? new Date(initialData.updated_at).toLocaleDateString()
                        : "N/A"}
                    </p>
                    <p>
                      Created:{" "}
                      {initialData.created_at
                        ? new Date(initialData.created_at).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleBackButton}
                  disabled={isSubmitting}
                  className={`px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium transition ${
                    isSubmitting
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={!isFormDirty || isSubmitting}
                  className={`px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium transition ${
                    !isFormDirty || isSubmitting
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-50"
                  }`}
                >
                  Reset Changes
                </button>
                <button
                  type="submit"
                  disabled={!isFormDirty || isSubmitting}
                  className={`px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-1 transition ${
                    !isFormDirty || isSubmitting
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating Vendor...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Update Vendor
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EditVendor;
