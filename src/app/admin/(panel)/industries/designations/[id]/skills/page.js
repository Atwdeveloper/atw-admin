import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import SkillsByDesignation from "@/modules/admin/pages/industry-management/SkillsByDesignation";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <SkillsByDesignation />;
}
