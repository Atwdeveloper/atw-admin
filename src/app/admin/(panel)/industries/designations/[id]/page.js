import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import DesignationByIndustry from "@/modules/admin/pages/industry-management/DesignationByIndustry";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <DesignationByIndustry />;
}
