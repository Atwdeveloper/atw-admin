import javaApi, { unwrap } from "../javaApi";

// Java worker endpoints (/admin/workers/**), plus the two modules nested under
// them: worker KYC (/kyc) and face enrollment (/face-enrollment).
//
// Conventions:
// - Worker status: REGISTERED | KYC_PENDING | ACTIVE | SUSPENDED | INACTIVE | BLACKLISTED.
//   Changes always name an explicit target; REGISTERED/KYC_PENDING are never
//   settable (reached only automatically). A reason is required for
//   SUSPENDED/BLACKLISTED/INACTIVE, and entering or leaving BLACKLISTED needs a
//   super-admin.
// - Delete is a soft delete and is refused while the worker is ACTIVE.
// - Address, bank detail, designations and skills are FULL replaces — a field
//   left out is cleared.
// - Aadhaar/PAN/bank account numbers come back masked unless the caller holds
//   kyc.view_sensitive.
// - Bulk endpoints process each id independently: { successCount, failures: [{ id, reason }] }.

const BASE = "/admin/workers";

export const WORKER_STATUSES = [
  "REGISTERED",
  "KYC_PENDING",
  "ACTIVE",
  "SUSPENDED",
  "INACTIVE",
  "BLACKLISTED",
];
export const KYC_STATUSES = ["NOT_STARTED", "PENDING", "VERIFIED", "REJECTED"];
export const SORTABLE_FIELDS = ["firstName", "lastName", "workerCode", "mobileNumber", "status", "createdAt"];

// Spring binds repeated params (status=A&status=B), not axios' default status[]=A.
const repeatParams = { indexes: null };

// ---- Worker profile -------------------------------------------------------
// params: { status[], departmentId[], industryId[], designationId[], skillId[],
//           kycStatus[], search, registeredFrom, registeredTo (YYYY-MM-DD),
//           page (0-based), size, sort: "field,dir" }
// -> { content: WorkerSummaryResponse[], page, size, totalElements, totalPages, first, last }
// WorkerSummaryResponse { id, workerCode, firstName, lastName, mobileNumber,
//   primaryDesignationName, status, kycStatus, hasProfilePhoto, faceEnrolledAt }
export const getWorkersAPI = (params = {}, options = {}) =>
  javaApi
    .get(BASE, { params, paramsSerializer: repeatParams, signal: options.signal })
    .then(unwrap);

// WorkerResponse { id, workerCode, firstName, middleName, lastName, gender,
//   dateOfBirth, mobileNumber, personalEmail, fatherName, workExperienceYears,
//   departmentId (nullable), industryId, status,
//   statusReason, profilePhotoUrl, designations: [{ id, name, primary }],
//   skills: [{ id, name }], kycStatus, faceEnrollment, createdAt }
export const getWorkerAPI = (id) => javaApi.get(`${BASE}/${id}`).then(unwrap);

// body: { firstName, middleName?, lastName, gender, dateOfBirth?, mobileNumber,
//   personalEmail?, fatherName?, workExperienceYears?, departmentId?, industryId?,
//   designationIds (1-3),
//   primaryDesignationId, skillIds?, aadhaarVerificationId? }
export const createWorkerAPI = (body) => javaApi.post(BASE, body).then(unwrap);

// body: same core profile fields as create, minus designations/skills.
export const updateWorkerAPI = (id, body) => javaApi.put(`${BASE}/${id}`, body).then(unwrap);

// filters: { ids? } or the same filter fields as the list. Returns a CSV Blob.
export const exportWorkersAPI = (filters = {}) =>
  javaApi.post(`${BASE}/export`, filters, { responseType: "blob" }).then((r) => r.data);

// ---- Status ---------------------------------------------------------------
export const changeWorkerStatusAPI = (id, status, reason) =>
  javaApi.post(`${BASE}/${id}/status`, { status, reason: reason || undefined }).then(unwrap);

