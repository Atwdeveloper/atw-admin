import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import EsicReports from "@/modules/admin/pages/reports/EsicReports";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <EsicReports />;
}
