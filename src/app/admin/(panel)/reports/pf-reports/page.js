import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import PfReports from "@/modules/admin/pages/reports/PfReports";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <PfReports />;
}
