import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Doughnut, Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip as ChartTooltip,
  Legend
} from "chart.js";
import { FaFileAlt, FaSignOutAlt, FaUserShield, FaHome } from "react-icons/fa";
import profile from "../styles/profile.png";
import TimeFlow from "../styles/TimeFlow.png";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import "../styles/dashboard.css";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, ChartTooltip, Legend);

const EmployeePerformanceDashboard = () => {
  const [data, setData] = useState(null);
  const [efficiencies, setEfficiencies] = useState([]);
  const [user, setUser] = useState({ username: "", role: "" });
  const [weekStart, setWeekStart] = useState("2025-04-07");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const decoded = jwtDecode(token);
    const userId = decoded.user_id || decoded.id;
    setUser({ username: decoded.username || "User", role: decoded.role || "employee" });

    const fetchPerformance = async () => {
      try {
        const url = weekStart
          ? `http://localhost:8000/api/performance/employees/${userId}/week/${weekStart}`
          : `http://localhost:8000/api/performance/employees/${userId}/snapshot`;

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data.data);
      } catch (err) {
        console.error("Failed to fetch performance data", err);
      }
    };

    const fetchTaskEfficiencies = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/performance/employee/task_efficiency`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEfficiencies(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch task efficiencies",  err?.response?.data || err);
      }
    };

    fetchPerformance();
    fetchTaskEfficiencies();
  }, [navigate, weekStart]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (!data) return <div className="main-content"><p>Loading performance data...</p></div>;

  const productivityChart = {
    labels: ["Productive Hours", "Admin Hours"],
    datasets: [{
      data: [data.productive_hours, data.admin_hours],
      backgroundColor: ["#36A2EB", "#FFCE56"]
    }]
  };

  const utilizationChart = {
    labels: ["Utilized", "Remaining"],
    datasets: [{
      data: [data.utilization_rate, 100 - data.utilization_rate],
      backgroundColor: ["#4CAF50", "#E0E0E0"]
    }]
  };

  const dailyHoursChart = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    datasets: [{
      label: "Avg Daily Hours",
      data: Array(5).fill(data.total_hours / 5),
      backgroundColor: "#42A5F5"
    }]
  };

  return (
    <div className="screenDiv">
      {/* Sidebar */}
      <div className="sidebar sbsDiv">
        <div className="profile-container">
          <div className="logo-container">
            <img className="logo-img" src={TimeFlow} alt="TimeFlow Logo" />
          </div>
          <img className="profile-img" src={profile} alt="Profile" />
          <h2 style={{ textAlign: "center", textTransform: "uppercase" }}>{user.username}</h2>
          <p style={{ textAlign: "center", fontWeight: "bold", marginTop: "10px" }}>Welcome!</p>
        </div>
        <hr className="horizontal-seperator" />
        <button className="nav-btn" onClick={() => navigate("/dashboard")}><FaHome /> Dashboard</button>
        <button className="nav-btn" onClick={() => navigate("/timesheet/list")}><FaFileAlt /> Timesheets</button>
        <button className="nav-btn" onClick={() => navigate("/leave")}><FaUserShield /> Leave</button>
        <button className="nav-btn" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
        <hr className="horizontal-seperator" />
        <div style={{ padding: "0 20px" }}>
          <label htmlFor="weekStart"><strong>📅 Filter by Week:</strong></label>
          <input
            type="date"
            id="weekStart"
            value={weekStart || ""}
            onChange={(e) => setWeekStart(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "10px", borderRadius: "5px" }}
          />
          <button className="gen-btn" onClick={() => setWeekStart(null)}>Clear Filter</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content sbsDiv">
        <h2 className="section-title">📊 Weekly Snapshot</h2>

        {/* Chart Row */}
        <div className="snapshot-row">
          <div className="tile tile--green tile--chart">
            <h3 data-tooltip-id="utilizationTip">Utilization</h3>
            <Tooltip
              id="utilizationTip"
              place="top"
              content="This shows the percentage of time spent productively out of 40 hours. Aim for 80–100% to stay balanced."
            />
            <div className="chart-wrapper">
              <Doughnut data={utilizationChart} />
            </div>
            <p>{data.utilization_rate}% used</p>
          </div>

          <div className="tile tile--yellow tile--chart">
            <h3 data-tooltip-id="productivityTip">Productivity</h3>
            <Tooltip
              id="productivityTip"
              place="top"
              content="Breakdown of the time spent on admin tasks vs billable hours."
            />
            <div className="chart-wrapper">
              <Pie data={productivityChart} />
            </div>
            <p>Work vs Admin</p>
          </div>



          <div className="tile tile--neutral tile--chart">
          <h3 data-tooltip-id="dailyHoursTip">Daily Hours</h3>
            <Tooltip
              id="dailyHoursTip"
              place="top"
              content="Breakdown of the time the average hours of the week."
            />
            
            <div className="chart-wrapper">
              <Bar data={dailyHoursChart} />
            </div>
          </div>
        </div>

        {/* Stat Row */}
        <div className="snapshot-row">
          <div className="tile tile--neutral tile-stat">
            <h3>Tasks/Day</h3>
            <p><strong>{data.average_task_per_day}</strong></p>
            <p>on average</p>
          </div>

          <div className="tile tile--neutral tile-stat">
            <h3>Context Switches</h3>
            <p><strong>{data.context_switch_count}</strong></p>
            <p>in the week</p>
          </div>

          <div className="tile tile--red tile-stat">
            <h3>Utilization Status</h3>
            <p>
              {data.overutilized ? "🚀 Overused" :
                data.underutilized ? "💤 Underused" : "✅ Balanced"}
            </p>
          </div>
        </div>

        {/* Task Efficiency Section */}
        <div className="task-efficiency-section">
          <h2 className="section-title">🧠 Task Efficiency Overview</h2>
          <div className="task-table">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Est. Hours</th>
                  <th>Actual Hours</th>
                  <th>Efficiency</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {efficiencies.length > 0 ? (
                  efficiencies.map((eff, i) => (
                    <tr key={i}>
                      <td>{eff.task_name}</td>
                      <td>{eff.project_name}</td>
                      <td>{Math.round(eff.estimated_hours)}</td>
                      <td>{Math.round(eff.actual_hours)}</td>
                      <td>{eff.efficiency_ratio}%</td>
                      <td>{eff.overdue ? "❌ Overdue" : eff.on_time ? "✅ On Time" : "Pending"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "1rem" }}>
                      No task efficiency data available.
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

export default EmployeePerformanceDashboard;
