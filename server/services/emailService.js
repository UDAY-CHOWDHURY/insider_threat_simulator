import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const ALERT_EMAIL = process.env.ALERT_EMAIL;
const RECIPIENT = "xxxxx@gmail.com";

export async function sendEmail(alert) {
  const msg = {
    to: RECIPIENT,
    from: ALERT_EMAIL,
    subject: `INSIDER THREAT ALERT [${alert.severity}]`,
    text: `
User: ${alert.user}
Host: ${alert.host}
Time: ${alert.time}

Risk Score: ${alert.riskScore}
Severity: ${alert.severity}

Description:
${alert.description}
`
  };

  await sgMail.send(msg);
}