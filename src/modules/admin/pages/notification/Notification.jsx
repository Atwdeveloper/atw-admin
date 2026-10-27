"use client";

import React, { useState } from "react";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Building,
  Users,
  Briefcase,
  AlertCircle,
  Check,
  Trash2,
  CheckCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye as ViewIcon,
  CheckCircle as ApproveIcon,
  XCircle as RejectIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  containerVariants,
  itemVariants,
} from "../../../../common/utils/motionVariants";
import { useNotifications } from "../../adminhooks/useNotifications";

const NotificationsPage = () => {
  const {
    notifications,
    loading,
    processingIds,

    pagination,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    goToPage,
    viewChanges,
    approveNotification,
    rejectNotification,
    deleteAllNotifications,
  } = useNotifications();

  const [leftFilter, setLeftFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("notifications");
  const isRequestNotification = (notification) => {
    const type = notification.type?.toLowerCase() || "";
    return (
      type.includes("withdrawal") ||
      type.includes("approval") ||
      type.includes("request")
    );
  };

  const leftNotifications = notifications.filter(
    (n) => !isRequestNotification(n),
  );
  const rightNotifications = notifications.filter((n) =>
    isRequestNotification(n),
  );
  const filteredLeftNotifications = leftNotifications.filter((n) => {
    if (leftFilter === "all") return true;
    return !n.read;
  });

  const getIconByType = (type) => {
    if (type.includes("company")) return <Building className="w-5 h-5" />;
    if (type.includes("worker")) return <Users className="w-5 h-5" />;
    if (type.includes("job")) return <Briefcase className="w-5 h-5" />;
    if (type.includes("withdrawal") || type.includes("approval"))
      return <AlertCircle className="w-5 h-5" />;
    return <Bell className="w-5 h-5" />;
  };

  const getColorByType = (type) => {
    if (type.includes("company")) return "text-blue-600 bg-blue-100";
    if (type.includes("worker")) return "text-green-600 bg-green-100";
    if (type.includes("job")) return "text-purple-600 bg-purple-100";
    if (type.includes("withdrawal")) return "text-red-600 bg-red-100";
    if (type.includes("approval")) return "text-orange-600 bg-orange-100";
    return "text-gray-600 bg-gray-100";
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "sms":
        return <Smartphone className="w-4 h-4" />;
      case "whatsapp":
        return <MessageSquare className="w-4 h-4" />;
      case "platform":
        return <Bell className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const NotificationItem = ({
    notification,
    isRequest = false,
    isProcessing = false,
    onMarkRead,
    onDelete,
    onView,
    onApprove,
    onReject,
  }) => {
    const processing = isProcessing;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
          !notification.read ? "bg-blue-50/50" : ""
        }`}
      >
        <div className="flex flex-col gap-3">
          {/* Content row */}
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-lg ${getColorByType(notification.type)}`}
            >
              {getIconByType(notification.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">
                    {notification.description}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {notification.companyName && (
                      <span className="text-sm px-2 py-1 bg-gray-100 rounded">
                        Company: {notification.companyName}
                      </span>
                    )}
                    {notification.workerName && (
                      <span className="text-sm px-2 py-1 bg-gray-100 rounded">
                        Worker: {notification.workerName}
                      </span>
                    )}
                    {notification.jobTitle && (
                      <span className="text-sm px-2 py-1 bg-gray-100 rounded">
                        Job: {notification.jobTitle}
                      </span>
                    )}
                    {notification.amount && (
                      <span className="text-sm px-2 py-1 bg-gray-100 rounded">
                        Amount: {notification.amount}
                      </span>
                    )}
                  </div>
                  {notification.channels &&
                    notification.channels.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-gray-500">Sent via:</span>
                        <div className="flex items-center gap-1">
                          {notification.channels.map((channel) => (
                            <span
                              key={channel}
                              className="p-1 bg-gray-100 rounded"
                              title={channel}
                            >
                              {getChannelIcon(channel)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
                {/* ✅ STEP 1: Status badge + time */}
                <div className="flex flex-col items-end gap-1 ml-4">
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {notification.time}
                  </span>
                  {notification.status === "approved" && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Approved
                    </span>
                  )}
                  {notification.status === "rejected" && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center gap-1">
                      <RejectIcon className="w-3 h-3" />
                      Rejected
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Buttons row */}
          <div className="flex flex-wrap items-center justify-end gap-2 pl-14">
            {isRequest ? (
              // ✅ STEP 2 & 3: Show different buttons based on status
              notification.status === "pending" ? (
                <>
                  <button
                    onClick={() => onView(notification)}
                    disabled={processing}
                    className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 px-2 py-1 rounded"
                  >
                    <ViewIcon className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => onApprove(notification)}
                    disabled={processing}
                    className="text-sm text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 px-2 py-1 rounded"
                  >
                    <ApproveIcon className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => onReject(notification)}
                    disabled={processing}
                    className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 px-2 py-1 rounded"
                  >
                    <RejectIcon className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => onDelete(notification.id)}
                    disabled={processing}
                    className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 px-2 py-1 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </>
              ) : (
                // After approval/rejection – only delete button
                <button
                  onClick={() => onDelete(notification.id)}
                  disabled={processing}
                  className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 flex items-center gap-1 px-2 py-1 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )
            ) : (
              // Non‑request notifications: original buttons
              <>
                {!notification.read && (
                  <button
                    onClick={() => onMarkRead(notification.id)}
                    disabled={processing}
                    className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 flex items-center gap-1 px-2 py-1 rounded"
                  >
                    <Check className="w-4 h-4" />
                    Mark Read
                  </button>
                )}
                <button
                  onClick={() => onDelete(notification.id)}
                  disabled={processing}
                  className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 flex items-center gap-1 px-2 py-1 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderPagination = () => {
    const { currentPage, lastPage } = pagination;
    if (lastPage <= 1) return null;
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(lastPage, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg border ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`px-3 py-1 rounded-lg border ${page === currentPage ? "bg-blue-600 text-white border-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === lastPage}
          className={`p-2 rounded-lg border ${currentPage === lastPage ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  return (
    <motion.div
      className="flex-1 bg-gray-50 p-4 md:p-6 min-h-screen"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div
        className="relative overflow-hidden rounded-2xl mb-6 w-full mx-auto"
        variants={itemVariants}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
          <div className="space-y-2">
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.h1
                className="text-4xl font-bold"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                Notifications
              </motion.h1>
            </motion.div>
            <motion.div
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <p className="text-lg text-slate-600 font-medium">
                Stay updated with platform activities
              </p>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Check className="w-4 h-4" /> Mark All Read
            </button>
          </motion.div>
        </div>
      </motion.div>
      <div className="bg-white rounded-xl shadow-sm border mb-4">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-6 py-3 font-medium ${
              activeTab === "notifications"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500"
            }`}
          >
            Notifications ({leftNotifications.length})
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`px-6 py-3 font-medium ${
              activeTab === "requests"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500"
            }`}
          >
            Request Notifications ({rightNotifications.length})
          </button>
        </div>
      </div>

      {activeTab === "notifications" && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Left column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">Notifications</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLeftFilter("all")}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${leftFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  >
                    All ({leftNotifications.length})
                  </button>
                  <button
                    onClick={() => setLeftFilter("unread")}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${leftFilter === "unread" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  >
                    Unread ({leftNotifications.filter((n) => !n.read).length})
                  </button>
                  <button
                    onClick={deleteAllNotifications}
                    className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete All
                  </button>
                </div>
              </div>
              <div className="divide-y">
                <AnimatePresence>
                  {loading ? (
                    <motion.div className="p-8 text-center">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading notifications...</p>
                    </motion.div>
                  ) : filteredLeftNotifications.length === 0 ? (
                    <motion.div className="p-8 text-center">
                      <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No notifications found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {leftFilter === "unread"
                          ? "All notifications are read"
                          : "No notifications in this list"}
                      </p>
                    </motion.div>
                  ) : (
                    filteredLeftNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        isRequest={false}
                        isProcessing={processingIds.has(notification.id)}
                        onMarkRead={markAsRead}
                        onDelete={deleteNotification}
                        onView={viewChanges}
                        onApprove={approveNotification}
                        onReject={rejectNotification}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
              {filteredLeftNotifications.length > 0 && (
                <div className="px-6 py-4 border-t flex items-center justify-between">
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" /> Mark all as read
                  </button>
                  <div className="text-sm text-gray-500">
                    Showing {filteredLeftNotifications.length} of{" "}
                    {leftNotifications.length} notifications
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "requests" && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Right Notifications wala poora code */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center gap-2 bg-orange-50">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <h2 className="font-semibold text-gray-900">
                  Request Notifications
                </h2>
                <span className="ml-auto text-sm text-gray-500">
                  ({rightNotifications.length})
                </span>
              </div>
              <div className="divide-y">
                <AnimatePresence>
                  {loading ? (
                    <motion.div className="p-8 text-center">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading...</p>
                    </motion.div>
                  ) : rightNotifications.length === 0 ? (
                    <motion.div className="p-8 text-center">
                      <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No request notifications</p>
                      <p className="text-sm text-gray-400 mt-1">
                        All caught up!
                      </p>
                    </motion.div>
                  ) : (
                    rightNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        isRequest={true}
                        isProcessing={processingIds.has(notification.id)}
                        onMarkRead={markAsRead}
                        onDelete={deleteNotification}
                        onView={viewChanges}
                        onApprove={approveNotification}
                        onReject={rejectNotification}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
              {rightNotifications.length > 0 && (
                <div className="px-6 py-4 border-t text-center text-sm text-gray-500">
                  {rightNotifications.length} request
                  {rightNotifications.length !== 1 ? "s" : ""} pending
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!loading && pagination.lastPage > 1 && (
        <div className="mt-6 flex justify-center">{renderPagination()}</div>
      )}
    </motion.div>
  );
};

export default NotificationsPage;
