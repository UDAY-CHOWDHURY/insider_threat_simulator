
import express from "express";
import fs from "fs";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { generateAIResponse } from "../services/ollamaService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const DEFAULT_PYTHON_PATH = path.resolve(__dirname, "../../ai-engine/classifier.py");
const pythonFilePath = process.env.PYTHON_CLASSIFIER_PATH && fs.existsSync(process.env.PYTHON_CLASSIFIER_PATH)
  ? process.env.PYTHON_CLASSIFIER_PATH
  : DEFAULT_PYTHON_PATH;

// ------------------ ROUTE ------------------
router.post("/", async (req, res) => {
  try {
    const { messages } = req.body;

    // ------------------ GET TODAY DATE ------------------
    const today = new Date().toISOString().split("T")[0];

    // ------------------ CALL PYTHON ------------------
    const classified = await runPythonModel(today);
   console.log("classified =", classified);
console.log("isArray =", Array.isArray(classified));
    // ------------------ FALLBACK ------------------
    if (!classified || classified.length === 0) {
      const reply = await generateAIResponse(messages, []);
      return res.json({ role: "assistant", content: reply });
    }

    // ------------------ FILTER ATTACKS ------------------
    const attacks = classified.filter(
      c => c.PREDICTED_ATTACK !== "normal_behavior"
    );

    const sequences = attacks.map(a => ({
      file: a.file,
      sequence: a.PREDICTED_ATTACK
    }));

    // ------------------ SEND TO OLLAMA ------------------
    const aiReply = await generateAIResponse(messages, sequences);

    return res.json({
      role: "assistant",
      content: aiReply
    });

  } catch (error) {
    console.error("AI Route Error:", error);

    return res.status(500).json({
      role: "assistant",
      content: "AI server error."
    });
  }
});

// ------------------ PYTHON RUNNER ------------------
function runPythonModel(todayDate) {
  return new Promise((resolve, reject) => {
    const pythonCmd = process.env.PYTHON_BIN || (process.platform === "win32" ? "python" : "python3");
    const py = spawn(pythonCmd, ["-u", pythonFilePath]);

    let data = "";

    py.stdout.on("data", chunk => {
      data += chunk.toString();
    });

    py.stderr.on("data", chunk => {
      console.log("PY ERROR:", chunk.toString());
    });

    py.on("close", () => {
      try {
        resolve(JSON.parse(data.trim()));
      } catch (e) {
        reject("Invalid JSON from Python");
      }
    });

    // send ONLY today date
    py.stdin.write(todayDate);
    py.stdin.end();
  });
}

export default router;