"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileDown,
  Filter,
  Home,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

// Replace these option arrays with API responses when the lookup endpoints are ready.
const FILTER_FIELDS = [
  ["company", "Company", ["All Companies", "Tech Mahindra", "Tata Motors", "Larsen & Toubro"]],
  ["agent", "Agent", ["All Agents", "Amit Singh", "Priya Patel", "Karan Shah"]],
  ["worker", "Worker", ["All Workers", "Rahul Kumar", "Sunita Sharma", "Anil Verma"]],
  ["state", "State", ["All States", "Maharashtra", "Karnataka", "Gujarat"]],
  ["city", "City", ["All Cities", "Mumbai", "Bengaluru", "Pune"]],
  ["industry", "Industry", ["All Industries", "Manufacturing", "Automotive", "Logistics"]],
  ["designation", "Designation", ["All Designations", "Machine Operator", "Welder", "Sales Executive"]],
  ["referralType", "Referral Type", ["All Types", "Worker-to-Worker", "Agent-to-Worker", "Company Referral"]],
  ["commissionStatus", "Commission Status", ["All Statuses", "Active", "Inactive", "Draft"]],
  ["payoutStatus", "Payout Status", ["All Payouts", "Pending", "Paid", "On Hold"]],
];

const EMPTY_FILTERS = Object.fromEntries(FILTER_FIELDS.map(([key, , options]) => [key, options[0]]));
const PERIOD_OPTIONS = ["Daily", "Weekly", "Monthly", "Half-Yearly", "Yearly"];
const INITIAL_FORM = {
  name: "",
  referralType: "Worker-to-Worker",
  calculationType: "Flat Amount",
  amount: "",
  startDate: "",
  endDate: "",
  eligibility: "",
  retentionDays: "30",
  payoutTrigger: "On Joining",
  approvalWorkflow: "Auto-Approve",
  duplicateMobile: true,
  selfReferral: true,
  joiningValidation: true,
  showAmount: false,
  active: true,
};

const INITIAL_RULES = [
  {
    id: "RR-1001",
    name: "Worker Joining Bonus Q3",
    referralType: "Worker-to-Worker",
    calculationType: "Flat Amount",
    amount: "₹1,500",
    status: "Active",
    periodFrequency: "Monthly",
    startDate: "2026-07-01",
    endDate: "2026-09-30",
    period: "01 Jul 2026 – 30 Sep 2026",
    createdBy: "Operations Lead",
    updatedAt: "12 Jul 2026, 10:30 AM",
  },
  {
    id: "RR-1002",
    name: "Agent Standard Commission",
    referralType: "Agent-to-Worker",
    calculationType: "Percentage",
    amount: "5%",
    status: "Active",
    periodFrequency: "Monthly",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    period: "01 Jan 2026 – 31 Dec 2026",
    createdBy: "Priya Patel",
    updatedAt: "08 Jul 2026, 03:45 PM",
  },
  {
    id: "RR-1003",
    name: "Manufacturing Hiring Drive",
    referralType: "Company Referral",
    calculationType: "Flat Amount",
    amount: "₹2,000",
    status: "Scheduled",
    periodFrequency: "Yearly",
    startDate: "2026-08-01",
    endDate: "2026-10-31",
    period: "01 Aug 2026 – 31 Oct 2026",
    createdBy: "Admin User",
    updatedAt: "05 Jul 2026, 11:12 AM",
  },
  {
    id: "RR-1004",
    name: "Monsoon Worker Referral",
    referralType: "Worker-to-Worker",
    calculationType: "Flat Amount",
    amount: "₹1,000",
    status: "Inactive",
    periodFrequency: "Monthly",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    period: "01 Jun 2026 – 30 Jun 2026",
    createdBy: "Amit Singh",
    updatedAt: "01 Jul 2026, 09:00 AM",
  },
];

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50";

function Button({ children, variant = "primary", icon: Icon, className = "", type = "button", ...props }) {
  const styles = {
    primary: "bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:ring-blue-200",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-200",
    danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50 focus:ring-red-100",
  };
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {children}
    </button>
  );
}

function FormField({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, options, label, className = "" }) {
  return (
    <FormField label={label} className={className}>
      <select value={value} onChange={onChange} className={inputClass}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </FormField>
  );
}

