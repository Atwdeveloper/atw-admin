import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import AddDesignation from "@/modules/admin/pages/industry-management/AddDesignation";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <AddDesignation />;
}
