import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import AdminCompanyAllWorkers from "@/modules/admin/pages/company/AdminCompanyAllWorkers";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <AdminCompanyAllWorkers />;
}
