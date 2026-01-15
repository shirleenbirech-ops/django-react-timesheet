
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate} from "react-router-dom";
import "../styles/Login.css"; 

const API_URL = "http://localhost:8000/api/auth/login"; 

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();
    
    useEffect(() => {
      
        document.body.classList.add("login-body");
        return () => {
            document.body.classList.remove("login-body");
        };
    }, []);
    


    const handleLogin = async (e) => {
        e.preventDefault();
        setError(""); // Clear previous errors

        try {
            const response = await axios.post(
                API_URL,
                { username, password },
                { headers: { "Content-Type": "application/json" } ,
                withCredentials: true

            } 
        );

            const { access, user } = response.data;

            if (rememberMe) {
                localStorage.setItem("token", access);
                
                localStorage.setItem("user", JSON.stringify(user));
            } else {
                sessionStorage.setItem("token", access);
                
                sessionStorage.setItem("user", JSON.stringify(user));
            }

            onLogin(access);
            navigate("/dashboard");

        } catch (err) {
            console.error("Login failed:", err);
            setError(err.response?.status === 401
                ? "Invalid username or password. Please try again."
                : "Login failed. Please try again later."
            );
        }
    };

    return (
        <div className="login-container">
            <section id="logincontent">
                <form onSubmit={handleLogin}>
                    <h1 className="login-h1">Login</h1>

                    {error && <p className="alert alert-danger">{error}</p>}

                    <div>
                        <input
                            type="text"
                            placeholder="Username"
                            id="username"
                            className="form-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            id="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-options">
                        <div className="form-check">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={() => setRememberMe(!rememberMe)}
                            />
                            <label htmlFor="rememberMe">Remember me</label>
                        </div>
                        
                    </div>

                    <input type="submit" value="Log In" />
                </form>

                
            </section>
        </div>
    );
};

export default Login;
