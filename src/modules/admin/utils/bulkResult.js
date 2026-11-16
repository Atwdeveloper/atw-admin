import Swal from "sweetalert2";

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

// Shows the result of a backend bulk endpoint ({ successCount, failures: [{ id, reason }] }).
// - noun: singular label, e.g. "industry" (pluralised with nounPlural or +"s")
// - verb: past tense, e.g. "deleted", "activated"
// - nameOf(id): display name for a failed id
// Failures are grouped by reason so many skips collapse into a few groups.
export const showBulkResult = ({ result, noun = "item", nounPlural, verb, nameOf = (id) => id }) => {
  const successCount = result?.successCount ?? 0;
  const failures = result?.failures || [];
  const plural = (n) => (n === 1 ? noun : nounPlural || `${noun}s`);

  if (failures.length === 0) {
    return Swal.fire({
      icon: "success",
      title: "Done!",
      text: `${successCount} ${plural(successCount)} ${verb}.`,
      timer: 1800,
      showConfirmButton: false,
    });
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

  return Swal.fire({
    title: successCount ? "Partially done" : "Nothing changed",
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
