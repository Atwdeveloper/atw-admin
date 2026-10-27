"use client";

import React from "react";
import { motion } from "framer-motion";
import { itemVariants } from "../../../../common/utils/motionVariants";

const SalaryPreviewTable = ({ results }) => {
  if (!results) return null;

  const formatCurrency = (val) =>
    `₹${val.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6"
      variants={itemVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="px-6 py-4 border-b bg-blue-50">
        <h2 className="text-lg font-semibold text-gray-800">
          Salary Preview Calculator
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Live preview based on entered per‑day values.
        </p>
      </div>

      <div className="p-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Component</th>
              <th className="px-3 py-2 text-center">% of Gross</th>
              <th className="px-3 py-2 text-right">Per Hour</th>
              <th className="px-3 py-2 text-right">Per Day</th>
              <th className="px-3 py-2 text-right">Monthly</th>
              <th className="px-3 py-2 text-right">Annual</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {results.components.map((comp) => (
              <tr key={comp.id}>
                <td className="px-3 py-2">{comp.name}</td>
                <td className="px-3 py-2 text-center text-xs font-semibold text-slate-500">
                  {comp.percent !== undefined ? `${comp.percent}%` : "0%"}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatCurrency(comp.hourly)}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatCurrency(comp.perDay)}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatCurrency(comp.monthly)}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatCurrency(comp.annual)}
                </td>
              </tr>
            ))}
            <tr className="font-semibold bg-gray-50">
              <td className="px-3 py-2">Gross Salary</td>
              <td className="px-3 py-2 text-center text-xs font-bold text-slate-600">
                100%
              </td>
              <td className="px-3 py-2 text-right">
                {formatCurrency(results.grossHourly)}
              </td>
              <td className="px-3 py-2 text-right">
                {formatCurrency(results.grossPerDay)}
              </td>
              <td className="px-3 py-2 text-right">
                {formatCurrency(results.grossMonthly)}
              </td>
              <td className="px-3 py-2 text-right">
                {formatCurrency(results.grossAnnual)}
              </td>
            </tr>

            {/* Employer Contributions */}
            <tr>
              <td colSpan={6} className="pt-4 font-medium">
                Employer Contributions
              </td>
            </tr>
            <tr>
              <td className="px-3 py-1">PF (Employer)</td>
              <td colSpan={4}></td>
              <td className="text-right">
                {formatCurrency(results.employerPF)}
              </td>
            </tr>
            <tr>
              <td className="px-3 py-1">Gratuity Provision</td>
              <td colSpan={4}></td>
              <td className="text-right">{formatCurrency(results.gratuity)}</td>
            </tr>
            <tr>
              <td className="px-3 py-1">ESI (Employer)</td>
              <td colSpan={4}></td>
              <td className="text-right">
                {formatCurrency(results.employerESI)}
              </td>
            </tr>
            <tr>
              <td className="px-3 py-1">Service Charge (5%)</td>
              <td colSpan={4}></td>
              <td className="text-right">
                {formatCurrency(results.serviceCharge)}
              </td>
            </tr>
            <tr className="font-semibold">
              <td className="px-3 py-1">CTC</td>
              <td colSpan={4}></td>
              <td className="text-right">
                {formatCurrency(results.ctcMonthly)}
              </td>
            </tr>

            {/* Employee Deductions */}
            <tr>
              <td colSpan={6} className="pt-4 font-medium">
                Employee Deductions
              </td>
            </tr>
            <tr>
              <td className="px-3 py-1">PF (Employee)</td>
              <td colSpan={4}></td>
              <td className="text-right">
                {formatCurrency(results.employeePF)}
              </td>
            </tr>
            <tr>
              <td className="px-3 py-1">ESI (Employee)</td>
              <td colSpan={4}></td>
              <td className="text-right">
                {formatCurrency(results.employeeESI)}
              </td>
            </tr>
            <tr>
              <td className="px-3 py-1">Professional Tax</td>
              <td colSpan={4}></td>
              <td className="text-right">{formatCurrency(results.profTax)}</td>
            </tr>
            <tr className="font-semibold">
              <td className="px-3 py-1">Total Deductions</td>
              <td colSpan={4}></td>
              <td className="text-right">
                {formatCurrency(results.totalDeductions)}
              </td>
            </tr>

            {/* Net Salary */}
            <tr className="font-bold text-green-700 bg-green-50">
              <td className="px-3 py-2">Net Salary (In-Hand)</td>
              <td colSpan={4}></td>
              <td className="text-right">
                {formatCurrency(results.netSalaryMonthly)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default SalaryPreviewTable;
