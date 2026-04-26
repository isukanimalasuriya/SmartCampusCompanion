import React, { useState, useEffect } from "react";
import { Shield, AlertTriangle, Clock, Ban, CheckCircle, Loader2, RefreshCw, Crown, UserCog, UserMinus, Volume2 } from "lucide-react";
import axios from "axios";
import WarningModal from "./WarningModal";

const API = "http://localhost:5000/api";

const StrikesPanel = ({ groupId, isOwner, onSettingsChange }) => {
  const [violations, setViolations] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [actionBusy, setActionBusy] = useState(null);
  const token = localStorage.getItem("token");

  const fetchViolations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/groups/${groupId}/moderation/violations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setViolations(res.data.data);
    } catch (err) {
      console.error("Failed to fetch violations:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMembers = async () => {
    try {
      const res = await axios.get(`${API}/groups/${groupId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroupMembers(res.data.data);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    }
  };

  useEffect(() => {
    if (isOwner) {
      fetchViolations();
      fetchGroupMembers();
    }
  }, [groupId, isOwner]);

  const handleRemoveStrike = async (strikeId) => {
    if (!confirm("Remove this strike? This will reduce the user's warning count.")) return;
    setActionBusy(`remove_${strikeId}`);
    try {
      await axios.delete(`${API}/groups/${groupId}/moderation/strike/${strikeId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { groupId },
      });
      fetchViolations();
      if (onSettingsChange) onSettingsChange();
    } catch (err) {
      alert("Failed to remove strike");
    } finally {
      setActionBusy(null);
    }
  };

  const handlePromoteToAdmin = async (userId, userName) => {
    if (!confirm(`Promote ${userName} to Admin? They will get moderation permissions.`)) return;
    setActionBusy(`promote_${userId}`);
    try {
      await axios.put(
        `${API}/groups/${groupId}/members/${userId}/role`,
        { role: "admin" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchGroupMembers();
      alert(`${userName} is now an Admin!`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to promote user");
    } finally {
      setActionBusy(null);
    }
  };

  const handleDemoteToMember = async (userId, userName) => {
    if (!confirm(`Demote ${userName} to Member? They will lose moderation permissions.`)) return;
    setActionBusy(`demote_${userId}`);
    try {
      await axios.put(
        `${API}/groups/${groupId}/members/${userId}/role`,
        { role: "member" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchGroupMembers();
      alert(`${userName} is now a Member.`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to demote user");
    } finally {
      setActionBusy(null);
    }
  };

  if (!isOwner) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
        <Shield size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">Only group owner can access moderation panel</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Moderation Panel</h3>
          <p className="text-sm text-gray-500">Manage user strikes, roles, and violations</p>
        </div>
        <button onClick={() => { fetchViolations(); fetchGroupMembers(); }} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 rounded-xl hover:bg-gray-200 transition">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {violations?.settings && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800 mb-2">Active Moderation Settings</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div><span className="text-amber-600">Warnings before ban:</span><span className="ml-2 font-bold">{violations.settings.moderation.warningsBeforeBan}</span></div>
            <div><span className="text-amber-600">Mute duration:</span><span className="ml-2 font-bold">{violations.settings.moderation.muteDurationMinutes} min</span></div>
            <div><span className="text-amber-600">Temp ban duration:</span><span className="ml-2 font-bold">{violations.settings.moderation.tempBanDurationHours} hours</span></div>
            <div><span className="text-amber-600">Strike expiry:</span><span className="ml-2 font-bold">{violations.settings.moderation.strikeExpiryDays} days</span></div>
          </div>
        </div>
      )}

      {/* Member Management */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2"><UserCog size={16} /> Member Management</h4>
        </div>
        <div className="divide-y divide-gray-100">
          {groupMembers.map((member) => {
            const userId = member.user?._id || member.user;
            const isCreator = member.user?._id === violations?.user?._id;
            return (
              <div key={member._id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {member.user?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member.user?.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {member.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700"><Shield size={10} /> Admin</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Member</span>
                      )}
                    </div>
                  </div>
                </div>
                {!isCreator && (
                  <div className="flex gap-2">
                    {member.role === "member" ? (
                      <button onClick={() => handlePromoteToAdmin(userId, member.user?.name)} disabled={actionBusy === `promote_${userId}`} className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition flex items-center gap-1">
                        {actionBusy === `promote_${userId}` ? <Loader2 size={12} className="animate-spin" /> : <UserCog size={12} />} Promote to Admin
                      </button>
                    ) : (
                      <button onClick={() => handleDemoteToMember(userId, member.user?.name)} disabled={actionBusy === `demote_${userId}`} className="px-3 py-1.5 text-xs bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition flex items-center gap-1">
                        {actionBusy === `demote_${userId}` ? <Loader2 size={12} className="animate-spin" /> : <UserMinus size={12} />} Demote to Member
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Violations List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2"><AlertTriangle size={16} /> Violations & Strikes</h4>
        </div>
        {violations?.violations.length === 0 ? (
          <div className="text-center py-12"><CheckCircle size={48} className="mx-auto text-green-300 mb-3" /><p className="text-gray-500">No violations found. Clean group!</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {violations?.violations.map((violation) => (
              <div key={violation.user._id} className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      {violation.user.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{violation.user.name}</p>
                      <p className="text-xs text-gray-400">{violation.user.email}</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedUser(violation.user); setShowWarningModal(true); }} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition flex items-center gap-1">
                    <AlertTriangle size={12} /> Moderate
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {violation.warningCount > 0 && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700"><AlertTriangle size={12} /> {violation.warningCount} Warning{violation.warningCount !== 1 ? "s" : ""}</span>}
                  {violation.muteCount > 0 && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700"><Volume2 size={12} /> {violation.muteCount} Mute{violation.muteCount !== 1 ? "s" : ""}</span>}
                  {violation.banCount > 0 && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-700"><Ban size={12} /> {violation.banCount} Ban{violation.banCount !== 1 ? "s" : ""}</span>}
                  {violation.profanityCount > 0 && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">💬 {violation.profanityCount} profanity attempt{violation.profanityCount !== 1 ? "s" : ""}</span>}
                </div>

                {violation.strikes.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-2">Recent strikes:</p>
                    <div className="space-y-2">
                      {violation.strikes.slice(0, 3).map((strike) => (
                        <div key={strike._id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                          <div>
                            <span className={`font-medium ${strike.type === "warning" ? "text-amber-600" : strike.type === "temporary_mute" ? "text-orange-600" : "text-red-600"}`}>
                              {strike.type.replace("_", " ").toUpperCase()}
                            </span>
                            <p className="text-gray-500 text-xs mt-0.5">{strike.reason}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-400 text-xs">{new Date(strike.createdAt).toLocaleDateString()}</span>
                            <button onClick={() => handleRemoveStrike(strike._id)} disabled={actionBusy === `remove_${strike._id}`} className="text-gray-400 hover:text-green-600 transition" title="Remove strike">
                              {actionBusy === `remove_${strike._id}` ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={14} />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedUser && (
        <WarningModal isOpen={showWarningModal} onClose={() => { setShowWarningModal(false); setSelectedUser(null); }} groupId={groupId} userId={selectedUser._id} userName={selectedUser.name} onSuccess={() => { fetchViolations(); if (onSettingsChange) onSettingsChange(); }} />
      )}
    </div>
  );
};

export default StrikesPanel;