import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import CompanyPaymentDetails from "@/modules/admin/pages/company/CompanyPaymentDetails";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <CompanyPaymentDetails />;
}
