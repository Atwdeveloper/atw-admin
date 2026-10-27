import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import SalaryStructureListing from "@/modules/admin/pages/salary-structure/SalaryStructureListing";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <SalaryStructureListing />;
}
