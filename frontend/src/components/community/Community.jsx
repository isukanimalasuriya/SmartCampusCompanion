// frontend/src/components/community/Community.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, Plus, LogIn, Search, Globe, Lock, Loader2, 
  BookOpen, TrendingUp, Sparkles, RefreshCw
} from "lucide-react";
import axios from "axios";

import GroupCard from "./GroupCard";
import CreateGroupModal from "./CreateGroupModal";
import JoinGroupModal from "./JoinGroupModal";
import Navbar from "../Navbar";

const Community = () => {
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [activeTab, setActiveTab] = useState("my");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchGroups = useCallback(async () => {
    if (!token) {
      navigate("/");
      return;
    }
    setLoading(true);
    setFetchError(null);
    try {
      const [myRes, pubRes] = await Promise.all([
        axios.get("http://localhost:5000/api/groups/my-groups", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/groups/public"),
      ]);
      setMyGroups(myRes.data.data || []);
      setGroups(pubRes.data.data || []);
    } catch (err) {
      console.error("Error fetching groups:", err);
      const msg = err.response?.status === 401
        ? "Session expired. Please sign in again."
        : (err.response?.data?.message || "Failed to load groups");
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleGroupClick = (groupId) => navigate(`/community/${groupId}`);

  // Filter groups based on search
  const filterGroups = (groupList) => {
    if (!searchTerm.trim()) return groupList;
    const term = searchTerm.toLowerCase();
    return groupList.filter((g) =>
      [g.name, g.course, g.topic, g.description].some((f) =>
        f?.toLowerCase().includes(term)
      )
    );
  };

  const filteredMyGroups = filterGroups(myGroups);
  const filteredDiscoverGroups = filterGroups(
    groups.filter((g) => !myGroups.some((mg) => mg._id === g._id))
  );

  // Stats
  const totalMyGroups = myGroups.length;
  const totalPublicGroups = groups.length;
  const totalPrivateGroupsUserIsIn = myGroups.filter((g) => !g.isPublic).length;

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 font-poppins">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex h-screen bg-gray-50 font-poppins">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
          <p className="text-gray-600 font-medium">Sign in to access Study Groups.</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-poppins">
      <Navbar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Study Groups</h1>
            <nav className="flex items-center bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("my")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  activeTab === "my" 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Users size={16} /> My Groups ({filteredMyGroups.length})
              </button>
              <button
                onClick={() => setActiveTab("discover")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  activeTab === "discover" 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Globe size={16} /> Discover ({filteredDiscoverGroups.length})
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "my" && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 font-semibold text-sm"
              >
                <Plus size={18} /> Create Group
              </button>
            )}
            {activeTab === "discover" && (
              <button
                onClick={() => setShowJoinModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition shadow-lg shadow-purple-100 font-semibold text-sm"
              >
                <LogIn size={18} /> Join with Code
              </button>
            )}
          </div>
        </header>

        {/* Error banner */}
        {fetchError && (
          <div className="shrink-0 mx-6 mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-amber-900">{fetchError}</span>
            <button
              type="button"
              onClick={() => fetchGroups()}
              className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all hover:border-indigo-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Your Groups</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{totalMyGroups}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Users size={24} />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <BookOpen size={10} /> Active collaborations
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all hover:border-indigo-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Public Groups</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{totalPublicGroups}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Globe size={24} />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <TrendingUp size={10} /> Available to join
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all hover:border-indigo-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Private Groups</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{totalPrivateGroupsUserIsIn}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Lock size={24} />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Sparkles size={10} /> Invite-only access
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3 w-full sm:w-[400px] px-4 py-3 rounded-2xl border border-gray-200 bg-white shadow-sm focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
                <Search size={20} className="text-gray-400" />
                <input
                  className="w-full outline-none text-sm text-gray-700 placeholder:text-gray-400 font-medium"
                  placeholder="Search groups by name, course, or topic..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab("my")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeTab === "my" 
                        ? "bg-white text-indigo-600 shadow-sm" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    My Groups
                  </button>
                  <button
                    onClick={() => setActiveTab("discover")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeTab === "discover" 
                        ? "bg-white text-indigo-600 shadow-sm" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Discover
                  </button>
                </div>
              </div>
            </div>

            {/* Groups Grid */}
            {activeTab === "my" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {filteredMyGroups.length > 0 ? (
                  filteredMyGroups.map((group) => (
                    <GroupCard
                      key={group._id}
                      group={group}
                      onClick={() => handleGroupClick(group._id)}
                      showJoinButton={false}
                      variant="myGroup"
                    />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-gray-300">
                    <Users size={48} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      {searchTerm ? `No groups match "${searchTerm}"` : "You haven't joined any groups yet"}
                    </p>
                    <button
                      onClick={() => setActiveTab("discover")}
                      className="text-indigo-600 font-bold text-sm hover:underline mt-2"
                    >
                      Browse public groups to join
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "discover" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {filteredDiscoverGroups.length > 0 ? (
                  filteredDiscoverGroups.map((group) => (
                    <GroupCard
                      key={group._id}
                      group={group}
                      onClick={() => handleGroupClick(group._id)}
                      showJoinButton={true}
                      onJoinSuccess={fetchGroups}
                      variant="discover"
                    />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-gray-300">
                    <Search size={48} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      {searchTerm 
                        ? `No groups match "${searchTerm}"` 
                        : "No public groups available to join"}
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="text-purple-600 font-bold text-sm hover:underline mt-2"
                    >
                      Create your own group!
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchGroups();
            setShowCreateModal(false);
          }}
        />
      )}
      {showJoinModal && (
        <JoinGroupModal
          onClose={() => setShowJoinModal(false)}
          onSuccess={() => {
            fetchGroups();
            setShowJoinModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Community;