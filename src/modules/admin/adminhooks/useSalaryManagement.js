"use client";

// modules/admin/adminhooks/useSalaryManagement.js
import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { useDebounce } from "../../../common/hooks/useDebounce"

// Dummy data for salary configurations
const dummySalaryConfigs = [
  {
    id: 1,
    config_code: 'SAL-001',
    config_type: 'basic',
    config_name: 'Basic Salary Percentage',
    description: 'Basic salary as percentage of CTC',
    value: '50',
    min_value: '',
    max_value: '',
    effective_from: '2024-01-01',
    effective_to: null,
    status: 'active',
    is_editable: true,
    applies_to: 'all',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 2,
    config_code: 'SAL-002',
    config_type: 'hra',
    config_name: 'HRA Percentage',
    description: 'House Rent Allowance as percentage of Basic',
    value: '50',
    min_value: '',
    max_value: '',
    effective_from: '2024-01-01',
    effective_to: null,
    status: 'active',
    is_editable: true,
    applies_to: 'all',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 3,
    config_code: 'SAL-003',
    config_type: 'conveyance',
    config_name: 'Conveyance Allowance',
    description: 'Monthly conveyance allowance',
    value: '1600',
    min_value: '',
    max_value: '',
    effective_from: '2024-01-01',
    effective_to: null,
    status: 'active',
    is_editable: true,
    applies_to: 'all',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 4,
    config_code: 'SAL-004',
    config_type: 'bonus',
    config_name: 'Statutory Bonus',
    description: 'Percentage for statutory bonus calculation',
    value: '8.33',
    min_value: '8.33',
    max_value: '20',
    effective_from: '2024-01-01',
    effective_to: null,
    status: 'active',
    is_editable: true,
    applies_to: 'all',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 5,
    config_code: 'SAL-005',
    config_type: 'pf_employer',
    config_name: 'PF Employer Contribution',
    description: 'Employer PF contribution percentage',
    value: '12',
    min_value: '',
    max_value: '',
    effective_from: '2024-01-01',
    effective_to: null,
    status: 'active',
    is_editable: false,
    applies_to: 'all',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 6,
    config_code: 'SAL-006',
    config_type: 'esi_employer',
    config_name: 'ESI Employer Contribution',
    description: 'Employer ESI contribution percentage',
    value: '3.25',
    min_value: '',
    max_value: '',
    effective_from: '2024-01-01',
    effective_to: null,
    status: 'active',
    is_editable: false,
    applies_to: 'all',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 7,
    config_code: 'SAL-007',
    config_type: 'pf_wage_cap',
    config_name: 'PF Wage Cap',
    description: 'Maximum wage for PF calculation',
    value: '15000',
    min_value: '',
    max_value: '',
    effective_from: '2024-01-01',
    effective_to: null,
    status: 'active',
    is_editable: false,
    applies_to: 'all',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  },
  {
    id: 8,
    config_code: 'SAL-008',
    config_type: 'esi_wage_limit',
    config_name: 'ESI Wage Limit',
    description: 'Maximum wage for ESI eligibility',
    value: '21000',
    min_value: '',
    max_value: '',
    effective_from: '2024-01-01',
    effective_to: null,
    status: 'active',
    is_editable: false,
    applies_to: 'all',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  }
];

export const useSalaryManagement = (options = { autoFetch: true }) => {
  const [salaryConfigs, setSalaryConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    config_type: '',
    config_name: '',
    status: ''
  });

  const debouncedFilters = useDebounce(filters, 500);

  const fetchSalaryConfigs = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter dummy data based on filters
      let filteredConfigs = [...dummySalaryConfigs];
      
      if (debouncedFilters.config_type) {
        filteredConfigs = filteredConfigs.filter(config => 
          config.config_type === debouncedFilters.config_type
        );
      }
      
      if (debouncedFilters.config_name) {
        filteredConfigs = filteredConfigs.filter(config => 
          config.config_name.toLowerCase().includes(debouncedFilters.config_name.toLowerCase())
        );
      }
      
      if (debouncedFilters.status) {
        filteredConfigs = filteredConfigs.filter(config => 
          config.status === debouncedFilters.status
        );
      }
      
      // Simulate pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedConfigs = filteredConfigs.slice(startIndex, endIndex);
      
      setSalaryConfigs(paginatedConfigs);
      setTotalPages(Math.ceil(filteredConfigs.length / limit));
      setTotalItems(filteredConfigs.length);
      
    } catch (error) {
      console.error('Error fetching salary configs:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch salary configurations. Please try again.',
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedFilters]);

  useEffect(() => {
    if (options.autoFetch) {
      fetchSalaryConfigs();
    }
  }, [fetchSalaryConfigs, options.autoFetch]);

  const handleSearch = () => {
    setPage(1);
  };

  const handleClear = () => {
    setFilters({
      config_type: '',
      config_name: '',
      status: ''
    });
    setPage(1);
  };

  const handleDeleteConfig = async (configId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This configuration will be deleted. This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove config from dummy data (in a real app, this would be an API call)
      const index = dummySalaryConfigs.findIndex(config => config.id === configId);
      if (index !== -1) {
        dummySalaryConfigs.splice(index, 1);
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'The configuration has been deleted successfully.',
        timer: 2000,
        showConfirmButton: false,
      });
      
      fetchSalaryConfigs();
      
    } catch (error) {
      console.error('Error deleting configuration:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete the configuration.',
        timer: 3000,
      });
    }
  };

  const handleAddConfig = async (configData) => {
    try {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create new config with dummy ID
      const newConfig = {
        id: dummySalaryConfigs.length + 1,
        config_code: `SAL-${(dummySalaryConfigs.length + 1).toString().padStart(3, '0')}`,
        ...configData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add to dummy data
      dummySalaryConfigs.unshift(newConfig);
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Configuration has been created successfully.',
        timer: 2000,
        showConfirmButton: false,
      });
      
      fetchSalaryConfigs();
      return { success: true };
    } catch (error) {
      console.error('Error adding configuration:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to create configuration.',
        timer: 3000,
      });
      
      return { 
        success: false, 
        error: 'Failed to create configuration.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const handleEditConfig = async (configId, configData) => {
    try {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update config in dummy data
      const index = dummySalaryConfigs.findIndex(config => config.id === configId);
      if (index !== -1) {
        dummySalaryConfigs[index] = { 
          ...dummySalaryConfigs[index], 
          ...configData,
          updated_at: new Date().toISOString()
        };
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Configuration has been updated successfully.',
        timer: 2000,
        showConfirmButton: false,
      });
      
      fetchSalaryConfigs();
      return { success: true };
    } catch (error) {
      console.error('Error editing configuration:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update configuration.',
        timer: 3000,
      });
      
      return { 
        success: false, 
        error: 'Failed to update configuration.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const getConfigByIdData = async (configId) => {
    try {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      const config = dummySalaryConfigs.find(config => config.id === parseInt(configId));
      return { data: config };
    } catch (error) {
      console.error('Error fetching configuration:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    salaryConfigs,
    loading,
    page,
    limit,
    totalPages,
    totalItems,
    filters,
    setPage,
    setLimit,
    setFilters,
    handleSearch,
    handleClear,
    handleDeleteConfig,
    handleAddConfig,
    handleEditConfig,
    getConfigByIdData,
    fetchSalaryConfigs
  };
};