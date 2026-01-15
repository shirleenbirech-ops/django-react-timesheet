import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/api/auth/test_api";

const ApiTest = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(API_URL)
      .then(response => {
        console.log("Backend Response:", response.data);
        setData(response.data);
      })
      .catch(error => {
        console.error("Error connecting to backend:", error);
        setError(error.message);
      });
  }, []);

  return (
    <div>
      <h2>Backend Connection Test</h2>
      {data ? <p>✅ Connected: {JSON.stringify(data)}</p> : <p>❌ Not Connected</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
};

export default ApiTest;
