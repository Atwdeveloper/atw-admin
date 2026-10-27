import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import AddSalaryStructure from "@/modules/admin/pages/salary-structure/AddSalaryStructure";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <AddSalaryStructure />;
}
