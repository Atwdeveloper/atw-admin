// Face capture/registration error handling.
//
// Laravel is expected to return a worker-facing `message` already, plus an
// `error_code` and (for low_quality) a `reasons` array originating from the
// atwface service. We prefer the server's message when there is one, and fall
// back to these strings so the UI still says something useful if the backend
// sends a bare code, a raw framework error, or nothing at all.

// Quality reasons emitted by atwface's capture gate.
export const FACE_REASON_MESSAGES = {
  face_too_small: "Please move closer to the camera.",
  image_blurry: "The photo is too blurry. Please hold still and try again.",
  too_dark: "It is too dark. Please move to a brighter place.",
  too_bright: "There is too much light. Please avoid strong backlight.",
  face_outside_frame: "Please centre your face in the frame.",
};

export const FACE_ERROR_MESSAGES = {
  no_face_detected:
    "No face was detected. Please look straight at the camera in good light.",
  multiple_faces_detected:
    "More than one person is visible. Please make sure you are alone in the frame.",
  low_quality: "The photo was not clear enough. Please try again.",
  service_unavailable:
    "Face registration is temporarily unavailable. Please try again shortly.",
  not_enrolled: "You have not registered your face yet.",
  not_authenticated: "Your session has expired. Please log in again.",
  too_many_attempts:
    "Too many attempts. Please wait a little while before trying again.",
  image_too_large: "That photo is too large. Please try again.",
  duplicate_face:
    "This face is already registered to another account. Please contact support if you think this is a mistake.",
  eyes_closed: "Your eyes were closed. Please look at the camera and try again.",
  unknown: "Face registration failed. Please try again.",
};

// Codes where retrying the same capture cannot help. The backend may also send
// `retryable` explicitly, which always wins over this list.
const NON_RETRYABLE = [
  "not_enrolled",
  "not_authenticated",
  "too_many_attempts",
  "duplicate_face",
];

const codeFromStatus = (status) => {
  if (status === 401 || status === 403) return "not_authenticated";
  if (status === 404) return "not_enrolled";
  if (status === 413) return "image_too_large";
  if (status === 429) return "too_many_attempts";
  if (status >= 500) return "service_unavailable";
  return "unknown";
};

/**
 * Normalise anything the face endpoints can throw or return into one shape.
 *
 * Accepts an axios error, or a response body that came back 200 with
 * `status: false`.
 *
 * @returns {{ message: string, code: string, reasons: string[], retryable: boolean }}
 */
export const resolveFaceError = (source) => {
  const isAxiosError = Boolean(source?.isAxiosError || source?.response || source?.request);
  const status = source?.response?.status ?? null;
  const body = isAxiosError ? source?.response?.data : source;

  // Request left the browser but nothing came back — server down, DNS, CORS, offline.
  if (isAxiosError && !source?.response) {
    return {
      message: FACE_ERROR_MESSAGES.service_unavailable,
      code: "service_unavailable",
      reasons: [],
      retryable: true,
    };
  }

  const reasons = Array.isArray(body?.reasons) ? body.reasons : [];
  const code = body?.error_code || (status ? codeFromStatus(status) : "unknown");

  // Prefer the server's own wording, then the specific quality reason, then the code.
  const message =
    (typeof body?.message === "string" && body.message.trim()) ||
    FACE_REASON_MESSAGES[reasons[0]] ||
    FACE_ERROR_MESSAGES[code] ||
    FACE_ERROR_MESSAGES.unknown;

  return {
    message,
    code,
    reasons,
    retryable: !NON_RETRYABLE.includes(code),
  };
};

// Liveness-specific reasons from /admin/face-test/enroll ("is this a real
// face or a photo/screen held up to the camera"), distinct from the
// quality reasons above.
export const LIVENESS_REASON_MESSAGES = {
  spoof_suspected:
    "This looks like a photo of a photo or a screen. Please use a live camera with a real face.",
};

// Every reason code we might see, across the no-face/multi-face gate, the
// quality check, and the liveness check, mapped to one worker-facing string.
const ALL_REASON_MESSAGES = {
  ...FACE_REASON_MESSAGES,
  ...LIVENESS_REASON_MESSAGES,
  no_face_detected: FACE_ERROR_MESSAGES.no_face_detected,
  multiple_faces_detected: FACE_ERROR_MESSAGES.multiple_faces_detected,
};

