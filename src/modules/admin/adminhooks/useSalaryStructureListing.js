"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getSalaryStructuresAPI,
  deleteSalaryStructureAPI,
} from "../../../api/admin/adminSalaryStructureAPI";
import Swal from "sweetalert2";

export const useSalaryStructureListing = () => {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);
  const [filters, setFilters] = useState({
    search: "",
  });

  const fetchStructures = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        ...(filters.search && { search: filters.search }),
      };
      const response = await getSalaryStructuresAPI(params);
      if (response && response.status !== 200) {
        throw new Error(
          response.message || "Could not load salary structures.",
        );
      }
      const allData = response?.data || [];

      // Client-side pagination (if API doesn't return paginated meta)
      const startIndex = (page - 1) * perPage;
      const paginatedData = allData.slice(startIndex, startIndex + perPage);

      setStructures(paginatedData);
      setTotalPages(Math.ceil(allData.length / perPage) || 1);
    } catch (error) {
      console.error("Failed to fetch salary structures:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Could not load salary structures. Please try again.",
      });
      setStructures([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, filters.search]);

  useEffect(() => {
    fetchStructures();
  }, [fetchStructures]);

  const handleClear = () => {
    setFilters({ search: "" });
    setPage(1);
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: "Delete Salary Structure?",
      html: `Are you sure you want to delete <strong>${name}</strong>?<br>This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it",
    });

    if (result.isConfirmed) {
      try {
        const res = await deleteSalaryStructureAPI(id);
        if (res && res.status !== 200) {
          throw new Error(res.message || "Could not delete salary structure.");
        }
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Salary structure has been deleted successfully.",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchStructures();
      } catch (error) {
        console.error("Delete failed:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            error.response?.data?.message ||
            error.message ||
            "Could not delete salary structure.",
        });
      }
    }
  };

  return {
    structures,
    loading,
    page,
    setPage,
    totalPages,
    filters,
    setFilters,
    handleClear,
    handleDelete,
    fetchStructures,
  };
};
