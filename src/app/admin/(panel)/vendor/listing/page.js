import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import VendorManagement from "@/modules/admin/pages/VendorManagement/VendorManagement";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <VendorManagement />;
}
