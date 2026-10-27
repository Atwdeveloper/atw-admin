"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const GraphChart = ({ data, title }) => {
  const chartData = data || [];

  // Show fallback if no data

  // Calculate the maximum value across both series; if all zero, set max to 5
  const maxValue = Math.max(
    ...chartData.flatMap((d) => [d.companies || 0, d.workers || 0]),
    0,
  );
  const yAxisMax = maxValue === 0 ? 5 : maxValue + 2;

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">
        {title || "Companies vs Workers (Last 7 Days)"}
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="date"
            tickFormatter={(date) =>
              new Date(date).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
              })
            }
            tick={{ fill: "#6b7280", fontSize: 12 }}
          />

          <YAxis
            domain={[0, yAxisMax]}
            tick={{ fill: "#6b7280", fontSize: 12 }}
          />

          <Tooltip
            labelFormatter={(date) => new Date(date).toLocaleDateString()}
            contentStyle={{
              borderRadius: "10px",
              border: "none",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
          />

          {/* <Legend /> */}

          <Line
            type="monotone"
            dataKey="companies"
            stroke="#6366f1"
            strokeWidth={3}
            dot={{ r: 6, strokeWidth: 2, fill: "#fff" }}
            activeDot={{ r: 8 }}
            name="Companies"
          />

          <Line
            type="monotone"
            dataKey="workers"
            stroke="#f59e0b"
            strokeWidth={3}
            dot={{ r: 6, strokeWidth: 2, fill: "#fff" }}
            activeDot={{ r: 8 }}
            name="Workers"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GraphChart;
