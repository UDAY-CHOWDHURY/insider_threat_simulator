import express from "express";
import { shouldTriggerEmail } from "../services/riskEngine.js";
import { sendEmail } from "../services/emailService.js";

const router = express.Router();

let alertStore = [];

router.post("/", async (req, res) => {
  const alert = req.body;

  alertStore.push(alert);

  if (shouldTriggerEmail(alert)) {
    await sendEmail(alert);
  }

  res.json({ success: true });
});

router.get("/alerts", (req, res) => {
  res.json(alertStore);
});

export default router;