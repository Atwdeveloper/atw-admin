// Helpers for the scoped /filter-options endpoints (workers, staff, minimum
// wage). Each returns only the values actually in use, e.g.
//   { states: [{ id, name }], industries: [...], statuses: ["ACTIVE", ...] }
// Items may be { id, name } objects or plain values (enum strings).

// Normalises one item to { id, name, ...rest }.
const toOption = (item) => {
  if (item == null) return null;
  if (typeof item !== "object") return { id: item, name: String(item) };
  const id = item.id ?? item.value ?? item.key ?? item.code;
  const name = item.name ?? item.label ?? item.value ?? String(id);
  return { ...item, id, name };
};

// The list stored under the first key present in `res` (null when none is),
// so callers can tell "not provided" apart from "nothing in use".
export const readFilterOptions = (res, ...keys) => {
  const data = res?.data && !Array.isArray(res.data) ? res.data : res;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key].map(toOption).filter(Boolean);
  }
  return null;
};

// Narrows `options` ({ key|id, ... }) to the values listed in `inUse`.
// Leaves it unchanged when the endpoint didn't provide that list.
export const onlyInUse = (options, inUse, idKey = "key") => {
  if (!inUse) return options;
  const ids = new Set(inUse.map((o) => String(o.id)));
  return options.filter((o) => !o[idKey] || ids.has(String(o[idKey])));
};

// City options for the selected states, from a scoped city list that carries
// stateId. Returns null when the list isn't usable, so the caller can fall
// back to loading cities per state.
export const citiesForStates = (scopedCities, stateIds) => {
  if (!scopedCities || scopedCities.some((c) => c.stateId == null)) return null;
  const wanted = new Set(stateIds.map(String));
  return scopedCities.filter((c) => wanted.has(String(c.stateId)));
};
