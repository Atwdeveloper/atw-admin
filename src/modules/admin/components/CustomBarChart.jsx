"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const CustomBarChart = ({ data, title }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />

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

          <YAxis />
          <Tooltip />

          <Bar
            dataKey="vacancies"
            fill="#3b82f6"
            radius={[6, 6, 0, 0]}
            minPointSize={5} // ✅ THIS LINE FIXES YOUR ISSUE
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomBarChart;
