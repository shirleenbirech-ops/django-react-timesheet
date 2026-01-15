import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaChartBar,
  FaClock,
  FaHistory,
  FaSignOutAlt,
  FaUserTie,
  FaHome,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaCalendarAlt,
  FaFileAlt
} from "react-icons/fa";

import "../styles/dashboard.css";
import TimeFlow from "../styles/TimeFlow.png";
import profile from "../styles/profile.png";

const API_LEAVE_SNAPSHOT = "http://localhost:8000/api/leave/get_leave_snapshot";
const API_LOGGED_IN_USER = "http://localhost:8000/api/auth/loggedinuser";

const LeaveDashboard = () => {
  const navigate = useNavigate();

  const [snapshot, setSnapshot] = useState({
    remaining_days: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  const [user, setUser] = useState({ username: "", role: "" });

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch user info from secure endpoint
    const fetchUser = async () => {
      try {
        const res = await axios.get(API_LOGGED_IN_USER, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUser({ username: res.data.username, role: res.data.role });
      } catch (err) {
        console.error("Failed to fetch user info:", err);
        navigate("/login");
      }
    };

    const fetchSnapshot = async () => {
      try {
        const res = await axios.get(API_LEAVE_SNAPSHOT, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setSnapshot(res.data);
      } catch (err) {
        console.error("Error fetching leave snapshot:", err);
      }
    };

    fetchUser();
    fetchSnapshot();
  }, [navigate]);

  return (
    <div className="screenDiv">
      {/* Sidebar */}
      <div className="sbsDiv sidebar">
        <div className="logo-container">
          <img src={TimeFlow} alt="TimeFlow Logo" className="logo-img" />
        </div>

        <div className="profile-container">
          <img className="profile-img" src={profile} alt="Profile" />
          <h2 style={{ textAlign: "center", textTransform: "uppercase" }}>{user.username}</h2>
          <p style={{ textAlign: "center", fontWeight: "bold", marginTop: "10px" }}>
            Welcome, {user.username}!
          </p>
        </div>

        <hr className="dashboardhorizontal-seperator" />

        <button className="nav-btn" onClick={() => navigate("/dashboard")}>
          <FaHome /> Dashboard
        </button>
        <button className="nav-btn" onClick={() => navigate("/performance/employees")}>
          <FaUserTie /> Performance
        </button>
        <button className="nav-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="sbsDiv main-content">
        <h2 className="section-title" style={{ marginTop: "10px", marginBottom: "20px" }}>
          Leave & Absence Tracking
        </h2>

        {/* Snapshots */}
        <div className="snapshot-row">
          <div className="tile small-tile">
            <h3><FaCalendarAlt className="neutral-icon" /> Remaining Days</h3>
            <p>{snapshot.remaining_days}</p>
          </div>
          <div className="tile small-tile">
            <h3><FaHourglassHalf className="yellow-icon" /> Pending</h3>
            <p>{snapshot.pending}</p>
          </div>
          <div className="tile small-tile">
            <h3><FaCheckCircle className="green-icon" /> Approved</h3>
            <p>{snapshot.approved}</p>
          </div>
          <div className="tile small-tile">
            <h3><FaTimesCircle className="red-icon" /> Rejected</h3>
            <p>{snapshot.rejected}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="summary">
          <h2 className="full_width" style={{ textAlign: "center" }}>
            Quick Actions
          </h2>

          <div className="quick-actions-row">
            <div className="tile action-card" onClick={() => navigate("/leave/request")}>
              <FaClock className="action-icon" />
              <h3>Request Leave</h3>
            </div>
            <div className="tile action-card" onClick={() => navigate("/leave/track")}>
              <FaChartBar className="action-icon" />
              <h3>Track Requests</h3>
            </div>
            <div className="tile action-card" onClick={() => navigate("/timesheet/list")}>
              <FaFileAlt className="action-icon" />
              <h3>My Timesheets</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveDashboard;
