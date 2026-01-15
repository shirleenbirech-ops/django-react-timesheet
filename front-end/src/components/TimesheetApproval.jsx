import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/approve.css";
import profile from "../styles/profile.png";
import TimeFlow from "../styles/TimeFlow.png";
import { toast } from "react-toastify";

const API_BASE_URL = "http://localhost:8000/api/timesheet/manager";
const API_HISTORY_COMPARE = "http://localhost:8000/api/timesheet/manager";


const TimesheetApproval = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [timesheet, setTimesheet] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [modalType, setModalType] = useState(""); // approve / reject
  const [comparisonData, setComparisonData] = useState([]);
  const [user, setUser] = useState({ first_name: "", role: "" });
  const [selectedProject, setSelectedProject] = useState("All");



  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    const fetchTimesheet = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTimesheet(res.data.data);
      } catch (error) {
        console.error("Error fetching timesheet:", error);
        navigate("/login");
      }
    };
   

    const fetchComparison = async () => {
      const token = localStorage.getItem("token"); // <-- ensure token is available
      try {
        const res = await axios.get(`${API_HISTORY_COMPARE}/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Comparison API response:", res.data); // optional debug
        setComparisonData(res.data.history || []);
      } catch (error) {
        console.warn("Could not fetch comparison data:", error.response?.data || error.message);
      }
    };
    

   

    fetchTimesheet();
    fetchComparison();
  }, [id, navigate]);
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
  


  const getProductivityLabel = (hours) => {
    if (hours >= 40) return "📈 Productive";
    if (hours >= 20) return "⚖️ Moderate";
    return "📉 Low Activity";
  };

  const handleApprove = async () => {
    console.log("Approve clicked"); 
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `${API_BASE_URL}/${id}/approve`,
        { feedback: feedbackNotes },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Timesheet approved!");
      navigate("/timesheet/history");
    } catch (error) {
      toast.error("Error approving timesheet.");
    }
  };

  const handleReject = async () => {
    console.log("Reject clicked"); 
    if (!rejectionReason.trim()) return toast.error("Please enter a rejection reason.");

    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `${API_BASE_URL}/${id}/reject`,
        {
          rejection_reason: rejectionReason,
          feedback: feedbackNotes,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      localStorage.setItem("is_editing_rejected", "true");
      localStorage.setItem("edit_timesheet_id", id);
      localStorage.setItem("edit_timesheet_data", JSON.stringify(timesheet)); 
      toast.success("Timesheet rejected.");
      navigate("/timesheet/history");
    } catch (error) {
      toast.error("Error rejecting timesheet.");
    }
  };

  if (!timesheet) return <p>Loading timesheet...</p>;

  const totalDaysWorked = timesheet.daily_logs.filter(
    (log) => log.start_time && log.end_time
  ).length;

  const allProjects = [
    ...new Set(timesheet.daily_logs.flatMap(log =>
      log.task_entries.map(entry => entry.task.project_name)
    ))
  ];
  

  return (
    <div className="timesheetapproval">
      <div className="screenDiv">
        <div className="sidebar">
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
          <button className="nav-btn" onClick={() => navigate("/dashboard")}> Dashboard</button>
          <button className="nav-btn" onClick={() => navigate("/timesheet/list")}>My Timesheets</button>
          <button className="nav-btn" onClick={() => navigate("/timesheet/create")}>New Timesheet</button>
          <button className="nav-btn logout" onClick={() => navigate("/login")}>Logout</button>
        </div>
  
        <div className="main-content">
          <div className="timesheetapproval-container">
            <h2>🧾 Timesheet Approval</h2>
  
            <div className="timesheet-summary">
              <p><strong>Week Start Date:</strong> {timesheet.week_start_date}</p>
              <p><strong>Submitted by:</strong> {timesheet.user?.first_name || "N/A"}</p>
              <p><strong>Total Hours:</strong> {timesheet.total_hours}h</p>
              <p><strong>Status:</strong> <span className={`status ${timesheet.approval_status.toLowerCase()}`}>{timesheet.approval_status}</span></p>
              <p><strong>Days Worked:</strong> {totalDaysWorked} / 5</p>
              <p><strong>Productivity:</strong> {getProductivityLabel(timesheet.total_hours)}</p>
            </div>
  
            <h3>🗓️ Daily Logs</h3>
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {timesheet.daily_logs
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map((log, index) => {
                    const total = log.task_entries.reduce((sum, e) => sum + e.duration, 0);
                    return (
                      <tr key={index}>
                        <td>{log.date}</td>
                        <td>{log.start_time || "N/A"}</td>
                        <td>{log.end_time || "N/A"}</td>
                        <td>{total}h</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            <div className="filters" style={{ margin: "20px 0" }}>
              <label htmlFor="projectFilter">Filter by Project:</label>
              <select
                id="projectFilter"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="All">All</option>
                {allProjects.map((project, idx) => (
                  <option key={idx} value={project}>{project}</option>
                ))}
              </select>
            </div>


            <h3>🧠 Task Details</h3>
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Task Name</th>
                  <th>Project</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                  {timesheet.daily_logs.flatMap((log) =>
                    log.task_entries
                      .filter(entry =>
                        selectedProject === "All" || entry.task.project_name === selectedProject
                      )
                      .map((entry, i) => (
                        <tr key={`${log.date}-${i}`}>
                          <td>{log.date}</td>
                          <td>🛠 {entry.task.name}</td>
                          <td>📁 {entry.task.project_name}</td>
                          <td>⏱ {entry.duration.toFixed(2)}h</td>
                        </tr>
                      ))
                  )}
                </tbody>

              
            </table>

  
           
  
            {timesheet.approval_status === "Pending" && (
              <div className="action-buttons">
                <label htmlFor="feedback">Manager Notes (optional):</label>
                <textarea
                  id="feedback"
                  placeholder="Provide feedback or comments..."
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                />
  
                <button className="approve-btn" onClick={() => setModalType("approve")}>✅ Approve</button>
                <button className="reject-btn" onClick={() => setModalType("reject")}>❌ Reject</button>
              </div>
            )}
           
            <button className="cancel-btn" onClick={() => navigate("/timesheet/history")}>⬅ Back</button>
  
            {/* Approve Modal */}
            {modalType === "approve" && (
              <div className="modal">
                <div className="modal-content">
                  <h3>Confirm Approval</h3>
                  <p>Are you sure you want to approve this timesheet?</p>
                  <button className="approve-btn" onClick={handleApprove}>Approve</button>
                  <button className="cancel-btn" onClick={() => setModalType("")}>Cancel</button>
                </div>
              </div>
            )}
  
            {/* Reject Modal */}
            {modalType === "reject" && (
              <div className="modal">
                <div className="modal-content">
                  <h3>Reject Timesheet</h3>
                  <textarea
                    placeholder="Enter reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                  <button className="reject-btn" onClick={handleReject}>Submit Rejection</button>
                  <button className="cancel-btn" onClick={() => setModalType("")}>Cancel</button>
                </div>
              </div>
            )}
  
            {comparisonData.length > 0 && (
              <div style={{ marginTop: "30px" }}>
                <h3>📊 Weekly Comparison</h3>
                <ul>
                  {comparisonData.map((week, index) => (
                    <li key={index}>
                      <strong>{week.week_start}</strong>: {week.total_hours}h - {getProductivityLabel(week.total_hours)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  


};

export default TimesheetApproval;
