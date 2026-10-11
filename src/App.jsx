/*import Dashboard from "./components/Dashboard";
import React from "react";
import "./components/style.css";

export default function App() {
  return (
    <div className="app-container">

      
      <section className="hero">

        <div className="hero-left">
          <img src="/logo/abc.png" alt="InsideSOC Logo" className="logo" />

          <h1 className="hero-title">
           CYBERHUB- AN UNIFIED AI SOC PLATFORM
          </h1>

          <p className="hero-subtitle">
            Detect insider threats, anomalies and attack chains using AI-driven
            behavioral intelligence.
          </p>

         <button
  className="hero-button"
  onClick={() => {
    document.getElementById("dashboard").scrollIntoView({
      behavior: "smooth",
    });
  }}
>
  Launch Dashboard
</button>
        </div>


      </section>
             <div id="dashboard">
    
      <Dashboard />
</div>
    </div>
  );
}*/
import React, { useState } from "react";
import Dashboard from "./components/Dashboard";
import "./components/style.css";

export default function App() {
  // Hardcoded admin credentials
  const ADMIN_EMAIL = "abcd@gmail.com";
  const ADMIN_PASSWORD = "admin123";

  // ✅ Initialize login state from sessionStorage
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    sessionStorage.getItem("isAdminLoggedIn") === "true"
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem("isAdminLoggedIn", "true"); // ✅ Save login
    } else {
      setError("Invalid email or password");
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem("isAdminLoggedIn"); // ✅ Clear login
  };

  // LOGIN PAGE
  if (!isAdminLoggedIn) {
    return (
      <div className="login-page">
        <div className="login-box">
          <h2>Admin Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Login</button>
          </form>
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    );
  }

  // MAIN APP AFTER LOGIN
  return (
    <div className="app-container">
      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-left">
          

          <h1 className="hero-title">
            CYBERHUB- AN UNIFIED AI SOC PLATFORM
          </h1>

          <p className="hero-subtitle">
            Detect insider threats, anomalies and attack chains using AI-driven
            behavioral intelligence.
          </p>

          <button
            className="hero-button"
            onClick={() => {
              document.getElementById("dashboard").scrollIntoView({
                behavior: "smooth",
              });
            }}
          >
            Launch Dashboard
          </button>

          {/* ✅ Logout Button */}
      <button
  onClick={handleLogout}
  style={{
    position: "absolute",
    top: "20px",
    right: "20px",
    padding: "10px 20px",
    backgroundColor: "transparent",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  }}
>
  Logout
</button>
        </div>
      </section>

      <div id="dashboard">
        <Dashboard />
      </div>
    </div>
  );
}
