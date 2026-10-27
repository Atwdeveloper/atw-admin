"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  Percent,
  IndianRupee,
  ShieldCheck,
  ShieldOff,
  Users,
  Building2,
  Settings2,
  ToggleLeft,
} from "lucide-react";

import Breadcrumb from "../../../../common/components/Breadcrumb";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";

/**
 * State keys below match `referral_settings` table columns 1:1
 * (see xxxx_xx_xx_add_fraud_recurring_general_to_referral_settings.php
 * and the ReferralSetting model's $fillable list).
 *
 * TODO: Replace mock state with a real hook, e.g.
 * const { settings, setSettings, saveSettings, loading } = useReferralSettings();
 * `saveSettings` -> POST /api/referral-settings with `settings` as-is
 * (no key mapping needed since these are the exact DB column names).
 * Initial value below would come from GET /api/referral-settings.
 */
const INITIAL_SETTINGS = {
  // Worker -> Worker reward
  worker_reward_type: "fixed", // enum: fixed | percentage
  worker_reward_value: 200,

  // Worker release conditions
  require_registration: true,
  require_kyc: true,
  require_company_join: true,
  require_salary: true,
  worker_admin_approval: true,

  // Worker fraud prevention
  worker_block_self_referral: true,
  worker_block_duplicate_mobile: true,
  worker_block_duplicate_device: true,
  worker_minimum_salary: 1000,

  // Agent -> Worker commission
  agent_worker_commission_type: "percentage", // enum: fixed | percentage
  agent_worker_commission_value: 10,
  agent_worker_recurring: "monthly", // enum: onetime | monthly | quarterly | yearly
  agent_worker_require_invoice_paid: true,

  // Agent -> Company commission
  agent_company_commission_type: "percentage", // enum: fixed | percentage
  agent_company_commission_value: 5,
  agent_company_recurring: "monthly", // enum: onetime | monthly | quarterly | yearly
  agent_company_require_approval: true,
  agent_company_require_vacancy: true,
  agent_company_require_invoice_generated: true,
  agent_company_require_invoice_paid: true,

  // General master switches
  general_enabled: true,
  general_worker_referral: true,
  general_agent_referral: true,
  general_company_referral: true,
  general_allow_referral_code: true,
  general_auto_release: false,
  general_require_approval: true,
};

