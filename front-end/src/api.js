import axios from "axios";
const API_BASE_URL = "http://localhost:8000/api/" ;

export const api = axios.create ({
    baseURL: API_BASE_URL,
    headers: {
        "Content-type" : "application/json",

    },
}) ;
// This is to send the login request

export const getTimesheets = async (token) => {
    const response = await api.get("timesheet/list", {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const loginUser = async (credentials) => {
    const response = await api.post("token/", credentials)
    return response.data;

};
