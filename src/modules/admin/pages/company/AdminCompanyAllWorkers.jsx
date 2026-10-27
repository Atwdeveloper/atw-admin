"use client";

import { useParams } from "@/lib/navigation";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Eye,
  UserCircle,
  Search,
  Briefcase,
  Award,
  MapPin,
  Calendar,
  LogIn,
  LogOut,
  X,
  Clock,
  Filter,
  CheckCircle,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useWorkerListing } from "../../adminhooks/useWorkerAttendance";
import Loader from "../../../../common/components/Loader";
import VacancyWorkerView from "../../components/vacancy/VacancyWorkerView";
import Swal from "sweetalert2";
import {
  signInAPI,
  signOutAPI,
} from "../../../../api/admin/adminWorkerAttendanceAPI";
import {
  getActiveCompanyVacanciesAPI,
  getStatesAPI,
  getCitiesAPI,
} from "../../../../api/admin/adminWorkerAttendanceAPI";

import Breadcrumb from "../../../../common/components/Breadcrumb";
import { useLocation } from "@/lib/navigation";
const normalizeWorkerForModal = (rawWorker) => {
  if (!rawWorker) return null;
  const personalDetail = rawWorker.personal_detail || {};
  const paymentDetail = Array.isArray(rawWorker.payment_detail)
    ? rawWorker.payment_detail[0] || {}
    : rawWorker.payment_detail || {};
  const statutoryDetail = rawWorker.statutory_detail || {};
  return {
    id: rawWorker.id,
    fullName:
      rawWorker.full_name ||
      `${rawWorker.first_name || ""} ${rawWorker.last_name || ""}`.trim(),
    workerCode: rawWorker.worker_code || "",
    mobile: rawWorker.mobile_number || rawWorker.mobile || "",
    email: rawWorker.work_email || rawWorker.email || "",
    workLocation: rawWorker.work_location || "",
    experience: rawWorker.experience || "0",
    designation: rawWorker.designation?.name || "",
    department: rawWorker.department?.name || "",
    industry: rawWorker.industry?.name || "",
    photo: rawWorker.photo || null,
    personal: {
      date_of_birth: personalDetail.date_of_birth,
      father_name: personalDetail.father_name,
      pan_number: personalDetail.pan_number,
      aadhar_number: personalDetail.aadhar_number,
      dress_size: personalDetail.dress_size,
      address: personalDetail.address,
      city: personalDetail.city,
      state: personalDetail.state,
      zip: personalDetail.zip,
    },
    payment: {
      payment_method: paymentDetail.payment_method,
      account_holder_name: paymentDetail.account_holder_name,
      bank_name: paymentDetail.bank_name,
      account_number: paymentDetail.account_number,
      ifsc_code: paymentDetail.ifsc_code,
      account_type: paymentDetail.account_type,
    },
    statutory: {
      epf_enabled: statutoryDetail.epf_enabled,
      uan_number: statutoryDetail.uan_number,
      eps_contribution: statutoryDetail.eps_contribution,
      esi_enabled: statutoryDetail.esi_enabled,
      esic_number: statutoryDetail.esic_number,
    },
  };
};

