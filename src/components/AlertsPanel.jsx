
import React, { useEffect, useState } from "react";
import "./AlertsPanel.css"; // Separate CSS file for styling
import { API_BASE } from "../config";

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/alerts`)
      .then((res) => res.json())
      .then((data) => {
        setAlerts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch alerts:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="alerts-card">
      <h2>Active Alerts</h2>

      {/* Scanning animation */}
      {loading && (
        <div className="scanning">
          Scanning for alerts
          <span className="dot">●</span>
        </div>
      )}

      {/* No alerts */}
      {!loading && alerts.length === 0 && <p>No alerts detected</p>}

      {/* Render alerts */}
      {!loading &&
        alerts.map((alert, index) => (
          <div key={index} className={`alert ${alert.severity.toLowerCase()}`}>
            <strong>{alert.severity}</strong>
            <p>{alert.description}</p>
            <small>
              {alert.user} | {alert.host} | {alert.time}
            </small>
            <div>Risk Score: {alert.riskScore}</div>
          </div>
        ))}
    </div>
  );
}