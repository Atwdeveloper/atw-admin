import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import SalarySheets from "@/modules/admin/pages/reports/SalarySheets";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <SalarySheets />;
}
