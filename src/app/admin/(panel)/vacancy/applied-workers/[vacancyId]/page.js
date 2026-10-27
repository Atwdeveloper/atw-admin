import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import ViewAppliedWorkers from "@/modules/admin/pages/all-vacancy/ViewAppliedWorkers";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <ViewAppliedWorkers />;
}
