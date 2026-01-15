import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/timesheet.css";
import profile from "../styles/profile.png"; 
import TimeFlow from "../styles/TimeFlow.png";
import { jwtDecode } from "jwt-decode";
import Sidebar from "../components/Sidebar"
import { FaFileAlt, FaPlusCircle, FaEye, FaSignOutAlt, FaClipboardCheck, FaUserShield, FaRocket, FaHome, FaCalendar, FaPlus, FaBars } from "react-icons/fa";



const API_EMPLOYEE_TIMESHEETS = "http://localhost:8000/api/timesheet/list";
const API_MANAGER_TIMESHEETS = "http://localhost:8000/api/timesheet/all";
const API_GET_BY_ID = "http://localhost:8000/api/timesheet/get";

const TimesheetList = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [userRole, setUserRole] = useState("");
  const [user, setUser] = useState({ first_name: "", role: "" });
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;



  

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    try {
      const decoded = jwtDecode(token);
      const role = decoded.role; // must be set by the backend in JWT
      setUserRole(role);
      fetchUserTimesheets(role);
      fetch("http://localhost:8000/api/auth/loggedinuser", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          setUser({
            username: data.username,
            role: data.role,
          });
        })
        .catch((err) => {
          console.error("Error fetching user info:", err);
          navigate("/login");
        });




    } catch (error) {
      console.error("Invalid token:", error);
      navigate("/login");
    }
  }, []);

  useEffect(() => {
    if (userRole === "employee") {
      const ws = new WebSocket("ws://localhost:8000/ws/timesheet/notifications/");
  
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        toast.success(data.message); // 🔁 Replace with toast if you like
        console.log("📬 Notification received:", data);
      };
  
      ws.onclose = () => {
        console.log("🛑 WebSocket disconnected");
      };
  
      return () => {
        ws.close();
      };
    }
  }, [userRole]); // 👈 Run only after userRole is set
  

  const fetchUserTimesheets = async (role) => {
    const token = localStorage.getItem("token");
    const endpoint = role === "manager" ? API_MANAGER_TIMESHEETS : API_EMPLOYEE_TIMESHEETS;

    try {
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimesheets(response.data.data);
    } catch (error) {
      console.error("Failed to fetch timesheets:", error);
      toast("Failed to fetch timesheets.");
      localStorage.removeItem("token");
      navigate("/login");
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
};

  const fetchTimesheetById = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    if (!id || isNaN(id)) {
      console.warn("Invalid timesheet ID:", id);
      return;
    }

    try {
      const response = await axios.get(`${API_GET_BY_ID}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedTimesheet(response.data.data);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching timesheet:", error);
    }
  };

  const formatDate = (str) => str?.substring(0, 10) || "N/A";
  const formatTime = (str) => str?.substring(0, 5) || "N/A";

  const filteredTimesheets = timesheets.filter(
    (ts) =>
      (!statusFilter || ts.approval_status === statusFilter) &&
      (!dateFilter || ts.week_start_date.includes(dateFilter))
  );

  return (
    <div className="screenDiv">
      {/* Sidebar */}
      <Sidebar user={user} onLogout={handleLogout}/>
     

      {/* Main Content */}
      <div className="timesheet-list-page">
        <div className="sbsDiv main-content">
          <div className="main-inner">
            <h2 className="section-title">
              {userRole === "manager" ? "📄 Team Timesheets" : "📄 My Timesheets"}
            </h2>

            {/* Filters */}
            <div className="filter-container">
              <label>Status:</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>

              <label>Week Start:</label>
              <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            </div>

            {/* Table */}

            {filteredTimesheets.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).length > 0 ? (
  <div className="viewtimesheet_table-container">
    <table className="viewtimesheet_table">
      <thead>
        <tr>
          <th>📅 Week Start</th>
          <th>⏳ Hours</th>
          <th>📌 Projects</th>
          <th>📊 Status</th>
          <th>👨‍💼 Manager</th>
          {userRole === "manager" && <th>👤 Employee</th>}
          <th>🔍</th>
        </tr>
      </thead>
      <tbody>
                    {filteredTimesheets
                      .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                      .map((ts) => (
                        <tr key={ts.id}>
                          <td>{formatDate(ts.week_start_date)}</td>
                          <td>{Math.round(ts.total_hours)}</td>
                          <td>
                            {ts.projects.map((p) => (
                              <span key={p.id} className="viewtimesheet_project-badge">
                                {p.project_name}
                              </span>
                            ))}
                          </td>
                          <td>
                            <span className={`status ${ts.approval_status.toLowerCase()}`}>
                              {ts.approval_status}
                              {ts.approval_status === "Rejected" && (
                                <span className="badge rejected">⚠️</span>
                              )}
                            </span>
                          </td>
                          <td>{ts.manager ? ts.manager.first_name : "N/A"}</td>
                          {userRole === "manager" && (
                            <td>{ts.user ? `${ts.user.first_name} ${ts.user.last_name}` : "N/A"}</td>
                          )}
                          <td>
                            <button
                              className="viewtimesheet_view-btn"
                              onClick={() => fetchTimesheetById(ts.id)}
                            >
                              🔍
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {/* Stylish & Centered Pagination */}
                <div className="pagination-container">
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    ⬅ Prev
                  </button>
                  <span className="pagination-info">
                    Page <strong>{currentPage}</strong> of <strong>{Math.ceil(filteredTimesheets.length / rowsPerPage)}</strong>
                  </span>
                  <button
                    className="pagination-btn"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredTimesheets.length / rowsPerPage)))
                    }
                    disabled={currentPage === Math.ceil(filteredTimesheets.length / rowsPerPage)}
                  >
                    Next ➡
                  </button>
                </div>

              </div>
            ) : (
              <p className="empty-message">No timesheets available.</p>
            )}

            

            {/* Timesheet Modal */}
            {showModal && selectedTimesheet && (
              <div className="viewtimesheet_modal-overlay">
                <div className="viewtimesheet_modal-content">
                  <h3>📄 Timesheet Details</h3>
                  <div className="timesheet-details-grid">
                    <div className="details-item">
                      <strong>📅 Week Start:</strong> {formatDate(selectedTimesheet.week_start_date)}
                    </div>
                    <div className="details-item">
                      <strong>⏳ Total Hours:</strong> {selectedTimesheet.total_hours}
                    </div>
                    <div className="details-item">
                      <strong>📊 Status:</strong> <span>{selectedTimesheet.approval_status}</span>
                    </div>

                    {selectedTimesheet.approval_status === "Rejected" && (
                      <>
                        <div className="details-item">
                          <strong>❌ Rejection Reason:</strong> {selectedTimesheet.rejection_reason}
                        </div>
                        {userRole === "employee" && (
                          <div className="details-item" style={{ textAlign: "left", marginTop: "10px" }}>
                            <button
                            className="edit-btn"
                            onClick={() => {
                              console.log("[Edit] Preparing timesheet for resubmission", selectedTimesheet);

                              //  Sanitize the timesheet structure for the create page
                              const cleanTimesheet = {
                                
                                week_start_date: selectedTimesheet.week_start_date,
                                daily_logs: selectedTimesheet.daily_logs.map(log => ({
                                  date: log.date,
                                  start_time: log.start_time,
                                  end_time: log.end_time,
                                  task_entries: log.task_entries.map(te => ({
                                    task_id: te.task.id, // required field
                                    duration: te.duration
                                  }))
                                }))
                              };

                              //  Set required storage
                              localStorage.setItem("edit_timesheet_data", JSON.stringify(cleanTimesheet));
                              localStorage.setItem("edit_timesheet_id", selectedTimesheet.id);
                              localStorage.setItem("is_editing_rejected", "true");

                              console.log("[Edit] LocalStorage Set", {
                                id: selectedTimesheet.id,
                                week: selectedTimesheet.week_start_date,
                                logs: cleanTimesheet.daily_logs
                              });

                              //  Navigate after setting
                              navigate("/timesheet/create");
                            }}
                          >
                            ✏️ Edit & Resubmit
                          </button>

                            
                          </div>
                        )}
                      </>
                    )}

                    
                    <div className="details-item">
                      <strong>👨‍💼 Manager:</strong> {selectedTimesheet.manager?.first_name || "N/A"}
                    </div>
                  </div>

                  <h4>🗓️ Entries</h4>
                  {selectedTimesheet.daily_logs.length > 0 ? (
                    selectedTimesheet.daily_logs.map((log, idx) => (
                      <div key={idx} className="viewtimesheet_entry-card">
                        <div>
                          <strong>{formatDate(log.date)}</strong><br />
                          <span>{formatTime(log.start_time)} - {formatTime(log.end_time)}</span>
                        </div>
                        <div style={{ flex: 1, marginLeft: "10px" }}>
                          {log.task_entries.map((te, i) => (
                            <div key={i} className="viewtimesheet_task-row">
                              <span>🛠️ <strong>{te.task.name}</strong></span>
                              <span>📁 {te.task.project.project_name}</span>
                              <span className="viewtimesheet_hours">⏱️ {te.duration} hrs</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-message">No task entries available for this timesheet.</p>
                  )}

                  <button className="viewtimesheet_close-btn" onClick={() => setShowModal(false)}>❌ Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimesheetList;
