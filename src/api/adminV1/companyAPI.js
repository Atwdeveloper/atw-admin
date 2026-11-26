import javaApi, { unwrap } from "../javaApi";

// Java company endpoints (/admin/companies/**). Admin side only — company
// documents and the company-user login flow are a separate, not-yet-built module.
//
// Conventions:
// - Status: PENDING_VERIFICATION | ACTIVE | SUSPENDED | REJECTED. Changes always
//   name an explicit target (company.manage_status). Allowed:
//   PENDING_VERIFICATION <-> REJECTED, PENDING_VERIFICATION -> ACTIVE,
//   ACTIVE <-> SUSPENDED. A reason is required for SUSPENDED/REJECTED.
//   SUSPENDED/REJECTED disables every login account of the company.
// - Delete is a soft delete and is refused while the company is ACTIVE.
// - GST/PAN come back masked unless the caller holds company.view_sensitive.
//   They can only be set on create — there is no endpoint to change them.
// - Bulk endpoints process each id independently: { successCount, failures: [{ id, reason }] }.

const BASE = "/admin/companies";

export const COMPANY_STATUSES = ["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "REJECTED"];
export const ADDRESS_TYPES = ["REGISTERED_OFFICE", "BRANCH"];

// Spring binds repeated params (status=A&status=B), not axios' default status[]=A.
const repeatParams = { indexes: null };

// ---- Profile ----------------------------------------------------------------
// params: { status[], industryId[], stateId[], cityId[], search, gstVerified,
//           createdFrom, createdTo (YYYY-MM-DD), page (0-based), size,
//           sort: "name|companyCode|status|createdAt,dir" }
// -> paged CompanySummaryResponse { id, companyCode, name, industryId, status, createdAt }
export const getCompaniesAPI = (params = {}, options = {}) =>
  javaApi
    .get(BASE, { params, paramsSerializer: repeatParams, signal: options.signal })
    .then(unwrap);

// CompanyResponse { id, companyCode, name, industryId, gstNumber, panNumber,
//   gstVerifiedAt, gstVerificationRef, status, statusReason,
//   owner: { id, name, email }, addresses: CompanyAddress[], createdAt }
export const getCompanyAPI = (id) => javaApi.get(`${BASE}/${id}`).then(unwrap);

// body: { name, industryId, gstNumber?, panNumber?, addresses?: [address + addressType],
//         ownerName, ownerEmail, ownerPhone? }
// Also creates the OWNER login account and emails them an invite.
export const createCompanyAPI = (body) => javaApi.post(BASE, body).then(unwrap);

// body: { name, industryId } — nothing else is editable here.
export const updateCompanyAPI = (id, body) => javaApi.put(`${BASE}/${id}`, body).then(unwrap);

// filters: { ids? } or the list's filter fields. Returns an .xlsx Blob.
export const exportCompaniesAPI = (filters = {}) =>
  javaApi.post(`${BASE}/export`, filters, { responseType: "blob" }).then((r) => r.data);

// ---- Status -----------------------------------------------------------------
export const changeCompanyStatusAPI = (id, status, reason) =>
  javaApi.post(`${BASE}/${id}/status`, { status, reason: reason || undefined }).then(unwrap);

export const bulkChangeCompanyStatusAPI = (ids, status, reason) =>
  javaApi.post(`${BASE}/bulk-status`, { ids, status, reason: reason || undefined }).then(unwrap);

// -> paged { content: [{ id, fromStatus, toStatus, reason, changedBy, changedAt }] }, newest first
//    changedBy: { id, name, userType: "ADMIN" | "SYSTEM" | "COMPANY" } — render with <ActorName>
export const getCompanyStatusHistoryAPI = (id, params = {}) =>
  javaApi.get(`${BASE}/${id}/status-history`, { params }).then(unwrap);

// ---- GST verification (company.edit) -----------------------------------------
// Verifies the GST number on file. -> CompanyResponse with gstVerifiedAt set.
// 422 when the provider says invalid/inactive or is unreachable.
export const verifyCompanyGstAPI = (id) => javaApi.post(`${BASE}/${id}/gst-verify`).then(unwrap);

// ---- Addresses ----------------------------------------------------------------
// CompanyAddress { id, addressType, primary, line1, line2, stateId, cityId, pincode }
// Exactly one is primary once any exist. Setting primary demotes the old one;
// the current primary can't be unset directly; the last address can't be
// deleted; deleting the primary promotes the next-oldest.
export const getCompanyAddressesAPI = (id) => javaApi.get(`${BASE}/${id}/addresses`).then(unwrap);
// body: { addressType, primary, line1, line2?, stateId, cityId, pincode }
export const addCompanyAddressAPI = (id, body) =>
  javaApi.post(`${BASE}/${id}/addresses`, body).then(unwrap);
// body: same minus addressType (fixed once created)
export const updateCompanyAddressAPI = (id, addressId, body) =>
  javaApi.put(`${BASE}/${id}/addresses/${addressId}`, body).then(unwrap);
export const deleteCompanyAddressAPI = (id, addressId) =>
  javaApi.delete(`${BASE}/${id}/addresses/${addressId}`).then(unwrap);

// ---- Deletion (soft; refused while ACTIVE) ------------------------------------
export const deleteCompanyAPI = (id) => javaApi.delete(`${BASE}/${id}`).then(unwrap);
export const bulkDeleteCompaniesAPI = (ids) => javaApi.post(`${BASE}/bulk-delete`, { ids }).then(unwrap);
