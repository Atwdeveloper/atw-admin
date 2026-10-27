import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import AddWorker from "@/modules/admin/pages/worker/AddWorker";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <AddWorker />;
}
