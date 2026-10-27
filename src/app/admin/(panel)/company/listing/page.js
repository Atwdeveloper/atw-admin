import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import CompanyListing from "@/modules/admin/pages/company/CompanyListing";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <CompanyListing />;
}
