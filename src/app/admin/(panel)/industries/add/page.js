import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import AddIndustry from "@/modules/admin/pages/industry-management/AddIndustry";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <AddIndustry />;
}
