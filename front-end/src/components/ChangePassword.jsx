import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8000/api/auth/change-password/";

const ChangePassword = () => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    const validatePassword = (password) => {
        return (
            password.length >= 8 &&
            /\d/.test(password) &&  
            /[!@#$%^&*]/.test(password)
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validatePassword(newPassword)) {
            setError("Password must be at least 8 characters long, include a number and a special character (!@#$%^&*).");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            await axios.post(
                API_URL, 
                { current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setSuccess("Password changed successfully!");
            setError("");

            setTimeout(() => navigate("/dashboard"), 2000);
        } catch (err) {
            setError(err.response?.data?.message || "Error changing password.");
            setSuccess("");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Change Password</h2>
                {error && <p className="alert alert-danger">{error}</p>}
                {success && <p className="alert alert-success">{success}</p>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Current Password</label>
                        <input 
                            type="password" 
                            className="form-control" 
                            value={currentPassword} 
                            onChange={(e) => setCurrentPassword(e.target.value)} 
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>New Password</label>
                        <input 
                            type="password" 
                            className="form-control" 
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)} 
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <input 
                            type="password" 
                            className="form-control" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block">Change Password</button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
