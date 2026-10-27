import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import AddCompany from "@/modules/admin/pages/company/AddCompany";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <AddCompany />;
}
