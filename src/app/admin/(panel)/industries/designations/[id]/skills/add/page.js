import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import AddSkill from "@/modules/admin/pages/industry-management/AddSkill";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <AddSkill />;
}
