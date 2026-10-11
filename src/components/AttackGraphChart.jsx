import React from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AttackGraphChart({ labels, frequency, riskScore }) {
  const data = {
    labels,
    datasets: [
      {
        label: "Frequency",
        data: frequency,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        yAxisID: "yFreq",
      },
      {
        label: "Avg Risk Score",
        data: riskScore,
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        yAxisID: "yRisk",
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      mode: "index",
      intersect: false,
    },
    stacked: false,
    plugins: {
      title: {
        display: true,
        text: "Attack Types vs Frequency & Risk Score",
        color: "white",
      },
      legend: {
        labels: {
          color: "white",
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "white" },
      },
      yFreq: {
        type: "linear",
        position: "left",
        ticks: { color: "white" },
        title: { display: true, text: "Frequency", color: "white" },
      },
      yRisk: {
        type: "linear",
        position: "right",
        ticks: { color: "white" },
        title: { display: true, text: "Avg Risk Score", color: "white" },
        grid: { drawOnChartArea: false }, // Avoid overlapping
      },
    },
  };

  return <Bar data={data} options={options} />;
}