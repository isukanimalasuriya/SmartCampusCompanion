import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft, Users, MessageSquare, FolderOpen, Megaphone,
  Send, Trash2, Plus, Link, FileText, Pin, Crown,
  Shield, Copy, Check, Globe, Lock, LogOut, UserPlus,
  Loader2, Paperclip, X, Reply, Image, File, Music,
  Video, Download, Calendar, Tag, AtSign, Hash, Settings,
  AlertTriangle, Ban, Volume2
} from "lucide-react";
import Navbar from "../Navbar";
import StrikesPanel from "./moderation/StrikesPanel";
import ModerationSettings from "./moderation/ModerationSettings";

const API = "http://localhost:5000/api";

const formatBytes = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileIcon = ({ fileType, size = 18 }) => {
  if (fileType === "image") return <Image size={size} />;
  if (fileType === "video") return <Video size={size} />;
  if (fileType === "audio") return <Music size={size} />;
  return <File size={size} />;
};

const FilePreview = ({ file, isOwn }) => {
  if (!file || !file.url) return null;
  const { url, originalName: name, fileType: type } = file;

  if (type === "image") return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block cursor-pointer mt-2">
      <img src={url} alt={name} className="max-w-[240px] max-h-[180px] rounded-xl object-cover ring-1 ring-white/20" />
    </a>
  );
  if (type === "video") return <video src={url} controls className="max-w-[240px] rounded-xl mt-2" />;
  if (type === "audio") return <audio src={url} controls className="mt-2 max-w-[240px]" />;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className={`flex items-center gap-2 mt-2 px-3 py-2 rounded-xl border text-sm cursor-pointer transition ${
        isOwn ? "border-white/20 bg-white/10 text-white hover:bg-white/20" : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
      }`}>
      <FileIcon fileType={type} size={15} />
      <div className="flex-1 min-w-0">
        <p className="truncate text-xs font-medium">{name}</p>
        <p className="text-xs opacity-60">{formatBytes(file.size)}</p>
      </div>
      <Download size={13} className="opacity-60 flex-shrink-0" />
    </a>
  );
};

const ReplyBar = ({ replyTo, onCancel }) => {
  if (!replyTo) return null;
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 border-t border-violet-100">
      <div className="w-0.5 h-8 bg-violet-400 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-violet-600">{replyTo.sender?.name}</p>
        <p className="text-xs text-gray-500 truncate">
          {replyTo.deleted ? "This message was deleted" : replyTo.file?.url ? replyTo.file.originalName : replyTo.content}
        </p>
      </div>
      <button onClick={onCancel} className="p-1 rounded-full hover:bg-violet-100 transition cursor-pointer">
        <X size={13} className="text-violet-400" />
      </button>
    </div>
  );
};

const ReplyPreview = ({ replyTo, isOwn }) => {
  if (!replyTo) return null;
  return (
    <div className={`text-xs rounded-lg px-2 py-1.5 mb-2 border-l-2 ${
      isOwn ? "bg-white/15 border-white/50 text-white/80" : "bg-gray-50 border-violet-400 text-gray-500"
    }`}>
      <p className="font-semibold mb-0.5">{replyTo.sender?.name || "Unknown"}</p>
      <p className="truncate">{replyTo.deleted ? "Message deleted" : replyTo.file?.url ? replyTo.file.originalName : replyTo.content}</p>
    </div>
  );
};

