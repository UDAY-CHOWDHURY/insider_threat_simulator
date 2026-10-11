import React, { useEffect, useState } from "react";
import AttackGraphChart from "./AttackGraphChart";
import { API_BASE } from "../config";

export default function AttackGraph() {
  const [alerts, setAlerts] = useState([]);
  const [chartData, setChartData] = useState({ labels: [], freq: [], risk: [] });

  useEffect(() => {
    fetch(`${API_BASE}/alerts`)
      .then(res => res.json())
      .then(data => {
        setAlerts(data);

        const types = ["DELETION", "MODIFICATION", "MOVE/RENAME", "CREATION"];
        const labels = [];
        const freq = [];
        const risk = [];

        types.forEach(type => {
          const filtered = data.filter(alert => alert.description.includes(type));
          if (filtered.length > 0) {
            labels.push(type);
            freq.push(filtered.length);
            const avgRisk =
              filtered.reduce((sum, a) => sum + a.riskScore, 0) / filtered.length;
            risk.push(Math.round(avgRisk));
          }
        });

        setChartData({ labels, freq, risk });
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="attack-graph-card card">
      <h2>Attack Graph</h2>
      {chartData.labels.length > 0 ? (
        <AttackGraphChart
          labels={chartData.labels}
          frequency={chartData.freq}
          riskScore={chartData.risk}
        />
      ) : (
        <p>No attacks detected yet</p>
      )}
    </div>
  );
}