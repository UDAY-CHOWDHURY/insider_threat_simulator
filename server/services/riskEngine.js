export const RISK_THRESHOLD = "Put your threshold here";

export function shouldTriggerEmail(alert) {
  return alert.riskScore >= RISK_THRESHOLD;
}