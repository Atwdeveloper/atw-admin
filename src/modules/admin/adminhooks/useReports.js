"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import * as reportsApi from "../../../api/admin/adminReportsAPI";
import * as XLSX from "xlsx";
export const useReports = (options = {}) => {
  const { autoFetch = false, initialFilters = {} } = options;

  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [filters, setFilters] = useState({
    company: "",
    designation: "",
    industry: "",
    startDate: "",
    endDate: "",
    state: "",
    district: "",
    city: "",
    worker: "",
    registrationType: "",
    workType: "",
    ...initialFilters,
  });
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [dropdownOptions, setDropdownOptions] = useState({
    companies: [],
    designations: [], // used by worker/other reports
    designationsByCompany: [], // used by earnings report (ID 2)
    states: [],
    districts: [],
    industries: [],
    cities: [],
    workers: [],
  });

  // ----- Fetch report data -----
  const fetchReportData = useCallback(
    async (reportId, customFilters = null, pageNo = page) => {
      try {
        setLoading(true);
        const currentFilters = customFilters || filters;
        const params = {
          page: pageNo,
          limit: 15,
        };

        if (reportId === 1) {
          if (currentFilters.company)
            params.company_id = currentFilters.company;
          if (currentFilters.industry)
            params.industry_id = currentFilters.industry;
          if (currentFilters.startDate)
            params.start_date = currentFilters.startDate;
          if (currentFilters.endDate) params.end_date = currentFilters.endDate;
        } else if (reportId === 2) {
          if (currentFilters.company)
            params.company_id = currentFilters.company;
          if (currentFilters.designation)
            params.designation_id = currentFilters.designation;
          if (currentFilters.state) params.state_id = currentFilters.state;

          if (currentFilters.city) params.city_id = currentFilters.city;

          if (currentFilters.industry)
            params.industry_id = currentFilters.industry;
        } else if (reportId === 4) {
          if (currentFilters.state) params.state_id = currentFilters.state;
          if (currentFilters.city) params.city_id = currentFilters.city;
          if (currentFilters.industry)
            params.industry_id = currentFilters.industry;
          if (currentFilters.designation)
            params.designation_id = currentFilters.designation;
          if (currentFilters.worker) params.worker_id = currentFilters.worker;
          if (currentFilters.startDate)
            params.start_date = currentFilters.startDate;
          if (currentFilters.endDate) params.end_date = currentFilters.endDate;
        } else if (reportId === 5) {
          if (currentFilters.state) params.state_id = currentFilters.state;
          if (currentFilters.city) params.city_id = currentFilters.city;
          if (currentFilters.startDate)
            params.start_date = currentFilters.startDate;
          if (currentFilters.endDate) params.end_date = currentFilters.endDate;
        } else if (reportId === 7) {
          if (currentFilters.startDate) params.date = currentFilters.startDate;
        } else {
          Object.keys(currentFilters).forEach((key) => {
            if (currentFilters[key] !== "" && currentFilters[key] != null) {
              params[key] = currentFilters[key];
            }
          });
        }

        let response;
        switch (reportId) {
          case 1:
            response = await reportsApi.getJobVacancyReport(params);
            break;
          case 2:
            response = await reportsApi.getEarningsByDesignationReport(params);
            break;
          case 3:
            response = await reportsApi.getJobReports(params);
            break;
          case 4:
            response = await reportsApi.getWorkerRegistrationReport(params);
            break;
          case 5:
            response = await reportsApi.getCompanyRegistrationReport(params);
            break;
          case 6:
            response = await reportsApi.getTurnoverReport(params);
            break;
          case 7:
            response =
              await reportsApi.getWorkerWalletTransactionsReport(params);
            break;
          default:
            throw new Error("Invalid report type");
        }

        if (response.success) {
          setPreviewData(response.data?.data || response.data || []);
          setTotalItems(response.data?.total || response.total || 0);
          setTotalPages(response.data?.last_page || response.total_pages || 1);
          toast.success("Report data loaded successfully");
        } else {
          throw new Error(response.message || "Failed to fetch report data");
        }
      } catch (error) {
        console.error("Error fetching report data:", error);
        toast.error(
          error.response?.data?.message || "Failed to load report data",
        );
        setPreviewData([]);
      } finally {
        setLoading(false);
      }
    },
    [filters, page],
  );

  // ----- Download report -----
  const downloadReport = useCallback(
    async (reportId, customFilters = null) => {
      try {
        setDownloading(true);
        const currentFilters = customFilters || filters;
        // const params = {};
        const params = {
          // page: 1,
          // limit: 1000,
        };

        if (reportId === 1) {
          if (currentFilters.company)
            params.company_id = currentFilters.company;
          if (currentFilters.industry)
            params.industry_id = currentFilters.industry;
          if (currentFilters.startDate)
            params.start_date = currentFilters.startDate;
          if (currentFilters.endDate) params.end_date = currentFilters.endDate;
        } else if (reportId === 2) {
          if (currentFilters.company)
            params.company_id = currentFilters.company;
          if (currentFilters.designation)
            params.designation_id = currentFilters.designation;
        } else if (reportId === 4) {
          if (currentFilters.state) params.state_id = currentFilters.state;
          if (currentFilters.city) params.city_id = currentFilters.city;
          if (currentFilters.industry)
            params.industry_id = currentFilters.industry;
          if (currentFilters.designation)
            params.designation_id = currentFilters.designation;
          if (currentFilters.worker) params.worker_id = currentFilters.worker;
          if (currentFilters.startDate)
            params.start_date = currentFilters.startDate;
          if (currentFilters.endDate) params.end_date = currentFilters.endDate;
        } else if (reportId === 5) {
          if (currentFilters.state) params.state_id = currentFilters.state;
          if (currentFilters.city) params.city_id = currentFilters.city;
          if (currentFilters.startDate)
            params.start_date = currentFilters.startDate;
          if (currentFilters.endDate) params.end_date = currentFilters.endDate;
        } else {
          Object.keys(currentFilters).forEach((key) => {
            if (currentFilters[key] !== "" && currentFilters[key] != null) {
              params[key] = currentFilters[key];
            }
          });
        }

        let response, fileName;
        switch (reportId) {
          case 1:
            response = await reportsApi.downloadJobVacancyReport(params);
            fileName = `job_vacancy_report_${Date.now()}.xlsx`;
            break;
          case 2:
            response =
              await reportsApi.downloadEarningsByDesignationReport(params);
            fileName = `earnings_by_designation_report_${Date.now()}.xlsx`;
            break;
          case 3:
            response = await reportsApi.downloadJobReports(params);
            fileName = `job_reports_${Date.now()}.xlsx`;
            break;
          case 4:
            response =
              await reportsApi.downloadWorkerRegistrationReport(params);
            fileName = `worker_registration_report_${Date.now()}.xlsx`;
            break;
          case 5:
            response =
              await reportsApi.downloadCompanyRegistrationReport(params);
            fileName = `company_registration_report_${Date.now()}.xlsx`;
            break;
          case 6:
            response = await reportsApi.downloadTurnoverReport(params);
            fileName = `turnover_report_${Date.now()}.xlsx`;
            break;
          default:
            throw new Error("Invalid report type");
        }

        // const url = window.URL.createObjectURL(new Blob([response.data]));
        // const link = document.createElement("a");
        // link.href = url;
        // link.setAttribute("download", fileName);
        // document.body.appendChild(link);
        // link.click();
        // link.remove();
        // window.URL.revokeObjectURL(url);
        const reportData =
          response?.data?.data?.data || response?.data?.data || [];

        const worksheet = XLSX.utils.json_to_sheet(reportData);

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

        XLSX.writeFile(workbook, fileName);
        toast.success("Report downloaded successfully");
      } catch (error) {
        console.error("Error downloading report:", error);
        toast.error(
          error.response?.data?.message || "Failed to download report",
        );
      } finally {
        setDownloading(false);
      }
    },
    [filters],
  );

  const handleSearch = (reportId, pageNo = page) =>
    fetchReportData(reportId, null, pageNo);

  const handleClear = () => {
    const resetFilters = {
      company: "",
      designation: "",
      industry: "",
      startDate: "",
      endDate: "",
      state: "",
      district: "",
      city: "",
      worker: "",
      registrationType: "",
      workType: "",
    };

    setFilters(resetFilters);
    setPreviewData([]);
    setPage(1);

    return resetFilters;
  };

  // const handleFilterChange = (key, value) => {
  //   setFilters((prev) => {
  //     const newFilters = { ...prev, [key]: value };
  //     if (key === "state") {
  //       newFilters.city = "";
  //       newFilters.district = "";
  //     }
  //     if (key === "industry") {
  //       newFilters.designation = ""; // for worker report
  //     }
  //     if (key === "company") {
  //       newFilters.designation = ""; // for earnings report
  //     }
  //     return newFilters;
  //   });
  // };
  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };

      // State change → city, industry, company, designation reset
      if (key === "state" || key === "state_id") {
        // newFilters.city = "";
        newFilters.city_id = "";

        newFilters.industry = "";
        newFilters.industry_id = "";

        newFilters.company = "";
        newFilters.designation = "";
      }

      // City change → industry, company, designation reset
      if (key === "city" || key === "city_id") {
        newFilters.industry = "";
        newFilters.industry_id = "";

        newFilters.company = "";
        newFilters.designation = "";
      }

      // Industry change → company, designation reset
      if (key === "industry" || key === "industry_id") {
        newFilters.company = "";
        newFilters.designation = "";
      }

      // Company change → designation reset
      if (key === "company" || key === "company_id") {
        newFilters.designation = "";
      }

      return newFilters;
    });
  };
  // ----- Dropdown fetching -----
  const fetchDropdownOptions = useCallback(async () => {
    // Companies
    try {
      const companiesRes = await reportsApi.getCompaniesDropdown();
      if (companiesRes?.success && Array.isArray(companiesRes.data)) {
        const companies = companiesRes.data.map((item) => ({
          id: item.id,
          name: item.company_name,
        }));
        setDropdownOptions((prev) => ({ ...prev, companies }));
      }
    } catch (error) {
      console.error("Failed to load companies:", error);
    }

    // Industries
    try {
      const industriesRes = await reportsApi.getIndustriesAPI();
      const industriesData = industriesRes?.data;
      if (
        industriesData?.status === 200 &&
        Array.isArray(industriesData.data)
      ) {
        const industries = industriesData.data.map((item) => ({
          id: item.id,
          name: item.name,
        }));
        setDropdownOptions((prev) => ({ ...prev, industries }));
      }
    } catch (error) {
      console.error("Failed to load industries:", error);
    }

    // States
    try {
      const statesRes = await reportsApi.getStatesAPI();
      const statesData = statesRes?.data;
      if (statesData?.status === 200 && Array.isArray(statesData.data)) {
        const states = statesData.data.map((item) => ({
          id: item.id,
          name: item.name,
        }));
        setDropdownOptions((prev) => ({ ...prev, states }));
      }
    } catch (error) {
      console.error("Failed to load states:", error);
    }

    // Workers
    try {
      const workersRes = await reportsApi.getWorkersDropdown();
      const workersData = workersRes?.data;
      if (workersData?.status === 200 && Array.isArray(workersData.data)) {
        setDropdownOptions((prev) => ({ ...prev, workers: workersData.data }));
      } else if (Array.isArray(workersData)) {
        setDropdownOptions((prev) => ({ ...prev, workers: workersData }));
      }
    } catch (error) {
      console.error("Failed to load workers:", error);
    }
  }, []);

  // Fetch designations by industry (for worker report)
  const fetchDesignationsByIndustry = useCallback(async (industryId) => {
    try {
      if (!industryId) {
        setDropdownOptions((prev) => ({ ...prev, designations: [] }));
        return;
      }
      const response =
        await reportsApi.getDesignationsByIndustryAPI(industryId);
      const list = response?.data?.data?.data || response?.data?.data || [];
      if (Array.isArray(list)) {
        const formatted = list.map((item) => ({
          id: item.id,
          name: item.name,
        }));
        setDropdownOptions((prev) => ({ ...prev, designations: formatted }));
      }
    } catch (error) {
      console.error("Failed to load designations (by industry):", error);
      setDropdownOptions((prev) => ({ ...prev, designations: [] }));
    }
  }, []);

  // Fetch designations by company (for earnings report)
  const fetchDesignationsByCompany = useCallback(async (companyId) => {
    try {
      if (!companyId) {
        setDropdownOptions((prev) => ({ ...prev, designationsByCompany: [] }));
        return;
      }
      const response =
        await reportsApi.getDesignationsByCompanyDropdown(companyId);
      const list = response?.data?.data || response?.data || [];
      if (Array.isArray(list)) {
        const formatted = list.map((item) => ({
          id: item.id,
          name: item.name,
        }));
        setDropdownOptions((prev) => ({
          ...prev,
          designationsByCompany: formatted,
        }));
      }
    } catch (error) {
      console.error("Failed to load designations (by company):", error);
      setDropdownOptions((prev) => ({ ...prev, designationsByCompany: [] }));
    }
  }, []);

  const fetchCities = useCallback(async (stateId) => {
    try {
      if (!stateId) {
        setDropdownOptions((prev) => ({ ...prev, cities: [] }));
        return;
      }
      const citiesRes = await reportsApi.getCitiesByStateAPI(stateId);
      const citiesData = citiesRes?.data;
      if (citiesData?.status === 200 && Array.isArray(citiesData.data)) {
        setDropdownOptions((prev) => ({ ...prev, cities: citiesData.data }));
      }
    } catch (error) {
      console.error("Failed to load cities:", error);
      setDropdownOptions((prev) => ({ ...prev, cities: [] }));
    }
  }, []);

  const fetchDistricts = useCallback(async (stateId) => {
    try {
      if (!stateId) {
        setDropdownOptions((prev) => ({ ...prev, districts: [] }));
        return;
      }
      const districtsRes = await reportsApi.getReportDistricts(stateId);
      if (districtsRes?.success && Array.isArray(districtsRes.data)) {
        setDropdownOptions((prev) => ({
          ...prev,
          districts: districtsRes.data,
        }));
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
      setDropdownOptions((prev) => ({ ...prev, districts: [] }));
    }
  }, []);

  const fetchCompaniesByIndustry = useCallback(
    async (industryId) => {
      try {
        if (!industryId) {
          setDropdownOptions((prev) => ({ ...prev, companiesByIndustry: [] }));
          return;
        }

        // state_id, city_id, industry_id teeno pass karo
        const params = {
          industry_id: industryId,
          ...(filters.state && { state_id: filters.state }),
          ...(filters.city && { city_id: filters.city }),
        };

        const response = await reportsApi.getCompaniesByIndustryAPI(params);
        const list = response?.data?.data || response?.data || [];

        if (Array.isArray(list)) {
          const formatted = list.map((item) => ({
            id: item.id,
            name: item.company_name || item.name,
          }));
          setDropdownOptions((prev) => ({
            ...prev,
            companiesByIndustry: formatted,
          }));
        }
      } catch (error) {
        console.error("Failed to load companies by industry:", error);
        setDropdownOptions((prev) => ({ ...prev, companiesByIndustry: [] }));
      }
    },
    [filters.state, filters.city],
  );
  useEffect(() => {
    if (filters.industry) {
      fetchCompaniesByIndustry(filters.industry);
    } else {
      setDropdownOptions((prev) => ({ ...prev, companiesByIndustry: [] }));
    }
  }, [filters.industry, filters.state, filters.city]);

  useEffect(() => {
    if (autoFetch) fetchDropdownOptions();
  }, [autoFetch, fetchDropdownOptions]);

  // Fetch designations by industry (worker report)
  useEffect(() => {
    fetchDesignationsByIndustry(filters.industry);
  }, [filters.industry, fetchDesignationsByIndustry]);

  // Fetch designations by company (earnings report)
  useEffect(() => {
    fetchDesignationsByCompany(filters.company);
  }, [filters.company, fetchDesignationsByCompany]);

  // Fetch cities
  useEffect(() => {
    fetchCities(filters.state);
  }, [filters.state, fetchCities]);

  // Fetch districts
  useEffect(() => {
    fetchDistricts(filters.state);
  }, [filters.state, fetchDistricts]);

  return {
    previewData,
    loading,
    downloading,
    page,
    totalItems,
    totalPages,
    filters,
    dropdownOptions,
    setPage,
    setFilters,
    handleSearch,
    handleClear,
    fetchReportData,
    handleFilterChange,
    downloadReport,
    fetchDropdownOptions,
    fetchCompaniesByIndustry,
  };
};