function StatusBadge({ status }) {
  const colors = {
    Active: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    Scheduled: "bg-blue-50 text-blue-700 ring-blue-100",
    Inactive: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${colors[status] || colors.Inactive}`}>{status}</span>;
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
      {label}
    </label>
  );
}

function formatDate(date) {
  return date ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date}T00:00:00`)) : "—";
}

function exportRows(rows) {
  const header = ["Rule Name", "Referral Type", "Calculation", "Amount", "Status", "Effective Period", "Created By", "Updated At"];
  const values = rows.map((rule) => [rule.name, rule.referralType, rule.calculationType, rule.amount, rule.status, rule.period, rule.createdBy, rule.updatedAt]);
  const csv = [header, ...values].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "referral-rules.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReferralRules() {
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, dateFrom: "", dateTo: "", period: "Monthly" });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [form, setForm] = useState(INITIAL_FORM);
  const [rules, setRules] = useState(INITIAL_RULES);
  const [tableSearch, setTableSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [viewingRule, setViewingRule] = useState(null);

  // Keep filtering client-side for the mock; replace with a query-key/API call later.
  const visibleRules = useMemo(() => {
    const tableQuery = tableSearch.trim().toLowerCase();
    return rules.filter((rule) => {
      const haystack = [rule.name, rule.referralType, rule.status, rule.createdBy].join(" ").toLowerCase();
      const matchesTableSearch = !tableQuery || haystack.includes(tableQuery);
      const matchesStatus = appliedFilters.commissionStatus === "All Statuses" || rule.status === appliedFilters.commissionStatus;
      const matchesStart = !appliedFilters.dateFrom || rule.startDate >= appliedFilters.dateFrom;
      const matchesEnd = !appliedFilters.dateTo || rule.endDate <= appliedFilters.dateTo;
      const matchesPeriod = !appliedFilters.period || rule.periodFrequency === appliedFilters.period;
      return matchesTableSearch && matchesStatus && matchesStart && matchesEnd && matchesPeriod;
    });
  }, [rules, tableSearch, appliedFilters]);

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  function resetFilters() {
    const reset = { ...EMPTY_FILTERS, dateFrom: "", dateTo: "", period: "Monthly" };
    setFilters(reset);
    setAppliedFilters(reset);
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setEditingId(null);
  }

  function handleSave(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.amount.trim()) return;
    const nextRule = {
      id: editingId || `RR-${Date.now().toString().slice(-6)}`,
      name: form.name.trim(),
      referralType: form.referralType,
      calculationType: form.calculationType,
      amount: form.calculationType === "Percentage" && !form.amount.includes("%") ? `${form.amount}%` : form.amount,
      status: form.active ? "Active" : "Inactive",
      periodFrequency: "Monthly",
      startDate: form.startDate,
      endDate: form.endDate,
      period: `${formatDate(form.startDate)} – ${formatDate(form.endDate)}`,
      createdBy: editingId ? rules.find((rule) => rule.id === editingId)?.createdBy || "Admin User" : "Admin User",
      updatedAt: new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date()),
    };
    setRules((current) => editingId ? current.map((rule) => rule.id === editingId ? nextRule : rule) : [nextRule, ...current]);
    resetForm();
  }

  function startEdit(rule) {
    setEditingId(rule.id);
    setForm({
      ...INITIAL_FORM,
      name: rule.name,
      referralType: rule.referralType,
      calculationType: rule.calculationType,
      amount: rule.amount.replace(/[₹,%]/g, ""),
      startDate: rule.startDate,
      endDate: rule.endDate,
      active: rule.status === "Active",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cloneRule(rule) {
    setRules((current) => [{ ...rule, id: `RR-${Date.now().toString().slice(-6)}`, name: `${rule.name} (Copy)`, status: "Inactive", updatedAt: "Just now" }, ...current]);
  }

  function removeRule(id) {
    if (window.confirm("Delete this referral rule? This cannot be undone.")) setRules((current) => current.filter((rule) => rule.id !== id));
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <nav className="mb-3 flex items-center gap-1.5 text-sm text-slate-500" aria-label="Breadcrumb">
              <Home className="h-4 w-4" /><ChevronRight className="h-4 w-4" /><span>Referrals</span><ChevronRight className="h-4 w-4" /><span className="font-medium text-slate-700">Referral Rules</span>
            </nav>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Referral Rules</h1>
            <p className="mt-1.5 text-sm text-slate-500">Configure eligibility, commissions, validation, and payout approvals for your referral program.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" icon={Download} onClick={() => exportRows(visibleRules)}>Export Rules</Button>
            <Button icon={Plus} onClick={() => { resetForm(); window.scrollTo({ top: 250, behavior: "smooth" }); }}>Create Rule</Button>
          </div>
        </motion.header>

        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Filter className="h-4 w-4" /></span><div><h2 className="font-bold text-slate-800">Filters</h2><p className="text-xs text-slate-500">Narrow down rules and referral records.</p></div></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {FILTER_FIELDS.map(([key, label, options]) => <Select key={key} label={label} value={filters[key]} options={options} onChange={(event) => updateFilter(key, event.target.value)} />)}
            <FormField label="Date From"><input type="date" value={filters.dateFrom} onChange={(event) => updateFilter("dateFrom", event.target.value)} className={inputClass} /></FormField>
            <FormField label="Date To"><input type="date" value={filters.dateTo} onChange={(event) => updateFilter("dateTo", event.target.value)} className={inputClass} /></FormField>
            <div className="sm:col-span-2 xl:col-span-3"><p className="text-xs font-semibold text-slate-600">Period</p><div className="mt-1.5 flex flex-wrap rounded-lg border border-slate-200 bg-slate-50 p-1">{PERIOD_OPTIONS.map((period) => <button key={period} type="button" onClick={() => updateFilter("period", period)} className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition sm:text-sm ${filters.period === period ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-white hover:text-slate-700"}`}>{period}</button>)}</div></div>
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1 xl:col-span-2"><Button variant="secondary" icon={RotateCcw} onClick={resetFilters} className="flex-1">Reset</Button><Button icon={Filter} onClick={() => setAppliedFilters(filters)} className="flex-1">Apply Filter</Button></div>
          </div>
        </motion.section>

        <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} onSubmit={handleSave} className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-800">Referral Rule Builder</h2><p className="mt-1 text-sm text-slate-500">{editingId ? "Update the selected rule and save your changes." : "Define a reusable referral policy for your teams."}</p></div>{editingId && <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-700"><X className="h-4 w-4" /> Stop editing</button>}</div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormField label="Rule Name"><input required value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="e.g. Worker Referral Bonus Q3" className={inputClass} /></FormField>
            <Select label="Referral Type" value={form.referralType} options={["Worker-to-Worker", "Agent-to-Worker", "Company Referral"]} onChange={(event) => updateForm("referralType", event.target.value)} />
            <Select label="Calculation Type" value={form.calculationType} options={["Flat Amount", "Percentage"]} onChange={(event) => updateForm("calculationType", event.target.value)} />
            <FormField label="Amount / Percentage"><input required value={form.amount} onChange={(event) => updateForm("amount", event.target.value)} placeholder={form.calculationType === "Percentage" ? "e.g. 5" : "e.g. ₹ 1,500"} className={inputClass} /></FormField>
            <FormField label="Effective Start Date"><input required type="date" value={form.startDate} onChange={(event) => updateForm("startDate", event.target.value)} className={inputClass} /></FormField>
            <FormField label="Effective End Date"><input required type="date" value={form.endDate} min={form.startDate} onChange={(event) => updateForm("endDate", event.target.value)} className={inputClass} /></FormField>
            <FormField label="Eligibility"><input value={form.eligibility} onChange={(event) => updateForm("eligibility", event.target.value)} placeholder="e.g. New workers only" className={inputClass} /></FormField>
            <FormField label="Minimum Retention Days"><input type="number" min="0" value={form.retentionDays} onChange={(event) => updateForm("retentionDays", event.target.value)} className={inputClass} /></FormField>
            <Select label="Payout Trigger" value={form.payoutTrigger} options={["On Joining", "After Retention", "On Offer Acceptance", "Manual Release"]} onChange={(event) => updateForm("payoutTrigger", event.target.value)} />
            <Select label="Approval Workflow" value={form.approvalWorkflow} options={["Auto-Approve", "Manager Approval", "Finance Approval", "Multi-level Approval"]} onChange={(event) => updateForm("approvalWorkflow", event.target.value)} />
          </div>
          <div className="mt-6 border-t border-slate-100 pt-5"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Validation Options</p><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"><Checkbox label="Duplicate Mobile Check" checked={form.duplicateMobile} onChange={(event) => updateForm("duplicateMobile", event.target.checked)} /><Checkbox label="Self Referral Block" checked={form.selfReferral} onChange={(event) => updateForm("selfReferral", event.target.checked)} /><Checkbox label="Joining Validation" checked={form.joiningValidation} onChange={(event) => updateForm("joiningValidation", event.target.checked)} /><Checkbox label="Show Amount On Worker Form" checked={form.showAmount} onChange={(event) => updateForm("showAmount", event.target.checked)} /><Checkbox label="Rule Active" checked={form.active} onChange={(event) => updateForm("active", event.target.checked)} /></div></div>
          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={resetForm}>Cancel</Button><Button type="submit">{editingId ? "Update Rule" : "Save Rule"}</Button></div>
        </motion.form>

        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-lg font-bold text-slate-800">Active Referral Rules</h2><p className="mt-1 text-sm text-slate-500">Manage the rules currently configured for your referral program.</p></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={tableSearch} onChange={(event) => setTableSearch(event.target.value)} placeholder="Search rules..." className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 sm:w-56" /></div><Button variant="secondary" icon={FileDown} onClick={() => exportRows(visibleRules)}>Export</Button></div></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[1150px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>{["Rule Name", "Referral Type", "Calculation", "Amount", "Status", "Effective Period", "Created By", "Updated At", "Actions"].map((title) => <th key={title} className="whitespace-nowrap px-5 py-4 font-bold">{title}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{visibleRules.map((rule) => <tr key={rule.id} className="transition hover:bg-slate-50/80"><td className="px-5 py-4"><p className="font-semibold text-slate-800">{rule.name}</p><p className="mt-0.5 text-xs text-slate-400">{rule.id}</p></td><td className="px-5 py-4 text-slate-600">{rule.referralType}</td><td className="px-5 py-4 text-slate-600">{rule.calculationType}</td><td className="px-5 py-4 font-semibold text-slate-800">{rule.amount}</td><td className="px-5 py-4"><StatusBadge status={rule.status} /></td><td className="px-5 py-4 whitespace-nowrap text-slate-600">{rule.period}</td><td className="px-5 py-4 text-slate-600">{rule.createdBy}</td><td className="px-5 py-4 whitespace-nowrap text-slate-600">{rule.updatedAt}</td><td className="px-5 py-4"><div className="flex items-center gap-1"><button title="View rule" onClick={() => setViewingRule(rule)} className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"><Eye className="h-4 w-4" /></button><button title="Edit rule" onClick={() => startEdit(rule)} className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"><Pencil className="h-4 w-4" /></button><button title="Clone rule" onClick={() => cloneRule(rule)} className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"><Copy className="h-4 w-4" /></button><button title="Delete rule" onClick={() => removeRule(rule.id)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div>
          {visibleRules.length === 0 && <div className="p-12 text-center text-sm text-slate-500">No referral rules match your search.</div>}
          <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-500">Showing {visibleRules.length} of {rules.length} rules</div>
        </motion.section>

        {viewingRule && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 p-4" role="dialog" aria-modal="true" aria-label="Referral rule details"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">{viewingRule.id}</p><h3 className="mt-1 text-xl font-bold text-slate-800">{viewingRule.name}</h3></div><button onClick={() => setViewingRule(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="mt-6 grid grid-cols-2 gap-4 text-sm"><div><p className="text-slate-500">Referral Type</p><p className="mt-1 font-semibold">{viewingRule.referralType}</p></div><div><p className="text-slate-500">Calculation</p><p className="mt-1 font-semibold">{viewingRule.calculationType}</p></div><div><p className="text-slate-500">Amount</p><p className="mt-1 font-semibold">{viewingRule.amount}</p></div><div><p className="text-slate-500">Status</p><div className="mt-1"><StatusBadge status={viewingRule.status} /></div></div><div className="col-span-2"><p className="text-slate-500">Effective Period</p><p className="mt-1 font-semibold">{viewingRule.period}</p></div></div><div className="mt-6 flex justify-end"><Button variant="secondary" onClick={() => setViewingRule(null)}>Close</Button></div></div></div>}
      </div>
    </main>
  );
}
