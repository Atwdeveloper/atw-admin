import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import AddMinimumWage from "@/modules/admin/pages/minimum-wage/AddMinimumWage";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <AddMinimumWage />;
}
