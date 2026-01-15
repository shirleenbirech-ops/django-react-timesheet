import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaSignOutAlt,
  FaUserTie,
  FaHome,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaCalendarAlt,
  FaFileAlt,
  FaUsers,
} from "react-icons/fa";

import "../styles/dashboard.css";
import profile from "../styles/profile.png";
import TimeFlow from "../styles/TimeFlow.png";
 

const API_MANAGER_LEAVE_SNAPSHOT = "http://localhost:8000/api/leave/get_manager_leave_snapshot";


const ManagerLeaveDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ first_name: "", role: "" });

  const [snapshot, setSnapshot] = useState({
    manager_remaining_days: 0,
    team_on_leave: 0,
    pending_requests: 0,
    on_leave_list: [],
  });
  const [showModal, setShowModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
  
      try {
        const res = await axios.get("http://localhost:8000/api/auth/loggedinuser", {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        setUser({
          first_name: res.data.first_name,
          role: res.data.role,
        });
      } catch (err) {
        console.error("Error fetching user info:", err);
        navigate("/login");
      }
    };
  
    fetchUserInfo();
  }, []);

  useEffect(() => {
    const fetchSnapshot = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await axios.get(API_MANAGER_LEAVE_SNAPSHOT, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSnapshot(res.data);
      } catch (err) {
        console.error("Error fetching manager snapshot:", err);
      }
    };

    fetchSnapshot();
  }, []);

  
  

  return (
    <div className="screenDiv">
      {/* Sidebar */}
      <div className="sbsDiv sidebar">
         <div className="profile-container">
                                    <div className="logo-container">
                                        <img className="logo-img" src={TimeFlow} alt="TimeFlow Logo"/>
                                    </div>
                                    <img className="profile-img" src={profile} alt="Profile" />
                                    
                                    <p style={{ textAlign: "center", fontWeight: "bold", marginTop: "10px" }}>
                                        Welcome, {user.first_name}!
                                    </p>
                                </div>
        <hr className="dashboardhorizontal-seperator" />
        <button className="nav-btn" onClick={() => navigate("/dashboard")}>
          <FaHome /> Dashboard
        </button>
        <button className="nav-btn" onClick={() => navigate("/performance/managers")}>
          <FaUserTie /> Performance
        </button>
        <button className="nav-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </div>

      {/* Main Content */}
      <div 
      className="sbsDiv main-content"
      style={{paddingTop: "10px" , paddingBottom: "20px"}}


      
      
      >
        <h2 className=
        "section-title"
        style={{
          marginTop: "5px",
          marginBottom: "10px",
          paddingBottom: "0px",
          lineHeight: "1.2",
          fontWeight: "bold"
        }}

        
        
        
        >Manager Leave & Team Tracking</h2>

          <div
            className="snapshot-wrapper"
            style={{
              marginTop: "0px",
              paddingTop: "5px"
            }}
          >

          <hr style={{ margin: "10px auto 20px", width: "80%" }} />
          <div className="snapshot-row">
            <div className="tile small-tile tile--neutral">
              <h3>
                <FaCalendarAlt className="neutral-icon" /> My Remaining Days
              </h3>
              <p>{snapshot.manager_remaining_days}</p>
            </div>
            <div className="tile small-tile tile--green" team-leave-title>
              <h3>
                <FaUsers className="green-icon" /> Team On Leave
              </h3>
              <p>{snapshot.team_on_leave}</p>
              {snapshot.team_on_leave > 0 && (
                <button className="team-leave-btn" onClick={() => setShowModal(!showModal)}>
                  {showModal ? "Hide List" : "View List"}
                </button>
              )}
            </div>
            <div className="tile small-tile tile--yellow">
              <h3>
                <FaHourglassHalf className="yellow-icon" /> Pending Requests
              </h3>
              <p>{snapshot.pending_requests}</p>
            </div>
          </div>
        </div>

        {/* Modal for team on leave */}
        {showModal && (
          <div className="leave-modal">
            <h3>Team Currently on Leave</h3>
            <ul>
              {snapshot.on_leave_list.map((entry, index) => (
                <li key={index}>
                  <strong>{entry.employee}</strong> — {entry.start_date} to {entry.end_date}
                  <br />
                  <em>Reason:</em> {entry.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quick Actions */}
        <div className="summary">
          <h2 className="full_width" style={{ textAlign: "center" }}>
            Quick Actions
          </h2>

          <div className="quick-actions-row">
            <div className="tile action-card" onClick={() => navigate("/leave/manage")}>
              <FaHourglassHalf className="action-icon" />
              <h3>Manage Requests</h3>
            </div>
            <div className="tile action-card" onClick={() => navigate("/timesheet/list")}>
              <FaFileAlt className="action-icon" />
              <h3>View Timesheets</h3>
            </div>
            <div className="tile action-card" onClick={() => navigate("/timesheet/history")}>
              <FaCheckCircle className="action-icon" />
              <h3>Approve Timesheets</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerLeaveDashboard;
