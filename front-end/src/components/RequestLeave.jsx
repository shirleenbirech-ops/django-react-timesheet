import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import {
  FaHome,
  FaCalendar,
  FaRocket,
  FaSignOutAlt,
} from "react-icons/fa";

import "../styles/RequestLeaveForm.css";
import TimeFlow from "../styles/TimeFlow.png";
import profile from "../styles/profile.png"; // Ensure this path is correct

const API_LEAVE_SNAPSHOT = "http://localhost:8000/api/leave/get_leave_snapshot";
const API_LEAVE_REQUEST = "http://localhost:8000/api/leave/request";
const API_LOGGED_IN_USER = "http://localhost:8000/api/auth/loggedinuser";

const RequestLeaveForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    leave_type: "",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [user, setUser] = useState({ username: "", role: "" });

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
          if (!data.username || !data.role) throw new Error("Invalid user data");
          setUser({ username: data.username, role: data.role });
        })
        .catch((err) => {
          console.error("Failed to fetch user info:", err);
          navigate("/login");
        });
    } catch (error) {
      console.error("Invalid token:", error);
      navigate("/login");
    }

    const fetchLeaveBalance = async () => {
      try {
        const response = await axios.get(API_LEAVE_SNAPSHOT, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setLeaveBalance(response.data.remaining_days);
      } catch (error) {
        console.error("Failed to fetch leave balance", error);
      }
    };

    fetchLeaveBalance();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const leaveTypeOptions = [
    { label: "Sick Leave", value: "sick" },
    { label: "Vacation Leave", value: "vacation" },
    { label: "Unpaid Leave", value: "unpaid" },
    { label: "Other", value: "other" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const { leave_type, start_date, end_date, reason } = formData;

    if (!leave_type || !start_date || !end_date || !reason) {
      toast.error("All fields are required.");
      return;
    }

    if (new Date(start_date) > new Date(end_date)) {
      toast.error("End date must be after start date.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(API_LEAVE_REQUEST, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      toast.success(response.data.message || "Leave request has been submitted successfully");
      setTimeout(() => navigate("/leave/track"), 2000);
    } catch (error) {
      const errMsg =
      error.response?.data?.non_field_errors?.[0] ||
      error.response?.data?.error ||
      "Submission failed.";

     toast.error(errMsg);

    }
  };

  return (
    <div className="screenDiv">
      {/* Sidebar */}
      <div className="sbsDiv sidebar">
        <div className="profile-container">
          <div className="logo-container">
            <img className="logo-img" src={TimeFlow} alt="TimeFlow Logo" />
          </div>
          <img className="profile-img" src={profile} alt="Profile" />
          <p style={{ textAlign: "center", fontWeight: "bold", marginTop: "10px" }}>
            Welcome, {user.username}!
          </p>
        </div>
        <hr className="dashboardhorizontal-seperator" />
        <button className="nav-btn active"><FaHome /> Home</button>
        <button className="nav-btn" onClick={() => navigate("/timesheet/list")}><FaCalendar /> Timesheets</button>

        {user.role === "manager" && (
          <button className="nav-btn" onClick={() => navigate("/performance/managers")}>
            <FaRocket /> Performance
          </button>
        )}

        {user.role === "employee" && (
          <button className="nav-btn" onClick={() => navigate("/performance/employees")}>
            <FaRocket /> Performance
          </button>
        )}

        <button className="nav-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </div>

      {/* Main */}
      <div className="request-leave-page">
        <div className="main-content">
          <div className="request-leave-container">
            <h2>📅 Request Leave</h2>

            {leaveBalance !== null && (
              <div className="leave-balance-box">
                <strong>🟢 Available Leave Days:</strong> {leaveBalance} days
              </div>
            )}

            

            <form onSubmit={handleSubmit} className="leave-form">
              <label>Leave Type:</label>
              <select name="leave_type" value={formData.leave_type} onChange={handleChange} required>
                <option value="">Select Leave Type</option>
                {leaveTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <label>Start Date:</label>
              <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required />

              <label>End Date:</label>
              <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} required />

              <label>Reason:</label>
              <textarea name="reason" value={formData.reason} onChange={handleChange} required />

              <button type="submit" className="submit-btn"> Submit Request</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestLeaveForm;
