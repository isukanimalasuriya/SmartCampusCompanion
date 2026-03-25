import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft, Users, MessageSquare, FolderOpen, Megaphone,
  Send, Trash2, Plus, Link, FileText, Pin, Crown,
  Shield, Copy, Check, Globe, Lock, LogOut, UserPlus,
  Loader2,
} from "lucide-react";
import Navbar from "../Navbar";

const API = "http://localhost:5000/api";

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Safely decode JWT
  let currentUserId = null;
  try {
    currentUserId = JSON.parse(atob(token.split(".")[1])).sub;
  } catch {
    navigate("/");
  }

  // ── State ──────────────────────────────────────────────────────────────────
  const [group, setGroup]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState("overview");
  const [isMember, setIsMember]     = useState(false);
  const [isAdmin, setIsAdmin]       = useState(false);
  const [joining, setJoining]       = useState(false);
  const [leaving, setLeaving]       = useState(false);
  const [error, setError]           = useState("");
  const [copied, setCopied]         = useState(false);

  // Chat
  const [messages, setMessages]     = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping]     = useState(false);
  const messagesEndRef              = useRef(null);
  const typingTimeoutRef            = useRef(null);
  const pollIntervalRef             = useRef(null);
  const typingPollRef               = useRef(null);

  // Resources
  const [resources, setResources]         = useState([]);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [resourceForm, setResourceForm]   = useState({
    title: "", description: "", type: "link", url: "", content: "",
  });

  // Announcements
  const [announcements, setAnnouncements]         = useState([]);
  const [unreadCount, setUnreadCount]             = useState(0);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm]   = useState({
    title: "", content: "", pinned: false,
  });

  const headers = { Authorization: `Bearer ${token}` };

  // ── Derived ────────────────────────────────────────────────────────────────
  const checkMembership = (grp) => {
    if (!grp || !currentUserId) return;
    const member = grp.members?.find(
      (m) => m.user?._id === currentUserId || m.user?.toString() === currentUserId
    );
    const creator = grp.creator?._id === currentUserId ||
                    grp.creator?.toString() === currentUserId;
    setIsMember(!!member || creator);
    setIsAdmin(creator || member?.role === "admin");
  };

  // ── Fetch group ────────────────────────────────────────────────────────────
  const fetchGroup = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/groups/${id}`, { headers });
      setGroup(res.data.data);
      checkMembership(res.data.data);
    } catch {
      setError("Failed to load group");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  // ── Tab data fetching ──────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === "chat" && isMember) {
      fetchMessages();
      startMessagePolling();
      startTypingPolling();
    } else {
      stopPolling();
    }
    if (activeTab === "resources" && isMember) fetchResources();
    if (activeTab === "announcements") {
      fetchAnnouncements();
      if (isMember) markRead();
    }
    return () => stopPolling();
  }, [activeTab, isMember]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Polling ────────────────────────────────────────────────────────────────
  const startMessagePolling = () => {
    stopPolling();
    pollIntervalRef.current = setInterval(fetchMessages, 3000);
  };

  const startTypingPolling = () => {
    typingPollRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/groups/${id}/typing`, { headers });
        setTypingUsers(
          (res.data.typingUsers || []).filter((u) => u.userId !== currentUserId)
        );
      } catch {}
    }, 1500);
  };

  const stopPolling = () => {
    clearInterval(pollIntervalRef.current);
    clearInterval(typingPollRef.current);
  };

  // ── Typing indicator ───────────────────────────────────────────────────────
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      axios.post(`${API}/groups/${id}/typing`, { typing: true }, { headers }).catch(() => {});
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      axios.post(`${API}/groups/${id}/typing`, { typing: false }, { headers }).catch(() => {});
    }, 2000);
  };

  // ── Messages ───────────────────────────────────────────────────────────────
  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API}/groups/${id}/messages`, { headers });
      setMessages(res.data.data);
    } catch {}
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSendingMsg(true);
    setIsTyping(false);
    clearTimeout(typingTimeoutRef.current);
    axios.post(`${API}/groups/${id}/typing`, { typing: false }, { headers }).catch(() => {});
    try {
      await axios.post(`${API}/groups/${id}/messages`, { content: newMessage }, { headers });
      setNewMessage("");
      await fetchMessages();
    } catch {
      setError("Failed to send message");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(`${API}/groups/${id}/messages/${messageId}`, { headers });
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    } catch {
      setError("Failed to delete message");
    }
  };

  // ── Resources ──────────────────────────────────────────────────────────────
  const fetchResources = async () => {
    try {
      const res = await axios.get(`${API}/groups/${id}/resources`, { headers });
      setResources(res.data.data);
    } catch {}
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/groups/${id}/resources`, resourceForm, { headers });
      setResources((prev) => [res.data.data, ...prev]);
      setResourceForm({ title: "", description: "", type: "link", url: "", content: "" });
      setShowResourceForm(false);
    } catch {
      setError("Failed to add resource");
    }
  };

  const handleDeleteResource = async (resourceId) => {
    try {
      await axios.delete(`${API}/groups/${id}/resources/${resourceId}`, { headers });
      setResources((prev) => prev.filter((r) => r._id !== resourceId));
    } catch {
      setError("Failed to delete resource");
    }
  };

  // ── Announcements ──────────────────────────────────────────────────────────
  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(`${API}/groups/${id}/announcements`, { headers });
      setAnnouncements(res.data.data);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {}
  };

  const markRead = async () => {
    try {
      await axios.post(`${API}/groups/${id}/announcements/read`, {}, { headers });
      setUnreadCount(0);
    } catch {}
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/groups/${id}/announcements`, announcementForm, { headers });
      setAnnouncements((prev) => [res.data.data, ...prev]);
      setAnnouncementForm({ title: "", content: "", pinned: false });
      setShowAnnouncementForm(false);
    } catch {
      setError("Failed to create announcement");
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    try {
      await axios.delete(`${API}/groups/${id}/announcements/${announcementId}`, { headers });
      setAnnouncements((prev) => prev.filter((a) => a._id !== announcementId));
    } catch {
      setError("Failed to delete announcement");
    }
  };

  // ── Join / Leave ───────────────────────────────────────────────────────────
  const handleJoin = async () => {
    if (!group?.inviteCode) return;
    setJoining(true);
    try {
      await axios.post(
        `${API}/groups/join`,
        { inviteCode: group.inviteCode },
        { headers }
      );
      await fetchGroup();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join group");
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) return;
    setLeaving(true);
    try {
      await axios.post(`${API}/groups/${id}/leave`, {}, { headers });
      navigate("/community");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to leave group");
    } finally {
      setLeaving(false);
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const tabs = [
    { key: "overview", label: "Overview", icon: Users },
    ...(isMember
      ? [
          { key: "chat", label: "Chat", icon: MessageSquare },
          { key: "resources", label: "Resources", icon: FolderOpen },
        ]
      : []),
    {
      key: "announcements",
      label: "Announcements",
      icon: Megaphone,
      badge: unreadCount > 0 ? unreadCount : null,
    },
  ];

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
        </main>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center">
          <p className="text-gray-500 mb-4">Group not found</p>
          <button
            onClick={() => navigate("/community")}
            className="text-indigo-600 hover:underline cursor-pointer"
          >
            Back to Community
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError("")} className="font-bold cursor-pointer">✕</button>
            </div>
          )}

          {/* ── Hero Header ───────────────────────────────────────────────── */}
          <section className="rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 md:p-8 shadow-lg">
            <button
              onClick={() => navigate("/community")}
              className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-5 transition cursor-pointer"
            >
              <ArrowLeft size={15} /> Back to Community
            </button>

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {group.isPublic
                    ? <Globe size={14} className="text-green-300" />
                    : <Lock size={14} className="text-white/50" />}
                  <span className="text-white/60 text-xs uppercase tracking-wide">
                    {group.category}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold leading-tight">{group.name}</h1>
                <p className="text-white/70 mt-2 text-sm leading-relaxed max-w-xl">
                  {group.description || "No description provided"}
                </p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <span className="text-xs px-3 py-1 rounded-full bg-white/20 font-medium">
                    {group.course}
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full bg-white/20 font-medium">
                    {group.topic}
                  </span>
                </div>
              </div>

              {/* Right side — invite code + actions */}
              <div className="flex flex-col gap-3 min-w-[200px]">
                {/* Invite code — only show to members */}
                {isMember && (
                  <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3">
                    <p className="text-white/50 text-xs mb-1">Invite Code</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold tracking-widest">
                        {group.inviteCode}
                      </span>
                      <button
                        onClick={copyInviteCode}
                        className="text-white/60 hover:text-white transition cursor-pointer"
                      >
                        {copied ? <Check size={15} /> : <Copy size={15} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Join button — non-members, public groups */}
                {!isMember && group.isPublic && (
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-white/90 active:scale-95 transition-all cursor-pointer disabled:opacity-60 shadow-md"
                  >
                    {joining
                      ? <><Loader2 size={15} className="animate-spin" /> Joining...</>
                      : <><UserPlus size={15} /> Join Group</>}
                  </button>
                )}

                {/* Leave button — members who are not creator */}
                {isMember && group.creator?._id !== currentUserId && (
                  <button
                    onClick={handleLeave}
                    disabled={leaving}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-red-500/30 hover:border-red-400 active:scale-95 transition-all cursor-pointer disabled:opacity-60 text-sm"
                  >
                    {leaving
                      ? <><Loader2 size={14} className="animate-spin" /> Leaving...</>
                      : <><LogOut size={14} /> Leave Group</>}
                  </button>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center justify-between rounded-2xl bg-white/10 border border-white/20 px-4 py-3">
                <span className="text-sm text-white/75 flex items-center gap-2">
                  <Users size={15} /> Members
                </span>
                <span className="font-bold text-lg">{group.members?.length} / {group.maxMembers}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/10 border border-white/20 px-4 py-3">
                <span className="text-sm text-white/75">Created by</span>
                <span className="font-medium text-sm truncate max-w-[120px]">{group.creator?.name}</span>
              </div>
              {!isMember && (
                <div className="flex items-center justify-center rounded-2xl bg-white/10 border border-white/20 px-4 py-3">
                  <span className="text-xs text-white/90"> Preview mode — join to access chat & resources</span>
                </div>
              )}
            </div>
          </section>

          {/* ── Tabs ──────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {tabs.map(({ key, label, icon: Icon, badge }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all duration-150 border-b-2 cursor-pointer ${
                    activeTab === key
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50/60"
                      : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                  {badge && (
                    <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Overview ────────────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="p-6">
                {isMember ? (
                  <>
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Members ({group.members?.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {group.members?.map((member) => {
                        const isCreator =
                          group.creator?._id === member.user?._id ||
                          group.creator?.toString() === member.user?._id;
                        return (
                          <div
                            key={member._id}
                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-indigo-100 transition"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                                {member.user?.name?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {member.user?.name}
                                </p>
                                <p className="text-xs text-gray-400">{member.user?.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isCreator && <Crown size={13} className="text-yellow-500" />}
                              {!isCreator && member.role === "admin" && (
                                <Shield size={13} className="text-indigo-500" />
                              )}
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  isCreator
                                    ? "bg-yellow-50 text-yellow-700"
                                    : member.role === "admin"
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {isCreator ? "Creator" : member.role}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  /* Non-member preview */
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                      <Users size={28} className="text-indigo-400" />
                    </div>
                    <p className="text-gray-700 font-semibold">
                      {group.members?.length} member{group.members?.length !== 1 ? "s" : ""} in this group
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Join the group to see who's in it and start collaborating
                    </p>
                    {group.isPublic && (
                      <button
                        onClick={handleJoin}
                        disabled={joining}
                        className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium text-sm cursor-pointer active:scale-95 flex items-center gap-2 mx-auto"
                      >
                        <UserPlus size={15} />
                        {joining ? "Joining..." : "Join Group"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Chat (members only) ──────────────────────────────────────── */}
            {activeTab === "chat" && isMember && (
              <div className="flex flex-col h-[600px]">
                {/* Messages area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                  {messages.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                      <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No messages yet. Say hello! </p>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isOwn =
                      msg.sender?._id === currentUserId ||
                      msg.sender?.toString() === currentUserId;
                    return (
                      <div
                        key={msg._id}
                        className={`flex gap-2 group ${isOwn ? "flex-row-reverse" : ""}`}
                      >
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 shadow-sm">
                          {msg.sender?.name?.[0]?.toUpperCase() || "?"}
                        </div>

                        <div
                          className={`max-w-[68%] flex flex-col ${
                            isOwn ? "items-end" : "items-start"
                          }`}
                        >
                          <span className="text-xs text-gray-400 mb-1 px-1">
                            {msg.sender?.name}
                          </span>
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                              isOwn
                                ? "bg-indigo-600 text-white rounded-tr-sm"
                                : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
                            }`}
                          >
                            {msg.content}
                          </div>
                          <span className="text-xs text-gray-300 mt-1 px-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Delete on hover */}
                        {(isOwn || isAdmin) && (
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all self-center cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Typing indicator */}
                  {typingUsers.length > 0 && (
                    <div className="flex gap-2 items-end">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 shadow-sm">
                        {typingUsers[0]?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400 mr-1">
                            {typingUsers.map((u) => u.name).join(", ")}
                          </span>
                          <span className="flex gap-0.5">
                            {[0, 1, 2].map((i) => (
                              <span
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }}
                              />
                            ))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input bar */}
                <div className="border-t border-gray-100 p-3 bg-white">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      value={newMessage}
                      onChange={handleTyping}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 outline-none text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition bg-gray-50 focus:bg-white"
                    />
                    <button
                      type="submit"
                      disabled={sendingMsg || !newMessage.trim()}
                      className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition disabled:opacity-40 cursor-pointer active:scale-95 shadow-sm"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ── Resources (members only) ─────────────────────────────────── */}
            {activeTab === "resources" && isMember && (
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">Shared Resources</h3>
                  <button
                    onClick={() => setShowResourceForm(!showResourceForm)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition cursor-pointer active:scale-95"
                  >
                    <Plus size={14} /> Add Resource
                  </button>
                </div>

                {showResourceForm && (
                  <form
                    onSubmit={handleAddResource}
                    className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3"
                  >
                    <input
                      required
                      placeholder="Title *"
                      value={resourceForm.title}
                      onChange={(e) =>
                        setResourceForm({ ...resourceForm, title: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    />
                    <input
                      placeholder="Description (optional)"
                      value={resourceForm.description}
                      onChange={(e) =>
                        setResourceForm({ ...resourceForm, description: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    />
                    <div className="flex gap-2">
                      <select
                        value={resourceForm.type}
                        onChange={(e) =>
                          setResourceForm({ ...resourceForm, type: e.target.value })
                        }
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white cursor-pointer"
                      >
                        <option value="link">🔗 Link</option>
                        <option value="note">📝 Note</option>
                      </select>
                      {resourceForm.type === "link" ? (
                        <input
                          placeholder="https://..."
                          value={resourceForm.url}
                          onChange={(e) =>
                            setResourceForm({ ...resourceForm, url: e.target.value })
                          }
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                        />
                      ) : (
                        <textarea
                          placeholder="Write your note..."
                          value={resourceForm.content}
                          onChange={(e) =>
                            setResourceForm({ ...resourceForm, content: e.target.value })
                          }
                          rows={3}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white resize-none"
                        />
                      )}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowResourceForm(false)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                )}

                {resources.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <FolderOpen size={38} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No resources yet. Be the first to share!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {resources.map((r) => (
                      <div
                        key={r._id}
                        className="flex items-start justify-between p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-indigo-50 flex-shrink-0">
                            {r.type === "link"
                              ? <Link size={15} className="text-indigo-600" />
                              : <FileText size={15} className="text-purple-600" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{r.title}</p>
                            {r.description && (
                              <p className="text-xs text-gray-400 mt-0.5">{r.description}</p>
                            )}
                            {r.type === "link" && r.url && (
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-500 hover:underline mt-1 block truncate max-w-xs cursor-pointer"
                              >
                                {r.url}
                              </a>
                            )}
                            {r.type === "note" && r.content && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {r.content}
                              </p>
                            )}
                            <p className="text-xs text-gray-300 mt-1.5">
                              by {r.uploadedBy?.name}
                            </p>
                          </div>
                        </div>
                        {(r.uploadedBy?._id === currentUserId || isAdmin) && (
                          <button
                            onClick={() => handleDeleteResource(r._id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition cursor-pointer flex-shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Announcements (everyone can see) ────────────────────────── */}
            {activeTab === "announcements" && (
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">Announcements</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition cursor-pointer active:scale-95"
                    >
                      <Plus size={14} /> Post
                    </button>
                  )}
                </div>

                {!isMember && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm text-indigo-700">
                    Join the group to see all announcements and stay updated with the latest news and updates.
                  </div>
                )}

                {showAnnouncementForm && isAdmin && (
                  <form
                    onSubmit={handleCreateAnnouncement}
                    className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3"
                  >
                    <input
                      required
                      placeholder="Announcement title *"
                      value={announcementForm.title}
                      onChange={(e) =>
                        setAnnouncementForm({ ...announcementForm, title: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    />
                    <textarea
                      required
                      placeholder="Write your announcement..."
                      value={announcementForm.content}
                      onChange={(e) =>
                        setAnnouncementForm({ ...announcementForm, content: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white resize-none"
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={announcementForm.pinned}
                        onChange={(e) =>
                          setAnnouncementForm({
                            ...announcementForm,
                            pinned: e.target.checked,
                          })
                        }
                        className="rounded"
                      />
                       Pin this announcement
                    </label>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowAnnouncementForm(false)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                      >
                        Post
                      </button>
                    </div>
                  </form>
                )}

                {announcements.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Megaphone size={38} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No announcements yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((a) => {
                      const isUnread = !a.readBy?.includes(currentUserId);
                      return (
                        <div
                          key={a._id}
                          className={`p-4 rounded-xl border group transition ${
                            a.pinned
                              ? "border-indigo-200 bg-indigo-50/50"
                              : isUnread && isMember
                              ? "border-blue-200 bg-blue-50/30"
                              : "border-gray-100 bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              {a.pinned && (
                                <Pin size={12} className="text-indigo-500 flex-shrink-0" />
                              )}
                              {isUnread && isMember && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                              )}
                              <h4 className="font-semibold text-gray-900 text-sm">
                                {a.title}
                              </h4>
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteAnnouncement(a._id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition cursor-pointer flex-shrink-0"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                            {a.content}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            Posted by{" "}
                            <strong className="text-gray-600">{a.author?.name}</strong>{" "}
                            · {new Date(a.createdAt).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                            })}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default GroupDetail;