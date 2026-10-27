"use client";

import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

// A <th> whose label is a clickable button that cycles asc -> desc ->
// unsorted, for use with the useSortableData hook. Matches the sort UI/UX
// used in CompanyListing.jsx exactly (same icons, same 3-state toggle).
// Pass `accessor` for fields that aren't a plain top-level property
// (e.g. row.state?.name).
const SortableHeader = ({
  label,
  sortKey,
  accessor,
  sortConfig,
  onSort,
  className = "",
}) => {
  const isActive = sortConfig?.key === sortKey;

  return (
    <th
      className={`px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey, accessor)}
        className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
      >
        {label}
        {isActive ? (
          sortConfig.direction === "asc" ? (
            <ArrowUp size={14} />
          ) : (
            <ArrowDown size={14} />
          )
        ) : (
          <ArrowUpDown size={14} className="text-gray-400" />
        )}
      </button>
    </th>
  );
};

export default SortableHeader;
