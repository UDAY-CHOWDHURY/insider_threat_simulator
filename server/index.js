
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import formData from "form-data";
import Mailgun from "mailgun.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import aiChatRoute from "./routes/aiChat.js";

import { spawn } from "child_process";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------ Mailgun setup ------------------
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY,
});

// ------------------ Express setup ------------------
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use("/ai-chat", aiChatRoute);

// ------------------ Config ------------------
const ALERT_EMAIL = process.env.ALERT_EMAIL;
const RECIPIENT_EMAILS = (process.env.RECIPIENT_EMAIL || "").split(",").map(e => e.trim()).filter(Boolean);
const RISK_THRESHOLD = 70;
const DEFAULT_LOG_PATH = path.resolve(__dirname, "../ai-engine/alerts_log.txt");
const LOG_PATH = process.env.LOG_PATH && fs.existsSync(process.env.LOG_PATH)
  ? process.env.LOG_PATH
  : DEFAULT_LOG_PATH;

let alertStore = [];

// ------------------ AI Analysis Endpoint ------------------
app.post("/analyze-event", async (req, res) => {
  const alert = req.body;

  if (!alert || alert.riskScore === undefined) {
    return res.status(400).json({ error: "Invalid alert data" });
  }

  alertStore.push(alert);

  console.log(`[ALERT RECEIVED] User: ${alert.user}, Risk Score: ${alert.riskScore}`);

  if (alert.riskScore >= RISK_THRESHOLD) {
    try {
      await sendEmail(alert);
      console.log(`[EMAIL SENT] User: ${alert.user}, Severity: ${alert.severity}`);
    } catch (err) {
      console.error("[EMAIL FAILED]", err);
    }
  }

  res.status(200).json({
    message: "Analysis processed",
    emailSent: alert.riskScore >= RISK_THRESHOLD,
  });
});

// ------------------ Fetch Logs by Date ------------------
app.get("/logs/:date", (req, res) => {
  const requestedDate = req.params.date;
  console.log("Requested date:", requestedDate);

  fs.readFile(LOG_PATH, "utf8", (err, data) => {
    if (err) {
      console.error("File read error:", err);
      return res.status(500).json({ error: "Cannot read log file" });
    }

    const lines = data.split("\n").filter(Boolean);

    // Filter lines that start with the requested date (YYYY-MM-DD)
    const filteredLogs = lines.filter(line => line.startsWith(requestedDate));

    res.json({ entries: filteredLogs });
  });
});

// ------------------ Fetch Today's Threats ------------------
app.get("/alerts", (req, res) => {
  res.json(alertStore);
});

// ------------------ AI Chat Endpoint ------------------
app.post("/ai-chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages) {
      return res.status(400).json({ error: "No messages sent" });
    }

    // ================================
    // 1. GET TODAY DATE
    // ================================
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // ================================
    // 2. READ LOG FILE
    // ================================
    const fileData = fs.readFileSync(LOG_PATH, "utf8");

    const lines = fileData.split("\n").filter(Boolean);

    // ================================
    // 3. FILTER TODAY'S LOGS
    // ================================
    const todaysLogs = lines.filter(line => line.startsWith(today));

    if (!todaysLogs.length) {
      return res.json({
        role: "assistant",
        content: "No logs found for today."
      });
    }

    // ================================
    // 4. CONVERT TO TEXT FOR PYTHON
    // ================================
    const logText = todaysLogs.join("\n");

    // ================================
    // 5. RUN PYTHON CLASSIFIER
    // ================================
    const classified = await runPythonModel(logText);

    console.log("=== CLASSIFIER OUTPUT ===");
    console.log(classified);

    if (!classified || !classified.length) {
      return res.json({
        role: "assistant",
        content: "No classified results returned."
      });
    }

    // ================================
    // 6. FILTER ATTACKS ONLY
    // ================================
    const filtered = classified.filter(
      c =>
        c.PREDICTED_ATTACK !== "normal_behavior" &&
        c.PREDICTED_ATTACK !== "unknown_pattern"
    );

    // ================================
    // 7. SORT BY RISK (IMPORTANT)
    // ================================
    filtered.sort((a, b) => b.MAX_RISK - a.MAX_RISK);

    // ================================
    // 8. BUILD LLM CONTEXT
    // ================================


    // ================================
    // 9. SYSTEM PROMPT (UPGRADED)
    // ================================
  
    // ================================
    // 11. RETURN RESPONSE
    // ================================
    return res.json({
      role: "assistant",
      content: aiResponse.message.content
    });

  } catch (err) {
    console.error("AI CHAT ERROR:", err);

    return res.status(500).json({
      error: "AI processing failed"
    });
  }
});

// ------------------ Mailgun Email Function ------------------
async function sendEmail(alert) {
  const messageData = {
    from: ALERT_EMAIL,
    to: RECIPIENT_EMAILS,
    subject: `INSIDER THREAT ALERT [${alert.severity}]`,
    text: `
 Insider Threat  Alert

User: ${alert.user}
Host: ${alert.host || "N/A"}
Time: ${alert.time || new Date().toISOString()}

Risk Score: ${alert.riskScore}
Severity: ${alert.severity}

Description:In
${alert.description} has occured please follow necessary precautions.
    `,
  };

  await mg.messages.create(process.env.MAILGUN_DOMAIN, messageData);
}

// ------------------ Start Server ------------------
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`AI SOC Backend running on http://localhost:${PORT}`);
});

function runPythonModel(logText) {
  return new Promise((resolve, reject) => {
    const pythonCmd = process.env.PYTHON_BIN || (process.platform === "win32" ? "python" : "python3");
    const scriptPath = path.resolve(__dirname, "../ai-engine/classifier.py");
    const py = spawn(pythonCmd, [scriptPath]);

    let data = "";
    let error = "";

    // Collect stdout
    py.stdout.on("data", chunk => {
      data += chunk.toString();
    });

    // Collect stderr (don't fail immediately)
    py.stderr.on("data", chunk => {
      error += chunk.toString();
    });

    // Handle process close
    py.on("close", code => {
      if (code !== 0) {
        console.error("Python exited with code:", code);
        console.error("stderr:", error);
        return reject("Python process failed");
      }

      try {
        const parsed = JSON.parse(data.trim());
        resolve(parsed);
      } catch (parseErr) {
        console.error("JSON Parse Error:", parseErr);
        console.error("Raw output:", data);
        reject("Invalid JSON from Python");
      }
    });

    // Safety timeout (optional but useful)
    setTimeout(() => {
      py.kill();
      reject("Python process timeout");
    }, 10000); // 10 seconds

    // Send input
    py.stdin.write(logText);
    py.stdin.end();
  });
}