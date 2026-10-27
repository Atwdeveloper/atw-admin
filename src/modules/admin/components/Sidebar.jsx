"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Building2,
  Users,
  Briefcase,
  FileText,
  ChevronRight,
  X,
  List,
  Headphones,
  ShoppingCart,
  LogOut,
  Shirt,
  User,
  Shield,
  PersonStanding,
  MessageCircle,
  Ratio,
  ChevronLeft,
  Menu,
  Layers,
  BriefcaseIcon,
  FileUser,
  Boxes,
  CreditCard,
  LayoutPanelTop,
  Banknote,
  BookOpen,
  Percent,
  LayoutDashboard,
  BarChart3,
  Clock,
  ScanFace,
} from "lucide-react";
import { useLocation, useNavigate } from "@/lib/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "../../../common/hooks/useAuth";
import { showLogoutConfirmation } from "../../admin/components/LogoutModal";
import Swal from "sweetalert2";
import { LEGACY_ADMIN_FEATURES } from "../../../common/utils/features";
import { endAdminSessionLocally } from "../../../api/adminV1/session";
import { useAdminPermissions } from "../../../common/hooks/useAdminPermissions";

const menuItems = [
  {
    id: "jobs",
    label: "Jobs",
    icon: Briefcase,
    path: "#",
    requiredPermission: { module: "notification", action: "view" },
  },
  {
    id: "company",
    label: "Company",
    icon: Building2,
    path: "/admin/company/listing",
    requiredPermission: { module: "companies", action: "view" },
    subItems: [
      {
        label: "Company Listing",
        path: "/admin/company/listing",
        icon: List,
        requiredPermission: { module: "companies", action: "view" },
      },
    ],
  },
  {
    id: "vacancy",
    label: "Vacancy",
    icon: BriefcaseIcon,
    path: "/admin/vacancy-listing",
    requiredPermission: { module: "vacancy", action: "view" },

    subItems: [
      {
        label: "All Vacancy",
        path: "/admin/vacancy-listing",
        icon: List,
        requiredPermission: {
          module: "vacancy",
          action: "view",
        },
      },
    ],
  },
  {
    id: "worker",
    label: "Workers",
    icon: Users,
    path: "/admin/worker/listing",
    requiredPermission: { module: "workers", action: "view" },
    subItems: [
      {
        label: "Worker Listing",
        path: "/admin/worker/listing",
        icon: List,
        requiredPermission: { module: "workers", action: "view" },
      },
    ],
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: Clock,
    path: "/admin/attendance/face-enroll",
    requiredPermission: { module: "face_enroll", action: "view" },
    subItems: [
      {
        label: "Face Enroll",
        path: "/admin/attendance/face-enroll",
        icon: ScanFace,
        requiredPermission: { module: "face_enroll", action: "view" },
      },
    ],
  },
  {
    id: "staff",
    label: "Staff",
    icon: User,
    path: "/admin/staff/listing",
    requiredPermission: { module: "admin_staff", action: "view" },
    subItems: [
      {
        label: "Staff Listing",
        path: "/admin/staff/listing",
        icon: List,
        requiredPermission: { module: "admin_staff", action: "view" },
      },
    ],
  },
  {
    id: "agent",
    label: "Agent",
    icon: FileUser,
    path: "/admin/agent/listing",
    requiredPermission: { module: "agent", action: "view" },
    subItems: [
      {
        label: "Agent Listing",
        path: "/admin/agent/listing",
        icon: List,
        requiredPermission: { module: "agent", action: "view" },
      },
    ],
  },
  {
    id: "roles",
    label: "Roles",
    icon: Shield,
    path: "/admin/roles",
    requiredPermission: { module: "admin_roles", action: "view" },
    subItems: [
      {
        label: "Role Listing",
        path: "/admin/roles",
        icon: List,
        requiredPermission: { module: "admin_roles", action: "view" },
      },
    ],
  },
  {
    id: "industries",
    label: "Industries",
    icon: Boxes,
    path: "/admin/industries",
    requiredPermission: { module: "industry", action: "view" },
    subItems: [
      {
        label: "Industry Listing",
        path: "/admin/industries",
        icon: List,
        requiredPermission: { module: "industry", action: "view" },
      },
      {
        label: "Designation Listing",
        path: "/admin/designations",
        icon: Briefcase,
        requiredPermission: { module: "designation", action: "view" },
      },
    ],
  },
  {
    id: "minimum-wage",
    label: "Minimum Wage",
    icon: Banknote,
    path: "/admin/minimum-wage",
    requiredPermission: { module: "minimum_wage", action: "view" },
    subItems: [
      {
        label: "Minimum Wage Listing",
        path: "/admin/minimum-wage",
        icon: List,
        requiredPermission: { module: "minimum_wage", action: "view" },
      },
      {
        label: "Skill Category Listing",
        path: "/admin/skill-categories",
        icon: Layers,
        requiredPermission: { module: "skill_category", action: "view" },
      },
    ],
  },
  {
    id: "team",
    label: "Team",
    icon: PersonStanding,
    path: "/admin/team/listing",
    requiredPermission: { module: "teams", action: "view" },
    subItems: [
      {
        label: "Team Listing",
        path: "/admin/team/listing",
        icon: List,
        requiredPermission: { module: "teams", action: "view" },
      },
    ],
  },
  {
    id: "deductionsettings",
    label: "Payroll",
    icon: CreditCard,
    path: "/admin/deductionsettings",
    requiredPermission: { module: "payroll", action: "view" },
    subItems: [
      {
        label: "Deduction Settings",
        path: "/admin/deductionsettings",
        icon: Settings,
        requiredPermission: {
          module: "payroll",
          action: ["view_deductions", "manage_deductions"],
        },
      },
      {
        label: "Salary Structure",
        path: "/admin/salary-structure",
        icon: LayoutPanelTop,
        requiredPermission: { module: "payroll", action: "view" },
      },
      // { label: "TDS Settings", path: "/admin/tds-settings", icon: List },
    ],
  },
  {
    id: "referrals",
    label: "Referrals",
    icon: Percent,
    path: "/admin/referrals/dashboard",
    requiredPermission: { module: "referrals", action: "view" },
    subItems: [
      {
        label: "Dashboard",
        path: "/admin/referrals/dashboard",
        icon: LayoutDashboard,
        requiredPermission: { module: "referrals", action: "view" },
      },
      {
        label: "Referral Rules",
        path: "/admin/referrals/rules",
        icon: FileText,
        requiredPermission: { module: "referrals", action: "view" },
      },
      // {
      //   label: "Manage Referral",
      //   path: "/admin/referrals/manage",
      //   icon: BarChart3,
      //   requiredPermission: { module: "referrals", action: "view" },
      // },
      //  {
      //   label: "Referral Settings",
      //   path: "/admin/referrals/settings",
      //   icon: Settings,
      //   requiredPermission: { module: "referrals", action: "view" },
      // },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: Ratio,
    path: "/admin/reports",
    requiredPermission: {
      module: "reports",
      action: [
        "pf_reports",
        "esic_reports",
        "invoice_reports",
        "wallet_transactions",
        "wallet_entries",
        "worker_payouts",
        "job_vacancy_report",
        "earnings_report",
        "worker_registration_report",
        "company_registration_report",
      ],
    },
    subItems: [
      {
        label: "All Reports",
        path: "/admin/reports",
        icon: FileText,
        requiredPermission: {
          module: "reports",
          action: [
            "job_vacancy_report",
            "earnings_report",
            "worker_registration_report",
            "company_registration_report",
          ],
        },
      },
      {
        label: "PF Reports",
        path: "/admin/reports/pf-reports",
        icon: FileText,
        requiredPermission: { module: "reports", action: "pf_reports" },
      },
      {
        label: "ESIC Reports",
        path: "/admin/reports/esic-reports",
        icon: FileText,
        requiredPermission: { module: "reports", action: "esic_reports" },
      },
      {
        label: "Invoice Report",
        path: "/admin/company/payment-details",
        icon: CreditCard,
        requiredPermission: { module: "reports", action: "invoice_reports" },
      },
      {
        label: "Worker Earning Report",
        path: "/admin/reports/worker-wallet-transactions",
        icon: Banknote,
        requiredPermission: {
          module: "reports",
          action: "wallet_transactions",
        },
      },
      {
        label: "Worker Wallet Entries",
        path: "/admin/reports/worker-wallet-entries",
        icon: BookOpen,
        requiredPermission: { module: "reports", action: "wallet_entries" },
      },
      {
        label: "Worker Payout Report",
        path: "/admin/reports/worker-payouts",
        icon: Banknote,
        requiredPermission: { module: "reports", action: "worker_payouts" },
      },
    ],
  },
  //   {
  //   id: "documents",
  //   label: "Documents",
  //   icon: ScrollText,
  //   path: "/admin/documents",
  //   // requiredPermission: { module: "documents", action: "view" },
  // },
  {
    id: "dress-orders",
    label: "Dress Orders",
    icon: Shirt,
    path: "/admin/dress-orders",
    subItems: [
      {
        label: "Vendor Listing",
        path: "/admin/vendor/listing",
        icon: ShoppingCart,
        requiredPermission: { module: "vendor", action: "view" },
      },
      {
        label: "Dress Orders Listing",
        path: "/admin/dress-orders",
        icon: List,
        requiredPermission: { module: "dress_orders", action: "view" },
      },
      {
        label: "Vendors Order",
        path: "/admin/vendor/orders",
        icon: Layers,
        requiredPermission: { module: "vendor_orders", action: "view" },
      },
    ],
  },
  {
    id: "support",
    label: "Support",
    icon: Headphones,
    path: "/admin/support-messages",
    requiredPermission: { module: "support", action: "view" },
    subItems: [
      {
        label: "Support Messages",
        path: "/admin/support-messages",
        icon: MessageCircle,
        requiredPermission: { module: "support", action: "view" },
      },
    ],
  },
];

// Only these sections run on the new Java backend so far.
const ADMIN_V1_SECTIONS = ["staff", "roles"];
const visibleMenuItems = LEGACY_ADMIN_FEATURES
  ? menuItems
  : menuItems.filter((item) => ADMIN_V1_SECTIONS.includes(item.id));

const sidebarVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { type: "spring", duration: 0.2, staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -15 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
};

const sidebarWidthVariants = {
  expanded: {
    width: "256px",
    transition: { duration: 0.3, ease: "easeInOut" },
  },
  collapsed: {
    width: "80px",
    transition: { duration: 0.3, ease: "easeInOut" },
  },
};

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });
  const { hasPermission, loading, permissions } = useAdminPermissions();

  // const toggleDropdown = (id) => {
  //   if (isCollapsed) return;
  //   setOpenDropdown(openDropdown === id ? null : id);
  // };
  const toggleDropdown = (id) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      localStorage.setItem("sidebarCollapsed", JSON.stringify(false));
      setOpenDropdown(id); // naya wala open
      return;
    }
    // Agar same pe click kiya toh band karo, warna naya open karo
    setOpenDropdown((prev) => (prev === id ? null : id));
  };
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));

    if (newState) {
      setOpenDropdown(null);
    }
  };

  // Helper function to check if a path is active (exact or starts with)
  const isPathActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const isCompanyListingActive = () => {
    return location.pathname.startsWith("/admin/company/edit/");
  };

  const isWorkerListingActive = () => {
    return location.pathname.startsWith("/admin/worker/edit/");
  };

  const isDressOrdersActive = () => {
    return (
      isPathActive("/admin/dress-orders") ||
      isPathActive("/admin/vendor/listing") ||
      isPathActive("/admin/vendor/orders")
    );
  };

  const isStaffListingActive = () => {
    return location.pathname.startsWith("/admin/staff/edit/");
  };

  const isRolesActive = () => {
    return isPathActive("/admin/roles") || isPathActive("/admin/roles/add");
  };

  const isTeamsActive = () => {
    return (
      isPathActive("/admin/team/listing") || isPathActive("/admin/teams/add")
    );
  };
  const isReportsActive = () => {
    return (
      isPathActive("/admin/reports") ||
      isPathActive("/admin/company/payment-details")
    );
  };
  const isPayrollActive = () => {
    return (
      isPathActive("/admin/deductionsettings") ||
      isPathActive("/admin/deductionsettings/templates") ||
      isPathActive("/admin/salary-structure") ||
      isPathActive("/admin/tds-settings")
    );
  };

  const isReferralsActive = () => {
    return (
      isPathActive("/admin/referrals/dashboard") ||
      isPathActive("/admin/referrals/manage")
    );
  };
  
  const isSupportActive = () => {
    return isPathActive("/admin/support");
  };

  useEffect(() => {
    if (isCollapsed) {
      setOpenDropdown(null);
      return;
    }

    // Check if any dress order path is active
    if (isDressOrdersActive()) {
      setOpenDropdown("dress-orders");
      return;
    }

    if (isReportsActive()) {
      setOpenDropdown("reports");
      return;
    }

    if (location.pathname.startsWith("/admin/company")) {
      setOpenDropdown("company");
      return;
    }

    if (location.pathname.startsWith("/admin/worker")) {
      setOpenDropdown("worker");
      return;
    }

    if (location.pathname.startsWith("/admin/staff")) {
      setOpenDropdown("staff");
      return;
    }

    if (isRolesActive()) {
      setOpenDropdown("roles");
      return;
    }

    if (isTeamsActive()) {
      setOpenDropdown("team");
      return;
    }
    if (isSupportActive()) {
      setOpenDropdown("support");
      return;
    }

    if (isPayrollActive()) {
      setOpenDropdown("deductionsettings");
      return;
    }

    if (isReferralsActive()) {              
      setOpenDropdown("referrals");
      return;
    }

    const activeParent = menuItems.find((item) =>
      item.subItems?.some((sub) => {
        // For menu items that have the same base path as parent, check exact match
        const isParentPath = item.path === sub.path;
        if (isParentPath) {
          return location.pathname === sub.path;
        }
        return isPathActive(sub.path);
      }),
    );

    setOpenDropdown(activeParent ? activeParent.id : null);
  }, [location.pathname, isCollapsed]);

  const isParentActive = (item) => {
    // Special cases for specific menu items
    if (item.id === "dress-orders") {
      return isDressOrdersActive();
    }

    if (item.id === "roles") {
      return isRolesActive();
    }

    if (item.id === "team") {
      return isTeamsActive();
    }
    if (item.id === "deductionsettings") {
      // <-- Add this case
      return isPayrollActive();
    }
    if (item.id === "reports") {
      return isReportsActive();
    }
     if (item.id === "referrals") {          
      return isReferralsActive();
    }
    if (item.id === "company") {
      if (location.pathname === "/admin/company/payment-details") {
        return false;
      }
    }

    const base = `/admin/${item.id}`;
    const isPathMatch = location.pathname.startsWith(base);

    if (item.requiredPermission) {
      return (
        isPathMatch &&
        hasPermission(
          item.requiredPermission.module,
          item.requiredPermission.action,
        )
      );
    }

    return isPathMatch;
  };

  const canAccess = (module, action) => {
    if (loading || !permissions) return false;

    if (!module || !action) return true;

    try {
      return hasPermission(module, action);
    } catch (error) {
      console.error("Permission check error:", error);
      return false;
    }
  };

  const Tooltip = ({ children, content }) => {
    if (!isCollapsed) return children;

    return (
      <div className="relative group">
        {children}
        <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none shadow-lg">
          {content}
          <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
        </div>
      </div>
    );
  };

  const renderMenuItems = () => {
    if (loading || !permissions || Object.keys(permissions).length === 0) {
      return null;
    }

    return visibleMenuItems
      .filter((item) => {
        if (item.requiredPermission) {
          if (Array.isArray(item.requiredPermission.action)) {
            return item.requiredPermission.action.some((act) =>
              hasPermission(item.requiredPermission.module, act),
            );
          }
          const hasAccess = hasPermission(
            item.requiredPermission.module,
            item.requiredPermission.action,
          );
          return hasAccess;
        }
        return true;
      })
      .map((item) => {
        const Icon = item.icon;

        const filteredSubItems =
          item.subItems?.filter((sub) => {
            if (sub.requiredPermission) {
              if (Array.isArray(sub.requiredPermission.action)) {
                return sub.requiredPermission.action.some((act) =>
                  hasPermission(sub.requiredPermission.module, act),
                );
              }
              return hasPermission(
                sub.requiredPermission.module,
                sub.requiredPermission.action,
              );
            }
            return true;
          }) || [];

        if (item.subItems && filteredSubItems.length === 0) {
          return null;
        }

        // Only treat as a dropdown when there's more than one visible sub-item.
        // A single sub-item collapses into a plain link straight to that page.
        const isDropdown = filteredSubItems.length > 1;
        const singleSubItemPath =
          filteredSubItems.length === 1 ? filteredSubItems[0].path : null;
        const isDropdownOpen =
          isDropdown && openDropdown === item.id && !isCollapsed;
        const isActive = isParentActive(item);

        return (
          <motion.div key={item.id}>
            <Tooltip content={item.label}>
              <motion.button
                variants={itemVariants}
                initial="hidden"
                onClick={() => {
                  if (isDropdown) {
                    toggleDropdown(item.id);
                  } else {
                    navigate(singleSubItemPath || item.path);
                  }
                }}
                whileHover={{
                  scale: isCollapsed ? 1.1 : 1.05,
                  x: isCollapsed ? 0 : 5,
                }}
                animate={[
                  "visible",
                  isActive
                    ? {
                        scale: isCollapsed ? 1.1 : 1.05,
                        x: isCollapsed ? 0 : 5,
                      }
                    : {
                        scale: 1,
                        x: 0,
                      },
                ]}
                className={`w-full flex items-center justify-between ${isCollapsed ? "px-4" : "px-6"} py-4 mb-2 transition-colors ${
                  isActive
                    ? "bg-orange-500 shadow-lg"
                    : "hover:bg-blue-700 dark:hover:bg-gray-800 bg-transparent"
                }`}
                style={{
                  borderTopRightRadius: "0.5rem",
                  borderBottomRightRadius: "0.5rem",
                  justifyContent: isCollapsed ? "center" : "space-between",
                }}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} />
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </div>
                {isDropdown && !isCollapsed && (
                  <motion.div
                    animate={{ rotate: isDropdownOpen ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight size={18} />
                  </motion.div>
                )}
              </motion.button>
            </Tooltip>

            <AnimatePresence>
              {isDropdownOpen && isDropdown && !isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="ml-8 mt-2 space-y-1"
                  >
                    {filteredSubItems.map((sub) => {
                      const SubIcon = sub.icon;

                      if (sub.isLogout) {
                        return (
                          <motion.button
                            key="logout"
                            onClick={handleLogout}
                            whileHover={{ scale: 1.05, x: 5 }}
                            className="w-full flex items-center gap-3 py-2 pl-4 pr-2 mb-1 rounded-md hover:bg-blue-700 dark:hover:bg-gray-800 text-gray-200"
                          >
                            <SubIcon size={18} />
                            <span className="font-medium">{sub.label}</span>
                          </motion.button>
                        );
                      }

                      // Check if sub-item path is same as parent path (like "Role Listing" same as parent "Roles")
                      const isSubSameAsParent = sub.path === item.path;

                      let isSubActive = false;

                      if (isSubSameAsParent) {
                        // For items that have same path as parent, use exact match
                        isSubActive = location.pathname === sub.path;
                      } else {
                        // For other items, check if path is active
                        isSubActive = isPathActive(sub.path);
                      }

                      // Handle special cases for edit pages
                      isSubActive =
                        isSubActive ||
                        (sub.label === "Company Listing" &&
                          isCompanyListingActive()) ||
                        (sub.label === "Worker Listing" &&
                          isWorkerListingActive()) ||
                        (sub.label === "Staff Listing" &&
                          isStaffListingActive());

                      return (
                        <Tooltip key={sub.path} content={sub.label}>
                          <motion.button
                            // onClick={() => navigate(sub.path)}
                            onClick={() => {
                              if (sub.path === "/admin/reports") {
                                navigate(sub.path, { replace: true });
                                window.location.reload();
                              } else {
                                navigate(sub.path);
                              }
                            }}
                            whileHover={{ scale: 1.05, x: 5 }}
                            animate={
                              isSubActive
                                ? { scale: 1.05, x: 5 }
                                : { scale: 1, x: 0 }
                            }
                            className={`w-full flex items-center justify-start gap-3 py-2 pl-4 pr-2 mb-1 rounded-md text-left ${
                              isSubActive
                                ? "bg-orange-500 text-white"
                                : "hover:bg-blue-700 dark:hover:bg-gray-800 text-gray-200"
                            }`}
                          >
                            <SubIcon size={18} className="shrink-0" />
                            {!isCollapsed && (
                              <span className="font-medium text-left whitespace-normal break-words leading-tight">
                                {sub.label}
                              </span>
                            )}
                          </motion.button>
                        </Tooltip>
                      );
                    })}
                  </motion.div>
                )}
            </AnimatePresence>
          </motion.div>
        );
      });
  };

  const handleLogout = () => {
    showLogoutConfirmation(() => {
      try {
        endAdminSessionLocally(logout);

        Swal.fire({
          title: "Logged Out!",
          text: "You have been successfully logged out.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          background: "#ffffff",
          color: "#333333",
        }).then(() => {
          navigate("/admin/login", { replace: true });
          onClose();
        });
      } catch (error) {
        console.error("Logout error:", error);
        Swal.fire({
          title: "Logout Failed",
          text: "There was an error logging out. Please try again.",
          icon: "error",
          confirmButtonText: "OK",
          background: "#ffffff",
          color: "#333333",
        });
      }
    });
  };

  const renderSkeletonLoader = () => (
    <div className="space-y-2 p-4">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className={`h-12 bg-blue-500/30 dark:bg-gray-700/40 rounded animate-pulse ${isCollapsed ? "w-12 mx-auto" : ""}`}
        ></div>
      ))}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        variants={sidebarWidthVariants}
        initial="expanded"
        animate={isCollapsed ? "collapsed" : "expanded"}
        className="hidden md:flex flex-col bg-gradient-to-b from-blue-600 to-blue-800 dark:from-gray-900 dark:to-gray-950 text-white h-full shadow-lg relative z-20 shrink-0"
      >
        {/* Header with Admin Panel and Toggle Button */}
        <div className="relative p-2 border-b border-blue-500/30 dark:border-gray-700/60 flex items-center justify-end shrink-0">
          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg z-30"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </button>
        </div>
        {/* Menu Items */}
        <motion.div
          className="flex-1 overflow-y-auto overflow-x-hidden py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          variants={sidebarVariants}
          initial="hidden"
          animate="visible"
          style={{ height: "calc(100% - 40px)" }}
        >
          {loading || !permissions ? renderSkeletonLoader() : renderMenuItems()}
        </motion.div>
      </motion.div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-0 z-50 flex md:hidden"
          >
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/40" onClick={onClose}></div>

            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: -250 }}
              animate={{ x: 0 }}
              exit={{ x: -250 }}
              transition={{ type: "tween", duration: 0.3 }}
              className="relative w-64 bg-gradient-to-b from-blue-600 to-blue-800 dark:from-gray-900 dark:to-gray-950 text-white min-h-screen shadow-lg flex flex-col"
            >
              {/* Mobile Header */}
              <div className="p-4 border-b border-blue-500/30 dark:border-gray-700/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-lg">A</span>
                  </div>
                  <span className="text-xl font-bold">Admin Panel</span>
                </div>
                <button onClick={onClose} className="text-white p-1">
                  <X size={24} />
                </button>
              </div>

              <motion.div
                className="mt-4 flex-grow"
                variants={sidebarVariants}
                initial="hidden"
                animate="visible"
              >
                {loading || !permissions
                  ? renderSkeletonLoader()
                  : renderMenuItems()}
              </motion.div>

              {/* Logout Button for Mobile */}
              {!loading && permissions && (
                <motion.button
                  variants={itemVariants}
                  onClick={handleLogout}
                  whileHover={{ scale: 1.05, x: 5 }}
                  className="md:hidden w-full flex items-center justify-between px-6 py-4 mb-2 hover:bg-red-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                  </div>
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Top Bar with Menu Toggle (only show when sidebar is closed) */}
      {!isOpen && (
        <div className="md:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-gray-900 dark:to-gray-950 text-white p-4 shadow-lg z-40">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onClose(!isOpen)}
              className="p-2 hover:bg-blue-700/50 dark:hover:bg-gray-800 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold">Admin Panel</h1>
            <div className="w-10"></div>
          </div>
        </div>
      )}
    </>
  );
}
