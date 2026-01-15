import axios from 'axios';

export const refreshAccessToken = async () => {
    console.log("Trying to refresh access token");
    try {
        const res = await axios.post('http://localhost:8000/api/auth/refresh', {}, {
            withCredentials: true  
        });

        const accessToken = res.data.access;
        localStorage.setItem("token", accessToken);
        return accessToken;
    } catch (err) {
        console.error("Token refresh failed:", err);
        return null;
    }
};
