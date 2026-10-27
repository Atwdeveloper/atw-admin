"use client";

import { Pencil, Trash2 } from "lucide-react";

export default function JobList({ jobs = [] }) {
  // Default to empty array
  const getDepartmentColor = (dept) => {
    if (!dept) return "text-gray-600";
    switch (dept.toLowerCase()) {
      case "engineering":
        return "text-blue-600";
      case "design":
        return "text-pink-600";
      case "marketing":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  if (!jobs || jobs.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Job List</h2>
        </div>
        <div className="p-8 text-center text-gray-500">No jobs available</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Job List</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                Job ID
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                Job Title
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                Department
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                Required
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                Rate
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                Start Date
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                End Date
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {jobs.map((job, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-600">
                  {job.job_id}
                </td>
                <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                  {job.title}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`text-sm font-semibold ${getDepartmentColor(job.department)}`}
                  >
                    {job.department}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {job.required_positions}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{job.rate}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {job.start_date}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {job.end_date}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Pencil size={18} />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
