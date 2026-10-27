"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { itemVariants } from "../../../../common/utils/motionVariants";

/**
 * A sub-component to handle local input state for salary components
 * This prevents the 'flickering' effect when typing into derived fields (Hourly/Monthly)
 */
const SalaryInput = ({
  value,
  onValueChange,
  componentId,
  factor,
  className,
  placeholder,
  step,
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync local value when external value changes (e.g. from another input)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const newVal = e.target.value;
    setLocalValue(newVal);
    onValueChange(componentId, newVal, factor);
  };

  return (
    <input
      type="number"
      step={step}
      min="0"
      value={localValue}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
    />
  );
};

const EditableSalaryTable = ({
  earningComponents,
  earningValues,
  calculationResults,
  onValueChange,
  readOnly = false,
}) => {
  if (!calculationResults) return null;

  const formatCurrency = (val) =>
    `₹${val.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;

  const resultsMap = {};
  calculationResults.components.forEach((c) => {
    resultsMap[c.id] = c;
  });

  const isEditable = (comp) => {
    return comp.is_derived !== 1 && !readOnly;
  };

  // Group earnings into Basic and Allowances
  const basicEarnings = earningComponents.filter(
    (c) => resultsMap[c.id]?.isBasic,
  );
  const allowanceEarnings = earningComponents.filter(
    (c) => !resultsMap[c.id]?.isBasic,
  );

  const renderValueRow = (
    label,
    values,
    className = "bg-white",
    isHeader = false,
  ) => (
    <tr className={`${className} ${isHeader ? "font-bold" : ""}`}>
      <td className="px-3 py-2 border font-medium">{label}</td>
      <td className="px-3 py-2 border text-center text-xs font-bold text-slate-500">
        {values.percent !== undefined ? `${values.percent}%` : "-"}
      </td>
      <td className="px-3 py-2 border text-right">
        {formatCurrency(values.hourly || 0)}
      </td>
      <td className="px-3 py-2 border text-right">
        {formatCurrency(values.perDay || 0)}
      </td>
      <td className="px-3 py-2 border text-right">
        {formatCurrency(values.monthly || 0)}
      </td>
      <td className="px-3 py-2 border text-right">
        {formatCurrency(values.annual || 0)}
      </td>
    </tr>
  );

  const renderComponentRow = (comp) => {
    const result = resultsMap[comp.id] || {};
    const editable = isEditable(comp);
    const inputState = earningValues[comp.id] || {};

    const isHourlyActive = inputState.factor === 1 / 8;
    const isDailyActive =
      inputState.factor === 1 ||
      (!inputState.factor && inputState.value !== undefined);
    const isMonthlyActive = inputState.factor === 1 / 26;

    return (
      <tr key={comp.id} className="hover:bg-gray-50 transition-colors">
        <td className="px-3 py-2 border">
          <div className="font-medium text-gray-700">{comp.name}</div>
          {!editable && (
            <div className="text-[10px] text-gray-400 font-medium italic">
              (auto‑calculated)
            </div>
          )}
        </td>
        <td className="px-3 py-2 border text-center text-xs font-semibold text-slate-500">
          {result.percent !== undefined ? `${result.percent}%` : "0%"}
        </td>
        <td className="px-3 py-2 border text-right">
          {editable ? (
            <div className="relative inline-block">
              <span className="absolute left-2 top-1.5 text-gray-500 text-[10px] pointer-events-none">
                ₹
              </span>
              <SalaryInput
                componentId={comp.id}
                value={
                  isHourlyActive
                    ? inputState.value
                    : result.hourly
                      ? result.hourly.toFixed(2)
                      : ""
                }
                onValueChange={onValueChange}
                factor={1 / 8}
                step="0.01"
                className="w-20 pl-5 py-1 border border-gray-300 rounded text-right text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="0"
              />
            </div>
          ) : (
            <span className="text-gray-600">
              {formatCurrency(result.hourly || 0)}
            </span>
          )}
        </td>
        <td className="px-3 py-2 border text-right">
          {editable ? (
            <div className="relative inline-block">
              <span className="absolute left-2 top-1.5 text-gray-600 text-[10px] pointer-events-none">
                ₹
              </span>
              <SalaryInput
                componentId={comp.id}
                value={
                  isDailyActive
                    ? inputState.value
                    : result.perDay
                      ? result.perDay.toFixed(2)
                      : ""
                }
                onValueChange={onValueChange}
                factor={1}
                step="0.01"
                className={`w-24 pl-5 py-1 border rounded text-right text-sm focus:ring-1 outline-none ${
                  calculationResults.grossMonthly > 0 &&
                  !calculationResults.compliance.isBasicDAPass &&
                  result.isBasic
                    ? "border-red-500 focus:ring-red-500 bg-red-50"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="0"
              />
              {calculationResults.grossMonthly > 0 &&
                !calculationResults.compliance.isBasicDAPass &&
                result.isBasic && (
                  <div className="text-[9px] text-red-500 mt-0.5 text-left font-bold leading-tight">
                    Min. 50% BASIC
                  </div>
                )}
            </div>
          ) : (
            <span className="text-gray-600">
              {formatCurrency(result.perDay || 0)}
            </span>
          )}
        </td>
        <td className="px-3 py-2 border text-right">
          {editable ? (
            <div className="relative inline-block">
              <span className="absolute left-2 top-1.5 text-gray-500 text-[10px] pointer-events-none">
                ₹
              </span>
              <SalaryInput
                componentId={comp.id}
                value={
                  isMonthlyActive
                    ? inputState.value
                    : result.monthly
                      ? result.monthly
                      : ""
                }
                onValueChange={onValueChange}
                factor={1 / 26}
                step="1"
                className="w-24 pl-5 py-1 border border-gray-300 rounded text-right text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="0"
              />
            </div>
          ) : (
            <span className="text-gray-600">
              {formatCurrency(result.monthly || 0)}
            </span>
          )}
        </td>
        <td className="px-3 py-2 border text-right text-gray-600">
          {formatCurrency(result.annual || 0)}
        </td>
      </tr>
    );
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden mb-8"
      variants={itemVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
          Salary Structure Editor
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Detailed breakdown of monthly and annual components
        </p>
      </div>

      <div className="p-0 overflow-x-auto min-h-[600px]">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-4 py-3 text-left border-r border-gray-700">
                SALARY COMPONENTS (MONTHLY)
              </th>
              <th colSpan="5" className="px-4 py-3 text-center">
                Amount
              </th>
            </tr>
            <tr className="bg-gray-100 text-gray-700">
              <th className="px-3 py-2 text-left border font-bold">
                Category / Component
              </th>
              <th className="px-3 py-2 text-center border font-bold">
                % of Gross
              </th>
              <th className="px-3 py-2 text-right border font-bold">
                Per Hour
              </th>
              <th className="px-3 py-2 text-right border font-bold">Per Day</th>
              <th className="px-3 py-2 text-right border font-bold">Monthly</th>
              <th className="px-3 py-2 text-right border font-bold uppercase text-[10px]">
                Annualy
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-yellow-50/50">
              <td
                colSpan="6"
                className="px-3 py-1 border font-bold text-gray-900 uppercase tracking-wider text-xs"
              >
                BASIC COMPONENTS
              </td>
            </tr>
            {basicEarnings.map(renderComponentRow)}
            {renderValueRow(
              "SUB-TOTAL: BASIC (A)",
              {
                ...calculationResults.basicSubtotal,
                percent: calculationResults.compliance.basicDAPercent,
              },
              "bg-gray-50 font-bold border-t-2",
            )}

            {/* ALLOWANCES */}
            <tr className="bg-green-50/50">
              <td
                colSpan="6"
                className="px-3 py-1 border font-bold text-gray-900 uppercase tracking-wider text-xs"
              >
                ALLOWANCES (≤50% of CTC)
              </td>
            </tr>
            {allowanceEarnings.map(renderComponentRow)}
            {renderValueRow(
              "SUB-TOTAL: ALLOWANCES (B)",
              {
                ...calculationResults.allowanceSubtotal,
                percent: calculationResults.compliance.allowancePercent,
              },
              "bg-gray-50 font-bold border-t-2",
            )}

            {/* GROSS SALARY */}
            {renderValueRow(
              "GROSS SALARY (C = A + B)",
              {
                percent: 100,
                hourly: calculationResults.grossHourly,
                perDay: calculationResults.grossPerDay,
                monthly: calculationResults.grossMonthly,
                annual: calculationResults.grossAnnual,
              },
              "bg-[#d9ead3] font-bold text-gray-900 border-2",
            )}

            {/* EMPLOYER CONTRIBUTIONS */}
            <tr className="bg-gray-50">
              <td
                colSpan="6"
                className="px-3 py-1 border font-bold text-gray-900 uppercase tracking-wider text-xs"
              >
                STATUTORY EMPLOYER CONTRIBUTIONS
              </td>
            </tr>
            {renderValueRow(
              `PF Contribution (Employer) (${calculationResults.employerPF.percent}%)`,
              calculationResults.employerPF,
              "text-gray-600 pl-6",
            )}
            {renderValueRow(
              `Gratuity Provision (${calculationResults.gratuity.percent}%)`,
              calculationResults.gratuity,
              "text-gray-600 pl-6",
            )}
            {renderValueRow(
              `ESI Contribution (Employer) (${calculationResults.employerESI.percent}%)`,
              calculationResults.employerESI,
              "text-gray-600 pl-6",
            )}
            {renderValueRow(
              "STATUTORY EMPLOYER CONTRIBUTIONS (D)",
              calculationResults.statutorySubtotal,
              "bg-gray-50 font-bold border-t",
            )}

            {/* CTC */}
            {renderValueRow(
              "COST TO COMPANY (CTC) = C + D",
              calculationResults.ctcValues,
              "bg-red-600 text-white font-bold text-lg",
            )}

            {/* DEDUCTIONS */}
            <tr className="bg-gray-50">
              <td
                colSpan="6"
                className="px-3 py-1 border font-bold text-gray-900 uppercase tracking-wider text-xs"
              >
                DEDUCTIONS FROM GROSS SALARY
              </td>
            </tr>
            {renderValueRow(
              `PF - Employee Contribution (${calculationResults.employeePF.percent}%)`,
              calculationResults.employeePF,
              "text-gray-600 pl-6",
            )}
            {renderValueRow(
              `ESI - Employee Contribution (${calculationResults.employeeESI.percent}%)`,
              calculationResults.employeeESI,
              "text-gray-600 pl-6",
            )}
            {renderValueRow(
              "Professional Tax",
              calculationResults.profTax,
              "text-gray-600 pl-6",
            )}
            {renderValueRow(
              "SUB-TOTAL: DEDUCTIONS (F)",
              calculationResults.deductionSubtotal,
              "bg-[#fce5cd] font-bold text-gray-900 border-t",
            )}

            {/* NET SALARY */}
            {renderValueRow(
              "NET SALARY (In-Hand Salary = C - F)",
              calculationResults.netSalaryValues,
              "bg-[#38761d] text-white font-bold",
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default EditableSalaryTable;
