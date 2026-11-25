import Swal from "sweetalert2";

export const COMPANY_STATUS_META = {
  PENDING_VERIFICATION: { label: "Pending Verification", className: "bg-amber-100 text-amber-800" },
  ACTIVE: { label: "Active", className: "bg-green-100 text-green-800" },
  SUSPENDED: { label: "Suspended", className: "bg-orange-100 text-orange-800" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800" },
};

export const companyStatusLabel = (status) => COMPANY_STATUS_META[status]?.label || status || "—";

export const ADDRESS_TYPE_LABELS = { REGISTERED_OFFICE: "Registered Office", BRANCH: "Branch" };
export const addressTypeLabel = (type) => ADDRESS_TYPE_LABELS[type] || type || "—";

// The backend's allowed transitions.
const TRANSITIONS = {
  PENDING_VERIFICATION: ["ACTIVE", "REJECTED"],
  ACTIVE: ["SUSPENDED"],
  SUSPENDED: ["ACTIVE"],
  REJECTED: ["PENDING_VERIFICATION"],
};
export const REASON_REQUIRED = ["SUSPENDED", "REJECTED"];

// Row/modal actions per current status: { status, label, tone }.
const ACTION_LABELS = {
  PENDING_VERIFICATION: { ACTIVE: "Approve", REJECTED: "Reject" },
  ACTIVE: { SUSPENDED: "Suspend" },
  SUSPENDED: { ACTIVE: "Reactivate" },
  REJECTED: { PENDING_VERIFICATION: "Move back to Pending" },
};
export const statusActions = (current) =>
  (TRANSITIONS[current] || []).map((status) => ({
    status,
    label: ACTION_LABELS[current]?.[status] || companyStatusLabel(status),
    danger: REASON_REQUIRED.includes(status),
  }));

const CONFIRM_TEXT = {
  ACTIVE: "The company will be set to Active and its users can log in.",
  SUSPENDED: "The company will be suspended. All of its users are logged out and can't log in.",
  REJECTED: "The company will be rejected. All of its users are logged out and can't log in.",
  PENDING_VERIFICATION: "The company will go back to Pending Verification.",
};

// Confirms a status change and, for SUSPENDED/REJECTED, asks for the reason
// (the backend requires one). Resolves { reason } or null if cancelled.
export const confirmCompanyStatus = async ({ status, label, subject = "this company" }) => {
  const needsReason = REASON_REQUIRED.includes(status);
  const result = await Swal.fire({
    title: `${label} ${subject}?`,
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

// Formats.
export const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

// "line1, line2, City, State pincode" with names from { states, cities } id->name maps.
export const describeCompanyAddress = (addr, geo = { states: {}, cities: {} }) => {
  if (!addr) return "";
  return [
    addr.line1,
    addr.line2,
    geo.cities[addr.cityId],
    [geo.states[addr.stateId], addr.pincode].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
};