const firstString = (...candidates) => {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return null;
};

const numberOrNull = (value) => (typeof value === "number" ? value : null);

// Laravel wraps these responses in the app's usual { status, message, data }
// envelope, so the face fields live one level down — but a bare payload is
// also accepted. `message` stays on the envelope, hence both are kept.
const unwrapPayload = (envelope) => {
  if (!envelope || typeof envelope !== "object") return {};
  const looksLikePayload =
    envelope.is_match !== undefined ||
    envelope.matched_id !== undefined ||
    envelope.ambiguous !== undefined ||
    envelope.quality !== undefined ||
    envelope.liveness !== undefined;
  if (looksLikePayload) return envelope;
  const nested = envelope.data || envelope.result || envelope.payload;
  return nested && typeof nested === "object" ? nested : envelope;
};

// The quality/liveness verdict field is named differently per check
// (`is_acceptable` on quality, `is_live` on liveness), so accept any of them
// and only count an explicit `false` as a failure.
const checkPassed = (check) => {
  if (!check || typeof check !== "object") return true;
  const verdicts = [
    check.pass,
    check.passed,
    check.is_acceptable,
    check.is_live,
    check.ok,
  ];
  for (const verdict of verdicts) {
    if (typeof verdict === "boolean") return verdict;
  }
  return true;
};

// The backend writes its own worker-facing copy now, so whenever it sends
// wording we show that instead of the canned strings above.
const serverMessage = (body) =>
  firstString(body?.message, body?.alert, body?.detail, body?.description);

// A reason may arrive as a bare code ("image_blurry") or, now that the
// backend sends its own copy, as an object carrying that code plus wording.
const normaliseReason = (entry) => {
  if (typeof entry === "string") return { code: entry.trim(), message: null };
  if (entry && typeof entry === "object") {
    return {
      code: firstString(entry.code, entry.reason, entry.key, entry.slug),
      message: firstString(entry.message, entry.text, entry.label, entry.detail),
    };
  }
  return null;
};

/**
 * Collects everything wrong with the captured shot itself, from wherever it
 * turns up in the body: a top-level gate code/reasons list
 * (no_face_detected, multiple_faces_detected) plus each sub-check's own
 * reasons. Shared by the enroll and identify endpoints, which both run the
 * same quality + liveness gate before doing their own work.
 *
 * @returns {{code: string, message: string}[]} empty when the shot is usable
 */
const collectCheckIssues = (body) => {
  const quality = body?.quality || null;
  const liveness = body?.liveness || null;

  const found = [];
  const addReason = (entry) => {
    const norm = normaliseReason(entry);
    const code = norm?.code;
    if (!code) return;
    const existing = found.find((item) => item.code === code);
    if (existing) {
      // Keep the first server-supplied wording we saw for this code.
      if (!existing.message && norm.message) existing.message = norm.message;
      return;
    }
    found.push({ code, message: norm.message });
  };

  if (body?.error_code) addReason(body.error_code);
  if (Array.isArray(body?.reasons)) body.reasons.forEach(addReason);
  if (quality && !checkPassed(quality)) {
    const reasons = Array.isArray(quality.reasons) ? quality.reasons : [];
    if (reasons.length > 0) reasons.forEach(addReason);
    else addReason({ code: "low_quality", message: serverMessage(quality) });
  }
  if (liveness && !checkPassed(liveness)) {
    const reasons = Array.isArray(liveness.reasons) ? liveness.reasons : [];
    if (reasons.length > 0) reasons.forEach(addReason);
    else addReason({ code: "spoof_suspected", message: serverMessage(liveness) });
  }

  return found.map(({ code, message }) => ({
    code,
    message:
      message ||
      ALL_REASON_MESSAGES[code] ||
      FACE_ERROR_MESSAGES[code] ||
      FACE_ERROR_MESSAGES.unknown,
  }));
};

/**
 * Normalises the /admin/face-test/enroll response — a single-shot capture
 * that comes back as `{ quality: { pass, reasons }, liveness: { pass, reasons } }`
 * (a hard no-face/multiple-faces gate may short-circuit either check and show
 * up as a top-level `error_code` instead) — into one shape the capture screen
 * can render as a checklist of everything wrong with the shot, not just the
 * first problem found.
 *
 * Accepts an axios error, or the 200 response body.
 *
 * `serverMessage` is the backend's own wording when it sent any, so the UI can
 * lead with that and still list the per-reason detail underneath.
 *
 * @returns {{ success: boolean, issues: {code: string, message: string}[],
 *             message: string, serverMessage: string|null, retryable: boolean }}
 */
