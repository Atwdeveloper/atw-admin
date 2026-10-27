import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import IndustryListing from "@/modules/admin/pages/industry-management/IndustryListing";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <IndustryListing />;
}
