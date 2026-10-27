import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import SkillCategoryListing from "@/modules/admin/pages/skill-category-management/SkillCategoryListing";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <SkillCategoryListing />;
}
