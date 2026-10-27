import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import Notification from "@/modules/admin/pages/notification/Notification";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <Notification />;
}
