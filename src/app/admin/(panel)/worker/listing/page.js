import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import WorkerListing from "@/modules/admin/pages/worker/WorkerListing";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <WorkerListing />;
}
