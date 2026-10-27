"use client";

// modules/admin/components/teams/TeamModal.jsx
import { motion } from "framer-motion";
import {
  X,
  Users,
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Hash,
  UserCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

const TeamModal = ({ team, isOpen, onClose }) => {
  if (!isOpen || !team) return null;

  // Function to count team members
  const countTeamMembers = () => {
    return team.members ? team.members.length : 0;
  };

  // Function to get team lead name
  const getTeamLeadName = () => {
    if (team.team_lead) {
      return `${team.team_lead.name}`;
    }
    return "Not assigned";
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header - Blue theme */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{team.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Hash className="w-4 h-4" />
                  <span className="font-mono">
                    {team.team_code ||
                      `T-${team.id.toString().padStart(5, "0")}`}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                Team Information
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Description
                  </label>
                  <p className="mt-1 text-gray-800 bg-gray-50 p-3 rounded-lg">
                    {team.description || "No description provided"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Status
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      {team.status === 1 ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-700 font-medium">
                            Active
                          </span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700 font-medium">
                            Inactive
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Created On
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-800">
                        {new Date(team.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Lead Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5 text-amber-600" />
                Team Lead
              </h3>

              {team.team_lead ? (
                <div className="bg-amber-50 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-white shadow">
                      <UserCircle className="w-8 h-8 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900">
                        {getTeamLeadName()}
                      </h4>
                      <p className="text-amber-700 font-medium">
                        {team.team_lead.designation || "Team Lead"}
                      </p>

                      <div className="mt-3 space-y-2">
                        {team.team_lead.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">
                              {team.team_lead.email}
                            </span>
                          </div>
                        )}

                        {team.team_lead.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">
                              {team.team_lead.phone}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                  <UserCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No team lead assigned</p>
                </div>
              )}
            </div>
          </div>
          {/* Assigned States Section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <Building className="w-5 h-5 text-blue-600" />
              Assigned States
            </h3>

            {team.states && team.states.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {team.states.map((state, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg"
                  >
                    <Building className="w-4 h-4 text-blue-600" />

                    <span className="text-sm font-medium text-gray-700">
                      {state.state_name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">No states assigned</p>
              </div>
            )}
          </div>
          {/* Team Members Section */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-purple-600" />
              Team Members ({countTeamMembers()})
            </h3>

            {team.members && team.members.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {team.members.map((member, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-700" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {member.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {member.designation || "Team Member"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {member.email && (
                        <div className="flex items-center gap-2 text-xs">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600 truncate">
                            {member.email}
                          </span>
                        </div>
                      )}

                      {member.phone && (
                        <div className="flex items-center gap-2 text-xs">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600">{member.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No members in this team yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TeamModal;
