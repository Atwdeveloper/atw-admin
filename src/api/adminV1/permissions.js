// Helpers for the Java backend's permission codes ("module.action").

const LABEL_OVERRIDES = {
  admin_staff: "Staff",
  admin_roles: "Roles",
  esic_reports: "ESIC Reports",
  pf_reports: "PF Reports",
  view_kyc: "View KYC",
};

// "manage_company_workers" -> "Manage Company Workers"
export const humanize = (key = "") =>
  LABEL_OVERRIDES[key] ||
  key
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// Catalog from GET /admin/permissions -> the shape the role screens use:
// [{ module, module_label, actions: [{ action, label }] }]
export const catalogToModules = (catalog = []) =>
  catalog.map(({ module, permissions = [] }) => ({
    module,
    module_label: humanize(module),
    actions: permissions.map((p) => ({
      action: p.action,
      label: p.label && p.label !== p.action ? p.label : humanize(p.action),
    })),
  }));

// Flat codes -> the same grouped shape (labels from the catalog if given).
export const groupCodes = (codes = [], modules = []) => {
  const grouped = new Map();
  codes.forEach((code) => {
    const [module, action] = code.split(".");
    if (!module || !action) return;
    if (!grouped.has(module)) {
      const known = modules.find((m) => m.module === module);
      grouped.set(module, { module, module_label: known?.module_label || humanize(module), actions: [] });
    }
    const label =
      modules.find((m) => m.module === module)?.actions.find((a) => a.action === action)?.label ||
      humanize(action);
    grouped.get(module).actions.push({ action, label });
  });
  return [...grouped.values()];
};

// my-permissions response -> { module: [actions] }, or { "*": true } for a super-admin.
export const codesToPermissionMap = (codes = []) => {
  if (codes.includes("*")) return { "*": true };
  return codes.reduce((map, code) => {
    const [module, action] = code.split(".");
    if (module && action) (map[module] = map[module] || []).push(action);
    return map;
  }, {});
};
