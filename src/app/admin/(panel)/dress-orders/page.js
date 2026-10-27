import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import ManageDressOrder from "@/modules/admin/pages/DressOrder/ManageDressOrder";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <ManageDressOrder />;
}
