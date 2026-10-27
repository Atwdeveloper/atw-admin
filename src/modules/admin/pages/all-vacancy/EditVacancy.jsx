"use client";

import { motion } from "framer-motion";

import { useParams } from "@/lib/navigation";
import VacancyForm from "../../components/vacancy/VacancyForm";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import { useLocation } from "@/lib/navigation";
import Breadcrumb from "../../../../common/components/Breadcrumb";
const AdminEditVacancy = () => {
  const { id } = useParams();

  const location = useLocation();

  const companyName = location.state?.companyName || "Company";
  return (
    <motion.div
      className="flex-1 bg-gray-50 p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Breadcrumb
        items={[
          { label: "All Vacancies", path: "/admin/vacancy-listing" },
          { label: companyName },
          { label: "Edit Vacancy" },
        ]}
      />
      {/* HEADER */}
      <motion.div className="mb-6" variants={itemVariants}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              {/* <button
                onClick={() => navigate("/company/vacancy/listing")}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button> */}
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Edit Vacancy
                </h1>
                <p className="text-gray-600 mt-1">Update job vacancy details</p>
              </div>
            </div>
          </div>
          {/* <div className="bg-green-100 p-3 rounded-full">
            <Edit className="w-8 h-8 text-green-700" />
          </div> */}
        </div>
      </motion.div>

      {/* FORM */}
      <div className="">
        <VacancyForm mode="edit" vacancyId={id} />
      </div>
    </motion.div>
  );
};

export default AdminEditVacancy;
