import { notFound } from "next/navigation";
import { LEGACY_ADMIN_FEATURES } from "@/common/utils/features";
import AgentListing from "@/modules/admin/pages/agent/AgentListing";

export default function Page() {
  if (!LEGACY_ADMIN_FEATURES) notFound();
  return <AgentListing />;
}
