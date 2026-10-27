"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  User,
  LogOut,
  Menu,
  Key,
  ChevronDown,
  UserCog,
  SlidersHorizontal,
  Bell,
  ScrollText,
  Search,
  X,
  Loader,
  Building2,
  Users,
  UserCircle,
  ShoppingBag,
  Package,
  Factory,
  Award,
  FileText,
} from "lucide-react";
import { useAuth } from "../../../common/hooks/useAuth";
import { useNavigate, useLocation, generatePath } from "@/lib/navigation";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { showLogoutConfirmation } from "./LogoutModal";
import Cookies from "js-cookie";
import { useAdminPermissions } from "../../../common/hooks/useAdminPermissions";
import { getUnreadCountAPI } from "../../../api/admin/adminNotificationsAPI";
import { globalSearchAPI } from "../../../api/admin/adminDashboardAPI";
import { LEGACY_ADMIN_FEATURES } from "../../../common/utils/features";
import { endAdminSessionLocally } from "../../../api/adminV1/session";
import ThemeToggle from "../../../common/components/ThemeToggle";

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// Icon mapping per result type
const typeIcons = {
  worker: Users,
  company: Building2,
  agent: UserCircle,
  staff: UserCog,
  vendor: ShoppingBag,
  dress_order: Package,
  industry: Factory,
  designation: Award,
};

const resultTypePermissionMap = {
  worker: { module: "workers", action: "view" },
  company: { module: "companies", action: "view" },
  agent: { module: "agent", action: "view" },
  staff: { module: "staff", action: "view" },
  vendor: { module: "vendor", action: "view" },
  dress_order: { module: "dress_orders", action: "view" },
  industry: { module: "industry", action: "view" },
  designation: { module: "designation", action: "view" },
};

