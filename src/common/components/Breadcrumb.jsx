"use client";

import React from "react";
import { ChevronRight, Home } from "lucide-react";
import { useNavigate } from "@/lib/navigation";

const Breadcrumb = ({ items, homePath = "/admin/dashboard" }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full mb-4">
      <div className="flex items-center text-sm text-gray-500 space-x-2">
        <button
          onClick={() => navigate(homePath)}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          <Home size={16} />
        </button>

        {items.map((item, index) => (
          <React.Fragment key={index}>
            <ChevronRight size={14} />

            {item.path ? (
              <button
                onClick={() => navigate(item.path)}
                className="hover:text-blue-600"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-gray-800 font-medium">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
export default Breadcrumb;
