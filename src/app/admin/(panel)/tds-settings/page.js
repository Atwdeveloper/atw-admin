import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import TDSListing from "@/modules/admin/pages/tds/TDSListing";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <TDSListing />;
}
