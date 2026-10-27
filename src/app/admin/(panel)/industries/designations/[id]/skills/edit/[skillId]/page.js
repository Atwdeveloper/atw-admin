import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import EditSkill from "@/modules/admin/pages/industry-management/EditSkill";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <EditSkill />;
}
