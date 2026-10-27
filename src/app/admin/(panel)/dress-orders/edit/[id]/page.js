import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import EditDressOrder from "@/modules/admin/pages/DressOrder/EditDressOrder";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <EditDressOrder />;
}