export const bulkChangeWorkerStatusAPI = (ids, status, reason) =>
  javaApi.post(`${BASE}/bulk-status`, { ids, status, reason: reason || undefined }).then(unwrap);

// -> paged { content: [{ id, fromStatus, toStatus, reason, changedBy, changedAt }] }, newest first
export const getWorkerStatusHistoryAPI = (id, params = {}) =>
  javaApi.get(`${BASE}/${id}/status-history`, { params }).then(unwrap);

// ---- Designations & skills (full replace) ---------------------------------
export const replaceWorkerDesignationsAPI = (id, designationIds, primaryDesignationId) =>
  javaApi.put(`${BASE}/${id}/designations`, { designationIds, primaryDesignationId }).then(unwrap);

export const replaceWorkerSkillsAPI = (id, skillIds) =>
  javaApi.put(`${BASE}/${id}/skills`, { skillIds }).then(unwrap);

// ---- Aadhaar e-KYC bridge (existing worker) -------------------------------
export const completeWorkerAadhaarVerificationAPI = (id, verificationId) =>
  javaApi.put(`${BASE}/${id}/aadhaar-verification`, { verificationId }).then(unwrap);

// ---- Profile photo (PNG/JPEG/WEBP, max 2MB) --------------------------------
export const uploadWorkerPhotoAPI = (id, file) => {
  const body = new FormData();
  body.append("file", file);
  return javaApi
    .put(`${BASE}/${id}/photo`, body, { headers: { "Content-Type": "multipart/form-data" } })
    .then(unwrap);
};
export const removeWorkerPhotoAPI = (id) => javaApi.delete(`${BASE}/${id}/photo`).then(unwrap);

// ---- Address: type is PERMANENT (home) or CURRENT (working) -----------------
// { line1, line2, stateId, cityId, pincode, latitude, longitude, formattedAddress }
// GET returns an all-null row (not 404) when nothing is saved.
export const getWorkerAddressAPI = (id, type) =>
  javaApi.get(`${BASE}/${id}/address/${type}`).then(unwrap);
// body: { line1?, line2?, stateId?, cityId?, pincode? } — full replace
export const updateWorkerAddressAPI = (id, type, body) =>
  javaApi.put(`${BASE}/${id}/address/${type}`, body).then(unwrap);

// ---- Bank detail -----------------------------------------------------------
// { accountHolderName, bankName, accountNumber, ifscCode, branchName, verified, verifiedAt }
// accountNumber is masked unless the caller holds workers.view_bank_details.
export const getWorkerBankDetailAPI = (id) => javaApi.get(`${BASE}/${id}/bank-detail`).then(unwrap);
// Full replace; any change resets verified/verifiedAt.
export const updateWorkerBankDetailAPI = (id, body) =>
  javaApi.put(`${BASE}/${id}/bank-detail`, body).then(unwrap);
// POST /{id}/bank-detail/verify exists on the backend but is on hold here —
// not wired until its request/response shape is confirmed.

// ---- Notes (append-only; read needs workers.view_comments, add needs workers.edit)
// -> paged { content: [{ id, note, createdBy, createdAt }] }, newest first
export const getWorkerNotesAPI = (id, params = {}) =>
  javaApi.get(`${BASE}/${id}/notes`, { params }).then(unwrap);
export const addWorkerNoteAPI = (id, note) => javaApi.post(`${BASE}/${id}/notes`, { note }).then(unwrap);

// ---- Deletion (soft; refused while ACTIVE) ----------------------------------
export const deleteWorkerAPI = (id) => javaApi.delete(`${BASE}/${id}`).then(unwrap);
export const bulkDeleteWorkersAPI = (ids) => javaApi.post(`${BASE}/bulk-delete`, { ids }).then(unwrap);

// ---- Intake wizard (workers.create) -----------------------------------------
// Rate limited: 3 sends per number and 10 per IP in 10 minutes (422 when hit).
// -> { otpId, expiresInSeconds }
export const sendIntakeMobileOtpAPI = (mobileNumber) =>
  javaApi.post(`${BASE}/intake/mobile-otp`, { mobileNumber }).then(unwrap);
