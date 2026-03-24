import React from "react";
import { Users, Globe, Lock, User, Users as MembersIcon, Tag } from "lucide-react";

const GroupCard = ({ group, onClick, showJoinButton = false, onJoin }) => {
  const handleJoin = (e) => {
    e.stopPropagation();
    if (onJoin) onJoin();
  };

  const memberCount = group.members?.length || 1;
  const isFull = memberCount >= group.maxMembers;

  return (
    <div
      onClick={onClick}
      className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-900 text-lg line-clamp-1">
          {group.name}
        </h3>
        {group.isPublic ? (
          <Globe size={16} className="text-green-500 flex-shrink-0" />
        ) : (
          <Lock size={16} className="text-gray-400 flex-shrink-0" />
        )}
      </div>

      {/* Category Badge */}
      {group.category && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-purple-50 text-purple-600 font-medium">
            <Tag size={12} />
            {group.category}
          </span>
        </div>
      )}

      {/* Course & Topic Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 font-medium">
          {group.course}
        </span>
        <span className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600 font-medium">
          {group.topic}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
        {group.description || "No description provided"}
      </p>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
        <div className="flex items-center gap-1">
          <Users size={14} />
          <span>{memberCount} / {group.maxMembers} members</span>
        </div>
        <div className="flex items-center gap-1">
          <User size={14} />
          <span className="truncate max-w-[100px]">
            {group.creator?.name || "User"}
          </span>
        </div>
      </div>

      {/* Full indicator */}
      {isFull && (
        <div className="mt-3 text-xs text-red-500 flex items-center gap-1">
          <MembersIcon size={12} />
          <span>Group is full</span>
        </div>
      )}

      {/* Join Button (for discover tab) */}
      {showJoinButton && !isFull && (
        <button
          onClick={handleJoin}
          className="mt-4 w-full py-2 rounded-lg bg-indigo-50 text-indigo-600 font-medium text-sm hover:bg-indigo-100 transition"
        >
          Join Group
        </button>
      )}

      {showJoinButton && isFull && (
        <button
          disabled
          className="mt-4 w-full py-2 rounded-lg bg-gray-100 text-gray-400 font-medium text-sm cursor-not-allowed"
        >
          Group Full
        </button>
      )}
    </div>
  );
};

export default GroupCard;