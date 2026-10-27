import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import ChangeEmail from "@/modules/admin/pages/configuration/ChangeEmail";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <ChangeEmail />;
}
