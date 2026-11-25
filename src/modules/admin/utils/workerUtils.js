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

// Status buttons per current status — a guide for the admin; the backend
// rejects anything it doesn't allow (with a readable message).
// Suspend / Deactivate / Blacklist need a reason; going back to ACTIVE doesn't.
export const REASON_REQUIRED = ["SUSPENDED", "INACTIVE", "BLACKLISTED"];

const SUSPEND = { status: "SUSPENDED", label: "Suspend" };
const DEACTIVATE = { status: "INACTIVE", label: "Deactivate" };
const BLACKLIST = { status: "BLACKLISTED", label: "Blacklist" };
const REACTIVATE = { status: "ACTIVE", label: "Reactivate" };

const STATUS_ACTIONS = {
  ACTIVE: [SUSPEND, DEACTIVATE, BLACKLIST],
  SUSPENDED: [REACTIVATE, BLACKLIST],
  INACTIVE: [REACTIVATE, BLACKLIST],
  BLACKLISTED: [{ status: "ACTIVE", label: "Remove from Blacklist" }],
  REGISTERED: [DEACTIVATE, BLACKLIST],
  KYC_PENDING: [DEACTIVATE, BLACKLIST],
};

// -> [{ status, label, danger }]
export const workerStatusActions = (current) =>
  (STATUS_ACTIONS[current] || []).map((a) => ({ ...a, danger: REASON_REQUIRED.includes(a.status) }));

const CONFIRM_TEXT = {
  ACTIVE: "The worker will be set back to Active.",
  SUSPENDED: "The worker will be suspended.",
  INACTIVE: "The worker will be deactivated.",
  BLACKLISTED: "The worker will be blacklisted.",
};

// Confirms a status change; asks for the (required) reason where needed.
// Resolves { reason } or null if cancelled.
export const confirmWorkerStatus = async ({ status, label }) => {
  const needsReason = REASON_REQUIRED.includes(status);
  const result = await Swal.fire({
    title: `${label} this worker?`,
    text: CONFIRM_TEXT[status],
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: `Yes, ${label.toLowerCase()}`,
    confirmButtonColor: needsReason ? "#d33" : "#16a34a",
    ...(needsReason
      ? {
          input: "textarea",
          inputLabel: "Reason (required)",
          inputPlaceholder: "Why is the status changing?",
          inputAttributes: { maxlength: "500" },
          inputValidator: (v) => (!v?.trim() ? "A reason is required." : undefined),
        }
      : {}),
  });
  if (!result.isConfirmed) return null;
  return { reason: needsReason ? result.value.trim() : undefined };
};

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

// Summary dialog for the bulk endpoints' { successCount, failures[] } result,
// with failures grouped by reason.
export const showBulkSummary = ({ title, verb, result, nameOf, noun = ["worker", "workers"] }) => {
  const successCount = result?.successCount ?? 0;
  const failures = result?.failures || [];
  if (failures.length === 0) {
    Swal.fire({
      icon: "success",
      title: "Done!",
      text: `${successCount} ${successCount === 1 ? noun[0] : noun[1]} ${verb}.`,
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