const Header = ({ toggleSidebar }) => {
  const { logout, user, settings } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const roleLabel = user?.superAdmin
    ? "Super Admin"
    : user?.roles?.length
      ? user.roles.join(", ")
      : "Administrator";

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { hasPermission } = useAdminPermissions();
  const filteredSearchResults = searchResults.filter((result) => {
    const permConfig = resultTypePermissionMap[result.type];
    if (!permConfig) return true;
    return hasPermission(permConfig.module, permConfig.action);
  });
  const caneditusername = hasPermission("configuration", "edit_username");
  const caneditemail = hasPermission("configuration", "edit_email");
  const caneditsitesettings = hasPermission(
    "configuration",
    "edit_site_settings",
  );
  const canviewdocuments = hasPermission("configuration", "manage_documents");

  const isMyProfileActive =
    location.pathname === "/admin/myprofile" ||
    location.pathname === "/admin/myprofile/edit";

  // Fetch unread count
  const fetchUnreadCount = async () => {
    // Notifications have no endpoint on the new backend yet.
    if (!LEGACY_ADMIN_FEATURES) return;
    try {
      const response = await getUnreadCountAPI();
      const count = response?.data?.unread_count ?? 0;
      setNotificationCount(count);
    } catch (error) {
      console.error("Failed to fetch unread count", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 300000);
    return () => clearInterval(interval);
  }, []);

  // Reactive: re-renders as soon as settings refresh (e.g. right after
  // saving a new logo in Site Settings), falling back to the cookie for
  // the brief window before settings load on first mount.
  const logoUrl = settings?.site_logo_url || Cookies.get("logo_url") || "";

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Perform search when debounced query changes
  useEffect(() => {
    const fetchResults = async () => {
      if (!LEGACY_ADMIN_FEATURES || debouncedSearch.trim().length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }
      setIsSearching(true);
      try {
        const response = await globalSearchAPI({ search: debouncedSearch });
        const results = response?.data?.data || response?.data || [];
        setSearchResults(Array.isArray(results) ? results : []);
        setShowResults(true);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    fetchResults();
  }, [debouncedSearch]);

  const navigateAndClose = (path) => {
    navigate(path);
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    showLogoutConfirmation(() => {
      endAdminSessionLocally(logout);
      Swal.fire({
        title: "Logged Out!",
        text: "You have been successfully logged out.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => navigate("/admin/login", { replace: true }));
    });
    setIsDropdownOpen(false);
  };

  const handleResultClick = (result) => {
    const routeMap = {
      worker: "/admin/worker/edit/:id",
      company: "/admin/company/edit/:id",
      agent: "/admin/agent/edit/:id",
      staff: "/admin/staff/edit/:id",
      vendor: "/admin/vendor/edit/:id",
      dress_order: "/admin/dress-orders/edit/:id",
      industry: "/admin/industries/edit/:id",
    };

    if (routeMap[result.type]) {
      const path = generatePath(routeMap[result.type], { id: result.id });
      setSearchQuery("");
      setShowResults(false);
      navigate(path);
    } else {
      Swal.fire({
        icon: "info",
        title: "Navigation Unavailable",
        text: `Direct detail page for ${result.type.replace("_", " ")} is not implemented yet.`,
      });
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    inputRef.current?.focus();
  };

  const getStatusBadge = (status) => {
    if (status === 1 || status === "active" || status === "1") {
      return (
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
          Active
        </span>
      );
    }
    return (
      <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
        Inactive
      </span>
    );
  };

  /* Reusable Dropdown Item */
  const ConfigItem = ({ label, path, icon: Icon, active }) => (
    <motion.button
      whileHover={{ x: 5 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigateAndClose(path)}
      className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-3
        ${
          active
            ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500"
            : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
        }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          active ? "bg-indigo-200" : "bg-indigo-100"
        }`}
      >
        <Icon
          size={16}
          className={active ? "text-indigo-700" : "text-indigo-600"}
        />
      </div>
      <p className="font-medium">{label}</p>
    </motion.button>
  );

  return (
    <motion.header className="bg-white border-b border-gray-200 px-4 md:px-8 py-2 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1 }}
        onClick={toggleSidebar}
        className="md:hidden text-gray-700"
      >
        <Menu size={24} />
      </motion.button>

      <div
        className="ml-4 cursor-pointer flex items-center gap-4"
        onClick={() => navigate("/admin/dashboard")}
      >
        <img
          src={logoUrl || "/images/Anytime_Work_logo.png"}
          alt="Anytime Work Logo"
          className="h-14"
        />
      </div>

      {/* Global Search Bar — no search endpoint on the new backend yet */}
      {!LEGACY_ADMIN_FEATURES && <div className="flex-1" />}
      {LEGACY_ADMIN_FEATURES && (
      <div
        className="hidden md:block flex-1 max-w-xl mx-6 relative"
        ref={searchContainerRef}
      >
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search workers, companies, agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader size={16} className="animate-spin text-gray-400" />
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50"
            >
              {filteredSearchResults.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No results found
                </div>
              ) : (
                <div className="py-1">
                  {filteredSearchResults.map((result, idx) => {
                    const IconComponent = typeIcons[result.type] || FileText;
                    return (
                      <motion.button
                        key={`${result.type}-${result.id}-${idx}`}
                        whileHover={{ backgroundColor: "#f3f4f6" }}
                        onClick={() => handleResultClick(result)}
                        className="w-full px-4 py-3 text-left flex items-start gap-3 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <IconComponent size={18} className="text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 truncate">
                              {result.label}
                            </span>
                            {result.code && (
                              <span className="text-xs text-gray-500 truncate">
                                ({result.code})
                              </span>
                            )}
                            {getStatusBadge(result.status)}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500 capitalize">
                              {result.type.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      )}

      {/* Mobile Search Icon */}
      {LEGACY_ADMIN_FEATURES && (
      <div className="md:hidden flex-1 flex justify-end mr-2">
        <button
          className="p-2 text-gray-700 hover:bg-gray-100 rounded-full"
          onClick={() => {
            Swal.fire({
              title: "Search",
              input: "text",
              inputPlaceholder: "Search...",
              showCancelButton: true,
            }).then((result) => {
              if (result.isConfirmed && result.value) {
                setSearchQuery(result.value);
              }
            });
          }}
        >
          <Search size={20} />
        </button>
      </div>
      )}

      <div className="flex items-center justify-between">
        {/* Theme Toggle */}
        <div className="mr-2">
          <ThemeToggle showLabel={false} variant="minimal" size="sm" />
        </div>

        {/* Bell Icon with Unread Count */}
        {LEGACY_ADMIN_FEATURES && (
        <div className="ml-auto mt-2 mr-4 relative">
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => navigate("/admin/notifications")}
            className="relative p-2 text-gray-700 hover:bg-gray-50 rounded-full transition-colors"
            aria-label="Notifications"
          >
            <Bell size={26} />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </motion.button>
        </div>
        )}

        {/* User Dropdown */}
        <div className="ml-auto relative" ref={dropdownRef}>
          <motion.button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>

            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-800">
                {user?.name || "Admin User"}
              </p>
              <p className="text-xs text-gray-500">
                {roleLabel}
              </p>
            </div>
            <ChevronDown
              size={16}
              className={`transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </motion.button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute overflow-hidden right-0 w-56 bg-white rounded-lg shadow-lg border z-50"
              >
                <div className="px-4 py-3 border-b">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>

                <ConfigItem
                  label="My Profile"
                  path="/admin/myprofile"
                  icon={User}
                  active={isMyProfileActive}
                />

                <div className="border-t">
                  <ConfigItem
                    label="Change Password"
                    path="/admin/settings/change-password"
                    icon={Key}
                    active={
                      location.pathname === "/admin/settings/change-password"
                    }
                  />

                  {LEGACY_ADMIN_FEATURES && caneditusername && (
                    <ConfigItem
                      label="Change Username"
                      path="/admin/configuration/change-username"
                      icon={UserCog}
                      active={
                        location.pathname ===
                        "/admin/configuration/change-username"
                      }
                    />
                  )}

                  {LEGACY_ADMIN_FEATURES && caneditemail && (
                    <ConfigItem
                      label="Change Email"
                      path="/admin/configuration/change-email"
                      icon={UserCog}
                      active={
                        location.pathname ===
                        "/admin/configuration/change-email"
                      }
                    />
                  )}

                  {LEGACY_ADMIN_FEATURES && canviewdocuments && (
                    <ConfigItem
                      label="Documents"
                      path="/admin/configuration/documents"
                      icon={ScrollText}
                      active={
                        location.pathname === "/admin/configuration/documents"
                      }
                    />
                  )}

                  {LEGACY_ADMIN_FEATURES && caneditsitesettings && (
                    <ConfigItem
                      label="Site Settings"
                      path="/admin/configuration/site-settings"
                      icon={SlidersHorizontal}
                      active={
                        location.pathname ===
                        "/admin/configuration/site-settings"
                      }
                    />
                  )}
                </div>

                <div className="border-t">
                  <motion.button
                    whileHover={{ x: 5 }}
                    onClick={handleLogout}
                    className="w-full px-4 py-3 flex items-center gap-3 text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    <span className="font-medium">Logout</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
