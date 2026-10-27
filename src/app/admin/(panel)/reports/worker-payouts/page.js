import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import WorkerPayoutReport from "@/modules/admin/pages/reports/WorkerPayoutReport";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <WorkerPayoutReport />;
}
