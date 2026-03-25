import React, { useState, useEffect } from "react";
import Navbar from "../Navbar";
import { Search, Filter, Plus, BookOpen, Clock, Globe, MapPin, Star, User, GraduationCap, LayoutDashboard, Compass, CheckCircle, AlertCircle, Bookmark } from "lucide-react";
import OfferSkillModal from "./OfferSkillModal";
import RequestHelpModal from "./RequestHelpModal";
import { SLIIT_SUBJECTS } from "../../data/sliitSubjects";

const SkillExchange = () => {
  const [activeTab, setActiveTab] = useState("explore"); // "explore" or "activity"
  const [skills, setSkills] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("All");
  const [filterSubject, setFilterSubject] = useState("All");
  const [filterLevel, setFilterLevel] = useState("All");
  
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [skillsRes, requestsRes] = await Promise.all([
        fetch("http://localhost:5000/api/skills"),
        fetch("http://localhost:5000/api/skills/requests")
      ]);
      const skillsData = await skillsRes.json();
      const requestsData = await requestsRes.json();
      setSkills(skillsData);
      setRequests(requestsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestHelp = (skill) => {
    setSelectedSkill(skill);
    setIsRequestModalOpen(true);
  };

  const handleRequestSubmit = () => {
    setIsRequestModalOpen(false);
    fetchData(); // Refresh to show the new request in Activity
    setActiveTab("activity");
  };

  const handleUpdateStatus = async (requestId, status) => {
    try {
      await fetch(`http://localhost:5000/api/skills/request/${requestId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleFeedback = async (requestId, rating) => {
    try {
      await fetch(`http://localhost:5000/api/skills/request/${requestId}/feedback`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, feedback: "Completed via Skill Exchange" })
      });
      fetchData();
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = 
      skill.skillName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.moduleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const subjectInfo = SLIIT_SUBJECTS.find(s => s.code === skill.moduleCode);
    const matchesYear = filterYear === "All" || (subjectInfo && subjectInfo.year.toString() === filterYear);
    const matchesSubject = filterSubject === "All" || skill.subject === filterSubject;
    const matchesLevel = filterLevel === "All" || skill.skillLevel === filterLevel;
    
    return matchesSearch && matchesYear && matchesSubject && matchesLevel;
  });

  return (
    <div className="flex h-screen bg-gray-50 font-poppins">
      <Navbar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">SLIIT Skill Exchange</h1>
            <nav className="flex items-center bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab("explore")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === "explore" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <Compass size={16} />
                Explore
              </button>
              <button 
                onClick={() => setActiveTab("activity")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === "activity" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <LayoutDashboard size={16} />
                My Activity
              </button>
            </nav>
          </div>
          <button 
            onClick={() => setIsOfferModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 font-semibold text-sm"
          >
            <Plus size={18} />
            Post a Skill
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeTab === "explore" ? (
            <div className="space-y-8">
              {/* Controls */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3 w-full md:w-[450px] px-4 py-3 rounded-2xl border border-gray-200 bg-white shadow-sm focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
                  <Search size={20} className="text-gray-400" />
                  <input
                    className="w-full outline-none text-sm text-gray-700 placeholder:text-gray-400 font-medium"
                    placeholder="Search modules (IT2010), subjects or skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl">
                    <Filter size={16} className="text-gray-400" />
                    <select 
                      className="text-sm font-medium text-gray-700 outline-none bg-transparent"
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                    >
                      <option value="All">All Years</option>
                      <option value="1">Year 1</option>
                      <option value="2">Year 2</option>
                      <option value="3">Year 3</option>
                      <option value="4">Year 4</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl">
                    <BookOpen size={16} className="text-gray-400" />
                    <select 
                      className="text-sm font-medium text-gray-700 outline-none bg-transparent w-[140px] truncate"
                      value={filterSubject}
                      onChange={(e) => setFilterSubject(e.target.value)}
                    >
                      <option value="All">All Subjects</option>
                      {SLIIT_SUBJECTS.filter(s => filterYear === "All" || s.year.toString() === filterYear).map(s => (
                        <option key={s.code} value={s.name}>{s.code} - {s.name}</option>
                      ))}
                    </select>
                  </div>
                  <select 
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 outline-none"
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                  >
                    <option value="All">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Skills Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  [1,2,3].map(i => (
                    <div key={i} className="h-64 bg-gray-100 rounded-3xl animate-pulse"></div>
                  ))
                ) : filteredSkills.length > 0 ? (
                  filteredSkills.map((skill) => (
                    <div key={skill._id} className="bg-white border border-gray-200 rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -z-0 opacity-50 group-hover:bg-indigo-600 group-hover:opacity-10 transition-colors"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-5">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md mb-1 w-fit">
                              {skill.moduleCode || "Gen"}
                            </span>
                            <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">
                              {skill.skillName}
                            </h3>
                            <p className="text-xs font-semibold text-gray-400 lowercase">{skill.subject}</p>
                          </div>
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                            skill.skillLevel === "Beginner" ? "bg-emerald-50 text-emerald-700" :
                            skill.skillLevel === "Intermediate" ? "bg-amber-50 text-amber-700" :
                            "bg-rose-50 text-rose-700"
                          }`}>
                            {skill.skillLevel}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2 mb-6 min-h-[40px]">
                          {skill.description || "No description provided."}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 mb-6 pt-4 border-t border-gray-50">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold">
                      <Clock size={14} />
                      <span>
                        {new Date(skill.availability).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(skill.availability).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                            <User size={14} className="text-indigo-400" />
                            <span>{skill.providerName}</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleRequestHelp(skill)}
                          className="w-full py-3.5 bg-gray-900 group-hover:bg-indigo-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-gray-200 group-hover:shadow-indigo-200 transform active:scale-95"
                        >
                          Send Request
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-gray-300">
                    <div className="flex flex-col items-center gap-3">
                      <Search size={48} className="text-gray-200" />
                      <p className="text-gray-500 font-medium">No experts found for this module yet.</p>
                      <button onClick={() => setIsOfferModalOpen(true)} className="text-indigo-600 font-bold text-sm hover:underline">
                        Be the first to offer help!
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-gray-900">Module Requests</h2>
                <p className="text-sm text-gray-500 font-medium">Manage your learning sessions and help requests</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {requests.length > 0 ? (
                  requests.map((req) => (
                    <div key={req._id} className="bg-white border border-gray-200 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-indigo-200 transition-colors group">
                      <div className="flex items-center gap-5 w-full md:w-auto">
                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${
                          req.status === "Pending" ? "bg-amber-50 text-amber-600" :
                          req.status === "Scheduled" ? "bg-indigo-50 text-indigo-600" :
                          "bg-emerald-50 text-emerald-600"
                        }`}>
                          {req.status === "Pending" ? <Clock size={28} /> : 
                           req.status === "Scheduled" ? <GraduationCap size={28} /> :
                           <CheckCircle size={28} />}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase border border-indigo-100 px-1.5 rounded bg-indigo-50/30">
                              {req.skillId?.moduleCode || "N/A"}
                            </span>
                            <span className="text-sm font-bold text-gray-900">{req.skillId?.skillName}</span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium line-clamp-1 italic max-w-sm">"{req.problemDescription}"</p>
                          <div className="flex items-center gap-3 mt-2">
                             <span className="text-[10px] flex items-center gap-1 font-bold text-gray-400">
                               <User size={10} /> {req.requesterName}
                             </span>
                             <span className="text-[10px] flex items-center gap-1 font-bold text-gray-400">
                               <Clock size={10} /> {new Date(req.preferredTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                             </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                        {req.status === "Pending" ? (
                          <>
                            <button 
                              onClick={() => handleUpdateStatus(req._id, "Scheduled")}
                              className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition"
                            >
                              Accept Request
                            </button>
                            <button className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition">
                              <AlertCircle size={20} />
                            </button>
                          </>
                        ) : req.status === "Scheduled" ? (
                          <button 
                            onClick={() => handleUpdateStatus(req._id, "Completed")}
                            className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition"
                          >
                            Mark Completed
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(star => (
                              <Star 
                                key={star} 
                                size={18} 
                                className={`${star <= (req.rating || 5) ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} 
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-300">
                    <p className="text-gray-400 font-medium">No activity yet. Explore skills to get started!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <OfferSkillModal 
        isOpen={isOfferModalOpen} 
        onClose={() => setIsOfferModalOpen(false)} 
        onSuccess={fetchData}
      />

      <RequestHelpModal 
        isOpen={isRequestModalOpen} 
        onClose={() => setIsRequestModalOpen(false)} 
        skill={selectedSkill}
        onSubmit={handleRequestSubmit}
      />
    </div>
  );
};

export default SkillExchange;
