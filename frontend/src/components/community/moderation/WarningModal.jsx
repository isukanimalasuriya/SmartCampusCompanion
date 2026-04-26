import React, { useState } from "react";
import { X, AlertTriangle, Volume2, Ban, UserX, Loader2, Shield } from "lucide-react";
import axios from "axios";

const API = "http://localhost:5000/api";

const WarningModal = ({ isOpen, onClose, groupId, userId, userName, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [actionType, setActionType] = useState("warning");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let endpoint = "";
    let body = { userId, reason };

    switch (actionType) {
      case "warning":
        endpoint = `${API}/groups/${groupId}/moderation/warning`;
        break;
      case "mute":
        endpoint = `${API}/groups/${groupId}/moderation/mute`;
        body.durationMinutes = parseInt(duration) || 60;
        break;
      case "temp_ban":
        endpoint = `${API}/groups/${groupId}/moderation/temp-ban`;
        body.durationHours = parseInt(duration) || 24;
        break;
      case "permanent_ban":
        endpoint = `${API}/groups/${groupId}/moderation/permanent-ban`;
        break;
      default:
        break;
    }

    try {
      await axios.post(endpoint, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to apply action");
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = () => {
    switch (actionType) {
      case "warning": return <AlertTriangle size={16} />;
      case "mute": return <Volume2 size={16} />;
      case "temp_ban": return <Ban size={16} />;
      case "permanent_ban": return <UserX size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  const getActionColor = () => {
    switch (actionType) {
      case "warning": return "bg-amber-600 hover:bg-amber-700";
      case "mute": return "bg-orange-600 hover:bg-orange-700";
      case "temp_ban": return "bg-red-600 hover:bg-red-700";
      case "permanent_ban": return "bg-red-800 hover:bg-red-900";
      default: return "bg-indigo-600";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-amber-600 p-5 text-white">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Shield size={20} /></div>
              <div><h2 className="text-lg font-bold">Moderate User</h2><p className="text-white/70 text-sm">{userName}</p></div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/20 transition"><X size={18} /></button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
            <select value={actionType} onChange={(e) => setActionType(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500">
              <option value="warning">Warning (3 warnings = auto-ban)</option>
              <option value="mute">Mute (Cannot send messages)</option>
              <option value="temp_ban">Temporary Ban</option>
              <option value="permanent_ban">Permanent Ban + Remove from group</option>
            </select>
          </div>

          {(actionType === "mute" || actionType === "temp_ban") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration ({actionType === "mute" ? "minutes" : "hours"})</label>
              <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder={actionType === "mute" ? "60 minutes" : "24 hours"} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500" />
              <p className="text-xs text-gray-400 mt-1">Leave empty for default ({actionType === "mute" ? "60 min" : "24 hours"})</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Explain why this action is being taken..." className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 resize-none" required />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition text-sm font-medium">Cancel</button>
            <button type="submit" disabled={loading} className={`flex-1 px-4 py-2.5 text-white rounded-xl transition text-sm font-medium flex items-center justify-center gap-2 ${getActionColor()}`}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : getActionIcon()} {actionType === "warning" ? "Issue Warning" : actionType === "mute" ? "Mute User" : actionType === "temp_ban" ? "Temporary Ban" : "Permanent Ban"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WarningModal;