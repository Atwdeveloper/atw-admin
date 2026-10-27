import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import Legacy from "@/modules/admin/pages/dashboard/Dashboard";
import Current from "@/modules/admin/pages/AdminHome";

export default function Page() {
  return LEGACY_ADMIN_FEATURES ? <Legacy /> : <Current />;
}
