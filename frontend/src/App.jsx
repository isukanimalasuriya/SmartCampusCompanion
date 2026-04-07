import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import "./index.css";
import Navbar from "./components/Navbar";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import StudyAreas from "./components/StudyAreas";
import SkillExchange from "./components/SkillExchange/SkillExchange";
import Profile from "./components/Profile";

import SupportTicketForm from "./components/SupportTicketForm";
import MyTickets from "./components/MyTickets";
import Adminticketdashboard from "./components/Adminticketdashboard";

import Community from "./components/community/Community";
import GroupDetail from "./components/community/GroupDetail";
import ProtectedRoute from "./components/Routes/ProtectedRoute";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="studyareas" element={<StudyAreas />}></Route>
      <Route path="skill-exchange" element={<SkillExchange />}></Route>

      {/* <Route path="/dashboard/profile" element={<Profile />} /> */}
      <Route path="/support-ticket" element={<SupportTicketForm />} />
      <Route path="/my-tickets" element={<MyTickets />} />
      <Route path="/admin/tickets" element={<Adminticketdashboard />} />

      <Route path="profile" element={<Profile />} />
      <Route path="/community" element={<Community />} />
      <Route path="/community/:id" element={<GroupDetail />} />

      {/* Admin-protected route */}
      <Route
        path="/admin/tickets"
        element={
          <ProtectedRoute adminOnly={true}>
            <Adminticketdashboard />
          </ProtectedRoute>
        }
      />


      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<div>Not Found</div>} />
    </Routes>
  );
}

export default App;
