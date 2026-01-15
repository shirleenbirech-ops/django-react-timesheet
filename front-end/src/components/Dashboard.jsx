import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaFileAlt, FaPlusCircle, FaSignOutAlt, FaClipboardCheck, FaUserShield, FaRocket, FaHome, FaCalendar } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import "../styles/dashboard.css";
import profile from "../styles/profile.png"; 
import TimeFlow from "../styles/TimeFlow.png";
import {
    FaChartLine,
    FaClock,
    FaUsers,
    FaProjectDiagram,
    FaTasks,
    FaBolt,
    FaUserCheck,
    FaTachometerAlt
  } from "react-icons/fa";
import { refreshAccessToken } from "../tokenUtils";
  

const Dashboard = () => {
    const navigate = useNavigate();
    const [snapshots, setSnapshots] = useState([]);
    const [loading, setLoading] = useState(true);

    const [user, setUser] = useState({ username: "", role: "" });

    useEffect(() => {
        const init = async () => {
            console.log("🔄 Dashboard mounted. Checking token...");
            let token = localStorage.getItem("token");
    
            const now = Date.now() / 1000;
    
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    console.log("📜 Decoded token:", decoded);
    
                    if (decoded.exp < now) {
                        console.log(" Token expired. Attempting refresh...");
                        token = await refreshAccessToken();
                        if (!token) {
                            console.log(" Refresh failed. Redirecting to login.");
                            return navigate("/login");
                        }
                    } else {
                        console.log(" Token still valid.");
                    }
                } catch (e) {
                    console.log(" Invalid token. Attempting refresh...");
                    token = await refreshAccessToken();
                    if (!token) {
                        console.log(" Refresh failed. Redirecting to login.");
                        return navigate("/login");
                    }
                }
            } else {
                console.log(" No token found. Attempting refresh...");
                token = await refreshAccessToken();
                if (!token) {
                    console.log(" Refresh failed. Redirecting to login.");
                    return navigate("/login");
                }
            }
    
            try {
                const res = await axios.get("http://localhost:8000/api/auth/loggedinuser", {
                    headers: { Authorization: `Bearer ${token}` },
                });
    
                console.log("👤 User loaded:", res.data);
    
                setUser({
                    username: res.data.username,
                    role: res.data.role,
                });
                setLoading(false);
            } catch (err) {
                console.error(" Failed to load user data:", err.response?.data || err.message);
                setLoading(false);
                navigate("/login");
            }
        };
    
        init();
    }, [navigate]);


    
    

    
    
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;
    
        axios.get("http://localhost:8000/api/performance/snapshotsummary", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setSnapshots(res.data.data))
        .catch(err => console.error("Snapshot fetch error:", err));
    }, []);
    if (loading) {
        return <div>Loading dashboard...</div>; 
      }

    

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };
    const getIconForLabel = (label) => {
        const lower = label.toLowerCase();
        if (lower.includes("velocity")) return <FaBolt />;
        if (lower.includes("utilization")) return <FaTachometerAlt />;
        if (lower.includes("projects")) return <FaProjectDiagram />;
        if (lower.includes("tasks")) return <FaTasks />;
        if (lower.includes("team")) return <FaUsers />;
        if (lower.includes("hours")) return <FaClock />;
        if (lower.includes("efficiency")) return <FaChartLine />;
        if (lower.includes("attendance")) return <FaUserCheck />;
        return <FaChartLine />;
      };
      
    

    return (
        <div className="screenDiv">
            {/*  Sidebar */}
            <div className="sbsDiv sidebar">
                <div className="profile-container">
                    <div className="logo-container">
                        <img className="logo-img" src={TimeFlow} alt="TimeFlow Logo"/>
                    </div>
                    <img className="profile-img" src={profile} alt="Profile" />
                    
                    <p style={{ textAlign: "center", fontWeight: "bold", marginTop: "10px" }}>
                        Welcome, {user.username}!
                    </p>
                </div>
                <hr className="dashboardhorizontal-seperator" />
                <button className="nav-btn active"> <FaHome/> Home</button>
                <button className="nav-btn" onClick={() => navigate("/timesheet/list")}><FaCalendar/> Timesheets</button>
                {user.role === "manager" && (
                    <button className="nav-btn" onClick={() => navigate("/performance/managers")}>
                        <FaRocket/> Performance
                    </button>
                    )}

                    {user.role === "employee" && (
                    <button className="nav-btn" onClick={() => navigate("/performance/employees")}>
                       <FaRocket/> Performance
                    </button>
                )}


                <button className="nav-btn" onClick={handleLogout}>
                    <FaSignOutAlt /> Logout
                </button>
            </div>

            <hr className="main-seperator mobile-seperator" />

            {/* Main Content */}
            <div className="sbsDiv main-content">
                {/* Quick Actions */}
                <div className="summary">
                    <h2 className="full_width">Quick Actions</h2>
                    <div className="horizontal-scroll full_width">
                        {user.role === "employee" && (
                            <>
                                <div className="tile action-card" onClick={() => navigate("/timesheet/create")}>
                                    <FaPlusCircle className="action-icon" />
                                    <h3>Create Timesheet</h3>
                                </div>
                        
                                <div className="tile action-card" onClick={() => navigate("/timesheet/list")}>
                                    <FaFileAlt className="action-icon" />
                                    <h3>View Timesheets</h3>
                                </div>
                                <div className="tile action-card" onClick={() => navigate("/leave")}>
                                    <FaUserShield className="action-icon" />
                                    <h3>Leave Requests</h3>
                                </div>
                            </>
                        )}
                        {user.role === "manager" && (
                            <>
                                <div className="tile action-card" onClick={() => navigate("/timesheet/list")}>
                                    <FaFileAlt className="action-icon" />
                                    <h3>View Timesheets</h3>
                                </div>
                                <div className="tile action-card" onClick={() => navigate("/timesheet/history")}>
                                    <FaClipboardCheck className="action-icon" />
                                    <h3>Approve Timesheets</h3>
                                </div>
                                <div className="tile action-card" onClick={() => navigate("timesheet/manager/leave")}>
                                    <FaUserShield className="action-icon" />
                                    <h3>Manage Leave Requests</h3>
                                </div>
                            </>
                        )}
                        {user.role === "admin" && (
                            <>
                                <div className="tile action-card" onClick={() => navigate("/timesheet/list")}>
                                    <FaFileAlt className="action-icon" />
                                    <h3>All Timesheets</h3>
                                </div>
                                <div className="tile action-card" onClick={() => navigate("/timesheet/create")}>
                                    <FaPlusCircle className="action-icon" />
                                    <h3>Create Timesheet</h3>
                                </div>
                                <div className="tile action-card" onClick={() => navigate("/timesheet/approve")}>
                                    <FaClipboardCheck className="action-icon" />
                                    <h3>Approve Timesheets</h3>
                                </div>
                                <div className="tile action-card" onClick={() => navigate("/leave-requests")}>
                                    <FaUserShield className="action-icon" />
                                    <h3>Leave Requests</h3>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <hr className="main-seperator" />

                {/*  Analytics Snapshot */}
                <div className="summary">
                    <h2 className="full_width">Analytics Snapshot</h2>
                    <div className="analytics-grid full_width">
                        {snapshots.map((item, i) => (
                            <div
                            key={i}
                            className="tile tile--clickable"
                            onClick={() => {
                                const path = user.role === "manager" ? "/performance/managers" : "/performance/employees";
                                navigate(`${path}?highlight=${item.id}`);
                            }}
                            >
                            <div style={{ fontSize: "24px", marginBottom: "5px" }}>
                                {getIconForLabel(item.label)}
                            </div>
                            <h3>{item.label}</h3>
                            <p>{item.stat}</p>
                            <small>{item.updated}</small>
                            </div>
                        ))}
                        </div>

                    

                    
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
