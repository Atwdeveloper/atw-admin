import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import EditSkillCategory from "@/modules/admin/pages/skill-category-management/EditSkillCategory";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <EditSkillCategory />;
}
