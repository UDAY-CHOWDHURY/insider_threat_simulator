# CyberHub - Unified AI SOC Platform

**CyberHub (InsideSOC)** is an AI-driven Security Operations Center (SOC) platform designed to detect insider threats, file system anomalies, and attack chains using behavioral intelligence and statistical machine learning.

---

## 🚀 Features

- **🛡️ Real-Time Threat Detection**: Identifies malicious file lifecycle patterns (rapid creation, unauthorized modifications, bulk deletions, tampering).
- **📊 Interactive SOC Dashboard**: Visualizes risk scores, active alerts, and attack distribution charts via Chart.js and React.
- **📅 Neon Activity Calendar**: Browse, inspect, and analyze system activity logs by date.
- **🤖 AI Threat Advisor ("Alex")**: An integrated AI SOC analyst powered by Ollama / LLM and Python behavioral sequence classifiers.
- **✉️ Automated Alerts**: Integrates with Mailgun and SendGrid to dispatch immediate notifications upon high-risk incidents.

---

## 🏗️ Architecture

```
insidesoc/
├── src/                  # React 19 + Vite Frontend
│   ├── components/       # Dashboard, AlertsPanel, AttackGraph, RiskScoreCard, SessionTimeline
│   └── App.jsx           # Admin Authentication & Application Shell
├── server/               # Express.js API Server
│   ├── routes/           # REST & AI chat endpoints (/ai-chat, /analyze-event, /alerts, /logs)
│   ├── services/         # Mailgun, SendGrid & Ollama integrations
│   └── index.js          # API entrypoint
└── ai-engine/            # Python Behavioral Analysis Engine
    ├── classifier.py     # Median + 3 MAD dynamic statistical anomaly classifier
    ├── insider_risk_analysis.py # Real-time file system observer & watcher
    └── alerts_log.txt    # Activity log history
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+) with `numpy`

### 2. Install Dependencies

#### Frontend:
```bash
cd insidesoc
npm install
```

#### Server:
```bash
cd server
npm install
```

### 3. Environment Configuration
Copy the example environment file in `server/`:
```bash
cp server/.env.example server/.env
```
Configure your Mailgun or SendGrid API keys in `server/.env` if email alerting is desired.

### 4. Running the Project

#### Step 1: Start the Backend Server
```bash
cd server
npm start
# Server runs on http://localhost:5000
```
Or from the root `insidesoc` directory:
```bash
npm run server
```

#### Step 2: Start the Frontend Application
In a separate terminal:
```bash
npm run dev
# Vite runs on http://localhost:5173
```

### 5. Accessing the Platform
1. Open [http://localhost:5173](http://localhost:5173) in your browser.
2. Sign in with the default admin credentials:
   - **Email:** `abcd@gmail.com`
   - **Password:** `admin123`
3. Launch the SOC Dashboard to monitor alerts, inspect calendar logs, and interact with the AI Advisor.

---

## 📄 License
ISC
