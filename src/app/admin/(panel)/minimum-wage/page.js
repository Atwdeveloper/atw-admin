import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import MinimumWageListing from "@/modules/admin/pages/minimum-wage/MinimumWageListing";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <MinimumWageListing />;
}
