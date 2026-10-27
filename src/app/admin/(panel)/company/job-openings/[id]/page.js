import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import JobOpeningsList from "@/modules/admin/pages/company/JobOpeningsList";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <JobOpeningsList />;
}
