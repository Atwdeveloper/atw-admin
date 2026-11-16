import Swal from "sweetalert2";
import { apiError } from "../../../api/javaApi";

export const STATUS_META = {
  REGISTERED: { label: "Registered", className: "bg-blue-100 text-blue-800" },
  KYC_PENDING: { label: "KYC Pending", className: "bg-amber-100 text-amber-800" },
  ACTIVE: { label: "Active", className: "bg-green-100 text-green-800" },
  SUSPENDED: { label: "Suspended", className: "bg-orange-100 text-orange-800" },
  INACTIVE: { label: "Inactive", className: "bg-gray-200 text-gray-700" },
  BLACKLISTED: { label: "Blacklisted", className: "bg-red-100 text-red-800" },
};

export const KYC_META = {
  NOT_STARTED: { label: "Not Started", className: "bg-gray-100 text-gray-600" },
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-800" },
  VERIFIED: { label: "Verified", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800" },
};

// Lookup responses as an array — tolerates a paged { content: [...] } body or
// an unexpected shape instead of crashing on .find/.filter.
export const asList = (value) =>
  Array.isArray(value) ? value : Array.isArray(value?.content) ? value.content : [];

export const statusLabel =(status) => STATUS_META[status]?.label || status || "—";
export const kycLabel = (status) => KYC_META[status]?.label || status || "—";

export const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

export const fullName = (w) =>
  [w?.firstName, w?.middleName, w?.lastName].filter(Boolean).join(" ") || "—";

// Statuses an admin can set by hand. REGISTERED/KYC_PENDING are reached only
// automatically, and ACTIVE only from SUSPENDED/INACTIVE (otherwise via KYC).
const SETTABLE = ["ACTIVE", "SUSPENDED", "INACTIVE", "BLACKLISTED"];
const REASON_REQUIRED = ["SUSPENDED", "INACTIVE", "BLACKLISTED"];

export const allowedTargets = (current) =>
  SETTABLE.filter((s) => {
    if (s === current) return false;
    if (s === "ACTIVE") return !current || ["SUSPENDED", "INACTIVE"].includes(current);
    return true;
  });

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

// Asks for an explicit target status (+ reason where required).
// Resolves { status, reason } or null if cancelled. `current` is omitted for bulk.
export const promptStatusChange = async ({ current, count } = {}) => {
  const targets = allowedTargets(current);
  if (targets.length === 0) {
    Swal.fire({
      icon: "info",
      title: "No status change available",
      text: "A worker in this status becomes Active only by completing KYC verification.",
    });
    return null;
  }
  const subject = count ? `${count} selected worker${count > 1 ? "s" : ""}` : "this worker";
  const result = await Swal.fire({
    title: "Change Status",
    html: `
      <div class="text-left space-y-3">
        ${current ? `<p class="text-sm text-gray-600">Current status: <b>${escapeHtml(statusLabel(current))}</b></p>` : ""}
        <label class="block text-sm font-medium text-gray-700">New status for ${escapeHtml(subject)}</label>
        <select id="worker-status-target" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          ${targets.map((s) => `<option value="${s}">${escapeHtml(statusLabel(s))}</option>`).join("")}
        </select>
        <label class="block text-sm font-medium text-gray-700">Reason <span id="worker-status-reason-hint" class="text-xs text-gray-500"></span></label>
        <textarea id="worker-status-reason" rows="3" maxlength="500" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Why is the status changing?"></textarea>
        <p class="text-xs text-gray-500">Blacklisting a worker, or reversing a blacklist, needs a super-admin.</p>
      </div>`,
    showCancelButton: true,
    confirmButtonText: "Change Status",
    confirmButtonColor: "#2563eb",
    focusConfirm: false,
    didOpen: () => {
      const select = document.getElementById("worker-status-target");
      const hint = document.getElementById("worker-status-reason-hint");
      const sync = () => {
        hint.textContent = REASON_REQUIRED.includes(select.value) ? "(required)" : "(optional)";
      };
      select.addEventListener("change", sync);
      sync();
    },
    preConfirm: () => {
      const status = document.getElementById("worker-status-target").value;
      const reason = document.getElementById("worker-status-reason").value.trim();
      if (REASON_REQUIRED.includes(status) && !reason) {
        Swal.showValidationMessage(`A reason is required when setting status to ${statusLabel(status)}.`);
        return false;
      }
      return { status, reason };
    },
  });
  return result.isConfirmed ? result.value : null;
};

// Summary dialog for the bulk endpoints' { successCount, failures[] } result,
// with failures grouped by reason.
export const showBulkSummary = ({ title, verb, result, nameOf }) => {
  const successCount = result?.successCount ?? 0;
  const failures = result?.failures || [];
  if (failures.length === 0) {
    Swal.fire({
      icon: "success",
      title: "Done!",
      text: `${successCount} worker${successCount === 1 ? "" : "s"} ${verb}.`,
      timer: 1800,
      showConfirmButton: false,
    });
    return;
  }
  const groups = new Map();
  failures.forEach(({ id, reason }) => {
    const key = reason || "Unknown reason";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(id);
  });
  const groupsHtml = [...groups.entries()]
    .map(
      ([reason, ids]) => `
        <details class="bg-red-50 border border-red-200 rounded-lg p-2.5 mb-2" ${groups.size === 1 ? "open" : ""}>
          <summary class="cursor-pointer text-xs font-semibold text-red-800 flex items-center justify-between gap-2">
            <span>${escapeHtml(reason)}</span>
            <span class="px-1.5 py-0.5 bg-red-200 text-red-900 rounded-full text-[10px]">${ids.length}</span>
          </summary>
          <div class="mt-2 flex flex-wrap gap-1.5">
            ${ids.map((id) => `<span class="px-2 py-1 bg-white border border-red-200 text-red-700 rounded-full text-xs">${escapeHtml(nameOf(id))}</span>`).join("")}
          </div>
        </details>`,
    )
    .join("");
  Swal.fire({
    title,
    html: `
      <div class="text-left">
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="p-3 rounded-lg bg-green-50 border border-green-200">
            <p class="text-lg font-bold text-green-800 m-0">${successCount}</p>
            <p class="text-xs text-green-700 m-0">${escapeHtml(verb)}</p>
          </div>
          <div class="p-3 rounded-lg bg-red-50 border border-red-200">
            <p class="text-lg font-bold text-red-800 m-0">${failures.length}</p>
            <p class="text-xs text-red-700 m-0">Skipped</p>
          </div>
        </div>
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Skipped — grouped by reason</p>
        <div class="max-h-72 overflow-y-auto pr-1">${groupsHtml}</div>
      </div>`,
    confirmButtonText: "Got it",
    confirmButtonColor: "#2563eb",
    width: 520,
  });
};

// A blob request's error body is a Blob too — parse it back into the JSON
// envelope so apiError can read it.
export const blobApiError = async (err, fallback) => {
  const data = err?.response?.data;
  if (data instanceof Blob) {
    try {
      err.response.data = JSON.parse(await data.text());
    } catch {
      /* not JSON — fall through to the generic message */
    }
  }
  return apiError(err, fallback);
};

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const formatDate = (value, withTime = false) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};
