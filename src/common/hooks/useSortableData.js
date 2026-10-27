"use client";

import { useState, useMemo, useCallback } from "react";

// Generic client-side sort for a table's currently-loaded page of rows,
// matching the sort behavior used in CompanyListing.jsx: clicking a column
// cycles asc -> desc -> unsorted. requestSort(key, accessor) — accessor
// optionally extracts the compare value from a row (e.g. r => r.state?.name)
// when the field isn't a plain top-level property or needs custom handling.
export const useSortableData = (items) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const sortedItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    if (!sortConfig.key) return items;

    const { key, direction, accessor } = sortConfig;
    const getValue = accessor || ((item) => item?.[key]);

    return [...items].sort((a, b) => {
      const aVal = getValue(a);
      const bVal = getValue(b);

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return direction === "asc" ? -1 : 1;
      if (aStr > bStr) return direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [items, sortConfig]);

  const requestSort = useCallback((key, accessor) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, accessor, direction: "asc" };
      if (prev.direction === "asc") return { key, accessor, direction: "desc" };
      return { key: null, accessor: undefined, direction: "asc" };
    });
  }, []);

  return { sortedItems, sortConfig, requestSort };
};
