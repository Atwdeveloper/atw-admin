import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import EditTeam from "@/modules/admin/pages/team/EditTeam";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <EditTeam />;
}
