"use client";

import { motion } from "framer-motion";
import { useParams } from "@/lib/navigation";
import { containerVariants } from "../../../../common/utils/motionVariants";
import AgentForm from "../../components/agent/AgentForm";

const EditAgent = () => {
  const { id } = useParams();

  return (
    <motion.div
      className="flex-1 bg-gray-50 p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <AgentForm mode="edit" agentId={id} submitText="Update Agent" />
    </motion.div>
  );
};

export default EditAgent;
