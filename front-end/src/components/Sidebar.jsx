import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaCalendar,
  FaRocket,
  FaSignOutAlt
} from "react-icons/fa";

import TimeFlow from "../styles/TimeFlow.png";
import profile from "../styles/profile.png";
import "../styles/dashboard.css"; 

const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="sbsDiv sidebar">
      <div className="profile-container">
        <div className="logo-container">
          <img className="logo-img" src={TimeFlow} alt="TimeFlow Logo" />
        </div>
        <img className="profile-img" src={profile} alt="Profile" />
        <p style={{ textAlign: "center", fontWeight: "bold", marginTop: "10px" }}>
          Welcome, {user.username}!
        </p>
      </div>

      <hr className="dashboardhorizontal-seperator" />

      <button className="nav-btn" onClick={() => navigate("/dashboard")}>
        <FaHome /> Home
      </button>

      <button className="nav-btn" onClick={() => navigate("/timesheet/list")}>
        <FaCalendar /> Timesheets
      </button>

      {user.role === "manager" && (
        <button className="nav-btn" onClick={() => navigate("/performance/managers")}>
          <FaRocket /> Performance
        </button>
      )}

      {user.role === "employee" && (
        <button className="nav-btn" onClick={() => navigate("/performance/employees")}>
          <FaRocket /> Performance
        </button>
      )}

      <button className="nav-btn" onClick={onLogout}>
        <FaSignOutAlt /> Logout
      </button>
    </div>
  );
};

export default Sidebar;
