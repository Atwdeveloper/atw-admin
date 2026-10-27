"use client";

import { motion } from "framer-motion";
import {
  Edit2,
  Trash2,
  Plus,
  Eye,
  Users,
  User,
  Hash,
  Building,
  PersonStanding,
  Mail,
  CheckCircle,
  Filter,
  Download,
} from "lucide-react";
import { useNavigate } from "@/lib/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  containerVariants,
  itemVariants,
  tableRowVariants,
} from "../../../../common/utils/motionVariants";
import TeamModal from "../../components/teams/TeamModal";
import { useTeams } from "../../adminhooks/useTeams";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import { useSortableData } from "../../../../common/hooks/useSortableData";
import SortableHeader from "../../../../common/components/SortableHeader";

const ManageTeams = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();

  const {
    teams,
    loading,
    page,
    totalItems,
    totalPages,
    filters,

    existingteamLeads,
    setPage,
    setFilters,
    handleSearch,
    handleClear,
    handleDelete,
    getTeamLeadsList,
    getexistingTeamLeadsList,
    totalRecords,
    handleExportDownload,
  } = useTeams({ autoFetch: true });

  const { sortedItems: sortedTeams, sortConfig, requestSort } =
    useSortableData(teams);

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showTeamLeadDropdown, setShowTeamLeadDropdown] = useState(false);

  useEffect(() => {
    getTeamLeadsList();
    getexistingTeamLeadsList();
  }, []);

  const teamLeadRef = useRef(null);

  // Handle click outside dropdowns
  const handleClickOutside = useCallback((event) => {
    if (teamLeadRef.current && !teamLeadRef.current.contains(event.target)) {
      setShowTeamLeadDropdown(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  const openViewModal = (team) => {
    setSelectedTeam(team);
    setIsModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedTeam(null);
    setIsModalOpen(false);
  };

  const handleExportClick = async () => {
    try {
      setIsExporting(true);
      await handleExportDownload();
    } finally {
      setIsExporting(false);
    }
  };

  // Clear all filters
  const handleClearAll = () => {
    setFilters({
      team_code: "",
      name: "",
      team_lead: "",
    });
    setFiltersVisible(false);
    handleSearch();
  };

  // Function to count team members
  const countTeamMembers = (team) => {
    return team.members ? team.members.length : 0;
  };

  // Function to get team lead name
  const getTeamLeadName = (team) => {
    if (team.team_lead) {
      return `${team.team_lead.name} `;
    }
    return "Not assigned";
  };

  // Check permissions for different actions
  const canView = hasPermission("teams", "view");
  const canCreate = hasPermission("teams", "create");
  const canEdit = hasPermission("teams", "edit");
  const canDelete = hasPermission("teams", "delete");
  const canExport = hasPermission("teams", "export");

  // If user doesn't have view permission, show access denied
  if (!permissionsLoading && !canView) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <Users className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view teams.
          </p>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex-1 bg-gray-50"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* HEADER WITH FILTER TOGGLE */}
      <motion.div
        className={`bg-white p-4 border border-gray-200 shadow-sm ${
          filtersVisible ? "rounded-t-2xl border-b-0" : "mb-4 rounded-2xl"
        }`}
        variants={itemVariants}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-gray-800">
              Team Management
            </h1>
            {/* <p className="text-gray-600 text-sm mt-1">
              Organize and manage your teams efficiently
            </p> */}
          </div>

          <div className="flex items-center gap-4">
            {/* Team Name Filter */}
            <input
              type="text"
              placeholder="Search by team name ....."
              value={filters.name || ""}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-auto"
            />

            {!filtersVisible && filters.name && (
              <button
                onClick={handleClear}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear All
              </button>
            )}

            <button
              onClick={() => setFiltersVisible(!filtersVisible)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg font-medium transition ${
                filtersVisible
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>

            {canExport && (
              <button
                onClick={handleExportClick}
                disabled={isExporting || loading}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition ${
                  isExporting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Export as CSV</span>
                  </>
                )}
              </button>
            )}

            {canCreate && (
              <button
                onClick={() => navigate("/admin/teams/add")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add New Team</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* FILTER SECTION */}
      {filtersVisible && (
        <motion.div
          className="bg-white p-4 mb-4 rounded-b-2xl border border-gray-200 shadow-sm"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="flex items-center gap-2 mb-4 sm:mb-0">
              <span className="text-sm font-medium text-gray-700">
                FILTER BY :
              </span>

              <div className="flex flex-wrap gap-2">
                {/* Team Code Filter */}
                <div className="relative w-48">
                  <div className="relative">
                    <Hash
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <input
                      type="text"
                      value={filters.team_code || ""}
                      onChange={(e) =>
                        setFilters({ ...filters, team_code: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-1.5 border border-gray-300 text-sm rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Team CODE....."
                    />
                  </div>
                </div>

                {/* Team Lead Filter Dropdown */}
                <div
                  ref={teamLeadRef}
                  className="relative w-48"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="relative">
                    <PersonStanding
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <input
                      type="text"
                      value={filters.team_lead || ""}
                      onChange={(e) =>
                        setFilters({ ...filters, team_lead: e.target.value })
                      }
                      onFocus={() => setShowTeamLeadDropdown(true)}
                      className="w-full pl-10 pr-4 py-1.5 border border-gray-300 text-sm rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                      placeholder="Team Lead....."
                      readOnly
                    />
                  </div>

                  {/* Team Lead Dropdown */}
                  {showTeamLeadDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div
                        className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 ${
                          !filters.team_lead ? "bg-blue-50" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilters({ ...filters, team_lead: "" });
                          setShowTeamLeadDropdown(false);
                        }}
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">All Team Leads</span>
                          {!filters.team_lead && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </div>

                      {existingteamLeads?.map((lead) => (
                        <div
                          key={lead.id}
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                            filters.team_lead === lead.staff.name
                              ? "bg-blue-50"
                              : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilters({
                              ...filters,
                              team_lead: lead.staff.name,
                            });
                            setShowTeamLeadDropdown(false);
                          }}
                        >
                          <div className="flex items-center justify-between text-sm">
                            <div>
                              <span className="block font-medium">
                                {lead.staff.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {lead.staff_code}
                              </span>
                            </div>
                            {filters.team_lead === lead.staff.name && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Clear All
                </button>
                {/* <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Apply Filters
                </button> */}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* MAIN TABLE */}
      <motion.div
        className="bg-white rounded-[22px] border border-[#DDDDDD] shadow-sm overflow-hidden"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Team List</h2>
          <h2 className="flex items-center justify-between gap-1 text-lg font-medium text-gray-800">
            <p>Total Teams : </p> {totalRecords || totalItems || teams.length}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortableHeader
                  label="Team ID"
                  sortKey="team_code"
                  accessor={(t) =>
                    t.team_code || `T-${t.id.toString().padStart(5, "0")}`
                  }
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Team Name"
                  sortKey="name"
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Team Lead"
                  sortKey="team_lead"
                  accessor={(t) => t.team_lead?.name || ""}
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Team Members"
                  sortKey="members_count"
                  accessor={(t) => (t.members ? t.members.length : 0)}
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <SortableHeader
                  label="Created Date"
                  sortKey="created_at"
                  accessor={(t) =>
                    t.created_at ? new Date(t.created_at).getTime() : 0
                  }
                  sortConfig={sortConfig}
                  onSort={requestSort}
                />
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    1
                  </td>
                </tr>
              ) : sortedTeams.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-500">
                    <div className="flex flex-col items-center">
                      <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-600">
                        No teams found.
                      </p>
                      <p className="text-sm mt-1 text-gray-400">
                        Create your first team by clicking "Add New Team" above.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedTeams.map((team, index) => (
                  <motion.tr
                    key={team.id}
                    className="cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    onClick={() => openViewModal(team)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* <Hash className="w-4 h-4 text-blue-600" />   */}
                        <span className="font-mono font-semibold text-gray-800">
                          {team.team_code ||
                            `T-${team.id.toString().padStart(5, "0")}`}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building className="w-4 h-4 text-blue-700" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 block">
                            {team.name}
                          </span>
                          {team.description && (
                            <span className="text-xs text-gray-500">
                              {team.description?.length > 25
                                ? team.description.slice(0, 25) + "..."
                                : team.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {team.team_lead ? (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-green-700" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 block">
                              {getTeamLeadName(team)}
                            </span>
                            {team.team_lead.email && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {team.team_lead.staff_code}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">
                          Not assigned
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {team.members &&
                            team.members.slice(0, 3).map((member, idx) => (
                              <div
                                key={idx}
                                className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-800"
                                title={`${member.name}`}
                              >
                                {member.name?.charAt(0)}
                              </div>
                            ))}
                          {team.members && team.members.length > 3 && (
                            <div
                              className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-700"
                              title={`${team.members.length - 3} more members`}
                            >
                              +{team.members.length - 3}
                            </div>
                          )}
                        </div>
                        <div className="ml-2">
                          <span className="font-semibold text-gray-900">
                            {countTeamMembers(team)}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">
                            members
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(team.created_at).toLocaleDateString()}
                      <div className="text-xs text-gray-400">
                        {new Date(team.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="px-6 py-4 cursor-auto"
                    >
                      <div className="flex gap-3">
                        {canView && (
                          <button
                            onClick={() => openViewModal(team)}
                            className="text-gray-600 hover:text-green-600"
                            title="View Team Details"
                          >
                            <Eye size={18} />
                          </button>
                        )}

                        {canEdit && (
                          <button
                            onClick={() =>
                              navigate(`/admin/teams/edit/${team.id}`)
                            }
                            className="text-gray-600 hover:text-blue-600"
                            title="Edit Team"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => handleDelete(team.id)}
                            className="text-gray-600 hover:text-red-600"
                            title="Delete Team"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* PAGINATION */}
      {teams.length > 0 && (
        <motion.div className="flex items-center justify-center space-x-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition 
              ${
                page === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-black hover:text-white"
              }`}
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, index) => {
            const p = index + 1;

            if (
              p === 1 ||
              p === totalPages ||
              (p >= page - 1 && p <= page + 1)
            ) {
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border text-sm shadow-sm transition
                    ${
                      page === p
                        ? "bg-black text-white"
                        : "bg-white hover:bg-black hover:text-white"
                    }`}
                >
                  {p}
                </button>
              );
            }

            if (p === page - 3 || p === page + 3) {
              return (
                <span key={p} className="px-2">
                  ...
                </span>
              );
            }

            return null;
          })}

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className={`px-3 py-2 rounded-xl border shadow-sm text-sm transition 
              ${
                page === totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-black hover:text-white"
              }`}
          >
            Next
          </button>
        </motion.div>
      )}

      {/* VIEW MODAL - Only show if user has view permission */}
      {canView && (
        <TeamModal
          team={selectedTeam}
          isOpen={isModalOpen}
          onClose={closeViewModal}
        />
      )}
    </motion.div>
  );
};

export default ManageTeams;
