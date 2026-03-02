import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import "./index.css";
import Navbar from "./components/Navbar";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import StudyAreas from "./components/StudyAreas";

function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />}></Route>
      <Route path="studyareas" element={<StudyAreas />}></Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<div>Not Found</div>} />
    </Routes>
  );
}

export default App;
