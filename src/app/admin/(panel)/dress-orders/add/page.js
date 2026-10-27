import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import AddDressOrder from "@/modules/admin/pages/DressOrder/AddDressOrder";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <AddDressOrder />;
}
