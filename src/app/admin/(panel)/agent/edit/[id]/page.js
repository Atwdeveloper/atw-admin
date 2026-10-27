import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import EditAgent from "@/modules/admin/pages/agent/EditAgent";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <EditAgent />;
}