const formatLocalDate = (date) => {
  if (!date || isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AdminCompanyAllWorkers = () => {
  const { companyId } = useParams();
  const {
    applications,
    loading,
    page,
    totalPages,
    totalWorkers,
    setPage,
    filters,
    setFilters,
  } = useWorkerListing(companyId);

  const location = useLocation();

  const companyName = location.state?.companyName || "Company";
  // State for vacancies dropdown
  const [vacancies, setVacancies] = useState([]);
  const [vacanciesLoading, setVacanciesLoading] = useState(false);
  const [showVacancyDropdown, setShowVacancyDropdown] = useState(false);
  const vacancyRef = useRef(null);

  // State for location filters
  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Dropdown UI states for state/city
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [selectedStateName, setSelectedStateName] = useState("");
  const [selectedCityName, setSelectedCityName] = useState("");

  // Refs for state/city
  const stateRef = useRef(null);
  const cityRef = useRef(null);

  // Attendance states
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [attendanceMap, setAttendanceMap] = useState({});
  const [markingInProgress, setMarkingInProgress] = useState({});

  useEffect(() => {
    const fetchVacancies = async () => {
      if (!companyId) return;

      setVacanciesLoading(true);

      try {
        const response = await getActiveCompanyVacanciesAPI(companyId);

        setVacancies(response?.data?.data || []);
      } catch (error) {
      } finally {
        setVacanciesLoading(false);
      }
    };

    fetchVacancies();
  }, [companyId]);

  // Fetch states
  useEffect(() => {
    const fetchStates = async () => {
      setStatesLoading(true);
      try {
        const response = await getStatesAPI();
        const statesData = response.data.data || [];
        setStates(statesData);
      } catch (error) {
      } finally {
        setStatesLoading(false);
      }
    };
    fetchStates();
  }, []);

  // Fetch cities when state changes
  useEffect(() => {
    const fetchCities = async () => {
      if (!filters.state_id) {
        setCities([]);
        return;
      }
      setCitiesLoading(true);
      try {
        const response = await getCitiesAPI(filters.state_id);
        const citiesData = response.data.data || [];
        setCities(citiesData);
        if (filters.city_id) {
          const selectedCity = citiesData.find(
            (c) => c.id.toString() === filters.city_id.toString(),
          );
          if (selectedCity) setSelectedCityName(selectedCity.name);
        }
      } catch (error) {
        setCities([]);
      } finally {
        setCitiesLoading(false);
      }
    };
    fetchCities();
  }, [filters.state_id]);

  // Update selected state name
  useEffect(() => {
    if (filters.state_id) {
      const state = states.find(
        (s) => s.id.toString() === filters.state_id.toString(),
      );
      if (state) setSelectedStateName(state.name);
    } else {
      setSelectedStateName("");
      setSelectedCityName("");
    }
  }, [filters.state_id, states]);

  // Update selected city name
  useEffect(() => {
    if (filters.city_id && cities.length > 0) {
      const city = cities.find(
        (c) => c.id.toString() === filters.city_id.toString(),
      );
      if (city) setSelectedCityName(city.name);
    } else if (!filters.city_id) {
      setSelectedCityName("");
    }
  }, [filters.city_id, cities]);

  // Click outside handlers
  const handleClickOutside = useCallback((event) => {
    if (vacancyRef.current && !vacancyRef.current.contains(event.target)) {
      setShowVacancyDropdown(false);
    }
    if (stateRef.current && !stateRef.current.contains(event.target)) {
      setShowStateDropdown(false);
      setStateSearch("");
    }
    if (cityRef.current && !cityRef.current.contains(event.target)) {
      setShowCityDropdown(false);
      setCitySearch("");
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  // Filter handlers
  const handleVacancySelect = (vacancy) => {
    setFilters({
      ...filters,
      vacancy_id: vacancy.vacancy_id,
    });

    setShowVacancyDropdown(false);
  };

  const handleStateSelect = (state) => {
    setFilters({ ...filters, state_id: state.id, city_id: "" });
    setSelectedStateName(state.name);
    setSelectedCityName("");
    setStateSearch("");
    setShowStateDropdown(false);
  };

  const handleCitySelect = (city) => {
    setFilters({ ...filters, city_id: city.id });
    setSelectedCityName(city.name);
    setCitySearch("");
    setShowCityDropdown(false);
  };

  const clearAllFilters = () => {
    setFilters({
      name: "",
      vacancy_id: "",
      state_id: "",
      city_id: "",
    });
    setSelectedStateName("");
    setSelectedCityName("");
    setFiltersVisible(false);
  };

  // ---------- Attendance logic (unchanged from your original) ----------
  const getFormattedDate = () => formatLocalDate(selectedDate);

  useEffect(() => {
    if (selectedDate) {
      const formattedDate = formatLocalDate(selectedDate);
      setFilters((prev) => ({ ...prev, attendance_date: formattedDate }));
    }
  }, [selectedDate, setFilters]);

  useEffect(() => {
    if (!applications.length) return;
    const currentFormatted = getFormattedDate();
    const newMap = { ...attendanceMap };
    let changed = false;
    applications.forEach((app) => {
      const worker = app.worker;
      const vacancy = app.vacancy || worker?.vacancy;
      if (!worker || !worker.id || !vacancy) return;
      const key = `${worker.id}_${vacancy.id}_${currentFormatted}`;
      const apiStatus = worker.attendance_status_today;
      if (!attendanceMap[key]) {
        if (apiStatus === "signed_in") {
          newMap[key] = {
            signInTime: true,
            signOutTime: null,
            quantity: null,
            status: "present",
            fromApi: true,
          };
          changed = true;
        } else if (apiStatus === "signed_out") {
          newMap[key] = {
            signInTime: true,
            signOutTime: true,
            quantity: null,
            status: "present",
            fromApi: true,
          };
          changed = true;
        }
      }
    });
    if (changed) setAttendanceMap(newMap);
  }, [applications, selectedDate]);

  useEffect(() => {
    setAttendanceMap({});
  }, [selectedDate]);

  const handleMarkAttendance = async (
    workerId,
    vacancy,
    action,
    quantity = null,
    customTime = null,
  ) => {
    const attendanceDate = getFormattedDate();
    const key = `${workerId}_${vacancy.id}_${attendanceDate}`;
    const existing = attendanceMap[key] || {};
    const rateType = String(vacancy.rate_type).toLowerCase();
    const isTimeBased =
      rateType === "salary" || rateType === "hourly" || rateType === "daily";
    const attendanceType = isTimeBased ? "daily" : "production";

    if (action === "signout") {
      if (!existing.signInTime && existing.fromApi !== true) {
        Swal.fire({
          icon: "warning",
          title: "Not signed in",
          text: "Worker must sign in first.",
        });
        return;
      }
      if (existing.signOutTime) {
        Swal.fire({
          icon: "warning",
          title: "Already signed out",
          text: "Worker already signed out today.",
        });
        return;
      }
      if (!isTimeBased) {
        if (!vacancy.rate_type || !vacancy.rate_per_unit) {
          Swal.fire({
            icon: "error",
            title: "Missing Vacancy Details",
            text: `This vacancy is missing unit or rate per unit.`,
          });
          return;
        }
        if (quantity === null || quantity === undefined) {
          Swal.fire({
            icon: "warning",
            title: "Missing quantity",
            text: "Please enter the production quantity.",
          });
          return;
        }
      }
    }

    if (action === "signin" && existing.signInTime) {
      Swal.fire({
        icon: "warning",
        title: "Already signed in",
        text: "Worker already signed in today.",
      });
      return;
    }

    if (action === "absent") {
      if (existing.signInTime || existing.signOutTime) {
        Swal.fire({
          icon: "warning",
          title: "Cannot mark absent",
          text: "Worker has already signed in/out.",
        });
        return;
      }
      setAttendanceMap((prev) => ({
        ...prev,
        [key]: {
          status: "absent",
          signInTime: null,
          signOutTime: null,
          quantity: null,
        },
      }));
      Swal.fire({
        icon: "success",
        title: "Marked absent",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    setMarkingInProgress((prev) => ({ ...prev, [key]: true }));

    try {
      let response;
      if (action === "signin") {
        const payload = {
          worker_id: workerId,
          company_id: companyId,
          vacancy_id: vacancy.id,
          attendance_type: attendanceType,
          custom_time: customTime,
          attendance_date: attendanceDate,
        };
        response = await signInAPI(payload);
      } else {
        // signout
        const payload = isTimeBased
          ? {
              worker_id: workerId,
              vacancy_id: vacancy.id,
              custom_time: customTime,
              attendance_date: attendanceDate,
              attendance_type: attendanceType,
            }
          : {
              worker_id: workerId,
              vacancy_id: vacancy.id,
              quantity: quantity,
              unit: vacancy.rate_type,
              rate_per_unit: vacancy.rate_per_unit,
              custom_time: customTime,
              attendance_date: attendanceDate,
              attendance_type: attendanceType,
            };
        response = await signOutAPI(payload);
      }

      if (
        response?.data &&
        (response.data.status === 500 || response.data.status !== 200)
      ) {
        throw new Error(
          response.data.message || "Failed to record attendance.",
        );
      }

      const now = new Date().toISOString();
      const customTimeFull = customTime
        ? `${attendanceDate}T${customTime}:00`
        : now;

      let updatedRecord;
      if (action === "signin") {
        updatedRecord = {
          signInTime: customTimeFull,
          signOutTime: null,
          quantity: null,
          status: "present",
        };
      } else {
        updatedRecord = {
          ...existing,
          signOutTime: customTimeFull,
          quantity: !isTimeBased ? quantity : null,
          status: "present",
        };
      }
      setAttendanceMap((prev) => ({ ...prev, [key]: updatedRecord }));

      const actionText = action === "signin" ? "IN" : "OUT";
      Swal.fire({
        icon: "success",
        title: "Success",
        text: `${actionText} recorded.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Failed to record attendance.",
      });
    } finally {
      setMarkingInProgress((prev) => ({ ...prev, [key]: false }));
    }
  };

  const getAttendanceDisplay = (workerId, vacancyId) => {
    const formattedDate = getFormattedDate();
    const key = `${workerId}_${vacancyId}_${formattedDate}`;
    const att = attendanceMap[key];
    if (!att) return null;
    if (att.status === "absent") return "Absent";
    const inTime =
      att.signInTime && typeof att.signInTime === "string"
        ? formatTime(att.signInTime)
        : att.signInTime
          ? "Yes"
          : null;
    const outTime =
      att.signOutTime && typeof att.signOutTime === "string"
        ? formatTime(att.signOutTime)
        : att.signOutTime
          ? "Yes"
          : null;
    const qty = att.quantity;
    if (inTime && outTime)
      return `IN: ${inTime} | OUT: ${outTime}${qty ? ` | Qty: ${qty}` : ""}`;
    if (inTime) return `IN: ${inTime} (pending OUT)`;
    if (outTime) return `OUT: ${outTime}`;
    return "Present";
  };

  const openViewModal = (worker) => {
    setSelectedWorker(normalizeWorkerForModal(worker));
    setIsModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedWorker(null);
    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 bg-gray-50 p-4 sm:p-6 min-h-screen">
      <Breadcrumb
        items={[
          { label: "Companies", path: "/admin/company/listing" },
          { label: companyName },
          { label: "Workers" },
        ]}
      />
      {/* Header */}
      <div className="bg-white p-4 mb-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Workers List</h1>
            <p className="text-gray-500 text-sm mt-1">
              Total workers: {totalWorkers}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-80">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by name or worker code..."
                value={filters.name || ""}
                onChange={(e) =>
                  setFilters({ ...filters, name: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setFiltersVisible(!filtersVisible)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition ${
                filtersVisible
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            {(filters.name ||
              filters.vacancy_id ||
              filters.state_id ||
              filters.city_id) && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {filtersVisible && (
        <div className="bg-white p-4 mb-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="text-sm font-medium text-gray-700">FILTER BY :</div>
            <div className="flex flex-wrap gap-3 items-start">
              {/* Vacancy Dropdown */}
              <div ref={vacancyRef} className="relative w-64">
                <div className="relative">
                  <Briefcase
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={
                      filters.vacancy_id
                        ? vacancies.find(
                            (v) =>
                              v.vacancy_id?.toString() ===
                              filters.vacancy_id?.toString(),
                          )?.designation_name || ""
                        : ""
                    }
                    onFocus={() => setShowVacancyDropdown(true)}
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 text-sm rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Select Vacancy..."
                    readOnly
                  />
                  {vacanciesLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                {showVacancyDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {vacanciesLoading ? (
                      <div className="px-3 py-2 text-center text-gray-500">
                        Loading...
                      </div>
                    ) : (
                      <>
                        <div
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b"
                          onClick={() => {
                            setFilters({ ...filters, vacancy_id: "" });
                            setShowVacancyDropdown(false);
                          }}
                        >
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">All Vacancies</span>
                            {!filters.vacancy_id && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </div>
                        {vacancies.map((vac) => (
                          <div
                            key={vac.vacancy_id}
                            className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b ${
                              filters.vacancy_id?.toString() ===
                              vac.vacancy_id?.toString()
                                ? "bg-blue-50"
                                : ""
                            }`}
                            onClick={() => handleVacancySelect(vac)}
                          >
                            <div className="flex justify-between text-sm">
                              <span>
                                {vac.designation_name}
                                {vac.rate_type && ` (${vac.rate_type})`}
                              </span>
                              {filters.vacancy_id?.toString() ===
                                vac.vacancy_id?.toString() && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                          </div>
                        ))}
                        {vacancies.length === 0 && (
                          <div className="px-3 py-2 text-center text-gray-500">
                            No vacancies found
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* State Dropdown */}
              <div ref={stateRef} className="relative w-40">
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={showStateDropdown ? stateSearch : selectedStateName}
                    onChange={(e) => {
                      setStateSearch(e.target.value);
                      if (!showStateDropdown) setShowStateDropdown(true);
                    }}
                    onFocus={() => {
                      setStateSearch("");
                      setShowStateDropdown(true);
                    }}
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="State..."
                  />
                </div>
                {showStateDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {statesLoading ? (
                      <div className="px-3 py-2 text-center text-gray-500">
                        Loading...
                      </div>
                    ) : (
                      <>
                        <div
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b"
                          onClick={() => {
                            setFilters({
                              ...filters,
                              state_id: "",
                              city_id: "",
                            });
                            setSelectedStateName("");
                            setSelectedCityName("");
                            setStateSearch("");
                            setShowStateDropdown(false);
                          }}
                        >
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">All States</span>
                            {!filters.state_id && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </div>
                        {states
                          .filter(
                            (s) =>
                              !stateSearch ||
                              s.name
                                .toLowerCase()
                                .includes(stateSearch.toLowerCase()),
                          )
                          .map((state) => (
                            <div
                              key={state.id}
                              className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b ${filters.state_id === state.id ? "bg-blue-50" : ""}`}
                              onClick={() => handleStateSelect(state)}
                            >
                              <div className="flex justify-between text-sm">
                                <span>{state.name}</span>
                                {filters.state_id === state.id && (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                )}
                              </div>
                            </div>
                          ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* City Dropdown */}
              <div ref={cityRef} className="relative w-40">
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={showCityDropdown ? citySearch : selectedCityName}
                    onChange={(e) => {
                      setCitySearch(e.target.value);
                      if (!showCityDropdown) setShowCityDropdown(true);
                    }}
                    onFocus={() => {
                      if (filters.state_id) {
                        setCitySearch("");
                        setShowCityDropdown(true);
                      }
                    }}
                    disabled={!filters.state_id}
                    className={`w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${!filters.state_id ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    placeholder={
                      !filters.state_id ? "Select state first" : "City..."
                    }
                  />
                  {citiesLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                {showCityDropdown && filters.state_id && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {citiesLoading ? (
                      <div className="px-3 py-2 text-center text-gray-500">
                        Loading...
                      </div>
                    ) : (
                      <>
                        <div
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b"
                          onClick={() => {
                            setFilters({ ...filters, city_id: "" });
                            setSelectedCityName("");
                            setCitySearch("");
                            setShowCityDropdown(false);
                          }}
                        >
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">All Cities</span>
                            {!filters.city_id && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </div>
                        {cities
                          .filter(
                            (c) =>
                              !citySearch ||
                              c.name
                                .toLowerCase()
                                .includes(citySearch.toLowerCase()),
                          )
                          .map((city) => (
                            <div
                              key={city.id}
                              className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b ${filters.city_id === city.id ? "bg-blue-50" : ""}`}
                              onClick={() => handleCitySelect(city)}
                            >
                              <div className="flex justify-between text-sm">
                                <span>{city.name}</span>
                                {filters.city_id === city.id && (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                )}
                              </div>
                            </div>
                          ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Picker */}
      <div className="mb-6 flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-gray-200">
        <label className="text-sm font-medium text-gray-700">
          Attendance Date:
        </label>
        <div className="relative w-[240px]">
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            dateFormat="yyyy-MM-dd"
            readOnly
            disabled
            className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm text-gray-500 bg-gray-50 shadow-sm cursor-not-allowed outline-none"
          />
          <Calendar
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
        </div>
      </div>

      {/* Workers List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader />
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <UserCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            No workers found
          </h3>
          <p className="text-gray-600">
            Try adjusting your filters or search criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app, idx) => {
            const worker = app.worker;
            const vacancy = app.vacancy || worker?.vacancy;
            if (!worker || !worker.id || !vacancy) return null;

            const formattedDate = getFormattedDate();
            const key = `${worker.id}_${vacancy.id}_${formattedDate}`;
            const att = attendanceMap[key];
            const isAbsent = att?.status === "absent";
            const hasSignIn = att?.signInTime;
            const hasSignOut = att?.signOutTime;
            const showSignInAbsent = !isAbsent && !hasSignIn && !hasSignOut;
            const showSignOutOnly = !isAbsent && hasSignIn && !hasSignOut;
            const attendanceDisplay = getAttendanceDisplay(
              worker.id,
              vacancy.id,
            );
            const isMarking = markingInProgress[key];

            return (
              <WorkerCard
                key={`${worker.id}-${idx}`}
                worker={worker}
                vacancy={vacancy}
                shiftStart={vacancy.shift_start_time?.slice(0, 5) || "--:--"}
                shiftEnd={vacancy.shift_end_time?.slice(0, 5) || "--:--"}
                onView={() => openViewModal(worker)}
                attendanceDisplay={attendanceDisplay}
                showSignInAbsent={showSignInAbsent}
                showSignOutOnly={showSignOutOnly}
                isSignedInOtherCompany={app.is_signed_in_other_company}
                companyName={app.already_signedin_company?.name}
                designationName={app.already_signedin_vacancy?.designation_name}
                onSignIn={(time) =>
                  handleMarkAttendance(worker.id, vacancy, "signin", null, time)
                }
                onSignOut={(quantity, time) =>
                  handleMarkAttendance(
                    worker.id,
                    vacancy,
                    "signout",
                    quantity,
                    time,
                  )
                }
                onAbsent={() =>
                  handleMarkAttendance(worker.id, vacancy, "absent")
                }
                isMarking={isMarking}
              />
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {applications.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition ${
              page === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-black hover:text-white"
            }`}
          >
            Prev
          </button>
          {[...Array(totalPages)].map((_, idx) => {
            const p = idx + 1;
            if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border text-sm shadow-sm transition ${
                    page === p
                      ? "bg-black text-white"
                      : "bg-white hover:bg-black hover:text-white"
                  }`}
                >
                  {p}
                </button>
              );
            if (p === page - 3 || p === page + 3)
              return (
                <span key={p} className="px-2">
                  ...
                </span>
              );
            return null;
          })}
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition ${
              page === totalPages
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-black hover:text-white"
            }`}
          >
            Next
          </button>
        </div>
      )}

      <VacancyWorkerView
        worker={selectedWorker}
        isOpen={isModalOpen}
        onClose={closeViewModal}
      />
    </div>
  );
};

// WorkerCard Component (exactly as you had it – unchanged)
const WorkerCard = ({
  worker,
  vacancy,
  shiftStart,
  shiftEnd,
  onView,
  attendanceDisplay,
  showSignInAbsent,
  showSignOutOnly,
  isSignedInOtherCompany,
  companyName,
  designationName,
  onSignIn,
  onSignOut,
  onAbsent,
  isMarking,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // "signin" or "signout"
  const [quantityInput, setQuantityInput] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const rateType = String(vacancy.rate_type).toLowerCase();
  const isTimeBased =
    rateType === "salary" || rateType === "hourly" || rateType === "daily";
  const unit =
    vacancy.rate_type && vacancy.rate_type.trim() !== ""
      ? vacancy.rate_type
      : "units";
  const ratePerUnit = vacancy.rate_per_unit || 0;
  const isProductionDataValid =
    vacancy.rate_type &&
    vacancy.rate_per_unit !== null &&
    vacancy.rate_per_unit !== undefined;

  const fullName =
    worker.full_name ||
    `${worker.first_name || ""} ${worker.last_name || ""}`.trim() ||
    "Unknown";
  const designation = worker.designation?.name || "—";
  const experience = worker.experience || "0";
  // const location = worker.work_location || "—";
  const workerCity = worker?.personal_detail?.current_city || "";
  const workerState = worker?.personal_detail?.current_state || "";
  const photo = worker.photo;
  const workerCode = worker.worker_code || "—";
  const handleSignInClick = () => {
    if (isSignedInOtherCompany) {
      Swal.fire({
        icon: "warning",
        title: "Worker Already Signed In",
        text: `This worker is already signed in at ${companyName} as a ${designationName} and cannot be signed in here.`,
      });

      return;
    }

    const schedule = vacancy?.schedules?.[0];
    let canSignIn = true;
    let vacancyStartText = "";

    // Case 1: start_date exists
    if (schedule?.start_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [year, month, day] = schedule.start_date.split("-");

      const startDate = new Date(Number(year), Number(month) - 1, Number(day));
      startDate.setHours(0, 0, 0, 0);

      vacancyStartText = `${Number(day)} ${startDate.toLocaleString("en-GB", {
        month: "long",
      })} ${year}`;

      canSignIn = today >= startDate;
    }

    // Case 2: dates array exists
    else if (schedule?.dates?.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Ignore timezone by taking only YYYY-MM-DD
      const dateString = schedule.dates[0].split("T")[0];
      const [year, month, day] = dateString.split("-");

      const firstDate = new Date(Number(year), Number(month) - 1, Number(day));
      firstDate.setHours(0, 0, 0, 0);

      vacancyStartText = `${Number(day)} ${firstDate.toLocaleString("en-GB", {
        month: "long",
      })} ${year}`;

      canSignIn = today >= firstDate;
    }

    // Case 3: weekly schedule
    else if (schedule?.weekdays?.length > 0) {
      const todayWeekday = new Date().getDay();

      canSignIn = schedule.weekdays.includes(todayWeekday);

      const weekdayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      vacancyStartText = schedule.weekdays
        .map((day) => weekdayNames[day])
        .join(", ");
    }

    if (!canSignIn) {
      Swal.fire({
        icon: "error",
        title: "Vacancy Not Started",
        text: schedule?.weekdays?.length
          ? `You cannot sign in this worker because this vacancy is available only on ${vacancyStartText}.`
          : `You cannot sign in this worker because the vacancy will start on ${vacancyStartText}.`,
        confirmButtonText: "OK",
      });
      return;
    }
    setModalType("signin");
    setTimeInput(new Date().toTimeString().slice(0, 5));
    setShowModal(true);
  };

  const handleSignOutClick = () => {
    setModalType("signout");
    setTimeInput(new Date().toTimeString().slice(0, 5));
    if (!isTimeBased && !isProductionDataValid) {
      Swal.fire({
        icon: "error",
        title: "Incomplete Vacancy Data",
        text: `This production vacancy is missing unit (${vacancy.rate_type || "null"}) or rate per unit (${vacancy.rate_per_unit || "null"}). Please update the vacancy details.`,
      });
      return;
    }
    setShowModal(true);
  };

  const handleModalSubmit = () => {
    if (!timeInput) {
      Swal.fire({
        icon: "warning",
        title: "Missing Time",
        text: "Please select a time.",
      });
      return;
    }

    // Prevent future time
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes(),
    ).padStart(2, "0")}`;

    if (timeInput > currentTime) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Time",
        text: "Future time is not allowed.",
      });
      return;
    }

    if (modalType === "signout") {
      if (!isTimeBased) {
        if (!quantityInput || isNaN(quantityInput)) {
          Swal.fire({
            icon: "warning",
            title: "Invalid Quantity",
            text: "Please enter a valid number.",
          });
          return;
        }

        onSignOut(parseFloat(quantityInput), timeInput);
      } else {
        onSignOut(0, timeInput);
      }
    } else {
      onSignIn(timeInput);
    }

    setQuantityInput("");
    setTimeInput("");
    setShowModal(false);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                {photo ? (
                  <img
                    src={photo}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{fullName.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>

            {/* Main Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {fullName}
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {workerCode}
                </span>
                {attendanceDisplay && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {attendanceDisplay}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-2">
                <span className="flex items-center gap-1">
                  <Briefcase size={14} className="text-gray-400" />{" "}
                  {designation}
                </span>
                <span className="flex items-center gap-1">
                  <Award size={14} className="text-gray-400" /> Exp:{" "}
                  {experience} yrs
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={14} className="text-gray-400" />
                  {workerCity && workerState
                    ? `${workerCity}, ${workerState}`
                    : workerCity || workerState || "—"}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-2">
                <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                  <Clock size={12} /> Rate:{" "}
                  {isTimeBased
                    ? rateType === "salary"
                      ? "Salary"
                      : rateType === "daily"
                        ? "Daily"
                        : "Hourly"
                    : "Piece Rate"}
                </span>
                {rateType !== "salary" && (
                  <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                    <Clock size={12} /> {ratePerUnit} / {unit}
                  </span>
                )}
                <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                  <Clock size={12} /> Shift: {shiftStart} - {shiftEnd}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:flex-col sm:w-36">
              {showSignInAbsent && (
                <>
                  <button
                    title={
                      isSignedInOtherCompany
                        ? "Already signed in another company"
                        : ""
                    }
                    onClick={handleSignInClick}
                    disabled={isMarking}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                  >
                    <LogIn size={16} />
                    IN
                  </button>
                </>
              )}
              {showSignOutOnly && (
                <button
                  onClick={handleSignOutClick}
                  disabled={isMarking}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200"
                >
                  <LogOut size={16} /> OUT
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView();
                }}
                className="flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                <Eye size={16} /> View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Action Modal (Time & Quantity) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {modalType === "signin" ? "Mark IN Time" : "Mark OUT Time"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Time
                </label>
                <div className="relative">
                  <Clock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="time"
                    value={timeInput}
                    max={new Date().toTimeString().slice(0, 5)}
                    onChange={(e) => setTimeInput(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {modalType === "signout" && !isTimeBased && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity ({unit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder={`e.g., 100 ${unit}`}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Rate: {ratePerUnit} per {unit}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirm {modalType === "signin" ? "IN" : "OUT"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminCompanyAllWorkers;