// -> null on success
export const verifyIntakeMobileOtpAPI = (otpId, code) =>
  javaApi.post(`${BASE}/intake/mobile-otp/verify`, { otpId, code }).then(unwrap);
// -> { verificationId, expiresInSeconds }. consentGiven must be true.
export const sendIntakeAadhaarOtpAPI = (aadhaarNumber) =>
  javaApi.post(`${BASE}/intake/aadhaar-otp`, { aadhaarNumber, consentGiven: true }).then(unwrap);
// -> { verificationId, fullName, fatherName, gender, dateOfBirth, addressLine1, addressLine2,
//      pincode, stateName, stateId, districtName, cityId, hasPhoto }
export const verifyIntakeAadhaarOtpAPI = (verificationId, otp) =>
  javaApi.post(`${BASE}/intake/aadhaar-otp/verify`, { verificationId, otp }).then(unwrap);

// ---- Worker KYC (kyc.*) -----------------------------------------------------
// { workerId, aadhaarNumber, panNumber, overallStatus, verifiedAt, verificationRef }
// Never 404s — NOT_STARTED placeholder when nothing is on file.
export const getWorkerKycAPI = (id) => javaApi.get(`${BASE}/${id}/kyc`).then(unwrap);
// Manual, unverified fallback. Moves NOT_STARTED -> PENDING.
export const submitWorkerAadhaarAPI = (id, aadhaarNumber) =>
  javaApi.put(`${BASE}/${id}/kyc/aadhaar`, { aadhaarNumber }).then(unwrap);
// PAN must match ^[A-Z]{5}[0-9]{4}[A-Z]$
export const submitWorkerPanAPI = (id, panNumber) =>
  javaApi.put(`${BASE}/${id}/kyc/pan`, { panNumber }).then(unwrap);

// ---- Face enrollment (faceauth.*) -------------------------------------------
// { workerId, enrolled, enrolledAt, livenessConfidence, photoUrl } — never 404s.
export const getFaceEnrollmentAPI = (id) => javaApi.get(`${BASE}/${id}/face-enrollment`).then(unwrap);
// Enroll or re-enroll (overwrites). The worker's consent must have been taken.
export const enrollWorkerFaceAPI = (id, imageBlob) => {
  const body = new FormData();
  body.append("file", imageBlob, "face.jpg");
  body.append("consentGiven", "true");
  return javaApi
    .put(`${BASE}/${id}/face-enrollment`, body, { headers: { "Content-Type": "multipart/form-data" } })
    .then(unwrap);
};
export const removeFaceEnrollmentAPI = (id) => javaApi.delete(`${BASE}/${id}/face-enrollment`).then(unwrap);

// ---- Face identification (faceauth.identify) --------------------------------
// Finds which worker a face belongs to — not nested under a worker id.
// UNCONFIRMED: the request/response shape isn't in the collections we have
// yet. Assumed: multipart "file" (like enrollment), at /admin/face-identify.
// Read the result through parseFaceIdentifyResult so a shape change is a
// one-place fix.
export const identifyFaceAPI = (imageBlob) => {
  const body = new FormData();
  body.append("file", imageBlob, "face.jpg");
  return javaApi
    .post("/admin/face-identify", body, { headers: { "Content-Type": "multipart/form-data" } })
    .then(unwrap);
};

// -> { matched: boolean, workerId: string | null, confidence: number | null }
export const parseFaceIdentifyResult = (data) => {
  const workerId =
    data?.workerId ?? data?.worker?.id ?? data?.match?.workerId ?? data?.matchedWorkerId ?? null;
  const confidence =
    data?.confidence ?? data?.matchConfidence ?? data?.similarity ?? data?.match?.confidence ?? null;
  const matched = data?.matched ?? data?.identified ?? Boolean(workerId);
  return { matched: Boolean(matched && workerId), workerId, confidence };
};
