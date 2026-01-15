import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import LeaveDashboard from "./components/LeaveDashboard";
import TimesheetList from "./components/TimeSheetList";
import CreateTimesheet from "./components/CreateTimesheet";
import ChangePassword from "./components/ChangePassword";
import {ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


import RequestLeaveForm from "./components/RequestLeave";
import LeaveTrackingDashboard from "./components/Employee_Leave";
import ManagerLeaveDashboard from "./components/ManagerLeave";
import TimesheetApproval from "./components/TimesheetApproval";
import TimesheetHistory from "./components/TimesheetHistory";
import TrackRequests from "./components/TrackRequests";

import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/custom.css";
import { jwtDecode } from "jwt-decode"; 
import ManagerApproval from "./components/ManagerApproval";
import EmployeePerformanceDashboard from "./components/employeeperformancedashboard";
import ManagerPerformanceDashboard from "./components/ManagerPerformanceDashboard";




const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const initializeAuth = async () => {
          let token = localStorage.getItem("token");
          const now = Date.now() / 1000;
    
          if (token) {
            try {
              const decodedToken = jwtDecode(token);
    
              if (decodedToken.exp < now) {
                console.log("🔁 Token expired, attempting refresh...");
                const res = await fetch("http://localhost:8000/api/auth/refresh", {
                  method: "POST",
                  credentials: "include",
                });
    
                if (res.ok) {
                  const data = await res.json();
                  localStorage.setItem("token", data.access);
                  const decodedNew = jwtDecode(data.access);
                  setUserRole(decodedNew.role);
                  setIsAuthenticated(true);
                } else {
                  setIsAuthenticated(false);
                }
              } else {
                // Token still valid
                setUserRole(decodedToken.role);
                setIsAuthenticated(true);
              }
            } catch (err) {
              console.warn("❌ Failed to decode token, trying refresh...");
              const res = await fetch("http://localhost:8000/api/auth/refresh", {
                method: "POST",
                credentials: "include",
              });
    
              if (res.ok) {
                const data = await res.json();
                localStorage.setItem("token", data.access);
                const decodedNew = jwtDecode(data.access);
                setUserRole(decodedNew.role);
                setIsAuthenticated(true);
              } else {
                setIsAuthenticated(false);
              }
            }
          } else {
            // No token at all — try refresh
            console.log("🔍 No token, attempting silent refresh...");
            const res = await fetch("http://localhost:8000/api/auth/refresh", {
              method: "POST",
              credentials: "include",
            });
    
            if (res.ok) {
              const data = await res.json();
              localStorage.setItem("token", data.access);
              const decodedNew = jwtDecode(data.access);
              setUserRole(decodedNew.role);
              setIsAuthenticated(true);
            } else {
              setIsAuthenticated(false);
            }
          }
        };
    
        initializeAuth();
      }, []);
    
      const handleLogin = (token) => {
        localStorage.setItem("token", token);
        const decodedToken = jwtDecode(token);
        setUserRole(decodedToken.role);
        setIsAuthenticated(true);
      };

    

    return (
        <div className="container">

            <ToastContainer position="top-right" autoClose={4000}/>
            <Router>
                <Routes>
                    {/* ✅ Public Routes */}
                    <Route path="/login" element={<Login onLogin={handleLogin} />} />
                    <Route path="/register" element={<Register />} />

                    {/* ✅ Role-Based Protected Routes */}
                    {isAuthenticated ? (
                        <>
                            {/* ✅ Common Routes for All Authenticated Users */}
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/change-password" element={<ChangePassword />} />

                            {/* ✅ Employee Routes */}
                            {userRole === "employee" && (
                                <>
                                    <Route path="/timesheet/list" element={<TimesheetList />} />
                                    <Route path="/timesheet/create" element={<CreateTimesheet />} />
                                    <Route path="/leave" element={<LeaveDashboard />} />
                                    <Route path="leave/request" element={< RequestLeaveForm/>} />
                                    <Route path="leave/track" element={< TrackRequests/>} />
                                    
                                    <Route path="/performance/employees" element={<EmployeePerformanceDashboard/>} />

                                </>
                            )}

                            {/* ✅ Manager Routes */}
                            {userRole === "manager" && (
                                <>
                                    <Route path="/timesheet/list" element={<TimesheetList />} />
                                    <Route path="/timesheet/manager/:id/approve" element={<TimesheetApproval />} />
                                    <Route path="/timesheet/manager/:id/reject" element={<TimesheetApproval />} />
                                    <Route path="/dashboard/timesheet/manager/leave" element={<ManagerLeaveDashboard />} />
                                    <Route path="/performance/managers" element={<ManagerPerformanceDashboard/>} />
                                    <Route path="/timesheet/create" element={<CreateTimesheet />} />
                                    

                                    
                                    <Route path="/timesheet/manager/:id" element={<TimesheetApproval />} />
                                    
                                    
                                    



                                    <Route path="/timesheet/history" element={<TimesheetHistory />} />
                                    <Route path="/timesheet/manager/all" element={<TimesheetHistory/>} />

                                    
                                    

                                    
                                    <Route path="/leave/manage" element={<ManagerApproval />} />
                                    <Route path="/leave/manage:leaveid" element={<ManagerApproval /> }/>
                                    <Route path="/leave/manage/all" element={<ManagerLeaveDashboard/> }/>
                                    <Route path="/leave/manage/all" element={<ManagerLeaveDashboard/> }/>


                                    

                                </>
                            )}

                            {/* ✅ Admin Routes */}
                            {userRole === "admin" && (
                                <>
                                    <Route path="/timesheet/list" element={<TimesheetList />} />
                                    <Route path="/timesheet/create" element={<CreateTimesheet />} />
                                    <Route path="/timesheet/approve" element={<ApproveTimesheets />} />
                                    <Route path="/leave" element={<LeaveDashboard />} />
                                </>
                            )}

                            {/* ✅ Redirect Unauthorized Users to Dashboard */}
                            <Route path="/" element={<Navigate to="/dashboard" />} />
                        </>
                    ) : (
                        <>
                            {/* ✅ Redirect all unauthenticated users to login */}
                            <Route path="*" element={<Navigate to="/login" />} />
                        </>
                    )}
                </Routes>
            </Router>
        </div>
    );




    
    
    
};

export default App;
