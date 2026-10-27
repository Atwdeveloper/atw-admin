import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import ManageReports from "@/modules/admin/pages/reports/ManageReports";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <ManageReports />;
}
