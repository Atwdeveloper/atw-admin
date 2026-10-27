"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronRight, Check } from "lucide-react";

// Generic checkbox multi-select dropdown: options = [{ id, name }]
const MultiSelectDropdown = ({
  options = [],
  selectedIds = [],
  onChange,
  placeholder = "Select options",
  error = false,
  showSelectAll = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const allSelected =
    options.length > 0 && options.every((option) => selectedIds.includes(option.id));

  const toggleSelectAll = () => {
    onChange(allSelected ? [] : options.map((option) => option.id));
  };

  const selectedNames = allSelected
    ? ["All selected"]
    : options
        .filter((option) => selectedIds.includes(option.id))
        .map((option) => option.name);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      >
        <span
          className={`truncate ${selectedNames.length ? "text-gray-900" : "text-gray-400"}`}
        >
          {selectedNames.length ? selectedNames.join(", ") : placeholder}
        </span>
        <ChevronRight
          className={`w-4 h-4 flex-shrink-0 ml-2 stroke-[3px] transition-transform ${
            isOpen ? "rotate-90" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              No options available
            </div>
          ) : (
            <>
              {showSelectAll && (
                <div
                  onClick={toggleSelectAll}
                  className="flex items-center justify-between px-4 py-2 cursor-pointer text-sm font-medium hover:bg-gray-100 border-b border-gray-100"
                >
                  <span className="text-gray-700">Select All</span>
                  <span
                    className={`w-4 h-4 flex items-center justify-center rounded border ${
                      allSelected
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {allSelected && <Check className="w-3 h-3 text-white" />}
                  </span>
                </div>
              )}
              {options.map((option) => {
                const checked = selectedIds.includes(option.id);
                return (
                  <div
                    key={option.id}
                    onClick={() => toggleOption(option.id)}
                    className="flex items-center justify-between px-4 py-2 cursor-pointer text-sm hover:bg-gray-100"
                  >
                    <span className="text-gray-700">{option.name}</span>
                    <span
                      className={`w-4 h-4 flex items-center justify-center rounded border ${
                        checked
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300"
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
