"use client";

import Swal from "sweetalert2";
import FaceScanner from "../../../attendance/FaceScanner";
import { enrollWorkerFaceAPI } from "../../../../api/adminV1/workerAPI";
import { apiError } from "../../../../api/javaApi";

// Enrollment never proceeds without the worker's explicit consent, which the
// backend records (with the admin's IP) — so ask for it before opening the camera.
export const confirmFaceConsent = async (workerName, reEnroll) => {
  const result = await Swal.fire({
    title: reEnroll ? "Re-enroll face?" : "Enroll face",
    html: `
      <div class="text-left text-sm text-gray-700 space-y-3">
        ${reEnroll ? "<p>The current face template will be <b>replaced</b>. Past enrollments are not kept.</p>" : ""}
        <p>The worker must be present in person. Confirm that <b>${String(workerName || "this worker")
          .replace(/[&<>"']/g, "")}</b> has agreed to have their face photo captured and stored for attendance face-matching.</p>
        <label class="flex items-start gap-2">
          <input type="checkbox" id="face-consent" class="mt-1" />
          <span>The worker has given consent.</span>
        </label>
      </div>`,
    showCancelButton: true,
    confirmButtonText: "Open Camera",
    confirmButtonColor: "#2563eb",
    preConfirm: () => {
      if (!document.getElementById("face-consent").checked) {
        Swal.showValidationMessage("The worker's consent is required.");
        return false;
      }
      return true;
    },
  });
  return result.isConfirmed;
};

// FaceScanner wired to PUT /admin/workers/{id}/face-enrollment. A 422 means
// the face-auth provider rejected the photo (quality/liveness) — retryable
// from the live camera. Anything else ends the attempt.
const WorkerFaceScanner = ({ worker, workerName, reEnroll, onClose, onEnrolled }) => {
  const handleCapture = async (blob) => {
    try {
      const enrollment = await enrollWorkerFaceAPI(worker.id, blob);
      onClose();
      Swal.fire({
        icon: "success",
        title: reEnroll ? "Face re-enrolled" : "Face enrolled",
        text: `${workerName}'s face template has been saved.`,
        timer: 2200,
        showConfirmButton: false,
      });
      onEnrolled?.(enrollment);
      return { success: true };
    } catch (error) {
      const err = apiError(error, "We couldn't enroll that photo. Please try again.");
      return {
        success: false,
        message: err.message,
        retryable: err.code === "BUSINESS_RULE_VIOLATION" || err.code === "NETWORK_ERROR",
      };
    }
  };

  return (
    <FaceScanner
      onCapture={handleCapture}
      onClose={onClose}
      labels={{
        submitting: reEnroll ? `Updating ${workerName}'s face…` : `Enrolling ${workerName}'s face…`,
        success: reEnroll ? "Face updated ✓" : "Face enrolled ✓",
        failure: "We couldn't enroll that photo. Please try again.",
      }}
    />
  );
};

export default WorkerFaceScanner;
