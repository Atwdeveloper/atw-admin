import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import ViewCompanyDocuments from "@/modules/admin/pages/company/ViewCompanyDocuments";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <ViewCompanyDocuments />;
}