export const resolveEnrollResult = (source) => {
  const isAxiosError = Boolean(source?.isAxiosError || source?.response || source?.request);

  // Request left the browser but nothing came back — server down, DNS, CORS, offline.
  if (isAxiosError && !source?.response) {
    const message = FACE_ERROR_MESSAGES.service_unavailable;
    return {
      success: false,
      issues: [{ code: "service_unavailable", message }],
      message,
      serverMessage: null,
      retryable: true,
    };
  }

  const status = source?.response?.status ?? null;
  const envelope = (isAxiosError ? source?.response?.data : source) || {};
  const body = unwrapPayload(envelope);
  const fromServer = serverMessage(envelope) || serverMessage(body);

  // A framework-level error (auth, rate limit, 5xx) with no quality/liveness
  // payload to speak of — same status-to-code mapping resolveFaceError uses.
  if (isAxiosError && status && body.quality == null && body.liveness == null) {
    const code = body.error_code || codeFromStatus(status);
    const message =
      fromServer || FACE_ERROR_MESSAGES[code] || FACE_ERROR_MESSAGES.unknown;
    return {
      success: false,
      issues: [{ code, message }],
      message,
      serverMessage: fromServer,
      retryable: !NON_RETRYABLE.includes(code),
    };
  }

  const issues = collectCheckIssues(body);

  const qualityPass = checkPassed(body.quality);
  const livenessPass = checkPassed(body.liveness);
  const explicitSuccess =
    typeof envelope.success === "boolean"
      ? envelope.success
      : typeof envelope.status === "boolean"
        ? envelope.status
        : typeof body.success === "boolean"
          ? body.success
          : null;
  const success =
    explicitSuccess !== null
      ? explicitSuccess
      : qualityPass && livenessPass && issues.length === 0;

  if (success) {
    return {
      success: true,
      issues: [],
      message: fromServer || "Face enrolled successfully.",
      serverMessage: fromServer,
      retryable: true,
    };
  }

  if (issues.length === 0) {
    issues.push({
      code: "unknown",
      message: fromServer || FACE_ERROR_MESSAGES.unknown,
    });
  }

  // The backend states `retryable` outright for cases like duplicate_face,
  // where retaking the photo can never help; trust it over our own guess.
  const explicitRetryable =
    typeof body.retryable === "boolean"
      ? body.retryable
      : typeof envelope.retryable === "boolean"
        ? envelope.retryable
        : null;

  return {
    success: false,
    issues,
    serverMessage: fromServer,
    message: fromServer || issues.map((issue) => issue.message).join(" "),
    retryable:
      explicitRetryable !== null
        ? explicitRetryable
        : !issues.some((issue) => NON_RETRYABLE.includes(issue.code)),
  };
};

// The five ways a 1:N identify attempt can land. "No match" is deliberately
// three separate outcomes — ambiguous, no_match and check_failed each need
// the worker to do something different, so they must never collapse into one
// generic "not recognised".
export const IDENTIFY_OUTCOMES = {
  MATCH: "match",
  AMBIGUOUS: "ambiguous",
  NO_MATCH: "no_match",
  CHECK_FAILED: "check_failed",
  ERROR: "error",
};

/**
 * Normalises the /admin/face-test/identify response — 1:N search returning
 * `{ matched_id, is_match, ambiguous, similarity, quality, liveness }` — into
 * a single tagged outcome the scanning UI can branch on.
 *
 * Accepts an axios error, or the 200 response body.
 *
 * `serverMessage` is the backend's own wording when it sent any — the UI leads
 * with that and keeps the outcome-specific guidance as the fallback, so the
 * three "no match" cases still read differently from each other.
 *
 * @returns {{ outcome: string, matchedId: string|number|null, similarity: number|null,
 *             issues: {code: string, message: string}[], title: string,
 *             message: string, serverMessage: string|null, retryable: boolean }}
 */
