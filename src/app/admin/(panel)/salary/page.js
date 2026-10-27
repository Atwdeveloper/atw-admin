import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import SalaryManagement from "@/modules/admin/pages/salary/SalaryManagement";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <SalaryManagement />;
}
