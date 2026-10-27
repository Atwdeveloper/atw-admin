"use client";

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "@/lib/navigation";
import { useAdminPermissions } from "../../../../common/hooks/useAdminPermissions";
import {
  Send,
  User,
  MessageCircle,
  Building2,
  CheckCircle2,
  Paperclip,
  Headphones,
  Shield,
  ArrowLeft,
  Phone,
} from "lucide-react";

import { useAdminSupport } from "../../adminhooks/useAdminSupport";
import Cookies from "js-cookie";
const AdminSupportChat = () => {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = useAdminPermissions();
  const canViewSupport = hasPermission("support", "view");
  const {
    filteredConversations,
    activeTab,
    setActiveTab,
    selectedChat,
    selectChat,
    chatInput,
    setChatInput,
    attachedFile,
    setAttachedFile,
    fileInputRef,
    handleFileChange,
    handleSendMessage,
    loading,
  } = useAdminSupport();

  const messagesEndRef = useRef(null);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  useEffect(() => {
    setWhatsappNumber(Cookies.get("whatsapp_number") || "");
    setSupportPhone(Cookies.get("phone_number") || "");
  }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [selectedChat?.messages]);

  const deselectChat = () => selectChat(null);

  if (permissionsLoading) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center min-h-[80vh]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!canViewSupport) {
    return (
      <div className="flex-1 bg-gray-50 p-4 flex items-center justify-center min-h-[80vh]">
        <div className="bg-white rounded-lg p-8 text-center max-w-md shadow-sm border border-gray-100">
          <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to view Support Messages.
          </p>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Thin custom scrollbar styles */}
      <style>{`
        .support-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .support-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .support-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 8px;
        }
        .support-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .support-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
      `}</style>

      <div className="h-[calc(100vh-80px)] overflow-hidden p-6 rounded-xl">
        <div className="h-full flex bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          {/* Conversation list (left panel) */}
          <div
            className={`lg:w-[360px] w-full border-r border-slate-200 flex flex-col bg-white ${
              selectedChat ? "hidden lg:flex" : ""
            }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Headphones size={22} />
                  </div>

                  <div>
                    <h1 className="text-xl font-bold">Support Center</h1>
                    <p className="text-blue-100 text-sm">
                      Manage worker & company chats
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {whatsappNumber && (
                    <a
                      href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:bg-white/30 p-2 rounded-lg transition"
                      title="WhatsApp"
                    >
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                        alt="WhatsApp"
                        className="w-6 h-6"
                      />
                    </a>
                  )}

                  {supportPhone && (
                    <a
                      href={`tel:${supportPhone}`}
                      className="hover:bg-white/30 p-2 rounded-lg transition"
                      title="Call"
                    >
                      <Phone size={18} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center px-3 pt-3 gap-2 border-b border-slate-100 bg-white">
              {[
                { key: "all", label: "All" },
                { key: "worker", label: "Workers" },
                { key: "company", label: "Companies" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto support-scrollbar">
              {loading.list ? (
                <div className="p-6 text-center text-slate-400">
                  Loading conversations...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  No conversations found
                </div>
              ) : (
                filteredConversations.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => selectChat(chat)}
                    className={`mx-3 my-2 p-4 rounded-2xl cursor-pointer transition-all duration-200 border ${
                      selectedChat?.id === chat.id
                        ? "bg-blue-50 border-blue-200 shadow-sm"
                        : "border-transparent hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                          chat.type === "worker"
                            ? "bg-orange-100 text-orange-600"
                            : "bg-purple-100 text-purple-600"
                        }`}
                      >
                        {chat.type === "worker" ? (
                          <User size={20} />
                        ) : (
                          <Building2 size={20} />
                        )}
                      </div>

                      {/* Content - FIXED: min-w-0 on name column, shrink-0 on time */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-800 truncate">
                              {chat.sender}
                            </h3>
                            <span
                              className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                                chat.type === "worker"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-purple-100 text-purple-700"
                              }`}
                            >
                              {chat.type}
                            </span>
                          </div>
                          <div className="flex flex-col items-end shrink-0">
                            <span className="text-xs text-slate-400 whitespace-nowrap">
                              {chat.time}
                            </span>
                            {chat.unread > 0 && (
                              <span className="mt-1 min-w-[22px] h-[22px] px-1 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                                {chat.unread}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-500 truncate mt-2">
                          {chat.lastMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat detail (right panel) */}
          <div
            className={`flex-1 flex flex-col bg-slate-50 ${
              !selectedChat ? "hidden lg:flex" : ""
            }`}
          >
            {selectedChat ? (
              <>
                {/* Header */}
                <div className="bg-white border-b border-slate-200 px-6 py-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={deselectChat}
                      className="lg:hidden p-2 -ml-2 rounded-full hover:bg-slate-100 transition"
                      aria-label="Back to conversation list"
                    >
                      <ArrowLeft size={20} className="text-slate-600" />
                    </button>

                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                        selectedChat.type === "worker"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-violet-100 text-violet-600"
                      }`}
                    >
                      {selectedChat.type === "worker" ? (
                        <User size={24} />
                      ) : (
                        <Building2 size={24} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="text-[24px] font-bold text-slate-800 truncate leading-tight">
                        {selectedChat.participantName || selectedChat.sender}
                      </h2>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {selectedChat.participantCode && (
                          <p className="text-sm text-slate-500">
                            <span className="font-medium text-slate-700">
                              {selectedChat.type === "worker"
                                ? "Worker Code:"
                                : "Company Code:"}
                            </span>{" "}
                            {selectedChat.participantCode}
                          </p>
                        )}
                        {selectedChat.status === "resolved" && (
                          <>
                            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                            <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                              <CheckCircle2 size={14} />
                              Resolved
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 support-scrollbar">
                  {loading.messages ? (
                    <div className="text-center text-slate-400">
                      Loading messages...
                    </div>
                  ) : (
                    selectedChat.messages?.map((msg, index) => {
                      const currentDate = formatMessageDate(msg.created_at);
                      const previousDate =
                        index > 0
                          ? formatMessageDate(
                              selectedChat.messages[index - 1].created_at,
                            )
                          : null;
                      const showDate = currentDate !== previousDate;
                      return (
                        <React.Fragment key={msg.id}>
                          {showDate && (
                            <div className="flex justify-center my-4">
                              <span className="bg-slate-200 text-slate-600 text-xs px-4 py-1 rounded-full">
                                {currentDate}
                              </span>
                            </div>
                          )}
                          <div
                            className={`flex ${
                              msg.sender === "admin"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-sm ${
                                msg.sender === "admin"
                                  ? "bg-blue-600 text-white rounded-br-md"
                                  : "bg-white border border-slate-200 text-slate-800 rounded-bl-md"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {msg.text}
                              </p>
                              <div className="mt-2 text-right">
                                <span className="text-[11px] opacity-70">
                                  {msg.time}
                                </span>
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-white border-t border-slate-200 p-4">
                  {attachedFile && (
                    <div className="mb-3 flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 w-fit">
                      <Paperclip size={14} className="text-slate-500" />
                      <span className="text-sm text-slate-700 truncate max-w-[220px]">
                        {attachedFile.name}
                      </span>
                      <button
                        onClick={() => {
                          setAttachedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                        className="text-red-500 hover:text-red-700 text-lg"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <div className="flex items-end gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your reply..."
                      rows={1}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={
                        (!chatInput.trim() && !attachedFile) || loading.sending
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <MessageCircle
                    size={70}
                    className="mx-auto mb-4 opacity-30"
                  />
                  <h2 className="text-2xl font-semibold text-slate-600 mb-2">
                    Support Messages
                  </h2>
                  <p>Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSupportChat;