const RECURRING_OPTIONS = [
  { value: "onetime", label: "One Time" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

/* -------------------------------------------------------------------------
 * Reusable primitives (unchanged from original layout)
 * ---------------------------------------------------------------------- */

const ToggleSwitch = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between gap-4 py-2.5">
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {description ? (
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      ) : null}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? "bg-blue-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  </div>
);

const RadioButtonGroup = ({ name, options, value, onChange }) => (
  <div className="flex flex-wrap items-center gap-5">
    {options.map((option) => {
      const isActive = value === option.value;
      return (
        <label
          key={option.value}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <span
            className={`flex items-center justify-center w-4 h-4 rounded-full border-2 transition-colors ${
              isActive ? "border-blue-600" : "border-gray-300"
            }`}
          >
            {isActive ? (
              <span className="w-2 h-2 rounded-full bg-blue-600" />
            ) : null}
          </span>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={isActive}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          <span
            className={`text-sm ${
              isActive ? "text-gray-800 font-medium" : "text-gray-500"
            }`}
          >
            {option.label}
          </span>
        </label>
      );
    })}
  </div>
);

const NumberInput = ({ label, value, onChange, prefix, placeholder }) => (
  <div>
    {label ? (
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        {label}
      </label>
    ) : null}
    <div className="relative">
      {prefix ? (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
          {prefix}
        </span>
      ) : null}
      <input
        type="number"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full ${
          prefix ? "pl-8" : "pl-3"
        } pr-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
      />
    </div>
  </div>
);

const SelectInput = ({ label, value, onChange, options }) => (
  <div>
    {label ? (
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        {label}
      </label>
    ) : null}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const SectionLabel = ({ children }) => (
  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
    {children}
  </p>
);

const StatCard = ({ icon: Icon, label, value, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
    <div
      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
    >
      <Icon className={`w-6 h-6 ${iconColor}`} />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const SettingCard = ({ icon: Icon, title, subtitle, children }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -2 }}
    transition={{ type: "spring", stiffness: 300, damping: 24 }}
    className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5"
  >
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>

    <div className="flex flex-col gap-5">{children}</div>
  </motion.div>
);

/* -------------------------------------------------------------------------
 * Page
 * ---------------------------------------------------------------------- */

const ReferralSettings = () => {
  const [settings, setSettings] = useState(INITIAL_SETTINGS);

  /* Single flat patch helper — state keys already equal DB column names,
     so this maps directly onto a PATCH/POST payload with no transform. */
  const patch = (key, value) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    // POST /api/referral-settings  body: settings  (1:1 with DB columns)
    // eslint-disable-next-line no-console
    console.log(settings);
  };

  const handleCancel = () => {
    setSettings(INITIAL_SETTINGS);
  };

  /* ---------- derived summary values ---------- */

  const summary = useMemo(() => {
    const fraudEnabled =
      settings.worker_block_self_referral ||
      settings.worker_block_duplicate_mobile ||
      settings.worker_block_duplicate_device;

    const fmt = (type, value) =>
      type === "percentage" ? `${value}%` : `₹${value}`;

    return {
      workerReward: fmt(settings.worker_reward_type, settings.worker_reward_value),
      agentCommission: fmt(
        settings.agent_worker_commission_type,
        settings.agent_worker_commission_value,
      ),
      companyCommission: fmt(
        settings.agent_company_commission_type,
        settings.agent_company_commission_value,
      ),
      fraudEnabled,
    };
  }, [settings]);

  return (
    <motion.div
      className="flex-1 bg-gray-50 p-4 pb-28"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Breadcrumb
        items={[
          { label: "Referral Management", path: "/admin/referrals/manage" },
          { label: "Referral Settings" },
        ]}
      />

      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Referral Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure worker rewards, agent commissions and referral
          eligibility rules.
        </p>
      </motion.div>

      {/* Top Summary */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6"
      >
        <StatCard
          icon={Wallet}
          label="Worker Reward"
          value={summary.workerReward}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={Percent}
          label="Agent Commission"
          value={summary.agentCommission}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          icon={IndianRupee}
          label="Company Commission"
          value={summary.companyCommission}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          icon={summary.fraudEnabled ? ShieldCheck : ShieldOff}
          label="Fraud Protection"
          value={summary.fraudEnabled ? "Enabled" : "Disabled"}
          iconBg={summary.fraudEnabled ? "bg-blue-100" : "bg-gray-100"}
          iconColor={summary.fraudEnabled ? "text-blue-600" : "text-gray-500"}
        />
      </motion.div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Card 1: Worker -> Worker Reward */}
        <SettingCard
          icon={Users}
          title="Worker → Worker Reward"
          subtitle="Reward given to a worker for referring another worker"
        >
          <div>
            <SectionLabel>Reward Type</SectionLabel>
            <RadioButtonGroup
              name="worker-reward-type"
              value={settings.worker_reward_type}
              onChange={(value) => patch("worker_reward_type", value)}
              options={[
                { value: "fixed", label: "Fixed Amount" },
                { value: "percentage", label: "Percentage" },
              ]}
            />
          </div>

          <NumberInput
            label="Reward Value"
            value={settings.worker_reward_value}
            placeholder="200"
            prefix={settings.worker_reward_type === "percentage" ? "%" : "₹"}
            onChange={(value) => patch("worker_reward_value", value)}
          />

          <div>
            <SectionLabel>Release Conditions</SectionLabel>
            <div className="divide-y divide-gray-100">
              <ToggleSwitch
                label="Registration Completed"
                checked={settings.require_registration}
                onChange={(v) => patch("require_registration", v)}
              />
              <ToggleSwitch
                label="KYC Completed"
                checked={settings.require_kyc}
                onChange={(v) => patch("require_kyc", v)}
              />
              <ToggleSwitch
                label="Joined Company"
                checked={settings.require_company_join}
                onChange={(v) => patch("require_company_join", v)}
              />
              <ToggleSwitch
                label="First Salary Earned"
                checked={settings.require_salary}
                onChange={(v) => patch("require_salary", v)}
              />
              <ToggleSwitch
                label="Manual Admin Approval"
                checked={settings.worker_admin_approval}
                onChange={(v) => patch("worker_admin_approval", v)}
              />
            </div>
          </div>

          <div>
            <SectionLabel>Fraud Prevention</SectionLabel>
            <div className="divide-y divide-gray-100">
              <ToggleSwitch
                label="Block Self Referral"
                checked={settings.worker_block_self_referral}
                onChange={(v) => patch("worker_block_self_referral", v)}
              />
              <ToggleSwitch
                label="Block Duplicate Mobile"
                checked={settings.worker_block_duplicate_mobile}
                onChange={(v) => patch("worker_block_duplicate_mobile", v)}
              />
              <ToggleSwitch
                label="Block Duplicate Device"
                checked={settings.worker_block_duplicate_device}
                onChange={(v) => patch("worker_block_duplicate_device", v)}
              />
            </div>
            <div className="mt-3">
              <NumberInput
                label="Minimum Salary Required"
                value={settings.worker_minimum_salary}
                prefix="₹"
                onChange={(v) => patch("worker_minimum_salary", v)}
              />
            </div>
          </div>
        </SettingCard>

        {/* Card 2: Agent -> Worker Commission */}
        <SettingCard
          icon={Building2}
          title="Agent → Worker Commission"
          subtitle="Commission paid to an agent for referring a worker"
        >
          <div>
            <SectionLabel>Commission Type</SectionLabel>
            <RadioButtonGroup
              name="agent-worker-commission-type"
              value={settings.agent_worker_commission_type}
              onChange={(value) => patch("agent_worker_commission_type", value)}
              options={[
                { value: "fixed", label: "Fixed" },
                { value: "percentage", label: "Percentage" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberInput
              label="Commission Value"
              value={settings.agent_worker_commission_value}
              prefix={
                settings.agent_worker_commission_type === "percentage"
                  ? "%"
                  : "₹"
              }
              onChange={(value) => patch("agent_worker_commission_value", value)}
            />
            <SelectInput
              label="Recurring Type"
              value={settings.agent_worker_recurring}
              options={RECURRING_OPTIONS}
              onChange={(value) => patch("agent_worker_recurring", value)}
            />
          </div>

          <div>
            <SectionLabel>Release Condition</SectionLabel>
            <div className="divide-y divide-gray-100">
              <ToggleSwitch
                label="Invoice Paid"
                checked={settings.agent_worker_require_invoice_paid}
                onChange={(v) => patch("agent_worker_require_invoice_paid", v)}
              />
            </div>
          </div>
        </SettingCard>

        {/* Card 3: Agent -> Company Commission */}
        <SettingCard
          icon={Building2}
          title="Agent → Company Commission"
          subtitle="Commission paid to an agent for referring a company"
        >
          <div>
            <SectionLabel>Commission Type</SectionLabel>
            <RadioButtonGroup
              name="agent-company-commission-type"
              value={settings.agent_company_commission_type}
              onChange={(value) => patch("agent_company_commission_type", value)}
              options={[
                { value: "fixed", label: "Fixed" },
                { value: "percentage", label: "Percentage" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberInput
              label="Commission Value"
              value={settings.agent_company_commission_value}
              prefix={
                settings.agent_company_commission_type === "percentage"
                  ? "%"
                  : "₹"
              }
              onChange={(value) => patch("agent_company_commission_value", value)}
            />
            <SelectInput
              label="Recurring Type"
              value={settings.agent_company_recurring}
              options={RECURRING_OPTIONS}
              onChange={(value) => patch("agent_company_recurring", value)}
            />
          </div>

          <div>
            <SectionLabel>Release Conditions</SectionLabel>
            <div className="divide-y divide-gray-100">
              <ToggleSwitch
                label="Company Approved"
                checked={settings.agent_company_require_approval}
                onChange={(v) => patch("agent_company_require_approval", v)}
              />
              <ToggleSwitch
                label="Vacancy Created"
                checked={settings.agent_company_require_vacancy}
                onChange={(v) => patch("agent_company_require_vacancy", v)}
              />
              <ToggleSwitch
                label="Invoice Generated"
                checked={settings.agent_company_require_invoice_generated}
                onChange={(v) =>
                  patch("agent_company_require_invoice_generated", v)
                }
              />
              <ToggleSwitch
                label="Invoice Paid"
                checked={settings.agent_company_require_invoice_paid}
                onChange={(v) => patch("agent_company_require_invoice_paid", v)}
              />
            </div>
          </div>
        </SettingCard>

        {/* Card 4: General Referral Rules */}
        <SettingCard
          icon={Settings2}
          title="General Referral Rules"
          subtitle="Global switches that control the referral system"
        >
          <div className="divide-y divide-gray-100">
            <ToggleSwitch
              label="Enable Referral System"
              description="Master switch for all referral types"
              checked={settings.general_enabled}
              onChange={(v) => patch("general_enabled", v)}
            />
            <ToggleSwitch
              label="Enable Worker Referral"
              checked={settings.general_worker_referral}
              onChange={(v) => patch("general_worker_referral", v)}
            />
            <ToggleSwitch
              label="Enable Agent Referral"
              checked={settings.general_agent_referral}
              onChange={(v) => patch("general_agent_referral", v)}
            />
            <ToggleSwitch
              label="Enable Company Referral"
              checked={settings.general_company_referral}
              onChange={(v) => patch("general_company_referral", v)}
            />
            <ToggleSwitch
              label="Allow Referral Code Sharing"
              checked={settings.general_allow_referral_code}
              onChange={(v) => patch("general_allow_referral_code", v)}
            />
            <ToggleSwitch
              label="Auto Release Rewards"
              description="Skip manual approval once conditions are met"
              checked={settings.general_auto_release}
              onChange={(v) => patch("general_auto_release", v)}
            />
            <ToggleSwitch
              label="Require Admin Approval"
              checked={settings.general_require_approval}
              onChange={(v) => patch("general_require_approval", v)}
            />
          </div>
        </SettingCard>
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] px-4 py-3 z-20">
        <div className="flex items-center justify-end gap-3 max-w-6xl ml-auto">
          <button
            onClick={handleCancel}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <ToggleLeft size={16} />
            Save Settings
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ReferralSettings;