import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import EditVendor from "@/modules/admin/pages/VendorManagement/EditVendor";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <EditVendor />;
}
