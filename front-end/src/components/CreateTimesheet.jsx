import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/newcreate.css";
import TimeFlow from "../styles/TimeFlow.png";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parseISO, format } from "date-fns";
import profile from "../styles/profile.png";
import { useRef } from "react";
import { FaFileAlt, FaPlusCircle, FaSignOutAlt,  FaBars, FaPlus, FaClipboardCheck, FaUserShield, FaRocket, FaHome, FaCalendar } from "react-icons/fa";
import { FaPerson } from "react-icons/fa6";
import {toast} from "react-toastify";
import TimesheetTemplates from "./TimesheetTemplate";

const API_CREATE_TIMESHEET = "http://localhost:8000/api/timesheet/create";
const API_CHECK_TIMESHEET = "http://localhost:8000/api/timesheet/check";
const API_GET_ASSIGNED_TASKS = "http://localhost:8000/api/task/get_assigned_tasks";
const API_GET_LEAVE_DAYS = "http://localhost:8000/api/leave/track"; // ✅ update to match your backend




const CreateTimesheet = () => {
  const getMonday = (date = new Date()) => {
    const day = date.getDay(); // Sunday = 0, Monday = 1
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(date.setDate(diff));
  };

  const [ukHolidays, setUkHolidays] = useState([]);
  const [leaveDates, setLeaveDates] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [internalTasks, setInternalTasks] = useState([]);
  const [showDraftSaved, setShowDraftSaved] = useState(false);
  const skipCheckRef = useRef(false);






  
  const [weekStartDate, setWeekStartDate] = useState(getMonday());
  
  const [dailyLogs, setDailyLogs] = useState([]);
  const [taskOptions, setTaskOptions] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [showConfirmModal, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({ first_name: "", role: "" });
  const [isEditingRejected, setIsEditingRejected] = useState(false);


  const navigate = useNavigate();useEffect(() => {
    
  }, []);
  
 




  const storageKey = `draft_timesheet_${weekStartDate.toISOString().split("T")[0]}`;
  useEffect(() => {
    const initializeTimesheetForm = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
  
      const savedEdit = localStorage.getItem("edit_timesheet_data");
      const isEditing = localStorage.getItem("is_editing_rejected") === "true";
      const editingId = localStorage.getItem("edit_timesheet_id");
  
      if (savedEdit && isEditing && editingId) {
        const parsed = JSON.parse(savedEdit);
  
        // Set weekStartDate immediately
        const parsedWeekDate = new Date(parsed.week_start_date);
        setWeekStartDate(parsedWeekDate);
  
        // Enable edit mode and skip the timesheet check
        skipCheckRef.current = true;
        setIsEditingRejected(true);
  
        // Load data from localStorage
        setDailyLogs(parsed.daily_logs);
        setApprovalStatus("Rejected");
        setIsLocked(false);
  
        console.log("[init] Loaded rejected timesheet for editing:", parsed);
      } else {
        setIsEditingRejected(false);
      }
    };
  
    initializeTimesheetForm();
  }, []);
  

  
 
    
  

 

  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
  
      try {
        const res = await axios.get(API_GET_ASSIGNED_TASKS, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        const allTasks = res.data;
  
        
        const assigned = allTasks.filter(
          (task) => task.requires_assignment && task.assigned_to !== null
        );
  
        
        const internal = allTasks.filter(
          (task) => !task.requires_assignment && task.assigned_to === null
        );
  
        setAssignedTasks(assigned);
        setInternalTasks(internal);
        console.log("Assigned Tasks:", assigned);
        console.log("Internal Tasks:", internal);

  
        //  Combine for internal use (e.g., project name display)
        setTaskOptions([...assigned, ...internal]);
  
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    };
  
    fetchTasks();
  }, []);
  

  useEffect(() => {
    const fetchLeaveDates = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(API_GET_LEAVE_DAYS, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        const approvedLeaves = res.data.filter(leave => leave.status === "approved");
  
        const allLeaveDates = [];
  
        approvedLeaves.forEach(leave => {
          const start = new Date(leave.start_date);
          const end = new Date(leave.end_date);
          for (
            let d = new Date(start);
            d <= end;
            d.setDate(d.getDate() + 1)
          ) {
            allLeaveDates.push(new Date(d)); // push a copy
          }
        });
  
        setLeaveDates(allLeaveDates);
      } catch (err) {
        console.error("Failed to fetch leave days:", err);
      }
    };
  
    fetchLeaveDates();
  }, []);



  useEffect(() => {
    if (skipCheckRef.current) {
      console.log("[checkTimesheet] Skipped due to rejected editing mode");
      skipCheckRef.current = false; 
      return;
    }
  
    const checkTimesheet = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
  
      const weekStr = weekStartDate.toISOString().split("T")[0];
      console.log("[checkTimesheet] Checking for week:", weekStr);
  
      try {
        const res = await axios.get(`${API_CHECK_TIMESHEET}?week_start=${weekStr}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        const isEditing = localStorage.getItem("is_editing_rejected") === "true";
        console.log("[checkTimesheet] Result:", res.data);
  
        if (res.data.exists) {
          const logs = res.data.entries || [];
          const status = res.data.status;
  
          setApprovalStatus(status);
          setDailyLogs(logs);
          setIsLocked(status !== "Rejected");
        } else {
          setApprovalStatus(null);
          setIsLocked(false);
  
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            setDailyLogs(JSON.parse(saved));
          } else {
            setDailyLogs([{
              date: weekStartDate.toISOString().split("T")[0],
              start_time: "",
              end_time: "",
              task_entries: [{ task_id: "", duration: "" }]
            }]);
          }
        }
      } catch (err) {
        console.error("checkTimesheet error:", err);
      }
    };
  
    checkTimesheet();
  }, [weekStartDate]);
  

  useEffect(() => {
    if (approvalStatus && approvalStatus !== "Rejected") {
      localStorage.removeItem("is_editing_rejected");
      localStorage.removeItem("edit_timesheet_id");
    }
  }, [approvalStatus]);
  
  
  



 
  





  useEffect(() => {
    const fetchPublicHolidays = async () => {
      try {
        const res = await axios.get("https://www.gov.uk/bank-holidays.json");
        const englandAndWales = res.data["england-and-wales"].events;
        const holidayDates = englandAndWales.map(event => new Date(event.date));
        setUkHolidays(holidayDates);
      } catch (err) {
        console.error("Failed to fetch UK holidays:", err);
      }
    };
  
    fetchPublicHolidays();
  }, []);

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
  
  

  const handleAddLog = () => {
    const usedDates = dailyLogs.map(log => log.date);
    for (let i = 0; i < 5; i++) {
      const date = new Date(weekStartDate.getTime() + i * 86400000); // Monday + i
      const dateStr = date.toISOString().split("T")[0];
      if (!usedDates.includes(dateStr)) {
        setDailyLogs(prev => [
          ...prev,
          {
            date: dateStr,
            start_time: "",
            end_time: "",
            task_entries: [{ task_id: "", duration: "" }]
          }
        ]);
        break;
      }
    }
  };
  



  const handleAddTaskEntry = (logIndex) => {
    const updated = [...dailyLogs];
    updated[logIndex].task_entries.push({ task_id: "", duration: "" });
    setDailyLogs(updated);
  };

  const updateLogField = (logIndex, field, value) => {
    const updated = [...dailyLogs];
    updated[logIndex][field] = value;
    setDailyLogs(updated);
  };

  const updateTaskEntry = (logIndex, entryIndex, field, value) => {
    const updated = [...dailyLogs];
    updated[logIndex].task_entries[entryIndex][field] = value;
    setDailyLogs(updated);
  };

  const handleWeekChange = (dir) => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(weekStartDate.getDate() + (dir === "next" ? 7 : -7));
    setWeekStartDate(newDate);
  };

  const calculateWeeklyTotals = () => {
    let regular = 0;
    let overtime = 0;

    dailyLogs.forEach(log => {
      let dayTotal = 0;
      log.task_entries.forEach(entry => {
        const duration = parseFloat(entry.duration || 0);
        dayTotal += duration;
      });

      if (regular + dayTotal > 40) {
        const over = (regular + dayTotal) - 40;
        overtime += over;
        regular += dayTotal - over;
      } else {
        regular += dayTotal;
      }
    });

    return { regular, overtime };
  };

  const handleSaveDraft = () => {
    console.log("Saving draft:", dailyLogs);
    localStorage.setItem(storageKey, JSON.stringify(dailyLogs));
    setShowDraftSaved(true);

    setTimeout(() => setShowDraftSaved(false),3000);
    
  };
  
  const handleSubmit = async () => {
    setShowConfirmation(false);
    setLoading(true);
  
    const token = localStorage.getItem("token");
    const formattedWeekStart = weekStartDate.toISOString().split("T")[0];
  
    const validLogs = dailyLogs
      .filter(log => log.start_time && log.end_time && log.task_entries.length > 0)
      .map(log => ({
        date: log.date,
        start_time: log.start_time,
        end_time: log.end_time,
        task_entries: log.task_entries
          .filter(te => te.task_id && te.duration)
          .map(te => ({
            task_id: te.task_id,
            duration: parseFloat(te.duration),
          })),
      }));
  
    if (!validLogs.length) {
      alert("Please enter at least one valid daily log with task entries.");
      setLoading(false);
      return;
    }
  
    const payload = {
      week_start_date: formattedWeekStart,
      daily_logs: validLogs,
    };
  
    try {
      const editingId = localStorage.getItem("edit_timesheet_id");
      const isEditingRejected = localStorage.getItem("is_editing_rejected") === "true";
  
      console.log("Submitting Timesheet", {
        mode: editingId && isEditingRejected ? "UPDATE (PUT)" : "CREATE (POST)",
        editingId,
        isEditingRejected,
        payload
      });
  
      if (editingId && isEditingRejected) {
        
        await axios.put(`http://localhost:8000/api/timesheet/update/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        
        await axios.post(API_CREATE_TIMESHEET, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
  
      
      localStorage.removeItem(storageKey);
      localStorage.removeItem("edit_timesheet_id");
      localStorage.removeItem("is_editing_rejected");
      setIsEditingRejected(false);
  
      toast.success("Timesheet submitted successfully!");
      navigate("/timesheet/list");
  
    } catch (err) {
      console.error("Submission error:", err.response?.data || err.message);
      toast.error(
        err.response?.data?.non_field_errors?.[0] || 
        err.response?.data?.message || 
        "Failed to submit the timesheet"
      );
      
    } finally {
      setLoading(false);
    }
  };
  



  const { regular, overtime } = calculateWeeklyTotals();

  return (
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
        <button onClick={() => navigate("/dashboard")} className="nav-btn"> <FaBars/> Dashboard</button>
        <button onClick={() => navigate("/timesheet/list")} className="nav-btn"> <FaPerson/> My Timesheets</button>
        <button onClick={() => navigate("/timesheet/create")} className="nav-btn"><FaPlus/> New Timesheet</button>
        <button onClick={() => navigate("/login")} className="nav-btn logout"><FaSignOutAlt/> Logout</button>
      </div>

      <div className="main-content">
        <form
          className="timesheet-form"
          onSubmit={(e) => {
            e.preventDefault();
            setShowConfirmation(true);
          }}
        >
          <h2 className="section-title">Create Timesheet</h2>
          {approvalStatus === null && dailyLogs.length === 1 && !dailyLogs[0].start_time && !dailyLogs[0].end_time && (
          <TimesheetTemplates
            setCurrentWeekEntries={setDailyLogs}
            currentWeekEntries={dailyLogs}
          />
        )}

         

          



          {isLocked && (
            <div className="locked-banner">
              This timesheet is {approvalStatus} and cannot be edited.
            </div>
          )}
          {showDraftSaved && (
            <div className="draft-banner success-banner">
              ✅ Draft saved successfully!
            </div>
          )}

          {approvalStatus === "Rejected" &&  !isLocked &&(
            <>
              {console.log("[UI] Showing Rejected Banner")}
              <div className="draft-banner warning-banner">
                ✏️ You’re editing a previously rejected timesheet. Submitting will replace the existing record.
              </div>
            </>
          )}

          
         

          




          <div className="create-timesheet-header">
            <div className="header-left">
              <div className="week-selector">
                <button type="button" onClick={() => handleWeekChange("prev")}>&lt;</button>
                <span>
                  {weekStartDate.toDateString()} -{" "}
                  {new Date(weekStartDate.getTime() + 4 * 86400000).toDateString()}
                </span>
                <button type="button" onClick={() => handleWeekChange("next")}>&gt;</button>
              </div>
            </div>

            <div className="header-middle">
              <div className="work-hours-summary">
                <div className="summary-box">
                  <span className="summary-value">{regular}h</span>
                  <span className="summary-label">Regular</span>
                </div>
                <div className="summary-box">
                  <span className="summary-value">{overtime}h</span>
                  <span className="summary-label">Overtime</span>
                </div>
              </div>
            </div>

          </div>

        

          

          {dailyLogs.map((log, logIndex) => (
            <div key={logIndex} className="daily-log">
              <div className="daily-log-header">
                <label>Date</label>
                <DatePicker
                  selected={log.date ? parseISO(log.date) : null}
                  onChange={(date) => {
                    const formatted = format(date, "yyyy-MM-dd");
                    updateLogField(logIndex, "date", formatted);
                  }}
                  minDate={weekStartDate}
                  maxDate={new Date(weekStartDate.getTime() + 4 * 86400000)}
                  excludeDates={[
                    ...ukHolidays,
                    ...leaveDates,
                    ...[0, 6].map(dow => {
                      return Array.from({ length: 5 }, (_, i) => {
                        const date = new Date(weekStartDate.getTime() + i * 86400000);
                        return date.getDay() === dow ? date : null;
                      }).filter(Boolean);
                    }).flat()
                  ]}
                  dayClassName={(date) => {
                    if (leaveDates.some(d => d.toDateString() === date.toDateString())) {
                      return "leave-day";
                    }
                    return undefined;
                  }}

                  disabled={isLocked}
                  placeholderText="Select date"
                  className="custom-datepicker"
                />

                
                <label>Time In</label>
                <input type="time" value={log.start_time} onChange={(e) => updateLogField(logIndex, "start_time", e.target.value)} disabled={isLocked} />
                <label>Time Out</label>
                <input type="time" value={log.end_time} onChange={(e) => updateLogField(logIndex, "end_time", e.target.value)} disabled={isLocked} />
              </div>

              <div className="task-entry-table">
                {log.task_entries.map((entry, entryIndex) => {
                  const task = taskOptions.find(t => t.id === parseInt(entry.task_id));
                  return (
                    <div key={entryIndex} className="task-entry-row">
                      <select
                        value={entry.task_id}
                        onChange={(e) => updateTaskEntry(logIndex, entryIndex, "task_id", e.target.value)}
                        disabled={isLocked}
                      >
                        <option value="">-- Select Task --</option>

                        <optgroup label="Assigned Tasks">
                          {assignedTasks.map((task) => (
                            <option key={task.id} value={task.id}>
                              {task.name} ({task.project_name})
                            </option>
                          ))}
                        </optgroup>

                        <optgroup label="Internal (Non-billable)">
                          {internalTasks.map((task) => (
                            <option key={task.id} value={task.id}>
                              {task.name}
                            </option>
                          ))}
                        </optgroup>
                      </select>

                      
                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        placeholder="Hours"
                        value={entry.duration}
                        onChange={(e) => updateTaskEntry(logIndex, entryIndex, "duration", e.target.value)}
                        disabled={isLocked}
                      />
                      <input
                        type="text"
                        readOnly
                        value={task ? task.project_name : ""}
                        placeholder="Project"
                        disabled={isLocked}
                      />
                    </div>
                  );
                })}
                {!isLocked && (
                  <button type="button" className="gen-btn" onClick={() => handleAddTaskEntry(logIndex)}>
                    + Add Task
                  </button>
                )}
              </div>
            </div>
          ))}

          {!isLocked && dailyLogs.length < 5 && (
            <button type="button" className="gen-btn" onClick={handleAddLog}>
              + Add Day
            </button>
          )}


            <button className="save-btn" type="button" onClick={handleSaveDraft}>
                Save Draft
              </button>


              {!isLocked && (
              <div className="header-right">
                <button className="submit-btn-top" type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Timesheet"}
                </button>
                
              </div>
            )}

        </form>

        {showConfirmModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Submit Timesheet</h3>
              <p>Are you sure you want to submit this timesheet?</p>
              <div className="modal-buttons">
                <button onClick={handleSubmit} className="submit-btn-top">Yes, Submit</button>
                <button className="gen-btn" onClick={() => setShowConfirmation(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateTimesheet;
