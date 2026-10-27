import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import EditVacancy from "@/modules/admin/pages/all-vacancy/EditVacancy";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <EditVacancy />;
}
