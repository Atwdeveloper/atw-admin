"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle, ChevronRight, X } from "lucide-react";

// Filter-panel controls shared by the Worker listing and the Face Enroll page.

const TAG_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-purple-50 text-purple-700 border-purple-200",
  "bg-orange-50 text-orange-700 border-orange-200",
  "bg-pink-50 text-pink-700 border-pink-200",
  "bg-teal-50 text-teal-700 border-teal-200",
];

// Searchable multi-select used for every filter in the panel. Selected values
// show as removable tags underneath the input.
export const MultiFilter = ({ icon: Icon, placeholder, options, selected, onChange, width = "w-48" }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id]);
  const visible = options.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()));
  const label =
    selected.length === 0
      ? ""
      : selected.length === 1
        ? options.find((o) => o.id === selected[0])?.name || "1 selected"
        : `${selected.length} selected`;

  return (
    <div ref={ref} className={`relative ${width}`}>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          value={open ? search : label}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setSearch("");
            setOpen(true);
          }}
          className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder={placeholder}
        />
      </div>
      {open && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div
            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 text-sm text-blue-600 font-medium"
            onClick={() => onChange([])}
          >
            Clear selection
          </div>
          {visible.map((o) => {
            const checked = selected.includes(o.id);
            return (
              <div
                key={o.id}
                className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${checked ? "bg-blue-50" : ""}`}
                onClick={() => toggle(o.id)}
              >
                <div className="flex items-center justify-between text-sm">
                  <span>{o.name}</span>
                  {checked && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
              </div>
            );
          })}
          {visible.length === 0 && (
            <div className="px-3 py-2 text-gray-500 text-center text-sm">Nothing found</div>
          )}
        </div>
      )}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5 max-h-16 overflow-y-auto">
          {selected.map((id, i) => {
            const name = options.find((o) => o.id === id)?.name || id;
            return (
              <span
                key={id}
                className={`inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs font-medium border ${TAG_COLORS[i % TAG_COLORS.length]}`}
              >
                {name}
                <button type="button" onClick={() => toggle(id)} className="p-0.5 rounded-full" title={`Remove ${name}`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Single-choice dropdown in the filter panel (same look as Face Enroll's "All Status").
export const SelectFilter = ({ options, value, onChange, width = "w-40" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const label = options.find((o) => o.key === value)?.label || options[0].label;
  return (
    <div ref={ref} className={`relative ${width}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
      >
        <span>{label}</span>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
          {options.map((option) => (
            <div
              key={option.key || "all"}
              onClick={() => {
                onChange(option.key);
                setOpen(false);
              }}
              className={`flex items-center justify-between px-3 py-2 cursor-pointer text-sm hover:bg-gray-100 ${value === option.key ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"}`}
            >
              <span>{option.label}</span>
              {value === option.key && <CheckCircle className="w-4 h-4 text-green-600" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
