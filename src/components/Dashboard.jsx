import React from "react";
import RiskScoreCard from "./RiskScoreCard";
import AlertsPanel from "./AlertsPanel";
import SessionTimeline from "./SessionTimeline";
import AttackGraph from "./AttackGraph";

export default function Dashboard() {
  return (
    <div className="dashboard-container">

      <header className="dashboard-header" style={{ fontFamily:"tangerine", textAlign: "center", marginBottom: "30px" }}>
  <h1 className="animated-title">Detect. Defend. Dominate.</h1>
</header>

      <div className="dashboard-grid">
        <RiskScoreCard />
        <AlertsPanel />
        <SessionTimeline />
      </div>

      <div className="attack-graph">
        <AttackGraph />
      </div>

    </div>
  );
}