import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import ReferralRules from "@/modules/admin/pages/referrals/ReferralRules";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <ReferralRules />;
}
