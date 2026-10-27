import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import DeductionSettings from "@/modules/admin/pages/deduction/DeductionSettings";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <DeductionSettings />;
}
