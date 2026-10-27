import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import ChangeUsername from "@/modules/admin/pages/configuration/ChangeUsername";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <ChangeUsername />;
}
