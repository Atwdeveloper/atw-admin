"use client";

import { motion } from "framer-motion";
import { containerVariants } from "../../../../common/utils/motionVariants";
import AgentForm from "../../components/agent/AgentForm";

const AddAgent = () => {
  return (
    <motion.div
      className="flex-1 bg-gray-50 p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <AgentForm mode="create" submitText="Create Agent" />
    </motion.div>
  );
};

export default AddAgent;