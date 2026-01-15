import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/ManagerApproval.css";
import { useNavigate } from "react-router-dom";
import TimeFlow from "../styles/TimeFlow.png";

const ManagerApproval = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [managerComment, setManagerComment] = useState("");
  const [filters, setFilters] = useState({
    user: "",
    leaveType: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchAllLeaveRequests = async () => {
      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      try {
        const response = await axios.get("http://localhost:8000/api/leave/manage/all", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const formattedRequests = response.data.map((req) => ({
          ...req,
          id: Number(req.id),
        }));

        setLeaveRequests(formattedRequests);
        setFilteredRequests(formattedRequests);
      } catch (error) {
        setError("Error fetching leave requests.");
      }
    };

    fetchAllLeaveRequests();
  }, [token]);

  const handleApproval = async (leaveId, status) => {
    try {
      const response = await axios.put(
        `http://localhost:8000/api/leave/manage/${leaveId}`,
        { status, manager_comment: status === "rejected" ? managerComment : "" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert(response.data.message);

      setLeaveRequests((prev) =>
        prev.map((req) =>
          req.id === leaveId ? { ...req, status, manager_comment: managerComment } : req
        )
      );
      setFilteredRequests((prev) =>
        prev.map((req) =>
          req.id === leaveId ? { ...req, status, manager_comment: managerComment } : req
        )
      );
      setSelectedRequest(null);
      setManagerComment("");
    } catch (error) {
      setError("Error updating leave request.");
    }
  };

  useEffect(() => {
    let filtered = leaveRequests;

    if (filters.user) {
      filtered = filtered.filter((req) =>
        String(req.user).includes(filters.user)
      );
    }
    if (filters.leaveType) {
      filtered = filtered.filter((req) => req.leave_type === filters.leaveType);
    }
    if (filters.status) {
      filtered = filtered.filter((req) => req.status === filters.status);
    }
    if (filters.startDate) {
      filtered = filtered.filter((req) => new Date(req.start_date) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      filtered = filtered.filter((req) => new Date(req.end_date) <= new Date(filters.endDate));
    }

    setFilteredRequests(filtered);
  }, [filters, leaveRequests]);

  const getLeaveTypeClass = (leaveType) => {
    switch (leaveType) {
      case "sick":
        return "leave-sick";
      case "vacation":
        return "leave-vacation";
      case "unpaid":
        return "leave-unpaid";
      case "other":
        return "leave-other";
      default:
        return "";
    }
  };

  return (
    <div className="screenDiv">
      <div className="sidebar">
        <div className="logo-container">
          <img src={TimeFlow} alt="TimeFlow Logo" className="logo-img" />
        </div>
        <h2>TimeSheet Management</h2>
        <button onClick={() => navigate("/dashboard")} className="nav-btn">🏠 Dashboard</button>
        <button onClick={() => navigate("/timesheet/list")} className="nav-btn">📄 My Timesheets</button>
        <button onClick={() => navigate("/timesheet/create")} className="nav-btn">➕ New Timesheet</button>
        <button onClick={() => navigate("/login")} className="nav-btn logout">🚪 Logout</button>
      </div>

      <div className="main-content">
        <div className="manager-approval-container">
          <h2 className="page-title">📝 Leave Management</h2>

          <div className="filters">
            <input
              type="text"
              placeholder="Filter by User"
              value={filters.user}
              onChange={(e) => setFilters({ ...filters, user: e.target.value })}
            />
            <select onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}>
              <option value="">All Leave Types</option>
              <option value="vacation">Vacation</option>
              <option value="sick">Sick</option>
              <option value="unpaid">Unpaid</option>
              <option value="other">Other</option>
            </select>
            <select onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <table className="leave-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Leave Type</th>
                <th>Dates Requested</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.user}</td>
                  <td>
                    <span className={getLeaveTypeClass(request.leave_type)}>
                      {request.leave_type.charAt(0).toUpperCase() + request.leave_type.slice(1)}
                    </span>
                  </td>

                  
                  <td>{request.start_date} - {request.end_date}</td>
                  <td>
                      <span className={`status ${request.status}`}>
                        {request.status.toUpperCase()}

                      </span>
                      
                    </td>
                 
                  <td>
                    <button className="approve-btn" onClick={() => handleApproval(request.id, "approved")}>
                      Approve
                    </button>
                    <button className="reject-btn" onClick={() => setSelectedRequest(request.id)}>
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedRequest && (
            <div className="modal">
              <div className="modal-content">
                <h3>Reject Leave Request</h3>
                <textarea
                  placeholder="Enter rejection reason..."
                  value={managerComment}
                  onChange={(e) => setManagerComment(e.target.value)}
                />
                <div className="modal-actions">
                  <button
                    className="confirm-reject"
                    onClick={() => {
                      if (!managerComment.trim()) return alert("Provide a rejection reason.");
                      handleApproval(selectedRequest, "rejected");
                    }}
                  >
                    Confirm Reject
                  </button>
                  <button className="cancel" onClick={() => setSelectedRequest(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerApproval;
