import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import EditIndustry from "@/modules/admin/pages/industry-management/EditIndustry";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <EditIndustry />;
}
