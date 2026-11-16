import javaApi, { unwrap } from "../javaApi";

// Seeded, read-only lookups for address dropdowns. Any signed-in admin can
// call these — no specific permission.

// -> [{ id, name, code }] sorted by name
export const getStatesAPI = () => javaApi.get("/masterdata/states").then(unwrap);

// -> [{ id, name }] sorted by name. An unknown stateId returns [], not a 404.
export const getCitiesAPI = (stateId) =>
  javaApi.get(`/masterdata/states/${stateId}/cities`).then(unwrap);
