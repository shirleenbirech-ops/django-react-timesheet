import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LeaveTrackingDashboard.css";
import axios from "axios";
import { FaChartBar, FaClock, FaHistory } from "react-icons/fa";

const LeaveTrackingDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="leave-tracking-container">
      <header className="leave-tracking-header">
        <h4 className="section-label">Section 3</h4>
        <h2 className="section-title">Leave and Absence Tracking</h2>
      </header>

      <div className="quick-actions-container">
        <h3 className="quick-actions-title">Quick Actions</h3>
        <div className="quick-actions">
          <div className="action-card" onClick={() => navigate("/request-leave")}> 
            <FaClock className="action-icon" />
            <p>Request Leave</p>
          </div>
          <div className="action-card" onClick={() => navigate("/track-leave-requests")}> 
            <FaChartBar className="action-icon" />
            <p>Track Leave Requests</p>
          </div>
          <div className="action-card" onClick={() => navigate("/view-request-history")}> 
            <FaHistory className="action-icon" />
            <p>View Request History</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveTrackingDashboard;
