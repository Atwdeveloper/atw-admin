import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import EditCompany from "@/modules/admin/pages/company/EditCompany";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <EditCompany />;
}
