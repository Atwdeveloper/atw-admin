import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import AddSkillCategory from "@/modules/admin/pages/skill-category-management/AddSkillCategory";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <AddSkillCategory />;
}
