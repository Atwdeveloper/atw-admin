"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getConversationsAPI,
  getConversationAPI,
  sendMessageAPI,
} from "../../../api/admin/adminSupportAPI";

export const useAdminSupport = () => {
  const [conversations, setConversations] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [loading, setLoading] = useState({
    list: false,
    messages: false,
    sending: false,
  });

  const fileInputRef = useRef(null);

  // ✅ Format time helper
  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ✅ Fetch conversations (FIXED MAPPING)
  useEffect(() => {
    const fetchConversations = async () => {
      setLoading((prev) => ({ ...prev, list: true }));

      try {
        const res = await getConversationsAPI();
        const apiData = res.data || [];

        const mapped = apiData.map((item) => {
          const lastMsg = item.last_message;

          return {
            id: item.id,

            sender:
              item.other_participant?.name ||
              `User ${lastMsg?.sender_id || ""}`,
            type: (() => {
              const senderType = lastMsg?.sender_type || "";
              const receiverType = lastMsg?.receiver_type || "";

              // If ANY side is worker → it's worker chat
              if (
                senderType.includes("Worker") ||
                receiverType.includes("Worker")
              ) {
                return "worker";
              }

              // If ANY side is company → it's company chat
              if (
                senderType.includes("Company") ||
                receiverType.includes("Company")
              ) {
                return "company";
              }

              return "worker"; // fallback
            })(),

            lastMessage: lastMsg?.message || "",

            time: formatTime(lastMsg?.created_at),

            // unread: lastMsg?.read_at ? 0 : 1,
            unread: lastMsg?.read_at || 0,
            // participantId: lastMsg?.sender_id,
            participantId: item.other_participant?.id,
            messages: [],
          };
        });

        setConversations(mapped);
      } catch (error) {
        console.error("Failed to load conversations", error);
      } finally {
        setLoading((prev) => ({ ...prev, list: false }));
      }
    };

    fetchConversations();
  }, []);

  // ✅ Filter conversations
  const filteredConversations = conversations
    .filter((item) => {
      if (activeTab === "worker") return item.type === "worker";
      if (activeTab === "company") return item.type === "company";
      return true;
    })
    .filter((item) =>
      item.sender?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  // ✅ Fetch messages for selected chat
  const selectChat = useCallback(async (chat) => {
    setSelectedChat(chat);

    setLoading((prev) => ({ ...prev, messages: true }));

    try {
      const res = await getConversationAPI(chat.id);

      const apiData = res.data || {};
      const apiMessages = apiData.messages || [];

      const mappedMessages = apiMessages.map((msg) => ({
        id: msg.id,
        text: msg.message,
        sender: msg.sender_type.includes("Admin") ? "admin" : "user",

        time: new Date(msg.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),

        created_at: msg.created_at,

        attachment: null,
      }));

      const updatedChat = {
        ...chat,

        unread: 0,

        messages: mappedMessages,
        participantId: apiData.other_participant?.id,
        participantName: apiData.other_participant?.name || "",

        participantCode: apiData.other_participant?.code || "",

        participantType: apiData.other_participant?.type || "",
      };

      setSelectedChat(updatedChat);

      // also update sidebar list
      setConversations((prev) =>
        prev.map((c) => (c.id === chat.id ? updatedChat : c)),
      );
    } catch (error) {
      console.error("Failed to load messages", error);
    } finally {
      setLoading((prev) => ({ ...prev, messages: false }));
    }
  }, []);

  // ✅ Send message
  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() && !attachedFile) return;
    if (!selectedChat) return;

    const receiverType =
      selectedChat.type === "worker" ? "worker" : "company_user";

    const payload = {
      receiver_id: selectedChat.participantId,
      receiver_type: receiverType,
      message: chatInput.trim(),
    };

    setLoading((prev) => ({ ...prev, sending: true }));

    try {
      const res = await sendMessageAPI(payload);
      const msg = res.data || res;

      const newMessage = {
        id: msg.id,

        text: msg.message,

        sender: "admin",

        time: formatTime(msg.created_at),

        created_at: msg.created_at,

        attachment: null,
      };

      const updatedChat = {
        ...selectedChat,
        messages: [...(selectedChat.messages || []), newMessage],
        lastMessage: msg.message || "📎 File",
        time: "Just now",
      };

      setSelectedChat(updatedChat);

      setConversations((prev) =>
        prev.map((c) => (c.id === updatedChat.id ? updatedChat : c)),
      );

      setChatInput("");
      setAttachedFile(null);

      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Send message failed", error);
    } finally {
      setLoading((prev) => ({ ...prev, sending: false }));
    }
  }, [chatInput, attachedFile, selectedChat]);

  // ✅ File attach
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAttachedFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });
  };

  return {
    conversations,
    filteredConversations,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
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
  };
};
