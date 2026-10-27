"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@/lib/navigation";
import { AtSign, Key, Mail, Shield, User } from "lucide-react";
import { containerVariants, itemVariants } from "../../../../common/utils/motionVariants";
import Loader from "../../../../common/components/Loader";
import { getMeAPI } from "../../../../api/adminV1/accountAPI";
import { apiError } from "../../../../api/javaApi";

// /admin/myprofile — the signed-in admin's own account (GET /admin/account/me).
// The backend has no self-edit endpoint yet; name/phone are changed by an admin
// with staff access, and the password from Change Password.
const AdminAccount = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMeAPI()
      .then(setMe)
      .catch((err) => setError(apiError(err, "Couldn't load your profile.").message));
  }, []);

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }
  if (!me) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader />
      </div>
    );
  }

  const rows = [
    { icon: User, label: "Full name", value: me.fullName },
    { icon: AtSign, label: "Username", value: me.username && `@${me.username}` },
    { icon: Mail, label: "Email", value: me.email },
  ];

  return (
    <motion.div className="flex-1 bg-gray-50" initial="hidden" animate="visible" variants={containerVariants}>
      <motion.div className="mb-6" variants={itemVariants}>
        <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
        <p className="text-gray-600 mt-1">Your admin account details</p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          variants={itemVariants}
          className="lg:col-span-1 bg-white rounded-[22px] border border-[#DDDDDD] shadow-sm p-6 text-center"
        >
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold">
            {(me.fullName || me.username || "?").charAt(0).toUpperCase()}
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-800">{me.fullName}</h2>
          <p className="text-sm text-gray-500">{me.email}</p>
          <span
            className={`mt-3 inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
              me.superAdmin ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
            }`}
          >
            {me.superAdmin ? "Super Admin" : "Admin Staff"}
          </span>
          <button
            onClick={() => navigate("/admin/settings/change-password")}
            className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            <Key size={16} /> Change Password
          </button>
        </motion.div>

        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants} className="bg-white rounded-[22px] border border-[#DDDDDD] shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Account</h3>
            <div className="divide-y divide-gray-100">
              {rows.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-4 py-3">
                  <span className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Icon size={18} />
                  </span>
                  <span className="w-32 text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-900 break-all">
                    {value || <span className="text-gray-400 font-normal">—</span>}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-gray-500">
              To change your name or phone, ask an admin with staff access.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-[22px] border border-[#DDDDDD] shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Shield size={18} className="text-blue-600" /> Roles & access
            </h3>
            {me.superAdmin ? (
              <p className="text-sm text-gray-600">You have full access to every admin section.</p>
            ) : me.roles?.length ? (
              <div className="flex flex-wrap gap-2">
                {me.roles.map((role) => (
                  <span key={role} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium bg-blue-50 text-blue-700">
                    <Shield size={13} /> {role}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No roles assigned yet.</p>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminAccount;
