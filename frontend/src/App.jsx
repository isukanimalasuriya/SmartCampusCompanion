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
import Profile from "./components/Profile";
<<<<<<< HEAD
import SupportTicketForm from "./components/SupportTicketForm";
=======
import Community from "./components/community/Community";
import GroupDetail from "./components/community/GroupDetail";
>>>>>>> kamindu

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="studyareas" element={<StudyAreas />}></Route>
<<<<<<< HEAD
      <Route path="/dashboard/profile" element={<Profile />} />
      <Route path="/support-ticket" element={<SupportTicketForm />} />
=======
      <Route path="/profile" element={<Profile />} />
      <Route path="/community" element={<Community />} />
      <Route path="/community/:id" element={<GroupDetail />} />
>>>>>>> kamindu

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<div>Not Found</div>} />
    </Routes>
  );
}

export default App;
