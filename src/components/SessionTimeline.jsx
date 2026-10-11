
import "./SessionTimeline.css";
import React, { useState, useRef, useEffect } from "react";
import { API_BASE } from "../config";

export default function SessionTimeline({ detectedThreats }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey. I am Alex your AI Insider Threat Advisor. Ask me about detected threats."
    }
  ]);
const chatEndRef = useRef(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
useEffect(() => {
  chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          threats: detectedThreats || []
        })
      });

      const data = await response.json();

      setMessages(prev => [...prev, data]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Error contacting AI server." }
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="chat-card">
      <h2>Ask Alex</h2>

      <div className="chat-window">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${msg.role}`}
          >
            {msg.content}
          </div>
        ))}
        {loading && <div className="chat-message assistant">Thinking...</div>}
        <div ref={chatEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Ask about threats..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>▶</button>
      </div>
    </div>
  );
}