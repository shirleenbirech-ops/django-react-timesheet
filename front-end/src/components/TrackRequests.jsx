import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "../styles/TrackRequests.css";
import TimeFlow from "../styles/TimeFlow.png";
import Sidebar from "../components/Sidebar"
import profile from "../styles/profile.png"; 

const API_LOGGED_IN_USER = "http://localhost:8000/api/auth/loggedinuser";
const API_LEAVE_TRACK = "http://localhost:8000/api/leave/track";

const TrackRequests = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [error, setError] = useState("");
  const [user, setUser] = useState({ username: "", role: "" });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
  
    if (!token) {
      navigate("/login");
      return;
    }
  
    try {
      const decoded = jwtDecode(token);
  
      fetch(API_LOGGED_IN_USER, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setUser({
            username: data.username,
            role: data.role,
          });
        })
        .catch((err) => {
          console.error("Failed to fetch user info:", err);
          navigate("/login");
        });
    } catch (error) {
      console.error("Invalid token:", error);
      navigate("/login");
    }
  
    const fetchLeaveRequests = async () => {
      try {
        const response = await axios.get(API_LEAVE_TRACK, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setLeaveRequests(response.data);
      } catch (error) {
        console.error("Error fetching leave requests:", error);
        setError("Error fetching leave requests.");
      }
    };
  
    fetchLeaveRequests();
  }, [navigate]);
  

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="track-request-page">
      {/* Sidebar */}
      <Sidebar user={user} onLogout={handleLogout}/>
      
      

      {/* Main Content */}
      <div className="track-request-page">
        <div className="main-content">
          <div className="track-requests-container">
            <h2 className="page-title">📋 Leave Request List</h2>

            {error && <p className="error-message">{error}</p>}

            <table className="leave-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Manager Comment</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.length > 0 ? (
                  leaveRequests.map((request) => (
                    <tr key={request.id} className={`row-${request.status}`}>
                      <td>
                        <span className={`leave-badge ${request.leave_type}`}>
                          {request.leave_type.charAt(0).toUpperCase() + request.leave_type.slice(1)}
                        </span>
                      </td>
                      <td>{request.start_date}</td>
                      <td>{request.end_date}</td>
                      <td>
                        <span className={`status ${request.status}`}>
                          {request.status}
                        </span>
                      </td>
                      <td>{request.manager_comment || "N/A"}</td>
                      <td>{new Date(request.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-requests">
                      You haven't made any leave requests yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackRequests;
