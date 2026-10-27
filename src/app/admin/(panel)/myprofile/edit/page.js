import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import EditProfile from "@/modules/admin/pages/myprofile/EditProfile";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <EditProfile />;
}
