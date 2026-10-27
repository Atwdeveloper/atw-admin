import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import WorkerWalletTransactionsReport from "@/modules/admin/pages/reports/WorkerWalletTransactionsReport";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <WorkerWalletTransactionsReport />;
}
