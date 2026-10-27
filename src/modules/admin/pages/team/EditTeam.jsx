"use client";

// EditTeam.jsx
import { motion } from "framer-motion";
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "@/lib/navigation";
import {
  Save,
  Users,
  User,
  Building,
  RotateCcw,
  Search,
  AlertCircle,
  Mail,
  X,
  Check,
  Shield,
  MapPin,
  ChevronDown,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import { useTeams } from "../../adminhooks/useTeams";
import { useFormDirtyTracker } from "../../../../common/utils/formUtils";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import Loader from "../../../../common/components/Loader";
import useUnsavedChangesWarning from "../../../../common/hooks/useUnsavedChangesWarning";

const EditTeam = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const {
    handleEditTeam,
    loading: apiLoading,
    getTeamLeadsList,
    teamLeads,
    getTeamByIdData,
    states,
    statesLoading,
    fetchStates,
  } = useTeams({ autoFetch: false });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [stateSearchTerm, setStateSearchTerm] = useState("");
  const stateDropdownRef = useRef(null);

  const initialFormData = {
    name: "",
    description: "",
    team_lead_id: "",
    team_lead_name: "",
    team_lead_staff_code: "",
    team_members: [],
    state_ids: [],
    status: "active",
  };

  const { isDirty, checkDirty, resetDirty, markAsClean } =
    useFormDirtyTracker(initialFormData);
  const [formData, setFormData] = useState(initialFormData);
  const [teamLeadSearch, setTeamLeadSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [showTeamLeadDropdown, setShowTeamLeadDropdown] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [filteredTeamLeads, setFilteredTeamLeads] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [teamCode, setTeamCode] = useState("");

  // Compute if form is dirty
  const isFormDirty = useMemo(() => {
    if (!initialFormData || !formData || isSubmitting || isLoading)
      return false;
    return isDirty;
  }, [isDirty, formData, initialFormData, isSubmitting, isLoading]);

  // Unsaved changes warning
  useUnsavedChangesWarning(
    isFormDirty && !isSubmitting,
    "You have unsaved changes. Are you sure you want to leave? All changes will be lost.",
  );

  // Helper functions
  const safeString = (value) => (value || "").toString().toLowerCase().trim();
  const getFullName = (person) => {
    if (!person) return "";
    return (
      person.name ||
      `${person.first_name || ""} ${person.last_name || ""}`.trim()
    );
  };
  const getEmail = (person) => person?.email || "";

  // Load team data on mount
  useEffect(() => {
    if (id) {
      loadTeamData();
    }
  }, [id]);

  // Load team leads and states on mount
  useEffect(() => {
    getTeamLeadsList();
    fetchStates();
  }, []);

  // Check dirty state
  useEffect(() => {
    if (!isLoading && !isSubmitting) {
      checkDirty(formData);
    }
  }, [formData, checkDirty, isLoading, isSubmitting]);

  // Click outside for state dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        stateDropdownRef.current &&
        !stateDropdownRef.current.contains(e.target)
      ) {
        setShowStateDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter team leads
  useEffect(() => {
    if (!isSubmitting && teamLeads && Array.isArray(teamLeads)) {
      if (teamLeadSearch.trim() === "") {
        const filtered = teamLeads.filter(
          (lead) => lead && lead.id && lead.id !== formData.team_lead_id,
        );
        setFilteredTeamLeads(filtered);
      } else {
        const searchTerm = safeString(teamLeadSearch);
        const filtered = teamLeads.filter((lead) => {
          if (!lead || !lead.id) return false;
          const fullName = safeString(getFullName(lead));
          const email = safeString(getEmail(lead));
          const staffCode = safeString(lead.staff_code);
          return (
            (fullName.includes(searchTerm) ||
              email.includes(searchTerm) ||
              staffCode.includes(searchTerm)) &&
            lead.id !== formData.team_lead_id
          );
        });
        setFilteredTeamLeads(filtered);
      }
    }
  }, [teamLeadSearch, teamLeads, formData.team_lead_id, isSubmitting]);

  // Filter members
  useEffect(() => {
    if (!isSubmitting && teamLeads && Array.isArray(teamLeads)) {
      if (memberSearch.trim() === "") {
        const filtered = teamLeads.filter(
          (member) =>
            member &&
            member.id &&
            member.id !== formData.team_lead_id &&
            !formData.team_members.some((m) => m.id === member.id),
        );
        setFilteredMembers(filtered);
      } else {
        const searchTerm = safeString(memberSearch);
        const filtered = teamLeads.filter((member) => {
          if (!member || !member.id) return false;
          const fullName = safeString(getFullName(member));
          const email = safeString(getEmail(member));
          const staffCode = safeString(member.staff_code);
          return (
            (fullName.includes(searchTerm) ||
              email.includes(searchTerm) ||
              staffCode.includes(searchTerm)) &&
            member.id !== formData.team_lead_id &&
            !formData.team_members.some((m) => m.id === member.id)
          );
        });
        setFilteredMembers(filtered);
      }
    }
  }, [
    memberSearch,
    teamLeads,
    formData.team_lead_id,
    formData.team_members,
    isSubmitting,
  ]);

  // Click outside for other dropdowns
  useEffect(() => {
    if (!isSubmitting) {
      const handleClickOutside = (e) => {
        if (
          !e.target.closest(".team-lead-dropdown-container") &&
          !e.target.closest(".member-dropdown-container")
        ) {
          setShowTeamLeadDropdown(false);
          setShowMemberDropdown(false);
        }
      };
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isSubmitting]);

  // Load team data - FIXED to handle states array correctly
  const loadTeamData = async () => {
    setIsLoading(true);
    try {
      const response = await getTeamByIdData(id);
      if (response && response.data) {
        const teamData = response.data;
        setTeamCode(teamData.team_code || "");

        const teamLeadName = teamData.team_lead
          ? getFullName(teamData.team_lead)
          : "";
        const teamLeadStaffCode = teamData.team_lead?.staff_code || "";

        const teamMembers = Array.isArray(teamData.members)
          ? teamData.members.map((member) => ({
              id: member.id,
              name: member.name || "",
              staff_code: member.staff_code || "",
              email: member.email || "",
              designation: member.designation || "Team Member",
            }))
          : [];

        // ✅ CORRECT: Extract state_ids from the 'states' array (each has state_id)
        const stateIds = Array.isArray(teamData.states)
          ? teamData.states.map((state) => state.state_id)
          : [];

        const formattedData = {
          name: teamData.name || "",
          description: teamData.description || "",
          team_lead_id: teamData.team_lead?.id || "",
          team_lead_name: teamLeadName,
          team_lead_staff_code: teamLeadStaffCode,
          team_members: teamMembers,
          state_ids: stateIds,
          status:
            teamData.status === 1 || teamData.status === "active"
              ? "active"
              : "inactive",
        };

        setFormData(formattedData);
        setOriginalData(JSON.parse(JSON.stringify(formattedData)));

        if (teamData.team_lead) {
          const displayName = teamLeadStaffCode
            ? `${teamLeadName} (${teamLeadStaffCode})`
            : teamLeadName;
          setTeamLeadSearch(displayName);
        }

        markAsClean(formattedData);
      }
    } catch (error) {
      console.error("Error loading team data:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load team data. Please try again.",
        timer: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Validate form (includes states validation)
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Team name is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (formData.description.trim().length < 10)
      newErrors.description = "Description must be at least 10 characters";
    if (!formData.team_lead_id)
      newErrors.team_lead_id = "Team lead is required";
    if (formData.team_members.length === 0)
      newErrors.team_members = "Please select at least one team member";
    if (formData.state_ids.length === 0)
      newErrors.state_ids = "Please select at least one state";
    return newErrors;
  };

  // State toggle handler
  const handleStateToggle = (stateId) => {
    if (isSubmitting) return;
    setFormData((prev) => {
      const isSelected = prev.state_ids.includes(stateId);
      const newStateIds = isSelected
        ? prev.state_ids.filter((id) => id !== stateId)
        : [...prev.state_ids, stateId];
      return { ...prev, state_ids: newStateIds };
    });
    if (errors.state_ids) setErrors({ ...errors, state_ids: "" });
  };

  const removeState = (stateId) => {
    if (isSubmitting) return;
    setFormData((prev) => ({
      ...prev,
      state_ids: prev.state_ids.filter((id) => id !== stateId),
    }));
  };

  // Team lead handlers
  const handleTeamLeadSelect = (lead) => {
    if (isSubmitting) return;
    const fullName = getFullName(lead);
    const staffCode = lead.staff_code || "";
    setFormData({
      ...formData,
      team_lead_id: lead.id,
      team_lead_name: fullName,
      team_lead_staff_code: staffCode,
    });
    const displayName = staffCode ? `${fullName} (${staffCode})` : fullName;
    setTeamLeadSearch(displayName);
    setShowTeamLeadDropdown(false);
    setErrors({ ...errors, team_lead_id: "" });
  };

  const removeTeamLead = () => {
    if (isSubmitting) return;
    setFormData({
      ...formData,
      team_lead_id: "",
      team_lead_name: "",
      team_lead_staff_code: "",
    });
    setTeamLeadSearch("");
  };

  // Member handlers
  const handleMemberSelect = (member) => {
    if (isSubmitting) return;
    const fullName = getFullName(member);
    const staffCode = member.staff_code || "";
    const email = getEmail(member);
    setFormData({
      ...formData,
      team_members: [
        ...formData.team_members,
        {
          id: member.id,
          name: fullName,
          staff_code: staffCode,
          email: email,
          designation: member.designation || "Team Member",
        },
      ],
    });
    setMemberSearch("");
    setShowMemberDropdown(false);
    setErrors({ ...errors, team_members: "" });
  };

  const removeMember = (memberId) => {
    if (isSubmitting) return;
    setFormData({
      ...formData,
      team_members: formData.team_members.filter(
        (member) => member.id !== memberId,
      ),
    });
  };

  const handleInputChange = (e) => {
    if (isSubmitting) return;
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const prepareSubmitData = () => ({
    name: formData.name,
    description: formData.description,
    team_lead_id: formData.team_lead_id,
    member_ids: formData.team_members.map((member) => member.id),
    state_ids: formData.state_ids,
    status: formData.status === "active" ? 1 : 0,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }
    const result = await handleEditTeam(id, prepareSubmitData());
    if (result.success) {
      markAsClean(formData);
      setIsSubmitting(false);
      Swal.fire({
        icon: "success",
        title: "Team Updated",
        text: "Team has been updated successfully.",
        timer: 1800,
        showConfirmButton: false,
      }).then(() => navigate("/admin/team/listing"));
    } else {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (isSubmitting || !originalData) return;
    setFormData(originalData);
    if (originalData.team_lead_name) {
      const displayName = originalData.team_lead_staff_code
        ? `${originalData.team_lead_name} (${originalData.team_lead_staff_code})`
        : originalData.team_lead_name;
      setTeamLeadSearch(displayName);
    } else {
      setTeamLeadSearch("");
    }
    setMemberSearch("");
    setErrors({});
    setShowTeamLeadDropdown(false);
    setShowMemberDropdown(false);
    resetDirty();
  };

  if (isLoading || permissionsLoading) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (!hasPermission("teams", "edit")) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to edit teams.
          </p>
          <button
            onClick={() => navigate("/admin/team/listing")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex-1 bg-gray-50 p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {isFormDirty && !isSubmitting && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 font-medium">
              You have unsaved changes
            </span>
          </div>
        </motion.div>
      )}

      {isSubmitting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-800 font-medium">Updating team...</span>
          </div>
        </motion.div>
      )}

      {/* HEADER */}
      <motion.div className="mb-4" variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Edit Team</h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-gray-600">
                Update team information and settings
              </p>
              {teamCode && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  <Shield className="w-3 h-3" />
                  {teamCode}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* STATS CARD */}
      <motion.div
        className="mb-4 bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        variants={itemVariants}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          Team Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-700">Team Lead</div>
            <div className="text-xl font-bold text-gray-900">
              {formData.team_lead_name || "Not assigned"}
            </div>
            {formData.team_lead_staff_code && (
              <div className="text-xs text-gray-500 mt-1">
                Staff Code: {formData.team_lead_staff_code}
              </div>
            )}
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-green-700">Total Members</div>
            <div className="text-xl font-bold text-gray-900">
              {formData.team_members.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Excluding team lead
            </div>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <div className="text-sm text-amber-700">Team Status</div>
            <div
              className={`text-xl font-bold ${formData.status === "active" ? "text-green-700" : "text-gray-700"}`}
            >
              {formData.status === "active" ? "Active" : "Inactive"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formData.status === "active"
                ? "Currently active"
                : "Currently inactive"}
            </div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-sm text-purple-700">States Assigned</div>
            <div className="text-xl font-bold text-gray-900">
              {formData.state_ids.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">Selected states</div>
          </div>
        </div>
      </motion.div>

      {/* FORM */}
      <motion.div
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
        variants={itemVariants}
      >
        <form onSubmit={handleSubmit}>
          {/* TEAM INFORMATION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Team Name <span className="text-red-500">*</span>
                </div>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className={`w-full px-4 py-3 border rounded-lg ${errors.name ? "border-red-500" : "border-gray-300"} ${isSubmitting ? "bg-gray-100" : ""}`}
                placeholder="Enter team name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div className="team-lead-dropdown-container">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Team Lead <span className="text-red-500">*</span>
                </div>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={teamLeadSearch}
                  onChange={(e) => {
                    setTeamLeadSearch(e.target.value);
                    setShowTeamLeadDropdown(true);
                  }}
                  onClick={() => setShowTeamLeadDropdown(true)}
                  disabled={isSubmitting}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg ${errors.team_lead_id ? "border-red-500" : "border-gray-300"} ${isSubmitting ? "bg-gray-100" : ""}`}
                  placeholder="Search for team lead by name or staff code..."
                />
                {showTeamLeadDropdown && filteredTeamLeads.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredTeamLeads.map((lead) => {
                      const fullName = getFullName(lead);
                      const staffCode = lead.staff_code || "";
                      return (
                        <div
                          key={lead.id}
                          onClick={() => handleTeamLeadSelect(lead)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b"
                        >
                          <div className="font-medium">{fullName}</div>
                          {staffCode && (
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              <Shield className="w-3 h-3" />
                              {staffCode}
                            </div>
                          )}
                          {lead.email && (
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              {lead.email}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {errors.team_lead_id && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.team_lead_id}
                </p>
              )}
            </div>
          </div>

          {/* SELECTED TEAM LEAD */}
          {formData.team_lead_id && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">{formData.team_lead_name}</h4>
                    {formData.team_lead_staff_code && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Shield className="w-3 h-3" />
                        {formData.team_lead_staff_code}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeTeamLead}
                  disabled={isSubmitting}
                  className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Change
                </button>
              </div>
            </div>
          )}

          {/* TEAM MEMBERS */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team Members <span className="text-red-500">*</span>
                <span className="text-sm text-gray-500 ml-auto">
                  Selected: {formData.team_members.length}
                </span>
              </div>
            </label>
            <div className="member-dropdown-container relative mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => {
                    setMemberSearch(e.target.value);
                    setShowMemberDropdown(true);
                  }}
                  onClick={() => setShowMemberDropdown(true)}
                  disabled={isSubmitting}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg ${errors.team_members ? "border-red-500" : "border-gray-300"} ${isSubmitting ? "bg-gray-100" : ""}`}
                  placeholder="Search for team members by name or staff code..."
                />
              </div>
              {showMemberDropdown && filteredMembers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredMembers.map((member) => {
                    const fullName = getFullName(member);
                    const staffCode = member.staff_code || "";
                    return (
                      <div
                        key={member.id}
                        onClick={() => handleMemberSelect(member)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{fullName}</div>
                            {staffCode && (
                              <div className="text-sm text-gray-500 flex items-center gap-2">
                                <Shield className="w-3 h-3" />
                                {staffCode}
                              </div>
                            )}
                            {member.email && (
                              <div className="text-sm text-gray-500 flex items-center gap-2">
                                <Mail className="w-3 h-3" />
                                {member.email}
                              </div>
                            )}
                          </div>
                          <Check className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {errors.team_members && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.team_members}
                </p>
              )}
            </div>
            {formData.team_members.length > 0 && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {formData.team_members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{member.name}</div>
                        {member.staff_code && (
                          <div className="text-xs text-gray-500">
                            <Shield className="w-3 h-3 inline mr-1" />
                            {member.staff_code}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMember(member.id)}
                      disabled={isSubmitting}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* STATE MULTI-SELECT */}
          <div className="mb-6" ref={stateDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                States <span className="text-red-500">*</span>
                <span className="text-sm text-gray-500 ml-auto">
                  Selected: {formData.state_ids.length}
                </span>
              </div>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  !isSubmitting && setShowStateDropdown(!showStateDropdown)
                }
                disabled={isSubmitting || statesLoading}
                className="w-full px-4 py-3 text-left border rounded-lg bg-white flex justify-between items-center focus:ring-2 focus:ring-blue-500"
              >
                <span
                  className={
                    formData.state_ids.length === 0
                      ? "text-gray-400"
                      : "text-gray-700"
                  }
                >
                  {formData.state_ids.length === 0
                    ? "Select states"
                    : `${formData.state_ids.length} state(s) selected`}
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>
              {showStateDropdown && !isSubmitting && !statesLoading && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search states..."
                        value={stateSearchTerm}
                        onChange={(e) => setStateSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {states
                      .filter((state) =>
                        state.name
                          .toLowerCase()
                          .includes(stateSearchTerm.toLowerCase()),
                      )
                      .map((state) => (
                        <div
                          key={state.id}
                          onClick={() => handleStateToggle(state.id)}
                          className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={formData.state_ids.includes(state.id)}
                            onChange={() => {}}
                            className="w-4 h-4 text-blue-600 rounded mr-3 pointer-events-none"
                          />
                          <span>{state.name}</span>
                        </div>
                      ))}
                    {states.filter((s) =>
                      s.name
                        .toLowerCase()
                        .includes(stateSearchTerm.toLowerCase()),
                    ).length === 0 && (
                      <div className="px-4 py-3 text-gray-500 text-center">
                        No states found
                      </div>
                    )}
                  </div>
                </div>
              )}
              {statesLoading && (
                <div className="text-sm text-gray-500 mt-1">
                  Loading states...
                </div>
              )}
            </div>
            {errors.state_ids && (
              <p className="text-red-500 text-sm mt-1">{errors.state_ids}</p>
            )}
            {formData.state_ids.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.state_ids.map((stateId) => {
                  const state = states.find((s) => s.id === stateId);
                  return state ? (
                    <span
                      key={stateId}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {state.name}
                      <button
                        type="button"
                        onClick={() => removeState(stateId)}
                        className="hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              maxLength={300}
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              disabled={isSubmitting}
              className={`w-full px-4 py-3 border rounded-lg resize-none ${errors.description ? "border-red-500" : "border-gray-300"} ${isSubmitting ? "bg-gray-100" : ""}`}
              placeholder="Describe the team's purpose, responsibilities, and goals..."
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>Minimum 10 characters</span>
              <span>{formData.description.length}/500</span>
            </div>
          </div>

          {/* STATUS */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === "active"}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2">Active</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={formData.status === "inactive"}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2">Inactive</span>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {formData.status === "active"
                ? "Active teams are visible and can be assigned new members."
                : "Inactive teams are archived and cannot receive new members."}
            </p>
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={handleReset}
              disabled={!isFormDirty || isSubmitting}
              className={`px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2 transition ${!isFormDirty || isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <RotateCcw className="w-4 h-4" />
              {isFormDirty ? "Reset Changes" : "No Changes"}
            </button>
            <button
              type="submit"
              disabled={apiLoading || !isFormDirty || isSubmitting}
              className={`px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition ${apiLoading || !isFormDirty || isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating Team...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Update Team
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* IMPORTANT NOTES */}
      <motion.div
        className="mt-8 bg-amber-50 rounded-2xl shadow-sm border border-amber-200 p-6"
        variants={itemVariants}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          Important Notes
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="font-medium text-amber-700">•</span>
            <span>
              Changing team status to "Inactive" will prevent adding new members
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-medium text-amber-700">•</span>
            <span>
              Changing team lead will not affect existing team members
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-medium text-amber-700">•</span>
            <span>Team code cannot be changed after creation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-medium text-amber-700">•</span>
            <span>
              All changes take effect immediately for all team members
            </span>
          </li>
        </ul>
      </motion.div>
    </motion.div>
  );
};

export default EditTeam;
