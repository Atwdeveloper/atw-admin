import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import AddVacancy from "@/modules/admin/pages/all-vacancy/AddVacancy";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <AddVacancy />;
}
