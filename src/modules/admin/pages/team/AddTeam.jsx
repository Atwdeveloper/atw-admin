"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "@/lib/navigation";
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
import Loader from "../../../../common/components/Loader";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import useUnsavedChangesWarning from "../../../../common/hooks/useUnsavedChangesWarning";

const AddTeam = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const {
    handleAddTeam,
    loading,
    getTeamLeadsList,
    teamLeads,
    states,
    statesLoading,
  } = useTeams({ autoFetch: false });

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const stateDropdownRef = useRef(null);

  const initialFormData = {
    name: "",
    description: "",
    team_lead_id: "",
    team_lead_name: "",
    team_lead_email: "",
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
  const [stateSearchTerm, setStateSearchTerm] = useState("");
  const isFormDirty = useMemo(() => {
    if (!initialFormData || !formData || isSubmitting || isPageLoading)
      return false;
    return isDirty;
  }, [isDirty, formData, initialFormData, isSubmitting, isPageLoading]);

  useUnsavedChangesWarning(
    isFormDirty && !isSubmitting,
    "You have unsaved changes. Are you sure you want to leave? All changes will be lost.",
  );

  const safeString = (value) => (value || "").toString().toLowerCase().trim();
  const getFullName = (lead) => {
    if (!lead) return "";
    const firstName = lead?.first_name || lead?.name || "";
    const lastName = lead?.last_name || "";
    return `${firstName} ${lastName}`.trim();
  };
  const getEmail = (lead) => lead?.email || "";

  // Initialize
  useEffect(() => {
    const initializeData = async () => {
      setIsPageLoading(true);
      try {
        await getTeamLeadsList();
      } catch (error) {
        console.error("Error initializing data:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load required data. Please refresh the page.",
          timer: 3000,
        });
      } finally {
        setIsPageLoading(false);
      }
    };
    initializeData();
  }, []);

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

  // Dirty check
  useEffect(() => {
    if (!isPageLoading && !isSubmitting) checkDirty(formData);
  }, [formData, checkDirty, isPageLoading, isSubmitting]);

  // Filter team leads
  useEffect(() => {
    if (!isPageLoading && !isSubmitting) {
      const leadsArray = Array.isArray(teamLeads) ? teamLeads : [];
      if (teamLeadSearch.trim() === "") {
        const filtered = leadsArray.filter(
          (lead) => lead && lead.id && lead.id !== formData.team_lead_id,
        );
        setFilteredTeamLeads(filtered);
      } else {
        const searchTerm = safeString(teamLeadSearch);
        const filtered = leadsArray.filter((lead) => {
          if (!lead || !lead.id) return false;
          const fullName = safeString(getFullName(lead));
          const email = safeString(getEmail(lead));
          return (
            (fullName.includes(searchTerm) || email.includes(searchTerm)) &&
            lead.id !== formData.team_lead_id
          );
        });
        setFilteredTeamLeads(filtered);
      }
    }
  }, [
    teamLeadSearch,
    teamLeads,
    formData.team_lead_id,
    isPageLoading,
    isSubmitting,
  ]);

  // Filter members
  useEffect(() => {
    if (!isPageLoading && !isSubmitting) {
      const leadsArray = Array.isArray(teamLeads) ? teamLeads : [];
      if (!formData.team_lead_id) {
        setFilteredMembers([]);
        return;
      }
      if (memberSearch.trim() === "") {
        const filtered = leadsArray.filter(
          (member) =>
            member &&
            member.id &&
            member.id !== formData.team_lead_id &&
            !formData.team_members.some((m) => m.id === member.id),
        );
        setFilteredMembers(filtered);
      } else {
        const searchTerm = safeString(memberSearch);
        const filtered = leadsArray.filter((member) => {
          if (!member || !member.id) return false;
          const fullName = safeString(getFullName(member));
          const email = safeString(getEmail(member));
          return (
            (fullName.includes(searchTerm) || email.includes(searchTerm)) &&
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
    isPageLoading,
    isSubmitting,
  ]);

  // Validation
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

  // State handlers
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
    const email = getEmail(lead);
    setFormData({
      ...formData,
      team_lead_id: lead.id,
      team_lead_name: fullName,
      team_lead_email: email,
    });
    setTeamLeadSearch(`${fullName} (${email || "No email"})`);
    setShowTeamLeadDropdown(false);
    setErrors({ ...errors, team_lead_id: "" });
    setMemberSearch("");
  };

  const removeTeamLead = () => {
    if (isSubmitting) return;
    setFormData({
      ...formData,
      team_lead_id: "",
      team_lead_name: "",
      team_lead_email: "",
      team_members: [],
    });
    setTeamLeadSearch("");
    setMemberSearch("");
  };

  // Member handlers
  const handleMemberSelect = (member) => {
    if (isSubmitting) return;
    if (!formData.team_lead_id) {
      Swal.fire({
        title: "Select Team Lead First",
        text: "Please select a team lead before adding team members",
        icon: "warning",
        confirmButtonColor: "#3B82F6",
        timer: 3000,
      });
      return;
    }
    const fullName = getFullName(member);
    const email = getEmail(member);
    setFormData({
      ...formData,
      team_members: [
        ...formData.team_members,
        {
          id: member.id,
          name: fullName,
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
    member_ids: formData.team_members.map((m) => m.id),
    state_ids: formData.state_ids,
    status: formData.status,
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
    const result = await handleAddTeam(prepareSubmitData());
    if (result.success) {
      markAsClean(formData);
      setIsSubmitting(false);
      Swal.fire({
        icon: "success",
        title: "Team Created",
        text: "Team has been created successfully.",
        timer: 1800,
        showConfirmButton: false,
      }).then(() => navigate("/admin/team/listing"));
    } else {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (isSubmitting) return;
    setFormData(initialFormData);
    setTeamLeadSearch("");
    setMemberSearch("");
    setErrors({});
    setShowTeamLeadDropdown(false);
    setShowMemberDropdown(false);
    resetDirty();
  };

  // Loading states
  if (loading || isPageLoading || permissionsLoading) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (!hasPermission("teams", "create")) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to add teams.
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

  if (!isPageLoading && (!teamLeads || teamLeads.length === 0)) {
    return (
      <div className="flex-1 bg-gray-50 p-4">
        <motion.div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            No Team Leads Available
          </h2>
          <p className="text-gray-600 mb-4">
            You need to have team leads registered before creating a team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/admin/team/listing")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center justify-center gap-2"
            >
              Back to Teams
            </button>
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
            >
              Go to Dashboard
            </button>
          </div>
        </motion.div>
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
            <span className="text-blue-800 font-medium">Creating team...</span>
          </div>
        </motion.div>
      )}

      <motion.div className="mb-6" variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Add New Team</h1>
            <p className="text-gray-600 mt-1">
              Create a new team for your organization
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span>{teamLeads?.length || 0} team leads available</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
        variants={itemVariants}
      >
        <form onSubmit={handleSubmit}>
          {/* Team Name & Team Lead */}
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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.name ? "border-red-500" : "border-gray-300"} ${isSubmitting ? "bg-gray-100" : ""}`}
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
                  placeholder="Search for team lead by name or email..."
                />
                {showTeamLeadDropdown && filteredTeamLeads.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredTeamLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => handleTeamLeadSelect(lead)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b"
                      >
                        <div className="font-medium">{getFullName(lead)}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          {getEmail(lead) || "No email"}
                        </div>
                      </div>
                    ))}
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

          {/* Selected Team Lead */}
          {formData.team_lead_id && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">{formData.team_lead_name}</h4>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      {formData.team_lead_email || "No email"}
                    </p>
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

          {/* Team Members */}
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
                  onClick={() => {
                    if (formData.team_lead_id) setShowMemberDropdown(true);
                  }}
                  disabled={!formData.team_lead_id || isSubmitting}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg ${errors.team_members ? "border-red-500" : "border-gray-300"} ${!formData.team_lead_id || isSubmitting ? "bg-gray-100" : ""}`}
                  placeholder={
                    formData.team_lead_id
                      ? "Search for team members..."
                      : "Select a team lead first..."
                  }
                />
              </div>
              {showMemberDropdown && filteredMembers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => handleMemberSelect(member)}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b"
                    >
                      <div className="font-medium">{getFullName(member)}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        {getEmail(member) || "No email"}
                      </div>
                    </div>
                  ))}
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
                        <div className="text-xs text-gray-500">
                          {member.email || "No email"}
                        </div>
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

          {/* State Multi-Select */}
          {/* State Multi-Select with Search */}
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
              {/* Dropdown trigger button */}
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

              {/* Dropdown panel with search input */}
              {showStateDropdown && !isSubmitting && !statesLoading && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {/* Search input inside dropdown */}
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
                  {/* State list - filtered */}
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

            {/* Selected state tags */}
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
          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              maxLength={300}
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

          {/* Status */}
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
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={handleReset}
              disabled={loading || isSubmitting}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Form
            </button>
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Team...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Create Team
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddTeam;
