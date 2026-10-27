import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import AdminWorkerHistory from "@/modules/admin/pages/worker/AdminWorkerHistory";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <AdminWorkerHistory />;
}
