import React, { useState } from "react";
import "./style.css";
import { API_BASE } from "../config";

export default function NeonCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showLogWindow, setShowLogWindow] = useState(false); // <-- new state

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const handleDayClick = async (day) => {
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(formattedDate);
    setShowLogWindow(true);

    try {
      const res = await fetch(`${API_BASE}/logs/${formattedDate}`); // backend URL
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      setLogs(data.entries || []);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setLogs([]);
    }
  };

  const generateCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(currentMonth, currentYear);
    const firstDay = firstDayOfMonth(currentMonth, currentYear);

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
      const isToday =
        d === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear();

      days.push(
        <div
          key={d}
          className={`calendar-day ${isToday ? "today" : ""}`}
          onClick={() => handleDayClick(d)}
          style={{ cursor: "pointer" }}
        >
          {d}
        </div>
      );
    }

    return days;
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div className="risk-card calendar-card">
      <div className="calendar-header">
        <button onClick={prevMonth}>&lt;</button>
        <h2>{monthNames[currentMonth]} {currentYear}</h2>
        <button onClick={nextMonth}>&gt;</button>
      </div>

      <div className="calendar-grid">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} className="calendar-weekday">{d}</div>
        ))}
        {generateCalendar()}
      </div>

      {/* Floating log window */}
      {showLogWindow && (
        <div className="log-window">
          <div className="log-header">
            <h3>Logs for {selectedDate}</h3>
            <button onClick={() => setShowLogWindow(false)}>✖</button>
          </div>
          <div className="log-entries">
            {logs.length > 0 ? (
              logs.map((log, idx) => (
                <div key={idx} className={`log-entry ${log.includes("Critical") ? "critical" : ""}`}>
                  {log}
                </div>
              ))
            ) : (
              <p>No entries found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}