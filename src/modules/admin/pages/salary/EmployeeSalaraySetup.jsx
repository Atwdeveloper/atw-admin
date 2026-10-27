"use client";

// modules/admin/pages/EmployeeSalarySetup.jsx
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/navigation";
import {
  ArrowLeft,
  Save,
  Search,
  User,
  IndianRupee,
  Percent,
  Eye,
  Building,
  Briefcase,
  MapPin,
  Calendar,
  AlertCircle,
  Hash,
} from "lucide-react";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";

const EmployeeSalarySetup = () => {
  const navigate = useNavigate();

  // Mock employee data
  const [employees, setEmployees] = useState([
    {
      id: 1,
      employee_code: "WK-0042",
      name: "Rajesh Kumar",
      department: "Construction",
      designation: "Site Supervisor",
      work_type: "monthly_salary",
      current_ctc: 25000,
      current_basic: 12500,
      current_hra: 6250,
      current_conveyance: 1600,
      location: "Delhi",
      status: "active",
    },
    {
      id: 2,
      employee_code: "WK-0043",
      name: "Mohan Singh",
      department: "Logistics",
      designation: "Driver",
      work_type: "daily_wage",
      current_ctc: 0,
      current_basic: 0,
      current_hra: 0,
      current_conveyance: 800,
      location: "Mumbai",
      status: "active",
    },
    {
      id: 3,
      employee_code: "WK-0044",
      name: "Priya Sharma",
      department: "Admin",
      designation: "Office Assistant",
      work_type: "monthly_salary",
      current_ctc: 18000,
      current_basic: 9000,
      current_hra: 4500,
      current_conveyance: 1600,
      location: "Bangalore",
      status: "active",
    },
  ]);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    department: "",
    work_type: "",
    location: "",
  });

  // Default salary rules (from config)
  const defaultRules = {
    basic_percent: 50,
    hra_percent: 50,
    conveyance_amount: 1600,
    bonus_percent: 8.33,
    pf_employer_percent: 12,
    pf_admin_percent: 0.5,
    esi_employer_percent: 3.25,
    pf_wage_cap: 15000,
    esi_wage_limit: 21000,
  };

  const [salaryData, setSalaryData] = useState({
    ctc: "",
    effective_from: new Date().toISOString().split("T")[0],
    basic_percent: defaultRules.basic_percent,
    hra_percent: defaultRules.hra_percent,
    conveyance_amount: defaultRules.conveyance_amount,
    bonus_percent: defaultRules.bonus_percent,
    pf_applicable: true,
    esi_applicable: true,
    min_wage: 12000,
    da_amount: 0,
    work_type: "monthly_salary",
  });

  const [calculations, setCalculations] = useState({
    basic: 0,
    hra: 0,
    conveyance: 0,
    bonus: 0,
    gross: 0,
    employer_pf: 0,
    employer_pf_admin: 0,
    employer_esi: 0,
    total_cost: 0,
  });

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    if (
      filters.search &&
      !emp.name.toLowerCase().includes(filters.search.toLowerCase()) &&
      !emp.employee_code.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }
    if (filters.department && emp.department !== filters.department)
      return false;
    if (filters.work_type && emp.work_type !== filters.work_type) return false;
    if (filters.location && emp.location !== filters.location) return false;
    return true;
  });

  // Calculate salary components when salary data changes
  useEffect(() => {
    if (!salaryData.ctc) return;

    const ctc = parseFloat(salaryData.ctc) || 0;
    const basic = ctc * (salaryData.basic_percent / 100);
    const hra = basic * (salaryData.hra_percent / 100);
    const conveyance = parseFloat(salaryData.conveyance_amount) || 0;

    // Bonus calculation (8.33% of min wage or basic+DA, whichever higher)
    const minWage = parseFloat(salaryData.min_wage) || 0;
    const basicPlusDA = basic + (parseFloat(salaryData.da_amount) || 0);
    const bonusBase = Math.max(minWage, basicPlusDA);
    const bonus = bonusBase * (salaryData.bonus_percent / 100);

    const gross = basic + hra + conveyance + bonus;

    // PF calculations
    const pfWage = Math.min(basic, defaultRules.pf_wage_cap);
    const employerPF = salaryData.pf_applicable
      ? pfWage * (defaultRules.pf_employer_percent / 100)
      : 0;
    const employerPFAdmin = salaryData.pf_applicable
      ? pfWage * (defaultRules.pf_admin_percent / 100)
      : 0;

    // ESI calculations
    const esiWage = Math.min(gross, defaultRules.esi_wage_limit);
    const employerESI =
      salaryData.esi_applicable && gross <= defaultRules.esi_wage_limit
        ? esiWage * (defaultRules.esi_employer_percent / 100)
        : 0;

    const totalCost = gross + employerPF + employerPFAdmin + employerESI;

    setCalculations({
      basic,
      hra,
      conveyance,
      bonus,
      gross,
      employer_pf: employerPF,
      employer_pf_admin: employerPFAdmin,
      employer_esi: employerESI,
      total_cost: totalCost,
    });
  }, [salaryData, defaultRules]);

  // Handle employee selection
  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);

    // Populate form with existing data
    setSalaryData({
      ctc: employee.current_ctc || "",
      effective_from: new Date().toISOString().split("T")[0],
      basic_percent: defaultRules.basic_percent,
      hra_percent: defaultRules.hra_percent,
      conveyance_amount:
        employee.current_conveyance || defaultRules.conveyance_amount,
      bonus_percent: defaultRules.bonus_percent,
      pf_applicable: true,
      esi_applicable: employee.current_ctc <= defaultRules.esi_wage_limit,
      min_wage: 12000,
      da_amount: 0,
      work_type: employee.work_type,
    });
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSalaryData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle save
  const handleSave = () => {
    alert("Salary configuration saved successfully!");
  };

  // Handle preview
  const handlePreview = () => {};

  return (
    <motion.div
      className="flex-1 bg-gray-50 p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* HEADER */}
      <motion.div
        className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-gray-200 mb-8"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => navigate("/admin/salary")}
              className="w-10 h-10 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 hover:bg-white/80 transition"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Employee Salary Setup
              </h1>
              <p className="text-gray-600 mt-1">
                Configure salary for individual employees
              </p>
            </div>
          </div>

          <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Employee List */}
        <motion.div
          className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          variants={itemVariants}
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Select Employee
            </h3>

            {/* Search and Filters */}
            <div className="space-y-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or code..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={filters.department}
                  onChange={(e) =>
                    setFilters({ ...filters, department: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Departments</option>
                  <option value="Construction">Construction</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Admin">Admin</option>
                </select>

                <select
                  value={filters.work_type}
                  onChange={(e) =>
                    setFilters({ ...filters, work_type: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Work Types</option>
                  <option value="monthly_salary">Monthly Salary</option>
                  <option value="daily_wage">Daily Wage</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
            </div>

            {/* Employee List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  onClick={() => handleSelectEmployee(employee)}
                  className={`p-4 rounded-lg border cursor-pointer transition ${
                    selectedEmployee?.id === employee.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedEmployee?.id === employee.id
                          ? "bg-blue-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <User
                        className={`w-5 h-5 ${
                          selectedEmployee?.id === employee.id
                            ? "text-blue-600"
                            : "text-gray-600"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {employee.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {employee.employee_code}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {employee.department}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded capitalize">
                          {employee.work_type.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    {employee.current_ctc > 0 && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{employee.current_ctc.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">Current CTC</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* RIGHT: Salary Configuration Form */}
        <motion.div className="lg:col-span-2 space-y-6" variants={itemVariants}>
          {selectedEmployee ? (
            <>
              {/* Employee Info Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {selectedEmployee.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {selectedEmployee.employee_code}
                        </span>
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {selectedEmployee.department}
                        </span>
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {selectedEmployee.designation}
                        </span>
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {selectedEmployee.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedEmployee.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedEmployee.status.charAt(0).toUpperCase() +
                      selectedEmployee.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Salary Configuration Form */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">
                  Salary Configuration
                </h3>

                <div className="space-y-6">
                  {/* CTC and Work Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CTC (Cost to Company){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          name="ctc"
                          value={salaryData.ctc}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter CTC amount"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Work Type
                      </label>
                      <select
                        name="work_type"
                        value={salaryData.work_type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="monthly_salary">Monthly Salary</option>
                        <option value="daily_wage">Daily Wage</option>
                        <option value="hourly">Hourly</option>
                      </select>
                    </div>
                  </div>

                  {/* Basic and HRA Percentages */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Basic % of CTC
                      </label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          name="basic_percent"
                          value={salaryData.basic_percent}
                          onChange={handleInputChange}
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        HRA % of Basic
                      </label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          name="hra_percent"
                          value={salaryData.hra_percent}
                          onChange={handleInputChange}
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Conveyance and Bonus */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Conveyance Allowance
                      </label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          name="conveyance_amount"
                          value={salaryData.conveyance_amount}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Statutory Bonus %
                      </label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          name="bonus_percent"
                          value={salaryData.bonus_percent}
                          onChange={handleInputChange}
                          min="8.33"
                          max="20"
                          step="0.01"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Minimum Wage and DA */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Wage (for bonus calculation)
                      </label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          name="min_wage"
                          value={salaryData.min_wage}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dearness Allowance (DA)
                      </label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          name="da_amount"
                          value={salaryData.da_amount}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Statutory Applicability */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Statutory Applicability
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="pf_applicable"
                          name="pf_applicable"
                          checked={salaryData.pf_applicable}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor="pf_applicable"
                          className="ml-2 text-sm text-gray-700"
                        >
                          PF Applicable
                        </label>
                        <span className="ml-2 text-xs text-gray-500">
                          (Basic ≤ ₹15,000)
                        </span>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="esi_applicable"
                          name="esi_applicable"
                          checked={salaryData.esi_applicable}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor="esi_applicable"
                          className="ml-2 text-sm text-gray-700"
                        >
                          ESI Applicable
                        </label>
                        <span className="ml-2 text-xs text-gray-500">
                          (Gross ≤ ₹21,000)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Effective Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Effective From Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        name="effective_from"
                        value={salaryData.effective_from}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Salary Preview */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Salary Preview
                  </h3>
                  <button
                    onClick={handlePreview}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                  >
                    <Eye className="w-4 h-4" />
                    Preview Payslip
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Earnings */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Earnings
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Basic Salary</span>
                        <span className="font-medium">
                          ₹
                          {calculations.basic.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          House Rent Allowance (HRA)
                        </span>
                        <span className="font-medium">
                          ₹
                          {calculations.hra.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          Conveyance Allowance
                        </span>
                        <span className="font-medium">
                          ₹
                          {calculations.conveyance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Statutory Bonus</span>
                        <span className="font-medium">
                          ₹
                          {calculations.bonus.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center font-bold text-lg">
                          <span className="text-gray-800">Gross Salary</span>
                          <span className="text-blue-700">
                            ₹
                            {calculations.gross.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Employer Contributions */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Employer Contributions
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          PF Contribution (12%)
                        </span>
                        <span className="font-medium">
                          ₹
                          {calculations.employer_pf.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          PF Admin Charges (0.5%)
                        </span>
                        <span className="font-medium">
                          ₹
                          {calculations.employer_pf_admin.toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          ESI Contribution (3.25%)
                        </span>
                        <span className="font-medium">
                          ₹
                          {calculations.employer_esi.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center font-bold text-lg">
                          <span className="text-gray-800">
                            Total Cost to Company
                          </span>
                          <span className="text-green-700">
                            ₹
                            {calculations.total_cost.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          CTC: ₹{salaryData.ctc || "0"} | Difference: ₹
                          {(
                            calculations.total_cost -
                            (parseFloat(salaryData.ctc) || 0)
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePreview}
                  className="px-6 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={handleSave}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Configuration
                </button>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Select an Employee
              </h3>
              <p className="text-gray-500 mb-6">
                Choose an employee from the list to configure their salary
              </p>
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">
                  Click on any employee card to begin
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EmployeeSalarySetup;
