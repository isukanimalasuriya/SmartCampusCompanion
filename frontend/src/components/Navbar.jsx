import React from "react";
import { NavLink } from "react-router-dom";
import { Home, User, Settings } from "lucide-react";

const Navbar = () => {
  const linkClass =
    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium";

  const activeClass =
    "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg";

  const inactiveClass = "text-gray-600 hover:bg-gray-100 hover:text-indigo-600";

  return (
    <aside className="h-screen w-64 bg-white shadow-xl p-6 font-poppins flex flex-col">
      {/* Logo / Brand */}
      <div className="text-2xl font-semibold text-indigo-600 mb-10">
        Dashboard
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-3">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${linkClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <Home size={20} />
          Home
        </NavLink>

        <NavLink
          to="/studyareas"
          className={({ isActive }) =>
            `${linkClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <User size={20} />
          Study Areas
        </NavLink>

        <NavLink
          to="profile"
          className={({ isActive }) =>
            `${linkClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <User size={20} />
          Profile
        </NavLink>

        <NavLink
          to="settings"
          className={({ isActive }) =>
            `${linkClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <Settings size={20} />
          Settings
        </NavLink>
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto text-sm text-gray-400">© 2026 YourApp</div>
    </aside>
  );
};

export default Navbar;
