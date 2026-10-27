import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import DesignationListing from "@/modules/admin/pages/designation-management/DesignationListing";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <DesignationListing />;
}
