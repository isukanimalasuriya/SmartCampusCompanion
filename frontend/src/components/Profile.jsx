import React from "react";
import { useUser } from "../context/UserContext";
import { LogOut, ShieldCheck, User, Mail, IdCard, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, loading } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  if (loading) {
    return <p className="text-center mt-20">Loading profile…</p>;
  }

  if (!user) {
    return <p className="text-center mt-20">No user found.</p>;
  }

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Top banner */}
        <div className="h-28 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 relative"></div>

        <div className="px-8 pb-8">
          <div className="flex items-end justify-between -mt-12 mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-white">
                {getInitials(user.name)}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full" />
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 hover:border-red-300 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span className="text-sm text-indigo-600 font-medium">Verified Student</span>
            </div>
          </div>

          <div className="border-t border-slate-100 mb-6" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoCard icon={<User className="w-4 h-4" />} label="Full Name" value={user.name} color="indigo" />
            <InfoCard icon={<IdCard className="w-4 h-4" />} label="Student ID" value={user.studentId || "N/A"} color="violet" />
            <InfoCard icon={<Mail className="w-4 h-4" />} label="Email Address" value={user.email} color="sky" />
            <InfoCard icon={<GraduationCap className="w-4 h-4" />} label="Role" value="Undergraduate" color="purple" />
          </div>
        </div>
      </div>
    </div>
  );
}

const colorMap = {
  indigo: { wrap: "bg-indigo-50 text-indigo-600", label: "text-indigo-400" },
  violet: { wrap: "bg-violet-50 text-violet-600", label: "text-violet-400" },
  sky: { wrap: "bg-sky-50 text-sky-600", label: "text-sky-400" },
  purple: { wrap: "bg-purple-50 text-purple-600", label: "text-purple-400" },
};

function InfoCard({ icon, label, value, color }) {
  const c = colorMap[color];
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all duration-200">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.wrap}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${c.label}`}>{label}</p>
        <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}