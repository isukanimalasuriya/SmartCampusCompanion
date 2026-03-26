import React, { useState } from "react";
import { X, Calendar, Clock, User } from "lucide-react";
import { useUser } from "../../context/UserContext";

const RequestHelpModal = ({ isOpen, onClose, skill, onSubmit }) => {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    problemDescription: ""
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen || !skill) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/skills/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: skill._id,
          ...formData,
          requesterName: user.name,
          requesterId: user.id,
          preferredTime: skill.availability // Use expert's time
        })
      });
      const data = await response.json();
      if (response.ok) {
        onSubmit(data);
        setFormData({ problemDescription: "" });
      }
    } catch (error) {
      console.error("Error requesting help:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Request Help</h2>
            <p className="text-xs text-indigo-600 font-medium">Topic: {skill.skillName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Problem Description</label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none transition resize-none"
              placeholder="Tell us what you need help with..."
              value={formData.problemDescription}
              onChange={(e) => setFormData({...formData, problemDescription: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
              <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Expert Availability</label>
              <div className="flex items-center gap-2 text-indigo-900 font-semibold text-xs">
                <Clock size={14} className="text-indigo-500" />
                <span>
                  {new Date(skill.availability).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(skill.availability).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Requesting As</label>
              <div className="flex items-center gap-2 text-gray-700 font-bold text-xs">
                <div className="h-5 w-5 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center text-[8px]">
                  {user.avatar}
                </div>
                <span>{user.name}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-50"
            >
              {loading ? "Matching..." : "Find Peers"}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestHelpModal;
