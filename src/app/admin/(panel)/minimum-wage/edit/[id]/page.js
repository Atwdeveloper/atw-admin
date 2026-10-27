import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import EditMinimumWage from "@/modules/admin/pages/minimum-wage/EditMinimumWage";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <EditMinimumWage />;
}
