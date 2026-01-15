import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8000/api/auth/register";

const Register = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            await axios.post(API_URL, { username, email, password });
            alert("Registration successful! Please log in.");
            navigate("/login");
        } catch (err) {
            console.error("Registration failed:", err);
            setError("Registration failed. Try again.");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Register</h2>
                
                {error && <p className="alert alert-danger">{error}</p>}

                <form onSubmit={handleRegister}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input 
                            type="text" 
                            id="username" 
                            className="form-control" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input 
                            type="email" 
                            id="email" 
                            className="form-control" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input 
                            type="password" 
                            id="password" 
                            className="form-control" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input 
                            type="password" 
                            id="confirmPassword" 
                            className="form-control" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block">Register</button>

                    <p className="text-center mt-3">Already have an account?  
                        <a href="/login" className="login-link"> Login</a>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Register;
