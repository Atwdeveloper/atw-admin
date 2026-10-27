/* eslint-disable no-new-func */

// Improved formula evaluator that handles Excel IF syntax
export const evaluateFormula = (formula, context) => {
  if (!formula) return 0;
  try {
    // Convert Excel IF(cond, trueVal, falseVal) to cond ? trueVal : falseVal
    // This handles simple nested IFs
    let jsFormula = formula;
    // Replace IF(...) with ternary
    while (jsFormula.includes("IF(")) {
      jsFormula = jsFormula.replace(
        /IF\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g,
        "($1 ? $2 : $3)",
      );
    }
    // Replace any remaining commas inside the ternary (should be fine)
    const func = new Function(...Object.keys(context), `return ${jsFormula};`);
    return func(...Object.values(context));
  } catch (error) {
    console.warn("Formula evaluation error:", formula, error);
    return 0;
  }
};

export const calculateSalaryResults = ({
  earningComponents,
  earningValues,
  deductionComponents,
  complianceRules,
  workingDays = 26,
  hoursPerDay = 8,
  monthsPerYear = 12,
  pfUpperCap = 0,
  esiUpperCap = 0,
  isPfApplicable = true,
  isEsiApplicable = true,
}) => {
  if (!earningComponents || !earningComponents.length) return null;

  const WORKING_DAYS = workingDays;
  const HOURS_PER_DAY = hoursPerDay;
  const MONTHS_PER_YEAR = monthsPerYear;

  const PF_OK =
    isPfApplicable === true ||
    isPfApplicable === "true" ||
    isPfApplicable === 1 ||
    isPfApplicable === "1";
  const ESI_OK =
    isEsiApplicable === true ||
    isEsiApplicable === "true" ||
    isEsiApplicable === 1 ||
    isEsiApplicable === "1";

  const sortedComps = [...earningComponents].sort(
    (a, b) => a.priority_order - b.priority_order,
  );

  // Three Parallel Tracks
  const dailyCtx = {};
  const monthlyCtx = {};
  const annualCtx = {};

  const dailyValues = {};
  const monthlyValues = {};
  const annualValues = {};

  // 1. Initial Mapping for Manual Components
  sortedComps.forEach((comp) => {
    if (!comp.is_derived) {
      const input = earningValues[comp.id];
      let perDay = 0,
        monthly = 0,
        annual = 0;

      if (typeof input === "object" && input !== null) {
        const val = parseFloat(input.value) || 0;
        const factor = input.factor || 1;

        if (factor === 1) {
          // Per Day
          perDay = val;
          monthly = val * WORKING_DAYS;
        } else if (factor === 1 / 26) {
          // Monthly
          monthly = val;
          perDay = val / WORKING_DAYS;
        } else if (factor === 1 / 8) {
          // Hourly
          perDay = val * 8;
          monthly = perDay * WORKING_DAYS;
        }
      } else {
        perDay = parseFloat(input) || 0;
        monthly = perDay * WORKING_DAYS;
      }

      annual = monthly * MONTHS_PER_YEAR;

      dailyValues[comp.id] = perDay;
      monthlyValues[comp.id] = monthly;
      annualValues[comp.id] = annual;

      if (comp.code) {
        dailyCtx[comp.code] = perDay;
        monthlyCtx[comp.code] = monthly;
        annualCtx[comp.code] = annual;
      }
    }
  });

  // 2. Aggregate BASIC Tracks
  const getBasicSum = (valMap) =>
    sortedComps
      .filter((c) => c.component_group === "basic")
      .reduce((sum, c) => sum + (valMap[c.id] || 0), 0);

  const updateContexts = () => {
    dailyCtx.BASIC = getBasicSum(dailyValues);
    monthlyCtx.BASIC = getBasicSum(monthlyValues);
    annualCtx.BASIC = getBasicSum(annualValues);

    const getGrossSum = (valMap) =>
      Object.values(valMap).reduce((sum, v) => sum + (v || 0), 0);

    const dg = getGrossSum(dailyValues);
    const mg = getGrossSum(monthlyValues);
    const ag = getGrossSum(annualValues);

    dailyCtx.GROSS = dg;
    dailyCtx.TOTAL = dg;
    monthlyCtx.GROSS = mg;
    monthlyCtx.TOTAL = mg;
    annualCtx.GROSS = ag;
    annualCtx.TOTAL = ag;
  };

  updateContexts();

  // 3. Process Derived components with Monthly-First Logic (Synchronized)
  sortedComps.forEach((comp) => {
    if (comp.is_derived && comp.formula) {
      // Evaluate formula logic using Monthly Context
      const monthlyRaw = evaluateFormula(comp.formula, monthlyCtx);

      // SYNC POINT: Anchor everything to the rounded Monthly total
      const monthlyFinal = Math.round(monthlyRaw);
      const dailyFinal = monthlyFinal / WORKING_DAYS;
      const annualFinal = monthlyFinal * MONTHS_PER_YEAR;

      dailyValues[comp.id] = dailyFinal;
      monthlyValues[comp.id] = monthlyFinal;
      annualValues[comp.id] = annualFinal;

      if (comp.code) {
        dailyCtx[comp.code] = dailyFinal;
        monthlyCtx[comp.code] = monthlyFinal;
        annualCtx[comp.code] = annualFinal;
      }

      // Sequential updates for formulas that depend on previous results
      updateContexts();
    }
  });

  const evaluateRule = (ruleKey, manualValue = null) => {
    if (!complianceRules) return true;
    const rule = complianceRules.find((r) => r.rule_key === ruleKey);
    if (!rule) return true;

    let compareValue = 0;

    if (manualValue !== null) {
      compareValue = manualValue;
    } else if (rule.condition_type === "percentage") {
      const isBasicRule = ruleKey.toLowerCase().includes("basic");
      const numeratorGroup = isBasicRule ? "basic" : "allowance";

      const numerator = sortedComps
        .filter((c) => c.component_group === numeratorGroup)
        .reduce((sum, c) => sum + (monthlyValues[c.id] || 0), 0);

      const denominator = monthlyCtx.GROSS;
      compareValue = denominator > 0 ? (numerator / denominator) * 100 : 0;
    } else {
      compareValue = monthlyCtx[rule.based_on] || monthlyCtx.GROSS;
    }

    const threshold = parseFloat(rule.value);
    switch (rule.operator) {
      case ">=":
        return compareValue >= threshold;
      case "<=":
        return compareValue <= threshold;
      case ">":
        return compareValue > threshold;
      case "<":
        return compareValue < threshold;
      case "==":
        return compareValue === threshold;
      default:
        return true;
    }
  };

  // 4. Final Statutory Calculations (Dynamic)
  let employerTotalMonthly = 0;
  let deductionsTotalMonthly = 0;

  let pfA = 0,
    esiA = 0,
    gratA = 0;
  let epfA = 0,
    eesiA = 0,
    ptA = 0;

  const findDeductionVal = (searchTerms) => {
    if (!deductionComponents) return 0;
    const item = deductionComponents.find((dItem) => {
      const comp = dItem?.deduction_component;
      const name = comp?.name || "";
      return searchTerms.every((term) =>
        name.toUpperCase().includes(term.toUpperCase()),
      );
    });
    return item?.value || item?.deduction_component?.value || 0;
  };

  if (deductionComponents) {
    deductionComponents.forEach((item) => {
      const component = item.deduction_component;
      if (!component) return;

      const value = parseFloat(item.value || component.value) || 0;
      const dependsOn = component.depends_on || "GROSS";
      const monthlyBase = monthlyCtx[dependsOn] || monthlyCtx.GROSS;

      // Applicability Checks
      if (component.name.toUpperCase().includes("PF") && !PF_OK) return;
      if (component.name.toUpperCase().includes("ESI") && !ESI_OK) return;

      let monthlyValue = 0;
      if (component.calculation_type === "percentage") {
        monthlyValue = (monthlyBase * value) / 100;
      } else {
        monthlyValue = value;
      }

      // UPPER CAP OVERRIDE (Template Specific or Compliance Rules fallback)
      let maxLimit = parseFloat(component.max_limit);

      const getRuleVal = (ruleKey) => {
        if (!complianceRules) return null;
        const rule = complianceRules.find((r) => r.rule_key === ruleKey);
        return rule ? parseFloat(rule.value) : null;
      };

      const pfLimit =
        getRuleVal("pf_applicability") || parseFloat(pfUpperCap) || 15000;
      const esiLimit =
        getRuleVal("esi_applicability") || parseFloat(esiUpperCap) || 21000;

      if (component.name.toUpperCase().includes("PF")) {
        if (!PF_OK) {
          monthlyValue = 0;
        } else {
          // If applicable, apply the cap to the base
          const baseForPF = Math.min(monthlyBase, pfLimit);
          if (component.calculation_type === "percentage") {
            monthlyValue = (baseForPF * value) / 100;
          }
          maxLimit = 0;
        }
      } else if (component.name.toUpperCase().includes("ESI")) {
        if (!ESI_OK) {
          monthlyValue = 0;
        } else {
          // If applicable, apply the cap to the base
          const baseForESI = Math.min(monthlyBase, esiLimit);
          if (component.calculation_type === "percentage") {
            monthlyValue = (baseForESI * value) / 100;
          }
          maxLimit = 0;
        }
      }

      if (maxLimit > 0 && monthlyValue > maxLimit) {
        monthlyValue = maxLimit;
      }

      const roundedMonthly = Math.round(monthlyValue);

      if (component.contribution_type === "employer") {
        employerTotalMonthly += roundedMonthly;
        if (component.name.toUpperCase().includes("PF")) pfA += roundedMonthly;
        if (component.name.toUpperCase().includes("ESI"))
          esiA += roundedMonthly;
        if (component.name.toUpperCase().includes("GRATUITY"))
          gratA += roundedMonthly;
      } else {
        deductionsTotalMonthly += roundedMonthly;
        if (component.name.toUpperCase().includes("PF")) epfA += roundedMonthly;
        if (component.name.toUpperCase().includes("ESI"))
          eesiA += roundedMonthly;
        if (
          component.name.toUpperCase().includes("PROFESSIONAL TAX") ||
          component.name.toUpperCase().includes("PT")
        )
          ptA += roundedMonthly;
      }
    });
  }

  const calcTrack = (val) => ({
    monthly: Math.round(val),
    perDay: val / WORKING_DAYS,
    hourly: val / WORKING_DAYS / HOURS_PER_DAY,
    annual: val * MONTHS_PER_YEAR,
  });

  const ctcMonthly = Math.round(monthlyCtx.GROSS + employerTotalMonthly);
  monthlyCtx.CTC = ctcMonthly;
  dailyCtx.CTC = ctcMonthly / WORKING_DAYS;
  annualCtx.CTC = ctcMonthly * MONTHS_PER_YEAR;

  return {
    monthlyCtx,
    dailyCtx,
    annualCtx,
    components: sortedComps.map((comp) => {
      const monthlyVal = monthlyValues[comp.id] || 0;
      return {
        ...comp,
        perDay: dailyValues[comp.id] || 0,
        monthly: monthlyVal,
        hourly: (dailyValues[comp.id] || 0) / HOURS_PER_DAY,
        annual: annualValues[comp.id] || 0,
        percent:
          monthlyCtx.GROSS > 0
            ? ((monthlyVal / monthlyCtx.GROSS) * 100).toFixed(2)
            : "0.00",
        isBasic: comp.component_group === "basic",
      };
    }),

    basicSubtotal: {
      monthly: monthlyCtx.BASIC,
      perDay: dailyCtx.BASIC,
      hourly: dailyCtx.BASIC / HOURS_PER_DAY,
      annual: annualCtx.BASIC,
    },
    allowanceSubtotal: {
      monthly: monthlyCtx.GROSS - monthlyCtx.BASIC,
      perDay: dailyCtx.GROSS - dailyCtx.BASIC,
      hourly: (dailyCtx.GROSS - dailyCtx.BASIC) / HOURS_PER_DAY,
      annual: annualCtx.GROSS - annualCtx.BASIC,
    },

    grossMonthly: monthlyCtx.GROSS,
    grossPerDay: dailyCtx.GROSS,
    grossHourly: dailyCtx.GROSS / HOURS_PER_DAY,
    grossAnnual: annualCtx.GROSS,

    employerPF: {
      ...calcTrack(pfA),
      percent: findDeductionVal(["Employer", "PF"]),
    },
    employerESI: {
      ...calcTrack(esiA),
      percent: findDeductionVal(["Employer", "ESI"]),
    },
    gratuity: { ...calcTrack(gratA), percent: findDeductionVal(["Gratuity"]) },

    statutorySubtotal: {
      monthly: employerTotalMonthly,
      perDay: employerTotalMonthly / WORKING_DAYS,
      hourly: employerTotalMonthly / WORKING_DAYS / HOURS_PER_DAY,
      annual: employerTotalMonthly * MONTHS_PER_YEAR,
    },

    ctcValues: {
      monthly: Math.round(monthlyCtx.GROSS + employerTotalMonthly),
      get annual() {
        return this.monthly * MONTHS_PER_YEAR;
      },
      get perDay() {
        return this.monthly / WORKING_DAYS;
      },
      get hourly() {
        return this.perDay / HOURS_PER_DAY;
      },
    },

    employeePF: {
      ...calcTrack(epfA),
      percent: findDeductionVal(["Employee", "PF"]),
    },
    employeeESI: {
      ...calcTrack(eesiA),
      percent: findDeductionVal(["Employee", "ESI"]),
    },
    profTax: calcTrack(ptA),

    deductionSubtotal: {
      monthly: deductionsTotalMonthly,
      perDay: deductionsTotalMonthly / WORKING_DAYS,
      hourly: deductionsTotalMonthly / WORKING_DAYS / HOURS_PER_DAY,
      annual: deductionsTotalMonthly * MONTHS_PER_YEAR,
    },

    netSalaryValues: {
      monthly: Math.round(monthlyCtx.GROSS - deductionsTotalMonthly),
      get annual() {
        return this.monthly * MONTHS_PER_YEAR;
      },
      get perDay() {
        return this.monthly / WORKING_DAYS;
      },
      get hourly() {
        return this.perDay / HOURS_PER_DAY;
      },
    },

    compliance: {
      basicDAPercent:
        monthlyCtx.GROSS > 0
          ? ((monthlyCtx.BASIC / monthlyCtx.GROSS) * 100).toFixed(2)
          : "0.00",
      allowancePercent:
        monthlyCtx.GROSS > 0
          ? (
              ((monthlyCtx.GROSS - monthlyCtx.BASIC) / monthlyCtx.GROSS) *
              100
            ).toFixed(2)
          : "0.00",

      // Specifically for the rule check results (using the rule's own based_on)
      basicDAPercentActual: (() => {
        const rule = complianceRules?.find(
          (r) => r.rule_key === "basic_da_percentage",
        );
        const denom = monthlyCtx[rule?.based_on] || monthlyCtx.GROSS;
        return denom > 0
          ? ((monthlyCtx.BASIC / denom) * 100).toFixed(2)
          : "0.00";
      })(),
      basicDABase:
        complianceRules?.find((r) => r.rule_key === "basic_da_percentage")
          ?.based_on || "GROSS",

      pfApplicable: evaluateRule("pf_applicability") ? "YES" : "NO",
      esiApplicable: evaluateRule("esi_applicability") ? "YES" : "NO",
      minWageCompliant: evaluateRule("min_wage") ? "COMPLIANT" : "CHECK",
      isBasicDAPass: evaluateRule("basic_da_percentage"),
      isAllowancePass: evaluateRule("allowance_percentage"),
      isMinWagePass: evaluateRule("min_wage"),
    },
  };
};
