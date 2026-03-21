import { useState } from "react";
import API from "../api";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, GraduationCap, ShieldCheck } from "lucide-react";

export default function SignIn() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/auth/login", form);
      alert("Login successful!");
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Left Side: Branding & Visual (Consistent with Register) */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-700 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-full h-full opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <circle cx="100" cy="100" r="80" fill="white" />
          </svg>
        </div>
        
        <div className="relative z-10 max-w-md text-white text-center lg:text-left">
          <div className="flex items-center gap-3 mb-8 justify-center lg:justify-start">
            <div className="bg-white p-2 rounded-lg shadow-xl">
              <GraduationCap className="text-indigo-700 w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Campus Portal</h1>
          </div>
          <h2 className="text-5xl font-extrabold mb-6 leading-tight">
            Welcome Back, Scholar.
          </h2>
          <p className="text-indigo-100 text-lg mb-8">
            Log in to pick up right where you left off. Your grades, schedules, and community await.
          </p>
          
          <div className="bg-indigo-600/40 border border-indigo-400/30 p-4 rounded-xl flex items-start gap-3">
            <ShieldCheck className="text-indigo-200 w-6 h-6 mt-1 flex-shrink-0" />
            <p className="text-sm text-indigo-100">
              Your connection is secure and encrypted. Always ensure you are on the official university domain.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-10 lg:hidden flex items-center gap-2">
             <GraduationCap className="text-indigo-600 w-6 h-6" />
             <span className="font-bold text-xl text-slate-900 tracking-tight">Campus Portal</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Sign In</h2>
            <p className="text-slate-500 text-base">Enter your details to access your dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Address */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">University Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <Link to="/forgot-password" size="sm" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
            </div>

            {/* Remember Me Toggle (Optional UI addition) */}
            <div className="flex items-center">
              <input 
                id="remember" 
                type="checkbox" 
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" 
              />
              <label htmlFor="remember" className="ml-2 text-sm text-slate-600">
                Keep me logged in
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center group"
            >
              Log In to Portal
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-600 text-sm">
              New to our University?{" "}
              <Link to="/register" className="text-indigo-600 font-bold hover:text-indigo-700">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}