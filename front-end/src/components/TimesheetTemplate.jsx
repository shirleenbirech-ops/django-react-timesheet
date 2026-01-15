import React, { useEffect, useState } from "react";
import axios from "axios";
import {toast} from "react-toastify";

const TimesheetTemplates = ({ setCurrentWeekEntries, currentWeekEntries }) => {
  const [templates, setTemplates] = useState([]);
  const [templateName, setTemplateName] = useState("");
  const token = localStorage.getItem("token");

  const fetchTemplates = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/template/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Fetched templates:", res.data.templates);
      setTemplates(res.data || []);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    }
  };

  const loadTemplate = async (id) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/template/load/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCurrentWeekEntries(res.data.daily_logs);
    } catch (err) {
      console.error("Failed to load template:", err);
    }
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      toast.warn("Template name required");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8000/api/template/create", {
        name: templateName,
        daily_logs: currentWeekEntries
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      

      setTemplateName("");
      fetchTemplates();
    } catch (err) {
      console.error("Failed to save template:", err);
      toast.error("Error saving template.");
    }
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm("Delete this template?")) return;

    try {
      await axios.delete(`http://localhost:8000/api/template/${id}/delete`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Template deleted successfully");
      fetchTemplates();
    } catch (err) {
      
      const errorMessage = err.response?.data?.message || "❌ Failed to delete template. Please try again.";
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return (
    <div style={{ marginBottom: "2rem" }}>
      <h4 style={{ marginBottom: "1rem" }}>🧩 Manage Templates</h4>

      <div style={{ display: "flex", gap: "8px", marginBottom: "1rem" , width: "50%"}}>
        <input
          type="text"
          placeholder="New Template Name"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            flexGrow: 1,
          }}
        />
        <button
          type="button"
          onClick={saveTemplate}
          style={{
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Save Current Week
        </button>
      </div>

      <div style={{ marginBottom: "1rem", display: "flex", gap: "8px", alignItems: "center", width:"25%" }}>
        <select
          onChange={(e) => loadTemplate(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #888",
            flexGrow: 1,
          }}
        >
          <option value="">Load a Template</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => deleteTemplate(t.id)}
            style={{
              backgroundColor: "white",
              color: "red",
              border: "1px solid red",
              padding: "6px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            🗑 {t.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimesheetTemplates;
