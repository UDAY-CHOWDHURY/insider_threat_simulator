
export async function generateAIResponse(messages, sequences) {

  const todayMessage = "Today's File Activity Sequences:\n";

  const threatContext = sequences.length
    ? todayMessage +
      sequences
        .map(
          (s, i) => `Event ${i + 1}
File: ${s.file}
Activity Sequence: ${s.sequence}`
        )
        .join("\n\n")
    : todayMessage + "No suspicious activity detected.";

  const systemPrompt = `
You are "Alex", an AI Security Operations Center (SOC) Analyst.

Your role:
- Analyze file system activity logs
- Detect security threats
- Explain attack patterns clearly
- Help security analysts understand incidents

RULES:
1. Always prioritize File Activity Logs over conversation.
2. If attack patterns exist, explain:
   - what happened
   - why it is dangerous
   - severity (Low / Medium / High / Critical)
3. If no attacks exist, say system is normal.
4. Never hallucinate attacks not present in logs.
5. Be concise but security-focused.
6. Do NOT mention "TXT file" or backend system.

ATTACK LABEL MEANINGS:
- attack_file_lifecycle_abuse = file created, modified, then deleted (possible cover-up)
- attack_data_destruction = multiple deletions detected (data wiping behavior)
- suspicious_bulk_creation = unusual rapid file creation
- attack_data_tampering = file moved and deleted or altered path behavior

STYLE:
- Act like a SOC dashboard analyst
- Be direct and factual
- No unnecessary greetings unless user greets first
`;

  const conversation = messages
    ?.map(m => `${m.role}: ${m.content}`)
    .join("\n");

  const fullPrompt = `
${systemPrompt}

File Activity Logs:
${threatContext}

Conversation:
${conversation}

assistant:
`;

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3",
      prompt: fullPrompt,
      stream: false
    })
  });

  const data = await response.json();

  return data.response;
}