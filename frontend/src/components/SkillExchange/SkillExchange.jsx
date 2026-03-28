import React, { useState, useEffect, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import Navbar from "../Navbar";
import { Search, Filter, Plus, BookOpen, Clock, Globe, MapPin, Star, User, GraduationCap, LayoutDashboard, Compass, CheckCircle, AlertCircle, Bookmark, Calendar } from "lucide-react";
import OfferSkillModal from "./OfferSkillModal";
import RequestHelpModal from "./RequestHelpModal";
import { SLIIT_SUBJECTS } from "../../data/sliitSubjects";
import API from "../../api";
import { toast } from "react-toastify";
import { useUser } from "../../context/UserContext";

const SkillExchange = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("explore"); // "explore" or "activity"
  const [activityView, setActivityView] = useState("list"); // "list" or "calendar"
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [upcomingMeeting, setUpcomingMeeting] = useState(null);
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [skillsRes, requestsRes] = await Promise.all([
        API.get("/skills"),
        API.get("/skills/requests")
      ]);
      setSkills(skillsRes.data || []);
      setRequests(requestsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load skill exchange data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reminder Logic
  useEffect(() => {
    const checkMeetings = () => {
      const now = new Date();
      requests.forEach(req => {
        const isReq = req.requesterId === (user?.id || user?._id) || req.requesterName === user?.name;
        const isProv = req.skillId?.userId === (user?.id || user?._id) || req.skillId?.providerName === user?.name;
        if (!(isReq || isProv)) return;

        if (req.status === "Scheduled" || (req.skillId?.isPublic && req.status === "Pending")) {
          const meetingTime = new Date(req.preferredTime || req.skillId?.availability);
          const diffMinutes = (meetingTime - now) / (1000 * 60);
          
          if (diffMinutes > 0 && diffMinutes <= 10) {
            const meetingId = req._id;
            // Avoid duplicate toasts
            if (upcomingMeeting !== meetingId) {
              setUpcomingMeeting(meetingId);
              toast.info(
                <div className="flex flex-col gap-2">
                  <p className="font-bold">Meeting Starting Soon!</p>
                  <p className="text-xs">Your session for {req.skillId?.skillName} starts in {Math.round(diffMinutes)} mins.</p>
                  {req.skillId?.meetingLink && (
                    <a 
                      href={req.skillId.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold text-center"
                    >
                      Join Now
                    </a>
                  )}
                </div>,
                { autoClose: 10000, icon: <Clock size={16} /> }
              );
            }
          }
        }
      });
    };

    const interval = setInterval(checkMeetings, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [requests, upcomingMeeting]);

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
      await API.patch(`/skills/request/${requestId}/status`, { status });
      toast.success(`Request marked as ${status}`);
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleFeedback = async (requestId, rating) => {
    try {
      await API.patch(`/skills/request/${requestId}/feedback`, {
        rating,
        feedback: "Completed via Skill Exchange"
      });
      toast.success("Feedback submitted!");
      fetchData();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
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

  const mySkills = skills.filter(skill => skill.userId === (user?.id || user?._id) || skill.providerName === user?.name);

  const myRequests = requests.filter(req => {
    const isReq = req.requesterId === (user?.id || user?._id) || req.requesterName === user?.name;
    const isProv = req.skillId?.userId === (user?.id || user?._id) || req.skillId?.providerName === user?.name;
    return isReq || isProv;
  });

  const requestsMade = myRequests.filter(req => req.requesterId === (user?.id || user?._id) || req.requesterName === user?.name);
  const requestsReceived = myRequests.filter(req => req.skillId?.userId === (user?.id || user?._id) || req.skillId?.providerName === user?.name);

  const hasRequested = (skillId) => {
    return requests.some(req => 
      req.skillId?._id === skillId && 
      (req.requesterId === (user?.id || user?._id) || req.requesterName === user?.name)
    );
  };

  const renderMySkillCard = (skill) => {
    return (
      <div key={skill._id} className="bg-white border border-gray-200 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-indigo-200 transition-colors group">
        <div className="flex items-center gap-5 w-full md:w-auto">
          <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <Globe size={28} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold text-indigo-600 uppercase border border-indigo-100 px-1.5 rounded bg-indigo-50/30">
                {skill.moduleCode || "N/A"}
              </span>
              <span className="text-sm font-bold text-gray-900">{skill.skillName}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${skill.isPublic ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                {skill.isPublic ? "Public" : "Private"}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium line-clamp-1 italic max-w-sm">"{skill.description}"</p>
            <div className="flex flex-wrap gap-3 mt-2">
               <span className="text-[10px] flex items-center gap-1 font-bold text-gray-400">
                 <Clock size={10} /> {new Date(skill.availability).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
               </span>
            </div>
          </div>
        </div>

         <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
           {skill.meetingLink && (
             <a 
               href={skill.meetingLink}
               target="_blank"
               rel="noopener noreferrer"
               className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition flex items-center gap-2"
             >
               <Globe size={14} /> Join Meeting
             </a>
           )}
           <span className="text-xs font-bold text-gray-500 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 whitespace-nowrap">
             Active Posting
           </span>
        </div>
      </div>
    );
  };

  const renderRequestCard = (req, isProvider) => {
    return (
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
           {req.skillId?.meetingLink && (
             <a 
               href={req.skillId.meetingLink}
               target="_blank"
               rel="noopener noreferrer"
               className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition flex items-center gap-2"
             >
               <Globe size={14} /> Join Meeting
             </a>
           )}
           {req.status === "Pending" && !req.skillId?.isPublic && isProvider ? (
             <div className="flex gap-2 w-full md:w-auto">
               <button 
                 onClick={() => handleUpdateStatus(req._id, "Scheduled")}
                 className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition"
               >
                 Accept Request
               </button>
             </div>
           ) : req.status === "Pending" && !req.skillId?.isPublic && !isProvider ? (
             <span className="text-xs font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 whitespace-nowrap">
               Waiting for Approval
             </span>
           ) : req.status === "Scheduled" || (req.skillId?.isPublic && req.status === "Pending") ? (
             <button 
               onClick={() => handleUpdateStatus(req._id, "Completed")}
               className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition"
             >
               Mark Completed
             </button>
           ) : req.status === "Completed" ? (
             <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-1 whitespace-nowrap">
               <CheckCircle size={14} /> Session Completed
             </span>
           ) : null}
        </div>
      </div>
    );
  };

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
                  filteredSkills.map((skill) => {
                    const isMySkill = skill.userId === (user?.id || user?._id) || skill.providerName === user?.name;
                    return (
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
                           <div className="flex flex-col items-end gap-1">
                             <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                               skill.skillLevel === "Beginner" ? "bg-emerald-50 text-emerald-700" :
                               skill.skillLevel === "Intermediate" ? "bg-amber-50 text-amber-700" :
                               "bg-rose-50 text-rose-700"
                             }`}>
                               {skill.skillLevel}
                             </span>
                             {skill.isPublic && (
                               <span className="text-[8px] px-2 py-0.5 rounded-md font-bold uppercase bg-indigo-600 text-white shadow-sm flex items-center gap-1">
                                 <Globe size={10} /> Public
                               </span>
                             )}
                           </div>
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
                           onClick={() => isMySkill ? setActiveTab("activity") : (!hasRequested(skill._id) && handleRequestHelp(skill))}
                           disabled={!isMySkill && hasRequested(skill._id)}
                           className={`w-full py-3.5 ${
                             isMySkill ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" :
                             hasRequested(skill._id) 
                               ? "bg-emerald-600 text-white cursor-default" 
                               : (skill.isPublic ? "bg-indigo-600 text-white group-hover:opacity-90 active:scale-95" : "bg-gray-900 text-white group-hover:opacity-90 active:scale-95")
                           } font-bold rounded-2xl transition-all shadow-lg transform flex items-center justify-center gap-2`}
                         >
                           {!isMySkill && hasRequested(skill._id) && <CheckCircle size={18} />}
                           {isMySkill 
                             ? "Hosted by You" 
                             : hasRequested(skill._id) 
                               ? (skill.isPublic ? "Joined" : "Requested") 
                               : (skill.isPublic ? "Join Session" : "Send Request")}
                         </button>
                      </div>
                    </div>
                    );
                  })
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
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">My Activity</h2>
                    <p className="text-sm text-gray-500 font-medium">Manage your learning sessions and help requests</p>
                  </div>
                  <div className="flex items-center bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
                    <button 
                      onClick={() => setActivityView("list")}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${activityView === "list" ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      List View
                    </button>
                    <button 
                      onClick={() => setActivityView("calendar")}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${activityView === "calendar" ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Schedule View
                    </button>
                  </div>
                </div>
               </div>
 
              {activityView === "list" ? (
                <div className="space-y-10">
                  {/* Your Postings Section */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                       <Globe className="text-indigo-600" /> Your Active Postings
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {mySkills.length > 0 ? (
                        mySkills.map((skill) => renderMySkillCard(skill))
                      ) : (
                        <div className="py-10 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-300">
                          <p className="text-gray-400 font-medium">You haven't posted any skills yet.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hosting Section */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                       <GraduationCap className="text-indigo-600" /> Incoming Requests (Hosting)
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {requestsReceived.length > 0 ? (
                        requestsReceived.map((req) => renderRequestCard(req, true))
                      ) : (
                        <div className="py-10 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-300">
                          <p className="text-gray-400 font-medium">No one has requested your skills yet.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Requested Section */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                       <BookOpen className="text-indigo-600" /> Help You've Requested
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {requestsMade.length > 0 ? (
                        requestsMade.map((req) => renderRequestCard(req, false))
                      ) : (
                        <div className="py-10 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-300">
                           <p className="text-gray-400 font-medium">You haven't requested any help yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Functional Calendar View Implementation */
                <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="flex flex-col items-center lg:items-start">
                      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Calendar size={20} className="text-indigo-600" />
                        Learning Calendar
                      </h3>
                      <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100 shadow-inner inline-block">
                        <style>{`
                          .rdp { --rdp-accent-color: #4f46e5; --rdp-background-color: #e0e7ff; margin: 0; }
                          .rdp-day_selected { background-color: var(--rdp-accent-color) !important; color: white !important; font-weight: bold; border-radius: 12px; }
                          .rdp-day_has_meeting { position: relative; font-weight: bold; color: #4f46e5; }
                          .rdp-day_has_meeting::after { content: ''; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; background-color: #4f46e5; border-radius: 50%; }
                        `}</style>
                        <DayPicker
                          mode="single"
                          selected={selectedDay}
                          onSelect={(day) => day && setSelectedDay(day)}
                          modifiers={{
                            hasMeeting: myRequests.map(r => new Date(r.preferredTime || r.skillId?.availability))
                          }}
                          modifiersClassNames={{
                            hasMeeting: "rdp-day_has_meeting"
                          }}
                        />
                      </div>
                      
                      <div className="mt-8 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 w-full max-w-[320px]">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                            {selectedDay.getDate()}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Selected Date</p>
                            <p className="text-sm font-bold text-indigo-900">{selectedDay.toLocaleDateString([], { month: 'long', year: 'numeric' })}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900">Agenda</h3>
                        <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          {myRequests.filter(r => new Date(r.preferredTime || r.skillId?.availability).toDateString() === selectedDay.toDateString()).length} Events
                        </span>
                      </div>
                      
                      <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                        {myRequests
                          .filter(r => new Date(r.preferredTime || r.skillId?.availability).toDateString() === selectedDay.toDateString())
                          .sort((a,b) => new Date(a.preferredTime || a.skillId?.availability) - new Date(b.preferredTime || b.skillId?.availability))
                          .map((req) => (
                            <div key={req._id} className="group relative">
                              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                      <Clock size={20} />
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-gray-900 leading-tight">{req.skillId?.skillName}</h4>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] py-0.5 px-1.5 bg-indigo-100 text-indigo-700 rounded font-bold uppercase tracking-wider">
                                          {req.skillId?.moduleCode || "IT2010"}
                                        </span>
                                        <span className="text-xs font-semibold text-gray-500">
                                          {new Date(req.preferredTime || req.skillId?.availability).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {req.skillId?.meetingLink && (
                                    <a 
                                      href={req.skillId.meetingLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 hover:scale-110 transition-transform"
                                      title="Join Meeting"
                                    >
                                      <Globe size={18} />
                                    </a>
                                  )}
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="h-5 w-5 rounded-md bg-gray-100 text-gray-400 flex items-center justify-center text-[8px] font-bold">
                                      {req.requesterName?.charAt(0) || "U"}
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{req.requesterName}</span>
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    req.status === "Pending" ? "text-amber-600 bg-amber-50" :
                                    req.status === "Scheduled" ? "text-indigo-600 bg-indigo-50" :
                                    "text-emerald-600 bg-emerald-50"
                                  }`}>
                                    {req.status}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                    (req.skillId?.userId === (user?.id || user?._id) || req.skillId?.providerName === user?.name)
                                      ? "bg-indigo-100 text-indigo-700" 
                                      : "bg-teal-100 text-teal-700"
                                  }`}>
                                    {(req.skillId?.userId === (user?.id || user?._id) || req.skillId?.providerName === user?.name) ? "Hosting" : "Learning"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        }
                        
                        {myRequests.filter(r => new Date(r.preferredTime || r.skillId?.availability).toDateString() === selectedDay.toDateString()).length === 0 && (
                          <div className="py-16 text-center bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
                            <Clock size={32} className="text-gray-200 mx-auto mb-3" />
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                              No events scheduled<br/>for this day
                            </p>
                            <button 
                              onClick={() => setActiveTab("explore")}
                              className="mt-4 text-xs font-bold text-indigo-600 hover:underline"
                            >
                              Browse more skills
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
