import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import EditSalaryStructure from "@/modules/admin/pages/salary-structure/EditSalaryStructure";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <EditSalaryStructure />;
}
