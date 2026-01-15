import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/approve.css";
import TimeFlow from "../styles/TimeFlow.png";
import profile from "../styles/profile.png";
import Papa from "papaparse"; // ✅ CSV export

const API_GET_USER_TIMESHEETS = "http://localhost:8000/api/timesheet/all";

const TimesheetHistory = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [filteredTimesheets, setFilteredTimesheets] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingCount, setPendingCount] = useState(0);
  const [user, setUser] = useState({ first_name: "", role: "" });

  const navigate = useNavigate();

  const rowsPerPage = 5;

  useEffect(() => {
    const fetchTimesheets = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await axios.get(API_GET_USER_TIMESHEETS, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTimesheets(response.data.data);
        setPendingCount(
          response.data.data.filter((t) => t.approval_status === "Pending").length
        );
      } catch (error) {
        console.error("Error fetching timesheets:", error);
      }
    };

    fetchTimesheets();
  }, []);

  useEffect(() => {
    if (statusFilter === "All") {
      setFilteredTimesheets(timesheets);
    } else {
      setFilteredTimesheets(
        timesheets.filter((t) => t.approval_status === statusFilter)
      );
    }
    setCurrentPage(1);
  }, [statusFilter, timesheets]);

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
  

  const exportCSV = () => {
    const csv = Papa.unparse(
      filteredTimesheets.map((t) => ({
        "Week Start": t.week_start,
        "Total Hours": t.total_hours,
        "Overtime": t.overtime_hours,
        "Status": t.approval_status,
        "Submitted By": t.submitted_by || "N/A",
      }))
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "timesheets.csv";
    link.click();
  };

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredTimesheets.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTimesheets.length / rowsPerPage);

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
          <button onClick={() => navigate("/dashboard")} className="nav-btn">Dashboard</button>
          <button onClick={() => navigate("/timesheet/list")} className="nav-btn">My Timesheets</button>
          <button onClick={() => navigate("/timesheet/create")} className="nav-btn">New Timesheet</button>
          <button onClick={() => navigate("/login")} className="nav-btn logout"> Logout</button>
        </div>
  
        <div className="main-content">
          <div className="timesheetapproval-container">
  
            <div className="top-banner">
              <h2 className="section-title">🧾 Timesheet History</h2>
              <p className="pending-banner">{pendingCount} pending timesheets</p>
            </div>
  
            <div className="filters">
              <label>Status Filter:</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
              <button className="gen-btn" onClick={exportCSV}>📤 Export to CSV</button>
            </div>
  
            <table className="approvaltimesheet-table">
              <thead>
                <tr>
                  <th>👤 User</th>
                  <th>📅 Week Start</th>
                  <th>⏱️ Total Hours</th>
                  <th>⏲️ Overtime</th>
                  <th>📊 Status</th>
                  <th>🔍 View</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((timesheet) => (
                  <tr key={timesheet.id} onClick={() => navigate(`/timesheet/manager/${timesheet.id}`)}>
                    <td>{timesheet.submitted_by || "N/A"}</td>
                    <td>{timesheet.week_start}</td>
                    <td>{Math.round(timesheet.total_hours)}h / 128h</td>
                    <td>{Math.round(timesheet.overtime_hours)}h</td>
                    <td>
                      <span className={`status ${timesheet.approval_status.toLowerCase()}`}>
                        {timesheet.approval_status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/timesheet/manager/${timesheet.id}`);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
  
            {/* Pagination */}
            <div className="pagination-controls">
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                ⬅ Prev
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                Next ➡
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
};

export default TimesheetHistory;
