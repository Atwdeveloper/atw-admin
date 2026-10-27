import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import AddEditTds from "@/modules/admin/pages/tds/AddEditTds";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <AddEditTds />;
}
