import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import AdminDocuments from "@/modules/admin/pages/documents/AdminDocuments";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <AdminDocuments />;
}
