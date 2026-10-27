import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import Legacy from "@/modules/admin/pages/myprofile/MyProfile";
import Current from "@/modules/admin/pages/myprofile/AdminAccount";

export default function Page() {
  return LEGACY_ADMIN_FEATURES ? <Legacy /> : <Current />;
}
