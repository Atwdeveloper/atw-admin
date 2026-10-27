"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/navigation";
import { getProfileAPI } from "../../../api/admin/adminProfileAPI";

export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Dummy profile data for demonstration
  const dummyProfile = {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "9876543210",
    role: "Administrator",
    designation: "Senior Manager",
    department: "Human Resources",
    date_of_birth: "1990-05-15",
    gender: "male",
    username: "johndoe",
    address: "123 Main Street, Sector 5",
    state: "Maharashtra",
    city: "Mumbai",
    pincode: "400001",
    aadhar_number: "123456789012",
    pan_number: "ABCDE1234F",
    uan_number: "987654321098",
    pf_number: "MH/12345/1234567",
    esic_number: "ESIC123456",
    account_holder_name: "John Doe",
    bank_name: "State Bank of India",
    account_number: "1234567890123456",
    ifsc_code: "SBIN0001234",
    branch_name: "Main Branch, Mumbai",
    account_type: "savings",
    profile_picture: null,
    email_verified: true,
    phone_verified: true,
    kyc_verified: true,
    bank_verified: true,
    bank_verified_at: "2024-01-15",
    status: "active",
    employee_id: "EMP001",
    joining_date: "2020-06-01",
    experience: "4 years",
    created_at: "2020-06-01",
    password_changed_at: "2024-01-01",
    documents: {
      aadhar_card: "/documents/aadhar.pdf",
      pan_card: "/documents/pan.pdf",
      bank_proof: "/documents/bank.pdf",
    },
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await getProfileAPI();
      if (response?.status === 200) {
        setProfile(response.data.data || response.data);
      } else {
        // Fallback to dummy data
        setProfile(dummyProfile);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      // Fallback to dummy data
      setProfile(dummyProfile);
    } finally {
      setLoading(false);
    }
  };

  const editMode = () => {
    navigate("/admin/myprofile/edit");
  };

  return {
    profile,
    loading,
    editMode,
    fetchProfile,
  };
};
