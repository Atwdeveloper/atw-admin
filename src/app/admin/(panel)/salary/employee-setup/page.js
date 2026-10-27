import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import EmployeeSalaraySetup from "@/modules/admin/pages/salary/EmployeeSalaraySetup";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <EmployeeSalaraySetup />;
}
