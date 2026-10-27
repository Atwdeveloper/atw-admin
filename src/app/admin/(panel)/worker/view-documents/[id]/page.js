import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import ViewWorkerDocuments from "@/modules/admin/pages/worker/ViewWorkerDocuments";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <ViewWorkerDocuments />;
}