const Avatar = ({ name, size = "md", className = "" }) => {
  const sizes = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-11 h-11 text-base" };
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-sm ${className}`}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
};

// Profanity warning shown above the input
const ProfanityWarning = ({ warning, onDismiss }) => {
  if (!warning) return null;
  const isLastWarning = warning.warningsLeft === 0;
  return (
    <div className={`mx-4 mb-2 rounded-2xl border px-4 py-3 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
      isLastWarning ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
    }`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isLastWarning ? "bg-red-100" : "bg-amber-100"
      }`}>
        {isLastWarning
          ? <Ban size={15} className="text-red-600" />
          : <AlertTriangle size={15} className="text-amber-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${isLastWarning ? "text-red-700" : "text-amber-700"}`}>
          {isLastWarning ? "Final warning — next violation results in a ban" : "Inappropriate language detected"}
        </p>
        <p className={`text-xs mt-0.5 leading-relaxed ${isLastWarning ? "text-red-600" : "text-amber-600"}`}>
          {warning.warningsLeft > 0
            ? `You have ${warning.warningsLeft} warning${warning.warningsLeft !== 1 ? "s" : ""} remaining before you are banned from this group.`
            : "You've used all your warnings. One more violation will result in a ban."}
        </p>
        <div className="flex gap-1 mt-2">
          {Array.from({ length: warning.warningsBeforeBan }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
              i < warning.warningCount
                ? isLastWarning ? "bg-red-400" : "bg-amber-400"
                : "bg-gray-200"
            }`} />
          ))}
        </div>
      </div>
      <button onClick={onDismiss} className="p-1 rounded-lg hover:bg-black/5 transition cursor-pointer flex-shrink-0 mt-0.5">
        <X size={13} className="text-gray-400" />
      </button>
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  let currentUserId = null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    currentUserId = payload.sub;
  } catch { navigate("/"); }

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [userRestriction, setUserRestriction] = useState(null);

  // Chat
  const [messages, setMessages] = useState([]);
  const [messageCount, setMessageCount] = useState(0);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [moderationSubTab, setModerationSubTab] = useState("violations");
  const [profanityWarning, setProfanityWarning] = useState(null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const typingPollRef = useRef(null);
  const fileInputRef = useRef(null);
  const isMarkingRead = useRef(false);
  const userScrolled = useRef(false);

  // Resources
  const [resources, setResources] = useState([]);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [resourceForm, setResourceForm] = useState({ title: "", description: "", type: "link", url: "", content: "" });

  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", content: "", pinned: false });

  const headers = { Authorization: `Bearer ${token}` };

  // Fetch user's restriction status (mute/ban)
  const fetchUserRestriction = useCallback(async () => {
    if (!isMember || isOwner) return;
    try {
      const res = await axios.get(`${API}/groups/${id}/user-restriction`, { headers });
      if (res.data.restricted) {
        setUserRestriction(res.data);
      } else {
        setUserRestriction(null);
      }
    } catch (err) {
      console.error("Failed to fetch restriction:", err);
    }
  }, [id, isMember, isOwner]);

  const checkMembership = (grp) => {
    if (!grp || !currentUserId) return;
    const member = grp.members?.find(m => m.user?._id === currentUserId || m.user?.toString() === currentUserId);
    const creator = grp.creator?._id === currentUserId || grp.creator?.toString() === currentUserId;
    setIsMember(!!member || creator);
    setIsAdmin(creator || member?.role === "admin");
    setIsOwner(creator);
  };

  const fetchGroup = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/groups/${id}`, { headers });
      setGroup(res.data.data);
      checkMembership(res.data.data);
    } catch { setError("Failed to load group"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  useEffect(() => {
    if (isMember && !isOwner) {
      fetchUserRestriction();
    }
  }, [isMember, isOwner, fetchUserRestriction]);

  useEffect(() => {
    if (activeTab === "chat" && isMember) {
      fetchMessages();
      fetchMessageCount();
      startMessagePolling();
      startTypingPolling();
    } else { stopPolling(); }
    if (activeTab === "resources" && isMember) fetchResources();
    if (activeTab === "announcements") { fetchAnnouncements(); if (isMember) markRead(); }
    return () => stopPolling();
  }, [activeTab, isMember]);

  const scrollToBottom = useCallback((force = false) => {
    if (force || !userScrolled.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleContainerScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    userScrolled.current = !atBottom;
  };

  const startMessagePolling = () => {
    stopPolling();
    pollIntervalRef.current = setInterval(fetchMessages, 3000);
  };
  const startTypingPolling = () => {
    typingPollRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/groups/${id}/typing`, { headers });
        setTypingUsers((res.data.typingUsers || []).filter(u => u.userId !== currentUserId));
      } catch {}
    }, 1500);
  };
  const stopPolling = () => { clearInterval(pollIntervalRef.current); clearInterval(typingPollRef.current); };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      axios.post(`${API}/groups/${id}/typing`, { typing: true }, { headers }).catch(() => {});
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        axios.post(`${API}/groups/${id}/typing`, { typing: false }, { headers }).catch(() => {});
      }
    }, 2000);
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API}/groups/${id}/messages`, { headers });
      setMessages(res.data.data);
      if (activeTab === "chat") markMessagesRead();
    } catch {}
  };

  const markMessagesRead = async () => {
    if (isMarkingRead.current) return;
    try {
      isMarkingRead.current = true;
      await axios.post(`${API}/groups/${id}/messages/read`, {}, { headers });
      await fetchMessageCount();
    } catch {}
    finally { setTimeout(() => { isMarkingRead.current = false; }, 1000); }
  };

  const fetchMessageCount = async () => {
    try {
      const res = await axios.get(`${API}/groups/${id}/messages/count`, { headers });
      setMessageCount(res.data.count);
    } catch {}
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(file);
    } else { setFilePreview(null); }
  };

  const clearFile = () => {
    setSelectedFile(null); setFilePreview(null); setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;
    
    setSendingMsg(true);
    if (isTyping) {
      setIsTyping(false);
      clearTimeout(typingTimeoutRef.current);
      axios.post(`${API}/groups/${id}/typing`, { typing: false }, { headers }).catch(() => {});
    }
    try {
      const formData = new FormData();
      if (newMessage.trim()) formData.append("content", newMessage.trim());
      if (selectedFile) formData.append("file", selectedFile);
      if (replyTo) formData.append("replyTo", replyTo._id);
      await axios.post(`${API}/groups/${id}/messages`, formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
        onUploadProgress: (p) => setUploadProgress(Math.round((p.loaded * 100) / p.total)),
      });
      setNewMessage(""); setReplyTo(null); clearFile();
      setProfanityWarning(null);
      userScrolled.current = false;
      await fetchMessages(); await fetchMessageCount();
    } catch (err) {
      const data = err.response?.data;
      if (data?.profanityDetected) {
        setProfanityWarning({
          warningsLeft: data.warningsLeft,
          warningCount: data.warningCount,
          warningsBeforeBan: data.warningsBeforeBan,
        });
      } else if (data?.restriction) {
        setError(data.message || "You are restricted from sending messages.");
        fetchUserRestriction();
      } else {
        setError(data?.message || "Failed to send message");
      }
    } finally {
      setSendingMsg(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(`${API}/groups/${id}/messages/${messageId}`, { headers });
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, deleted: true, content: "", file: null } : m));
      setMessageCount(c => Math.max(0, c - 1));
    } catch { setError("Failed to delete message"); }
  };

  const fetchResources = async () => {
    try { const res = await axios.get(`${API}/groups/${id}/resources`, { headers }); setResources(res.data.data); } catch {}
  };
  const handleAddResource = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/groups/${id}/resources`, resourceForm, { headers });
      setResources(prev => [res.data.data, ...prev]);
      setResourceForm({ title: "", description: "", type: "link", url: "", content: "" });
      setShowResourceForm(false);
    } catch { setError("Failed to add resource"); }
  };
  const handleDeleteResource = async (resourceId) => {
    try {
      await axios.delete(`${API}/groups/${id}/resources/${resourceId}`, { headers });
      setResources(prev => prev.filter(r => r._id !== resourceId));
    } catch { setError("Failed to delete resource"); }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(`${API}/groups/${id}/announcements`, { headers });
      setAnnouncements(res.data.data); setUnreadCount(res.data.unreadCount || 0);
    } catch {}
  };
  const markRead = async () => {
    try { await axios.post(`${API}/groups/${id}/announcements/read`, {}, { headers }); setUnreadCount(0); } catch {}
  };
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/groups/${id}/announcements`, announcementForm, { headers });
      setAnnouncements(prev => [res.data.data, ...prev]);
      setAnnouncementForm({ title: "", content: "", pinned: false }); setShowAnnouncementForm(false);
    } catch { setError("Failed to create announcement"); }
  };
  const handleDeleteAnnouncement = async (announcementId) => {
    try {
      await axios.delete(`${API}/groups/${id}/announcements/${announcementId}`, { headers });
      setAnnouncements(prev => prev.filter(a => a._id !== announcementId));
    } catch { setError("Failed to delete announcement"); }
  };

  const handleJoin = async () => {
    if (!group?.inviteCode) return;
    setJoining(true);
    try { await axios.post(`${API}/groups/join`, { inviteCode: group.inviteCode }, { headers }); await fetchGroup(); }
    catch (err) { setError(err.response?.data?.message || "Failed to join group"); }
    finally { setJoining(false); }
  };
  const handleLeave = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) return;
    setLeaving(true);
    try { await axios.post(`${API}/groups/${id}/leave`, {}, { headers }); navigate("/community"); }
    catch (err) { setError(err.response?.data?.message || "Failed to leave group"); }
    finally { setLeaving(false); }
  };
  const copyInviteCode = () => {
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  // Check if user is restricted from sending messages
  const isMessageRestricted = userRestriction?.type === "temporary_mute" || 
                              userRestriction?.type === "temporary_ban" || 
                              userRestriction?.type === "permanent_ban";
  
  const getRestrictionMessage = () => {
    if (userRestriction?.type === "temporary_mute") {
      return `Muted until ${new Date(userRestriction.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (userRestriction?.type === "temporary_ban") {
      return `Banned until ${new Date(userRestriction.expiresAt).toLocaleDateString()}`;
    }
    if (userRestriction?.type === "permanent_ban") {
      return "Permanently banned from this group";
    }
    return "";
  };

  const tabs = [
    { key: "overview", label: "Overview", icon: Users },
    ...(isMember ? [
      { key: "chat", label: "Chat", icon: MessageSquare, badge: messageCount > 0 ? messageCount : null },
      { key: "resources", label: "Resources", icon: FolderOpen },
    ] : []),
    ...(isOwner ? [{ key: "moderation", label: "Moderation", icon: Shield }] : []),
    { key: "announcements", label: "Announcements", icon: Megaphone, badge: unreadCount > 0 ? unreadCount : null },
  ];

  if (loading) return (
    <div className="flex h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-12 h-12">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 animate-pulse" />
            <Loader2 size={20} className="absolute inset-0 m-auto text-violet-600 animate-spin" />
          </div>
          <p className="text-gray-400 text-sm">Loading group…</p>
        </div>
      </main>
    </div>
  );

  if (!group) return (
    <div className="flex h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Users size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium mb-3">Group not found</p>
          <button onClick={() => navigate("/community")} className="px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition text-sm font-medium">
            Back to Community
          </button>
        </div>
      </main>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f7f7fb] overflow-hidden">
      <div className="flex-shrink-0"><Navbar /></div>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-5 space-y-4 pb-10">

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 text-sm flex justify-between items-center animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-red-500 rounded-full" />{error}</span>
              <button onClick={() => setError("")} className="p-1 rounded-lg hover:bg-red-100 transition cursor-pointer"><X size={14} /></button>
            </div>
          )}

          {/* ── COMPACT HERO HEADER ──────────────────────────────────────── */}
          <section className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500" />

            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => navigate("/community")}
                  className="inline-flex items-center gap-1.5 text-gray-400 hover:text-violet-600 text-xs font-medium transition group">
                  <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
                  Community
                </button>
                <div className="flex items-center gap-1.5">
                  {group.isPublic
                    ? <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700"><Globe size={8} />Public</span>
                    : <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><Lock size={8} />Private</span>}
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{group.category}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-snug truncate">
                    {group.name}
                  </h1>
                  <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">
                    {group.description || "No description provided"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 font-medium">
                      <Hash size={9} className="text-violet-500" />{group.course}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 font-medium">
                      <Tag size={9} className="text-indigo-500" />{group.topic}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isMember && (
                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                      <span className="font-mono text-sm font-bold tracking-widest text-gray-700">{group.inviteCode}</span>
                      <button onClick={copyInviteCode} className="p-0.5 rounded-md hover:bg-gray-200 transition cursor-pointer">
                        {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} className="text-gray-400" />}
                      </button>
                    </div>
                  )}
                  {!isMember && group.isPublic && (
                    <button onClick={handleJoin} disabled={joining}
                      className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 active:scale-95 transition-all cursor-pointer disabled:opacity-60 text-sm shadow-md shadow-violet-200">
                      {joining ? <><Loader2 size={13} className="animate-spin" />Joining…</> : <><UserPlus size={13} />Join</>}
                    </button>
                  )}
                  {isMember && group.creator?._id !== currentUserId && group.creator?.toString() !== currentUserId && (
                    <button onClick={handleLeave} disabled={leaving}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-500 rounded-xl hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer disabled:opacity-60 text-sm">
                      {leaving ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Users size={11} className="text-violet-400" />
                  <strong className="text-gray-700 font-semibold">{group.members?.length}</strong>
                  <span>/ {group.maxMembers}</span>
                </span>
                <span className="w-px h-3 bg-gray-200" />
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <MessageSquare size={11} className="text-indigo-400" />
                  <strong className="text-gray-700 font-semibold">{messageCount}</strong> messages
                </span>
                <span className="w-px h-3 bg-gray-200" />
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar size={11} className="text-gray-300" />
                  {new Date(group.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                {!isMember && (
                  <>
                    <span className="w-px h-3 bg-gray-200" />
                    <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 font-medium">
                      Preview mode
                    </span>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* ── TABS + CONTENT ───────────────────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide px-2 pt-2">
              {tabs.map(({ key, label, icon: Icon, badge }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 rounded-t-xl cursor-pointer ${
                    activeTab === key
                      ? "text-violet-700 bg-violet-50 border-b-2 border-violet-500"
                      : "text-gray-400 hover:text-gray-700 hover:bg-gray-50 border-b-2 border-transparent"
                  }`}>
                  <Icon size={15} />
                  {label}
                  {badge && (
                    <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── OVERVIEW ─────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="p-6 animate-in fade-in duration-300">
                {isMember ? (
                  <>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-semibold text-gray-900">Members
                        <span className="ml-2 text-sm font-normal text-gray-400">({group.members?.length})</span>
                      </h3>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                        {group.members?.filter(m => m.role === "admin").length} admins
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {group.members?.map((member) => {
                        const isCreator = group.creator?._id === member.user?._id || group.creator?.toString() === member.user?._id;
                        return (
                          <div key={member._id}
                            className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all">
                            <div className="flex items-center gap-3">
                              <Avatar name={member.user?.name} size="md" />
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{member.user?.name}</p>
                                <p className="text-xs text-gray-400">{member.user?.email}</p>
                              </div>
                            </div>
                            <span className={`text-[10px] px-2 py-1 rounded-lg font-semibold flex items-center gap-1 ${
                              isCreator ? "bg-amber-100 text-amber-700" : member.role === "admin" ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-500"
                            }`}>
                              {isCreator ? <><Crown size={10} />Creator</> : member.role === "admin" ? <><Shield size={10} />Admin</> : "Member"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-14">
                    <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-3">
                      <Users size={24} className="text-violet-400" />
                    </div>
                    <p className="text-gray-700 font-semibold">{group.members?.length} member{group.members?.length !== 1 ? "s" : ""}</p>
                    <p className="text-gray-400 text-sm mt-1 mb-4">Join to see who's here and start collaborating</p>
                    {group.isPublic && (
                      <button onClick={handleJoin} disabled={joining}
                        className="px-5 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition font-medium text-sm cursor-pointer active:scale-95 inline-flex items-center gap-2">
                        <UserPlus size={14} />{joining ? "Joining…" : "Join Group"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── CHAT ─────────────────────────────────────────── */}
            {activeTab === "chat" && isMember && (
              <div className="flex flex-col" style={{ height: "600px" }}>
                {/* Messages */}
                <div ref={messagesContainerRef} onScroll={handleContainerScroll}
                  className="flex-1 overflow-y-auto p-5 space-y-3">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <MessageSquare size={22} className="text-gray-300" />
                      </div>
                      <p className="text-gray-400 text-sm">No messages yet — say hello! 👋</p>
                    </div>
                  )}

                  {messages.map((msg) => {
                    const isOwn = msg.sender?._id === currentUserId || msg.sender?.toString() === currentUserId;
                    if (msg.deleted) return (
                      <div key={msg._id} className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex-shrink-0" />
                        <div className="px-3 py-2 rounded-2xl text-xs italic text-gray-400 border border-dashed border-gray-200">
                          This message was deleted
                        </div>
                      </div>
                    );
                    return (
                      <div key={msg._id}
                        className={`flex gap-2.5 group animate-in fade-in slide-in-from-bottom-1 duration-200 ${isOwn ? "flex-row-reverse" : ""}`}>
                        <Avatar name={msg.sender?.name} size="sm" />
                        <div className={`max-w-[70%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                          <span className="text-[11px] text-gray-400 mb-1 px-1 font-medium">{msg.sender?.name}</span>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isOwn
                              ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-md shadow-md shadow-violet-200/50"
                              : "bg-gray-100 text-gray-800 rounded-tl-md"
                          }`}>
                            {msg.replyTo && <ReplyPreview replyTo={msg.replyTo} isOwn={isOwn} />}
                            {msg.content && <p className="break-words">{msg.content}</p>}
                            {msg.file?.url && <FilePreview file={msg.file} isOwn={isOwn} />}
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1 px-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className={`opacity-0 group-hover:opacity-100 flex items-center gap-1 self-center transition-all duration-200 ${isOwn ? "flex-row-reverse" : ""}`}>
                          <button onClick={() => setReplyTo(msg)}
                            className="p-1.5 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-violet-500 hover:border-violet-300 transition cursor-pointer shadow-sm">
                            <Reply size={11} />
                          </button>
                          {(isOwn || isAdmin) && (
                            <button onClick={() => handleDeleteMessage(msg._id)}
                              className="p-1.5 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-400 hover:border-red-300 transition cursor-pointer shadow-sm">
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {typingUsers.length > 0 && (
                    <div className="flex gap-2 items-end animate-in fade-in duration-200">
                      <Avatar name={typingUsers[0]?.name} size="sm" />
                      <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{typingUsers.map(u => u.name).join(", ")} is typing</span>
                          <span className="flex gap-0.5">
                            {[0, 1, 2].map(i => (
                              <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Profanity warning */}
                <ProfanityWarning warning={profanityWarning} onDismiss={() => setProfanityWarning(null)} />

                {/* File preview */}
                {selectedFile && (
                  <div className="px-4 py-3 bg-violet-50 border-t border-violet-100 flex items-center gap-3">
                    {filePreview
                      ? <img src={filePreview} alt="preview" className="w-10 h-10 rounded-lg object-cover border border-violet-200" />
                      : <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center"><File size={16} className="text-violet-600" /></div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-gray-400">{formatBytes(selectedFile.size)}</p>
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-14">
                        <div className="h-1 bg-violet-200 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-600 transition-all" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    )}
                    <button onClick={clearFile} className="p-1 rounded-full hover:bg-violet-200 transition cursor-pointer">
                      <X size={13} className="text-violet-500" />
                    </button>
                  </div>
                )}

                <ReplyBar replyTo={replyTo} onCancel={() => setReplyTo(null)} />

                {/* ── INPUT SECTION ── */}
                <div className="border-t border-gray-100 p-4 bg-white">
                  {isMessageRestricted ? (
                    // Disabled input with restriction message
                    <div className="relative">
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-100 border border-gray-200 text-gray-500">
                        {userRestriction?.type === "temporary_mute" ? (
                          <Volume2 size={16} className="text-orange-500 flex-shrink-0" />
                        ) : (
                          <Ban size={16} className="text-red-500 flex-shrink-0" />
                        )}
                        <span className="text-sm flex-1">
                          {getRestrictionMessage()}
                        </span>
                        <div className="w-9 h-9 bg-gray-200 rounded-xl flex items-center justify-center">
                          <Send size={14} className="text-gray-400" />
                        </div>
                      </div>
                      {userRestriction?.type === "temporary_mute" && userRestriction?.expiresAt && (
                        <div className="absolute -bottom-5 left-0 right-0 text-center">
                          <span className="text-[10px] text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                            {Math.ceil((new Date(userRestriction.expiresAt) - new Date()) / 1000 / 60)} minutes remaining
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Normal active input
                    <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect}
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" />
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition cursor-pointer flex-shrink-0">
                        <Paperclip size={16} />
                      </button>
                      <input 
                        value={newMessage} 
                        onChange={handleTyping} 
                        placeholder="Type a message…"
                        className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 outline-none text-sm focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition bg-gray-50 focus:bg-white" 
                      />
                      <button type="submit" 
                        disabled={sendingMsg || (!newMessage.trim() && !selectedFile)}
                        className="w-9 h-9 flex items-center justify-center bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition disabled:opacity-40 cursor-pointer active:scale-95 shadow-md shadow-violet-200 flex-shrink-0">
                        {sendingMsg ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* ── RESOURCES ────────────────────────────────────── */}
            {activeTab === "resources" && isMember && (
              <div className="p-6 space-y-5 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">Shared Resources
                    <span className="ml-2 text-sm font-normal text-gray-400">({resources.length})</span>
                  </h3>
                  <button onClick={() => setShowResourceForm(!showResourceForm)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm hover:bg-violet-700 transition cursor-pointer active:scale-95 font-medium shadow-md shadow-violet-200">
                    <Plus size={14} />Add Resource
                  </button>
                </div>

                {showResourceForm && (
                  <form onSubmit={handleAddResource} className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <input required placeholder="Title *" value={resourceForm.title}
                      onChange={e => setResourceForm({ ...resourceForm, title: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 bg-white" />
                    <input placeholder="Description (optional)" value={resourceForm.description}
                      onChange={e => setResourceForm({ ...resourceForm, description: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 bg-white" />
                    <div className="flex gap-2">
                      <select value={resourceForm.type} onChange={e => setResourceForm({ ...resourceForm, type: e.target.value })}
                        className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-300 bg-white cursor-pointer">
                        <option value="link">Link</option>
                        <option value="note">Note</option>
                      </select>
                      {resourceForm.type === "link"
                        ? <input placeholder="https://…" value={resourceForm.url} onChange={e => setResourceForm({ ...resourceForm, url: e.target.value })}
                            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-300 bg-white" />
                        : <textarea placeholder="Write your note…" value={resourceForm.content} onChange={e => setResourceForm({ ...resourceForm, content: e.target.value })}
                            rows={3} className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-300 bg-white resize-none" />}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setShowResourceForm(false)}
                        className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-200 rounded-lg transition cursor-pointer">Cancel</button>
                      <button type="submit"
                        className="px-4 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition cursor-pointer font-medium">Save</button>
                    </div>
                  </form>
                )}

                {resources.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen size={36} className="mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400 text-sm">No resources yet — be the first to share!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {resources.map(r => (
                      <div key={r._id}
                        className="flex items-start justify-between p-4 rounded-2xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all group">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0">
                            {r.type === "link" ? <Link size={14} className="text-violet-600" /> : <FileText size={14} className="text-indigo-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">{r.title}</p>
                            {r.description && <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>}
                            {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-500 hover:underline mt-1 inline-block truncate max-w-xs">{r.url}</a>}
                            {r.content && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{r.content}</p>}
                            <p className="text-xs text-gray-400 mt-1">by {r.uploadedBy?.name}</p>
                          </div>
                        </div>
                        {(r.uploadedBy?._id === currentUserId || isAdmin) && (
                          <button onClick={() => handleDeleteResource(r._id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition cursor-pointer p-1">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ANNOUNCEMENTS ─────────────────────────────────── */}
            {activeTab === "announcements" && (
              <div className="p-6 space-y-5 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">Announcements</h3>
                    {unreadCount > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">{unreadCount} new</span>}
                  </div>
                  {isAdmin && (
                    <button onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm hover:bg-violet-700 transition cursor-pointer active:scale-95 font-medium shadow-md shadow-violet-200">
                      <Plus size={14} />Post
                    </button>
                  )}
                </div>

                {!isMember && (
                  <div className="bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3 text-sm text-violet-700 flex items-center gap-2">
                    <Megaphone size={13} />Join the group to stay updated with announcements.
                  </div>
                )}

                {showAnnouncementForm && isAdmin && (
                  <form onSubmit={handleCreateAnnouncement} className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <input required placeholder="Title *" value={announcementForm.title}
                      onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-300 bg-white" />
                    <textarea required placeholder="Write your announcement…" value={announcementForm.content}
                      onChange={e => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                      rows={3} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-300 bg-white resize-none" />
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={announcementForm.pinned}
                        onChange={e => setAnnouncementForm({ ...announcementForm, pinned: e.target.checked })}
                        className="rounded border-gray-300 accent-violet-600" />
                      Pin this announcement
                    </label>
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setShowAnnouncementForm(false)}
                        className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-200 rounded-lg transition cursor-pointer">Cancel</button>
                      <button type="submit" className="px-4 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition cursor-pointer font-medium">Post</button>
                    </div>
                  </form>
                )}

                {announcements.length === 0 ? (
                  <div className="text-center py-12">
                    <Megaphone size={36} className="mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400 text-sm">No announcements yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {announcements.map(a => {
                      const isUnread = !a.readBy?.includes(currentUserId);
                      return (
                        <div key={a._id} className={`p-5 rounded-2xl border transition-all group ${
                          a.pinned ? "border-violet-200 bg-violet-50/50" : isUnread && isMember ? "border-blue-200 bg-blue-50/30" : "border-gray-100 hover:shadow-md"
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {a.pinned && <Pin size={12} className="text-violet-500" />}
                              {isUnread && isMember && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                              <h4 className="font-semibold text-gray-900 text-sm">{a.title}</h4>
                            </div>
                            {isAdmin && (
                              <button onClick={() => handleDeleteAnnouncement(a._id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition cursor-pointer p-1">
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{a.content}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-3 pt-2.5 border-t border-gray-100">
                            <span>by <strong className="text-gray-600">{a.author?.name}</strong></span>
                            <span>·</span>
                            <span>{new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── MODERATION ────────────────────────────────────── */}
            {activeTab === "moderation" && isOwner && (
              <div className="p-6 animate-in fade-in duration-300">
                <div className="flex gap-2 border-b border-gray-100 mb-6">
                  {[
                    { key: "violations", label: "Violations & Strikes", icon: Shield },
                    { key: "settings", label: "Settings", icon: Settings },
                  ].map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setModerationSubTab(key)}
                      className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                        moderationSubTab === key ? "border-violet-500 text-violet-700" : "border-transparent text-gray-400 hover:text-gray-700"
                      }`}>
                      <Icon size={14} />{label}
                    </button>
                  ))}
                </div>
                {moderationSubTab === "violations" && <StrikesPanel groupId={id} isOwner={isOwner} />}
                {moderationSubTab === "settings" && <ModerationSettings groupId={id} isOwner={isOwner} />}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default GroupDetail;