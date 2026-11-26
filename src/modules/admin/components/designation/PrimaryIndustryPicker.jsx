"use client";

import { Star } from "lucide-react";

// Picks exactly one primary industry out of the industries selected for a
// designation. Renders nothing until at least one industry is selected.
const PrimaryIndustryPicker = ({ industries = [], selectedIds = [], primaryId, onChange, error }) => {
  const selected = selectedIds
    .map((id) => industries.find((i) => i.id === id))
    .filter(Boolean);
  if (selected.length === 0) return null;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Primary Industry <span className="text-red-500">*</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {selected.map((industry) => {
          const active = industry.id === primaryId;
          return (
            <button
              key={industry.id}
              type="button"
              onClick={() => onChange(industry.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                active
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${active ? "fill-current" : ""}`} />
              {industry.name}
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-xs text-gray-500">Only one industry can be primary.</p>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

// Keeps the primary valid after the selection changes: unchanged if it's still
// selected, otherwise the first selected industry (or "" when none).
export const nextPrimary = (primaryId, selectedIds) =>
  selectedIds.includes(primaryId) ? primaryId : selectedIds[0] || "";

export default PrimaryIndustryPicker;
