import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import FaceEnrollListing from "@/modules/admin/pages/attendance/FaceEnrollListing";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <FaceEnrollListing />;
}
