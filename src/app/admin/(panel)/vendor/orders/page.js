import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import VendorOrders from "@/modules/admin/pages/VendorManagement/VendorOrders";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <VendorOrders />;
}
