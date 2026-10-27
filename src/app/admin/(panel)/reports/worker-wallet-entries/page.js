import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import WorkerWalletEntriesReport from "@/modules/admin/pages/reports/WorkerWalletEntriesReport";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <WorkerWalletEntriesReport />;
}
