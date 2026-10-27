import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import EditWorker from "@/modules/admin/pages/worker/EditWorker";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <EditWorker />;
}
