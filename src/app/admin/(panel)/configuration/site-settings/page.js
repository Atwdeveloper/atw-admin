import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import SiteSettings from "@/modules/admin/pages/configuration/SiteSettings";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <SiteSettings />;
}
