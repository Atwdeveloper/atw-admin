import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import SupportMessage from "@/modules/admin/pages/support/SupportMessage";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <SupportMessage />;
}
