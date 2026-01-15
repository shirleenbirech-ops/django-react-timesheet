import React, { useEffect, useState } from "react";
import axios from "axios";
import { Doughnut, Pie, Bar } from "react-chartjs-2";
import ChartDataLabel from 'chartjs-plugin-datalabels';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip as ChartTooltip,
  Legend
} from "chart.js";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, ChartTooltip, Legend, ChartDataLabel);


const EmployeePerformanceDetail = ({ employeeId, onBack, employeeName: initialName, defaultWeekStart= "" }) => {
  const [employeeName, setEmployeeName] = useState(initialName || "Employee")
  

  const [snapshot, setSnapshot] = useState(null);
  const [efficiencies, setEfficiencies] = useState([]);
  const [weekStart, setWeekStart] = useState(defaultWeekStart);
  const [projectId, setProjectId] = useState("all");
  const [projects, setProjects] = useState([]);


  const token = localStorage.getItem("token");

  useEffect(() => {
    if (initialName) setEmployeeName(initialName);
  }, [initialName]);

  // Fetch employee name

  useEffect(() => {
    if (!employeeId) return;
  
    const fetchEmployeeInfo = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/api/performance/employees/${employeeId}/info`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const { username, first_name, last_name } = res.data.data || {};
        const fullName = [first_name, last_name].filter(Boolean).join(" ");
        const displayName = fullName || username;

        console.log("Fetched employee:", displayName);
        setEmployeeName(displayName);

      } catch (err) {
        console.error("Error fetching employee info:", err);
      }
    };
  
    fetchEmployeeInfo();
  }, [employeeId, token]);
  


  // Fetch snapshot on employee/weekly filter change
  useEffect(() => {
    if (!employeeId) return;

    const fetchSnapshot = async () => {
      try {
        const url = weekStart
          ? `http://localhost:8000/api/performance/employees/${employeeId}/week/${weekStart}`
          : `http://localhost:8000/api/performance/employees/${employeeId}/snapshot`;

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSnapshot(res.data.data);
      } catch (err) {
        console.error("Failed to load snapshot:", err);
      }
    };

    fetchSnapshot();
  }, [employeeId, weekStart]);

  // Fetch efficiencies
  useEffect(() => {
    if (!employeeId) return;

    const fetchEfficiencies = async () => {
      try {
        const url =
          projectId === "all"
            ? `http://localhost:8000/api/performance/employee/${employeeId}/task_efficiency`
            : `http://localhost:8000/api/performance/projects/${projectId}/employees/${employeeId}/tasks`;

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setEfficiencies(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch task efficiencies:", err);
      }
    };

    fetchEfficiencies();
  }, [employeeId, projectId]);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/performance/projects/managed", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProjects(res.data.data || []);
      } catch (err) {
        console.error("Failed to load projects:", err);
      }
    };

    fetchProjects();
  }, []);

  if (!snapshot) return <p>Loading employee analytics...</p>;

  // Summary logic
  const suggestion = (() => {
    if (snapshot.utilization_rate > 90) return " Overutilized — consider reducing assignments.";
    if (snapshot.utilization_rate < 30) return " Underutilized — assign more meaningful work.";
    if (snapshot.productive_hours < snapshot.admin_hours)
      return "More time spent on admin — try shifting to core tasks.";
    return " Balanced workload — keep up the good pace.";
  })();

  const productivityChart = {
    labels: ["Productive Hours", "Admin Hours"],
    datasets: [{
      data: [Math.round(snapshot.productive_hours), Math.round(snapshot.admin_hours)],
      backgroundColor: ["#36A2EB", "#FFCE56"]
    }]
  };
  const utilizationChart = {
    labels: ["Utilized", "Remaining"],
    datasets: [{
      data: [snapshot.utilization_rate, 100 - snapshot.utilization_rate],
      backgroundColor: ["#4CAF50", "#E0E0E0"]
    }]
  };
  


  const dailyHoursChart = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    datasets: [{
      label: "Avg Daily Hours",
      data: Array(5).fill(Math.round(snapshot.total_hours / 5)),
      backgroundColor: "#42A5F5"
    }]
  };

  const utilizationOptions = {
    plugins: {
      datalabels: {
        color: "#000",
        font: {
          weight: "bold"
        },
        formatter: (value) => `${Math.round(value)}%`
      },
      legend: { position: "bottom" }
    }
  };
  

 
  const productivityOptions = {
    plugins: {
      datalabels: {
        color: "#000",
        font: {
          weight: "bold"
        },
        formatter: (value) => `${value} hrs`
      },
      legend: { position: "bottom" }
    }
  };
  
  const dailyHoursOptions = {
    plugins: {
      datalabels: {
        color: "#000",
        anchor: "end",
        align: "top",
        font: {
          weight: "bold"
        },
        formatter: (value) => value.toFixed(1)
      },
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Hours"
        }
      }
    }
  };
  

  return (
    <div className="section-block">
      <button className="gen-btn" onClick={onBack}>← Back to Overview</button>

      <h2 style={{ marginTop: "1rem" }}>👤 {}</h2>
      <h3>Insights</h3>

      {/* Summary Section */}
      <div className="insight-box" style={{ marginBottom: "2rem" }}>
        <p><strong>🗂 Assigned Projects:</strong> {projects.length}</p>
        <p><strong>📊 Avg Tasks/Day:</strong> {snapshot.average_task_per_day || "N/A"}</p>
        <p><strong>🕒 Productive/Admin Hours:</strong> {snapshot.productive_hours} / {snapshot.admin_hours}</p>
        <p><strong>💡 Suggestion:</strong> {suggestion}</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
        <label>📆 Week Start:</label>
        <input
          type="date"
          value={weekStart}
          onChange={(e) => setWeekStart(e.target.value)}
        />

        <label>🗂 Project:</label>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="all">All Projects</option>
          {projects.map((proj) => (
            <option key={proj.id} value={proj.id}>{proj.project_name}</option>
          ))}
        </select>
      </div>

      {/* Charts */}
      <div className="snapshot-row">
        <div className="tile tile--chart" style={{ padding: "2px" }} >
          <h4>🎯 Utilization</h4>
          <Doughnut data={utilizationChart} options={utilizationOptions} />
        </div>
        <div className="tile tile--chart">
          <h4>⚙️ Productivity</h4>
          <Pie data={productivityChart} options={productivityOptions} />
        </div>
        <div className="tile tile--chart">
          <h4>📊 Avg Daily Hours</h4>
          <Bar data={dailyHoursChart} options={dailyHoursOptions} />
        </div>
      </div>

      {/* Task Table */}
      <div className="task-efficiency-section">
        <h4>✅ Task Efficiencies</h4>
        <div className="task-table">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Est. Hours</th>
                <th>Actual Hours</th>
                <th>Efficiency %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {efficiencies.length > 0 ? efficiencies.map((eff, i) => (
                <tr key={i}>
                  <td>{eff.task_name}</td>
                  <td>{eff.project_name}</td>
                  <td>{Math.round(eff.estimated_hours)}</td>
                  <td>{Math.round(eff.actual_hours)}</td>
                  <td>{Math.round(eff.efficiency_ratio)}%</td>
                  <td>{eff.overdue ? "❌ Overdue" : eff.on_time ? "✅ On Time" : "—"}</td>
                </tr>
              )) : (
                <tr><td colSpan="6" style={{ textAlign: "center" }}>No tasks available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeePerformanceDetail;