export const resolveIdentifyResult = (source) => {
  const isAxiosError = Boolean(source?.isAxiosError || source?.response || source?.request);

  // Request left the browser but nothing came back — server down, DNS, CORS, offline.
  if (isAxiosError && !source?.response) {
    return {
      outcome: IDENTIFY_OUTCOMES.ERROR,
      matchedId: null,
      similarity: null,
      issues: [
        { code: "service_unavailable", message: FACE_ERROR_MESSAGES.service_unavailable },
      ],
      title: "Service unavailable",
      message: FACE_ERROR_MESSAGES.service_unavailable,
      serverMessage: null,
      retryable: true,
    };
  }

  const status = source?.response?.status ?? null;
  const envelope = (isAxiosError ? source?.response?.data : source) || {};
  const body = unwrapPayload(envelope);
  const fromServer = serverMessage(envelope) || serverMessage(body);
  const serverTitle = firstString(
    envelope.title,
    envelope.headline,
    body.title,
    body.headline,
  );

  // Everything the service reports about how it reached its verdict — shown
  // on every outcome, since the near-miss numbers are exactly what you need
  // when tuning the threshold or explaining a rejection.
  const details = {
    worker: body.matched_worker || null,
    runnerUpSimilarity: numberOrNull(body.runner_up_similarity),
    threshold: numberOrNull(body.threshold),
    margin: numberOrNull(body.margin),
    candidatesConsidered: numberOrNull(body.candidates_considered),
    topMatches: Array.isArray(body.top_matches) ? body.top_matches : [],
    quality: body.quality || null,
    liveness: body.liveness || null,
  };

  // A framework-level failure (auth, rate limit, 5xx) with no identify
  // payload to interpret.
  if (
    isAxiosError &&
    status &&
    body.quality == null &&
    body.liveness == null &&
    body.is_match == null
  ) {
    const code = body.error_code || codeFromStatus(status);
    const message =
      fromServer || FACE_ERROR_MESSAGES[code] || FACE_ERROR_MESSAGES.unknown;
    return {
      outcome: IDENTIFY_OUTCOMES.ERROR,
      matchedId: null,
      similarity: null,
      issues: [{ code, message }],
      title: serverTitle || "Request failed",
      message,
      serverMessage: fromServer,
      details,
      retryable: !NON_RETRYABLE.includes(code),
    };
  }

  const similarity = typeof body.similarity === "number" ? body.similarity : null;
  const matchedId = body.matched_id ?? null;
  const issues = collectCheckIssues(body);

  // A shot rejected on quality or liveness makes any match verdict moot —
  // fix the photo before reading anything into is_match/similarity.
  if (issues.length > 0) {
    return {
      outcome: IDENTIFY_OUTCOMES.CHECK_FAILED,
      matchedId: null,
      similarity,
      issues,
      title: serverTitle || "Photo could not be used",
      message:
        fromServer || "The photo needs to be retaken before we can identify anyone.",
      serverMessage: fromServer,
      details,
      retryable: true,
    };
  }

  // Top two candidates too close to safely tell apart — never guess between
  // them, even if the server also filled in matched_id.
  if (body.ambiguous === true) {
    return {
      outcome: IDENTIFY_OUTCOMES.AMBIGUOUS,
      matchedId: null,
      similarity,
      issues: [],
      title: serverTitle || "Could not tell two people apart",
      message:
        fromServer ||
        "Two enrolled workers looked equally similar, so no one was picked. Please recapture, looking straight at the camera in even light.",
      serverMessage: fromServer,
      details,
      retryable: true,
    };
  }

  if (body.is_match === true || (body.is_match == null && matchedId != null)) {
    const name = firstString(details.worker?.worker_name);
    return {
      outcome: IDENTIFY_OUTCOMES.MATCH,
      matchedId,
      similarity,
      issues: [],
      title: serverTitle || "Worker identified",
      message: fromServer || `Matched ${name || `enrolled worker ${matchedId}`}.`,
      serverMessage: fromServer,
      details,
      retryable: true,
    };
  }

  return {
    outcome: IDENTIFY_OUTCOMES.NO_MATCH,
    matchedId: null,
    similarity,
    issues: [],
    title: serverTitle || "No matching worker found",
    message:
      fromServer ||
      "This face did not match anyone enrolled. Enrol the worker first, or retake the photo.",
    serverMessage: fromServer,
    details,
    retryable: true,
  };
};
