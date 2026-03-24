import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, LogIn, Search, Filter, ChevronRight } from "lucide-react";
import axios from "axios";
import GroupCard from "./GroupCard";
import CreateGroupModal from "./CreateGroupModal";
import JoinGroupModal from "./JoinGroupModal";

const Community = () => {
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [activeTab, setActiveTab] = useState("my");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      
      // Fetch user's groups
      const myGroupsRes = await axios.get("http://localhost:5000/api/groups/my-groups", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyGroups(myGroupsRes.data.data);

      // Fetch all public groups
      const publicRes = await axios.get("http://localhost:5000/api/groups/public");
      setGroups(publicRes.data.data);
      
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupCreated = () => {
    fetchGroups();
    setShowCreateModal(false);
  };

  const handleGroupJoined = () => {
    fetchGroups();
    setShowJoinModal(false);
  };

  const handleGroupClick = (groupId) => {
    navigate(`/community/${groupId}`);
  };

  // Filter groups based on search
  const filteredMyGroups = myGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPublicGroups = groups.filter(group =>
    !myGroups.some(myGroup => myGroup._id === group._id) && // Exclude groups user is already in
    (group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     group.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
     group.topic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <section className="rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 md:p-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-white/80 text-sm">Connect & Collaborate</p>
            <h2 className="text-2xl md:text-3xl font-semibold mt-1">
              Study Groups
            </h2>
            <p className="text-white/80 mt-2 text-sm md:text-base max-w-2xl">
              Create or join study groups, share resources, and learn together with your peers.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-white text-indigo-700 font-medium text-sm hover:bg-white/90 transition flex items-center gap-2"
            >
              <Plus size={18} />
              Create Group
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-medium text-sm hover:bg-white/15 transition flex items-center gap-2"
            >
              <LogIn size={18} />
              Join with Code
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 border border-white/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-white/90" />
              <span className="text-sm text-white/80">Your Groups</span>
            </div>
            <span className="text-sm font-semibold">{myGroups.length}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 border border-white/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-white/90" />
              <span className="text-sm text-white/80">Public Groups</span>
            </div>
            <span className="text-sm font-semibold">{groups.length}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 border border-white/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-white/90" />
              <span className="text-sm text-white/80">Total Members</span>
            </div>
            <span className="text-sm font-semibold">
              {groups.reduce((sum, g) => sum + (g.members?.length || 1), 0)}
            </span>
          </div>
        </div>
      </section>

      {/* Search and Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* Search Bar */}
          <div className="flex items-center gap-2 flex-1 max-w-md px-4 py-2 rounded-xl border border-gray-200 bg-white shadow-sm">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full outline-none text-sm text-gray-700 placeholder:text-gray-400"
              placeholder="Search groups by name, course, or topic..."
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("my")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "my"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              My Groups ({myGroups.length})
            </button>
            <button
              onClick={() => setActiveTab("discover")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "discover"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Discover ({filteredPublicGroups.length})
            </button>
          </div>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === "my" && filteredMyGroups.length > 0 && (
            filteredMyGroups.map((group) => (
              <GroupCard
                key={group._id}
                group={group}
                onClick={() => handleGroupClick(group._id)}
                showJoinButton={false}
              />
            ))
          )}

          {activeTab === "discover" && filteredPublicGroups.length > 0 && (
            filteredPublicGroups.map((group) => (
              <GroupCard
                key={group._id}
                group={group}
                onClick={() => handleGroupClick(group._id)}
                showJoinButton={true}
                onJoin={() => handleGroupJoined()}
              />
            ))
          )}
        </div>

        {/* Empty States */}
        {activeTab === "my" && filteredMyGroups.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 font-medium">No groups yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Create your first study group or join one with an invite code
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
            >
              Create Group
            </button>
          </div>
        )}

        {activeTab === "discover" && filteredPublicGroups.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <Search size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No groups match "{searchTerm}"</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
          </div>
        )}

        {activeTab === "discover" && filteredPublicGroups.length === 0 && !searchTerm && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No public groups available</p>
            <p className="text-gray-400 text-sm mt-1">
              Be the first to create a study group!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
            >
              Create Group
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleGroupCreated}
        />
      )}

      {showJoinModal && (
        <JoinGroupModal
          onClose={() => setShowJoinModal(false)}
          onSuccess={handleGroupJoined}
        />
      )}
    </div>
  );
};

export default Community;