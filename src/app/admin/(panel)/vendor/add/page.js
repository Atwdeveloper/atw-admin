import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import AddVendor from "@/modules/admin/pages/VendorManagement/AddVendor";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <AddVendor />;
}
