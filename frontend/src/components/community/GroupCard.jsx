// frontend/src/components/community/GroupCard.jsx
import React, { useState } from "react";
import { Users, Globe, Lock, User, Tag, Loader2, LogIn, CheckCircle, ChevronRight, Calendar } from "lucide-react";
import axios from "axios";

const GroupCard = ({ group, onClick, showJoinButton = false, onJoinSuccess, variant = "discover" }) => {
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  const memberCount = group.members?.length || 1;
  const isFull = memberCount >= group.maxMembers;

  const handleJoin = async (e) => {
    e.stopPropagation();
    setJoining(true);
    setError("");
    try {
      await axios.post(
        "http://localhost:5000/api/groups/join",
        { inviteCode: group.inviteCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJoined(true);
      if (onJoinSuccess) onJoinSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join");
    } finally {
      setJoining(false);
    }
  };

  const theme = variant === "myGroup" 
    ? { primary: "indigo", secondary: "violet", badge: "indigo" }
    : { primary: "purple", secondary: "indigo", badge: "purple" };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:border-indigo-200/70 hover:-translate-y-0.5 transition-all duration-300 group overflow-hidden relative flex flex-col h-full ring-1 ring-transparent hover:ring-indigo-100/80 cursor-pointer"
    >
      {/* Decorative gradient blob */}
      <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-${theme.primary}-100/90 to-${theme.secondary}-100/40 rounded-bl-[2.5rem] z-0 opacity-60 group-hover:opacity-90 transition-opacity pointer-events-none`} />

      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold text-${theme.primary}-700 uppercase tracking-wider bg-${theme.primary}-50 border border-${theme.primary}-100/80 px-2 py-0.5 rounded-md`}>
                {group.course || "General"}
              </span>
              {group.isPublic ? (
                <span className="text-[9px] px-2 py-0.5 rounded-md font-bold uppercase bg-emerald-600 text-white inline-flex items-center gap-0.5 shadow-sm">
                  <Globe size={9} strokeWidth={2.5} /> Public
                </span>
              ) : (
                <span className="text-[9px] px-2 py-0.5 rounded-md font-bold uppercase bg-amber-600 text-white inline-flex items-center gap-0.5 shadow-sm">
                  <Lock size={9} strokeWidth={2.5} /> Private
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight tracking-tight group-hover:text-indigo-700 transition-colors line-clamp-2">
              {group.name}
            </h3>
            <p className="text-xs font-medium text-slate-400 capitalize tracking-wide mt-0.5">
              {group.topic || "Study Group"}
            </p>
          </div>
          <div className="shrink-0">
            <div className={`h-10 w-10 rounded-xl bg-${theme.primary}-50 text-${theme.primary}-600 flex items-center justify-center`}>
              <Users size={20} strokeWidth={1.8} />
            </div>
          </div>
        </div>

        {/* Category Badge */}
        {group.category && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-purple-50 text-purple-600 font-medium">
              <Tag size={10} />
              {group.category}
            </span>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 flex-1 mb-4">
          {group.description || "No description provided."}
        </p>

        {/* Metadata panel */}
        <div className="rounded-2xl bg-slate-50/80 border border-slate-100 px-3 py-2.5 mb-4 space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-indigo-700">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm border border-indigo-100/80">
              <Users size={14} strokeWidth={2} />
            </span>
            <span>
              {memberCount} member{memberCount !== 1 ? "s" : ""}
              {group.maxMembers && ` / ${group.maxMembers} max`}
              {isFull && <span className="text-amber-600 ml-1">(Full)</span>}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-600">
            {group.creator?.name && (
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <User size={13} className="text-indigo-500 shrink-0" strokeWidth={2} />
                <span className="font-medium text-slate-700 truncate max-w-[9rem]">Created by {group.creator.name}</span>
              </span>
            )}
            {group.createdAt && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400 shrink-0" strokeWidth={2} />
                <span className="font-medium">Created {new Date(group.createdAt).toLocaleDateString([], { month: "short", year: "numeric" })}</span>
              </span>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs text-red-500 mb-2">{error}</p>
        )}

        {/* Action buttons */}
        <div className="mt-auto">
          {showJoinButton ? (
            <button
              onClick={handleJoin}
              disabled={joining || isFull || joined}
              className={`w-full py-3 bg-gradient-to-r from-${theme.primary}-600 to-${theme.secondary}-600 text-white font-bold rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-${theme.primary}-100 text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {joining ? (
                <Loader2 size={16} className="animate-spin" />
              ) : joined ? (
                <>
                  <CheckCircle size={14} /> Joined!
                </>
              ) : isFull ? (
                "Group Full"
              ) : (
                <>
                  <LogIn size={14} /> Join Group
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl inline-flex items-center gap-1">
                <CheckCircle size={12} /> Member
              </span>
              <button
                onClick={onClick}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
              >
                View Group <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupCard;