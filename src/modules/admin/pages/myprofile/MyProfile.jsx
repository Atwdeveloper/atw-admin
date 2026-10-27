"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Home,
  MapPin,
  ShieldCheck,
  Edit,
  CheckCircle,
  XCircle,
  Globe,
} from "lucide-react";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import Loader from "../../../../common/components/Loader";
import { useProfile } from "../../adminhooks/useProfile";

const MyProfile = () => {
  const { profile, loading, editMode } = useProfile();

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <motion.div
      className="flex-1 bg-gray-50 p-4 md:p-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <motion.div
        className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 md:p-8 border border-gray-200 mb-6"
        variants={itemVariants}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Profile Picture and Basic Info */}
          <div className="flex items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                <User className="w-12 h-12 md:w-16 md:h-16 text-blue-600" />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {profile?.name || "User Name"}
                </h1>
                {/* <p className="text-gray-600 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {profile?.designation || "Designation"}
                  {profile?.department && (
                    <>
                      {/* <span className="mx-1">•</span> */}
                {/* {profile.department} 
                    </>
                  )}
                </p> */}
              </div>

              <div className="flex flex-wrap gap-2">
                {profile?.roles && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                    {profile.roles}
                  </span>
                )}
                {profile?.status_label && (
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      profile.status_label === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {profile.status_label}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {profile?.email || "email@example.com"}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {profile?.phone || "+91 00000 00000"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
            <button
              onClick={editMode}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg font-medium"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        variants={containerVariants}
      >
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-lg p-4 shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Profile Completion</p>
              <p className="text-2xl font-bold text-gray-900">
                {calculateProfileCompletion(profile)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${calculateProfileCompletion(profile)}%` }}
              ></div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-lg p-4 shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Account Status</p>
              <p
                className={`text-2xl font-bold ${
                  profile?.status_label === "active"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {profile?.status_label || "Inactive"}
              </p>
            </div>
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                profile?.status_label === "active" ? "bg-green-50" : "bg-red-50"
              }`}
            >
              {profile?.status_label === "active" ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {profile?.status === 1
              ? "Account is active"
              : "Account is inactive"}
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-lg p-4 shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Member Since</p>
              <p className="text-2xl font-bold text-gray-900">
                {profile?.created_at
                  ? new Date(profile.created_at).getFullYear()
                  : "N/A"}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {profile?.created_at
              ? formatDate(profile.created_at)
              : "Not available"}
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-lg p-4 shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Permission Profile</p>
              <p className="text-2xl font-bold text-gray-900">
                {profile?.permission_profile_name || "N/A"}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ID: {profile?.permission_profile_id || "Not set"}
          </p>
        </motion.div>
      </motion.div>

      {/* Profile Details Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border p-6"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">
                Personal Details
              </h2>
            </div>
            <div className="text-sm text-gray-500">
              ID: {profile?.staff_code || "N/A"}
            </div>
          </div>

          <div className="space-y-4">
            <DetailRow label="Full Name" value={profile?.name} />

            <DetailRow
              label="Date of Birth"
              value={formatDate(profile?.date_of_birth)}
            />
            <DetailRow
              label="Gender"
              value={
                profile?.gender
                  ? profile.gender.charAt(0).toUpperCase() +
                    profile.gender.slice(1)
                  : "Not set"
              }
            />
            <DetailRow label="Email" value={profile?.email} />
            <DetailRow label="Phone" value={profile?.phone} />
            <DetailRow label="Role" value={profile?.roles} />
            {/* <DetailRow label="Designation" value={profile?.designation} /> */}
          </div>
        </motion.div>

        {/* Address Details */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border p-6"
          variants={itemVariants}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Home className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Address Details</h2>
          </div>

          <div className="space-y-4">
            <DetailRow label="Address" value={profile?.address} />
            <DetailRow label="State" value={profile?.state} />
            <DetailRow label="City" value={profile?.city} />
            <DetailRow label="Pincode" value={profile?.pincode} />

            {(profile?.address ||
              profile?.city ||
              profile?.state ||
              profile?.pincode) && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">
                      Complete Address
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {profile.address || "Address not provided"}
                      {profile.city && `, ${profile.city}`}
                      {profile.state && `, ${profile.state}`}
                      {profile.pincode && ` - ${profile.pincode}`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* KYC Details */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border p-6"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">KYC Details</h2>
            </div>
            {hasKYCData(profile) ? (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Data Available
              </span>
            ) : (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                No Data
              </span>
            )}
          </div>

          <div className="space-y-4">
            <DetailRow
              label="Aadhar Number"
              value={profile?.aadhar_number}
              masked
            />
            <DetailRow label="PAN Number" value={profile?.pan_number} masked />
            {/* <DetailRow label="UAN Number" value={profile?.uan_number} />
            <DetailRow label="PF Number" value={profile?.pf_number} />
            <DetailRow label="ESIC Number" value={profile?.esic_number} /> */}
          </div>
        </motion.div>
      </div>

      {/* Additional Information */}
      <motion.div
        className="mt-6 bg-white rounded-xl shadow-sm border p-6"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Globe className="w-5 h-5 text-gray-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">
              Additional Information
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoCard
            icon={Calendar}
            title="Joining Date"
            value={
              profile?.created_at ? formatDate(profile.created_at) : "Not set"
            }
            color="blue"
          />

          <InfoCard
            icon={ShieldCheck}
            title="Permission Profile"
            value={profile?.permission_profile_name || "Not set"}
            color="purple"
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

// Helper component for detail rows
const DetailRow = ({ label, value, masked = false }) => {
  if (value === null || value === undefined || value === "") {
    return (
      <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <span className="text-sm text-gray-400 italic">Not set</span>
      </div>
    );
  }

  const displayValue =
    masked && typeof value === "string" && value.length > 4
      ? `****${value.slice(-4)}`
      : value;

  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{displayValue}</span>
    </div>
  );
};

// Helper component for info cards
const InfoCard = ({ icon: Icon, title, value, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
      <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

// Helper function to calculate profile completion percentage
const calculateProfileCompletion = (profile) => {
  if (!profile) return 0;

  const fields = [
    "name",
    "email",
    "phone",
    "date_of_birth",
    "gender",
    "address",
    "city",
    "state",
    "pincode",
    "aadhar_number",
    "pan_number",
  ];

  const filledFields = fields.filter(
    (field) =>
      profile[field] !== null &&
      profile[field] !== undefined &&
      profile[field] !== "",
  ).length;

  return Math.round((filledFields / fields.length) * 100);
};

// Helper function to check if KYC data exists
const hasKYCData = (profile) => {
  if (!profile) return false;
  return (
    profile.aadhar_number ||
    profile.pan_number ||
    profile.uan_number ||
    profile.pf_number ||
    profile.esic_number
  );
};

// Helper function to check if bank data exists
const hasBankData = (profile) => {
  if (!profile) return false;
  return (
    profile.account_holder_name ||
    profile.account_number ||
    profile.ifsc_code ||
    profile.bank_name ||
    profile.branch_name
  );
};

export default MyProfile;
