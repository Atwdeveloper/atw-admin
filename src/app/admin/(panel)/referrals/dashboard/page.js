import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import ReferralDashboard from "@/modules/admin/pages/referrals/ReferralDashboard";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <ReferralDashboard />;
}
