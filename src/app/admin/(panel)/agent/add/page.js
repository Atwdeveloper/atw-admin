import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import AddAgent from "@/modules/admin/pages/agent/AddAgent";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <AddAgent />;
}
