"use client";

// Who made a change, from status-history `changedBy` / notes `createdBy`:
//   { id, name, userType: "ADMIN" | "SYSTEM" | "COMPANY" }
// Older responses sent a plain string (an email or raw id), and company status
// history used `changedByAdminEmail` — both still render.

export const actorName = (actor) => {
  if (!actor) return "";
  if (typeof actor === "string") return actor;
  return actor.name || (actor.userType === "SYSTEM" ? "System" : "") || actor.id || "";
};

export const isSystemActor = (actor) =>
  !!actor && typeof actor === "object" && actor.userType === "SYSTEM";

const TYPE_BADGE = {
  SYSTEM: { label: "System", className: "bg-slate-200 text-slate-700" },
  COMPANY: { label: "Company", className: "bg-amber-100 text-amber-800" },
};

// "Rahul Prajapat", or a small "System" badge for automatic changes (e.g. KYC
// auto-verification), or the name plus a "Company" badge for company users.
const ActorName = ({ actor, prefix = "" }) => {
  const name = actorName(actor);
  if (!name) return null;
  const badge = typeof actor === "object" ? TYPE_BADGE[actor.userType] : null;

  if (isSystemActor(actor)) {
    return (
      <span className="inline-flex items-center gap-1">
        {prefix}
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${badge.className}`}>
          {badge.label}
        </span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      {prefix}
      {name}
      {badge && (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${badge.className}`}>
          {badge.label}
        </span>
      )}
    </span>
  );
};

export default ActorName;
