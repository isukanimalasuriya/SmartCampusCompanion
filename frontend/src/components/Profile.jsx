import { useEffect, useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { User, Mail, IdCard, GraduationCap, LogOut } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


export default function Profile() {
  const [student, setStudent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("❌ Please login first");
        navigate("/");
        return;
      }

      try {
        const res = await API.get("/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudent(res.data.user || res.data);
      } catch (err) {
        toast.error("Failed to fetch profile");
        navigate("/");
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    setTimeout(() => navigate("/"), 1000);
  };

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <GraduationCap className="text-indigo-600 w-8 h-8" />
          <h1 className="text-2xl font-bold text-slate-900">Student Profile</h1>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-indigo-600" />
            <span className="font-medium">{student.name}</span>
          </div>

          {/* Student ID */}
          <div className="flex items-center gap-3">
            <IdCard className="w-6 h-6 text-indigo-600" />
            <span className="font-medium">{student.studentId}</span>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-indigo-600" />
            <span className="font-medium">{student.email}</span>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="mt-8 w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-bold transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      {/* Toast notifications */}
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </div>
  );
}