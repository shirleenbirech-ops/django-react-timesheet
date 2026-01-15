import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Doughnut } from "react-chartjs-2";
import "../styles/performancestyle.css";
import profile from "../styles/profile.png";
import TimeFlow from "../styles/TimeFlow.png";
import Sidebar from "../components/Sidebar"
import EmployeePerformanceDetail from "./employeeperformancedetail";
import { FaHome, FaCalendar, FaRocket, FaProjectDiagram, FaSignOutAlt } from "react-icons/fa";


const ManagerPerformanceDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectStats, setProjectStats] = useState(null);
  const [projectEmployees, setProjectEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeStats, setEmployeeStats] = useState([]);
  const [taskEfficiencies, setTaskEfficiencies] = useState([]);
  const [user, setUser] = useState({ username: "", role: "" });
  const [activeTab, setActiveTab] = useState("projects");
  const [managedEmployees, setManagedEmployees] = useState([]);

  const [searchParams] = useSearchParams();
  const highlight = searchParams.get("highlight");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;


    fetch("http://localhost:8000/api/auth/loggedinuser", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.username || !data.role) throw new Error("Invalid user data");
        setUser({ username: data.username, role: data.role });
      })
      .catch((err) => {
        console.error("Failed to fetch user info:", err);
        navigate("/login");
      });
    

    

    const fetchProjectsAndStats = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/performance/projects/managed", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const uniqueProjects = Array.from(
          new Map(res.data.data.map((p) => [p.project_name, p])).values()
        );

        const enriched = await Promise.all(
          uniqueProjects.map(async (proj) => {
            try {
              const statRes = await axios.get(
                `http://localhost:8000/api/performance/projects/${proj.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              return { ...proj, stats: statRes.data.data };
            } catch {
              return { ...proj, stats: null };
            }
          })
        );

        setProjects(enriched);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      }
    };

    fetchProjectsAndStats();
  }, []);

  useEffect(() => {
    if (!highlight) return;

    const sectionMap = {
      velocity: "velocity-section",
      budget: "budget-section",
      utilization: "employee-grid",
      progress: "project-table"
    };

    const targetId = sectionMap[highlight];
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        el.classList.add("highlighted-section");
        setTimeout(() => el.classList.remove("highlighted-section"), 2500);
      }
    }
  }, [highlight]);

  useEffect(() => {
    const fetchManagedEmployees = async () => {
      const token = localStorage.getItem("token");
      if (!token || activeTab !== "employees") return;

      try {
        const res = await axios.get("http://localhost:8000/api/performance/employees", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const employeeSnapshots = await Promise.all(
          res.data.data.map((emp) =>
            axios
              .get(`http://localhost:8000/api/performance/employees/${emp.id}/snapshot`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              .then((snap) => ({ ...snap.data.data, name: emp.username, id: emp.id }))
              .catch(() => null)
          )
        );

        setManagedEmployees(employeeSnapshots.filter(Boolean));
      } catch (err) {
        console.error("Failed to load employee snapshots:", err);
      }
    };

    fetchManagedEmployees();
  }, [activeTab]);

  const handleProjectSelect = async (projectId) => {
    const token = localStorage.getItem("token");
    const selected = projects.find(p => p.id === projectId);
    
    setSelectedProject(projectId);
    setSelectedEmployee(null);
    setEmployeeStats([]);
    setTaskEfficiencies([]);

    try {
      const projRes = await axios.get(
        `http://localhost:8000/api/performance/projects/${projectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProjectStats({ ...projRes.data.data, project_id: projectId, project_name: selected?.project_name || "X Project" ,project_budget: selected?.project_budget || selected?.budget || 0, });

      const taskRes = await axios.get(
        `http://localhost:8000/api/performance/projects/${projectId}/tasks/efficiency`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTaskEfficiencies(taskRes.data.data || []);

      const empRes = await axios.get(
        `http://localhost:8000/api/performance/projects/${projectId}/employees`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const employees = empRes.data.data || [];
      setProjectEmployees(employees);

      const snapshots = await Promise.all(
        employees.map((emp) =>
          axios
            .get(
              `http://localhost:8000/api/performance/employees/${emp.id}/snapshot`,
              { headers: { Authorization: `Bearer ${token}` } }
            )
            .then((res) => ({ ...res.data.data, name: emp.username }))
            .catch(() => null)
        )
      );
      setEmployeeStats(snapshots.filter(Boolean));
    } catch (err) {
      console.error("Error loading project data:", err);
    }
  };

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployee(employeeId);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const formatMoney = (num) => {
    if (!num && num !== 0) return "—";
    return `$${parseFloat(num).toLocaleString()}`;
  };

  return (
    <div className="screenDiv">
      {/* Sidebar */}
      <Sidebar user={user} onLogout={handleLogout}/>
      

    

      {/* Main Content */}
      <div className="main-content sbsDiv">
        {/* Tab Switcher */}
        <div className="tab-switcher">
          <button className={activeTab === "projects" ? "active-tab" : ""} onClick={() => setActiveTab("projects")}>
            🗂 Project Performance
          </button>
          <button className={activeTab === "employees" ? "active-tab" : ""} onClick={() => setActiveTab("employees")}>
            👥 Employee Performance
          </button>
        </div>

        {/* PROJECT PERFORMANCE TAB */}
        {activeTab === "projects" && (
          <>
            <h2 className="section-title">📂 Manager Dashboard</h2>

            <div className="section-block">
              <h3>📁 Your Projects</h3>
              <table className="manager-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Progress</th>
                    <th>Budget Used</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((proj) => (
                    <tr key={proj.id} onClick={() => handleProjectSelect(proj.id)} className={selectedProject === proj.id ? "selected-row" : ""}>
                      <td>{proj.project_name}</td>
                      <td>{proj.stats ? `${Math.round(proj.stats.progress_percentage)}%` : "—"}</td>
                      <td>{proj.stats ? formatMoney(proj.stats.budget_utilized) : "—"}</td>
                      <td>{proj.stats ? (proj.stats.over_budget ? "⚠️ Over Budget" : "✅ On Track") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {projectStats && (
              <>
                <div className="insight-box">
                  <h3>Project Insights for <span style={{ color: "#007acc" }}>{projectStats?.project_name || "..."}</span></h3>
                  <ul>
                    <li>{projectStats.over_budget ? "🚨 Budget exceeded" : "✅ Budget is under control"}</li>
                    <li>{projectStats.progress_percentage < 40 ? "📉 Progress lagging" : "📈 Good momentum"}</li>
                    <li>{projectStats.stalled_tasks_count > 3 ? "⚠️ Multiple stalled tasks" : "✅ No major stalls"}</li>
                    <li>{projectStats.budget_deviation }</li>
                    
                    
                  </ul>
                </div>

                <div className="snapshot-row">
                  <div className="tile tile--chart">
                    <h3><FaProjectDiagram /> Progress Overview</h3>
                    <div className="chart-wrapper">
                      <Doughnut
                        data={{
                          labels: ["Completed", "Remaining"],
                          datasets: [{
                            data: [projectStats.tasks_completed, projectStats.tasks_remaining],
                            backgroundColor: ["#4CAF50", "#E0E0E0"]
                          }]
                        }}
                        options={{
                          plugins: {
                            title: { display: true, text: "Task Completion", font: { size: 14 } },
                            legend: { position: "bottom" }
                          }
                        }}
                      />
                    </div>
                    <p>{Math.round(projectStats.progress_percentage)}% complete</p>
                  </div>

                  {/* Budget Utilization Chart */}
<div className="tile tile--chart" title="Shows how much of the project budget has been used.">
  <h3>💰 Budget Utilization</h3>
  <div className="chart-wrapper">
    <Doughnut
      data={{
        labels: ["Utilized", "Remaining"],
        datasets: [{
          data: [projectStats.budget_utilized, projectStats.budget_remaining],
          backgroundColor: ["#2196F3", "#BBDEFB"],
        }]
      }}
      options={{
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${formatMoney(ctx.raw)}`
            }
          },
          legend: { position: "bottom" }
        }
      }}
    />
  </div>
  <p>{formatMoney(projectStats.budget_utilized)} / {formatMoney(projectStats.budget_remaining + projectStats.budget_utilized)}</p>
  <p>{projectStats.over_budget ? "🚨 Over Budget" : "✅ On Budget"}</p>
</div>

{/* Velocity Chart */}
<div className="tile tile--chart" title="Shows how many tasks are completed per week and how many are stalled.">
  <h3>📈 Velocity</h3>
  <div className="chart-wrapper">
    <Doughnut
      data={{
        labels: ["Tasks/Week", "Stalled Tasks"],
        datasets: [{
          data: [projectStats.tasks_per_week, projectStats.stalled_tasks_count],
          backgroundColor: ["#FFC107", "#FF5722"],
        }]
      }}
      options={{
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) =>
                ctx.label === "Tasks/Week"
                  ? `${ctx.raw} tasks per week`
                  : `${ctx.raw} stalled tasks`,
            },
          },
          legend: { position: "bottom" }
        }
      }}
    />
  </div>
  <p>{projectStats.tasks_per_week} tasks/week</p>
  <p>{projectStats.stalled_tasks_count} stalled tasks</p>
</div>

                </div>
              </>
            )}
                        {/* Employee Stats (Team Overview + Insights) */}
            {employeeStats.length > 0 && (
              <>
                <div className="section-block">
                  <h3>👨‍💼 Team Overview</h3>
                  <div className="employee-grid">
                    {employeeStats.map((emp, i) => (
                      <div
                        key={i}
                        className="tile tile--clickable"
                        onClick={() => handleEmployeeSelect(projectEmployees[i]?.id)}
                      >
                        <h4>{emp.name}</h4>
                        <p>Utilization: {emp.utilization_rate}%</p>
                        <p>Context Switches: {emp.context_switch_count}</p>
                        <p>Avg Tasks/Day: {emp.average_task_per_day}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="insight-box">
                  <h3>🔎 Team Insights</h3>
                  <ul>
                    {employeeStats.map((emp) => (
                      <li key={emp.name}>
                        {emp.name}:{" "}
                        {emp.utilization_rate < 30
                          ? "⚠️ Underutilized"
                          : emp.utilization_rate > 90
                          ? "🔥 Overutilized"
                          : "✅ Balanced"}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}


            {taskEfficiencies.length > 0 && (
              <div className="section-block">
                <h3>📋 Task Efficiency</h3>
                <div className="task-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Est. Hours</th>
                        <th>Actual Hours</th>
                        <th>Efficiency %</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taskEfficiencies.map((t, i) => (
                        <tr key={i}>
                          <td>{t.task_name}</td>
                          <td>{t.estimated_hours}</td>
                          <td>{Math.round(t.actual_hours)}</td>
                          <td>{Math.round(t.efficiency_ratio)}%</td>
                          <td>{t.overdue ? "❌ Overdue" : t.on_time ? "✅ On Time" : "Pending"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* EMPLOYEE PERFORMANCE TAB */}
        {activeTab === "employees" && (
          <>
            <h2 className="section-title">👥 Employee Performance</h2>

            <div className="employee-grid">
              {managedEmployees.map((emp, i) => (
                <div
                  key={i}
                  className={`tile tile--clickable ${selectedEmployee === emp.id ? "active" : ""}`}
                  onClick={() => handleEmployeeSelect(emp.id)}
                >
                  <h4>{emp.name}</h4>
                  <p>Utilization: {emp.utilization_rate}%</p>
                  <p>Tasks/day: {emp.average_task_per_day}</p>
                  <p>Context Switches: {emp.context_switch_count}</p>
                </div>
              ))}
            </div>

            {selectedEmployee && (
              <EmployeePerformanceDetail
                employeeId={selectedEmployee}
                employeeName={employeeStats.find(emp => emp.id === selectedEmployee)?.name}
                defaultWeekStart={"2025-04-07"}
                onBack={() => setSelectedEmployee(null)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ManagerPerformanceDashboard;
