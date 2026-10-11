export const riskScore = 78;

export const alerts = [
  {
    id: 1,
    user: "j.doe",
    host: "FIN-SERVER-01",
    severity: "Critical",
    description: "Suspicious privilege escalation + lateral movement",
    time: "10:42 AM"
  },
  {
    id: 2,
    user: "a.smith",
    host: "HR-ENDPOINT-07",
    severity: "High",
    description: "Unusual file exfiltration behavior detected",
    time: "09:15 AM"
  }
];

export const sessionTimeline = [
  "User Login",
  "Accessed Financial Records",
  "Executed PowerShell Command",
  "Created Admin Account",
  "Outbound Network Connection"
];

export const attackGraph = {
  nodes: ["User: j.doe", "Host: FIN-SERVER-01", "DB Server", "External IP"],
  edges: [
    "User → Host",
    "Host → DB Server",
    "Host → External IP"
  ]
};