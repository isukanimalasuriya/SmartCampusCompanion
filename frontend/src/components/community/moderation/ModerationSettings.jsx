import React, { useState, useEffect } from "react";
import { Settings, Save, Loader2, AlertTriangle,Clock } from "lucide-react";
import axios from "axios";

const API = "http://localhost:5000/api";

const ModerationSettings = ({ groupId, isOwner, onSettingsChange }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const token = localStorage.getItem("token");

  const fetchSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API}/groups/${groupId}/moderation/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(res.data.data);
    } catch (err) {
      console.error("Failed to fetch settings:", err);
      setError(err.response?.data?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      fetchSettings();
    }
  }, [groupId, isOwner]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await axios.put(
        `${API}/groups/${groupId}/moderation/settings`,
        { moderation: settings.moderation },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Settings saved successfully!");
      if (onSettingsChange) onSettingsChange();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      moderation: { ...prev.moderation, [key]: value },
    }));
  };

  if (!isOwner) return null;
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900">Moderation Settings</h3>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Changes
        </button>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-600">
          {success}
        </div>
      )}

      {/* Warning Settings */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
        <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
          <AlertTriangle size={16} />
          Warning & Ban Settings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warnings Before Automatic Ban
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.moderation.warningsBeforeBan}
              onChange={(e) => updateSetting("warningsBeforeBan", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              User gets auto-banned after this many warnings
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Strike Expiry (days)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={settings.moderation.strikeExpiryDays}
              onChange={(e) => updateSetting("strikeExpiryDays", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Strikes expire after this many days of good behavior
            </p>
          </div>
        </div>
      </div>

      {/* Duration Settings */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <Clock size={16} />
          Duration Settings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mute Duration (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="1440"
              value={settings.moderation.muteDurationMinutes}
              onChange={(e) => updateSetting("muteDurationMinutes", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Default: 60 minutes (1 hour), Max: 1440 (24 hours)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temporary Ban Duration (hours)
            </label>
            <input
              type="number"
              min="1"
              max="168"
              value={settings.moderation.tempBanDurationHours}
              onChange={(e) => updateSetting("tempBanDurationHours", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Default: 24 hours (1 day), Max: 168 (7 days)
            </p>
          </div>
        </div>
      </div>

      {/* Toggle Settings */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
        <h4 className="font-semibold text-gray-700 mb-3">Auto-Moderation</h4>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Enable Auto-Moderation</span>
              <p className="text-xs text-gray-500">Automatically detect and warn for profanity</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.moderation.autoModerationEnabled}
                onChange={(e) => updateSetting("autoModerationEnabled", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm font-medium text-gray-700">Enable Profanity Filter</span>
              <p className="text-xs text-gray-500">Block messages containing profane words</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.moderation.profanityFilterEnabled}
                onChange={(e) => updateSetting("profanityFilterEnabled", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </div>
          </label>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
        <p className="text-xs text-indigo-700">
          💡 <strong>How it works:</strong> Users receive warnings for profanity. 
          After {settings.moderation.warningsBeforeBan} warnings, they are automatically 
          banned for {settings.moderation.tempBanDurationHours} hours. 
          Strikes expire after {settings.moderation.strikeExpiryDays} days of good behavior.
        </p>
      </div>
    </div>
  );
};



export default ModerationSettings;