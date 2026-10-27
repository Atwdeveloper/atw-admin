import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import AdminWorkerWallet from "@/modules/admin/pages/worker/AdminWorkerWallet";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <AdminWorkerWallet />;
}
