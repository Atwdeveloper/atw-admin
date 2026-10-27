import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import EditDesignation from "@/modules/admin/pages/designation-management/EditDesignation";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <EditDesignation />;
}
