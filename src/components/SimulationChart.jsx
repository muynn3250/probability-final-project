import React from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  TimeScale
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, TimeScale);

// Fisher-Yates shuffle để random sample không bias
function randomSample(array, sampleSize) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, sampleSize);
}

export default function SimulationChart({ labels, historyPlusFuture, simulated }) {
  if (!labels || !historyPlusFuture || !simulated) return null;

  // ---- NEW: chọn 200 đường random nếu simulated > 200 ----
  const MAX_PATHS = 200;
  const sampledPaths =
    simulated.length > MAX_PATHS
      ? randomSample(simulated, MAX_PATHS)
      : simulated;

  const datasets = [
    {
      label: "Actual (history+future)",
      data: historyPlusFuture,
      borderColor: "red",
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.2,
    },

    ...sampledPaths.map((path, i) => ({
      label: `Sim ${i + 1}`,
      data: path,
      borderColor: "rgba(0,0,200,0.12)",
      borderWidth: 1,
      pointRadius: 0,
      tension: 0.2,
    })),
  ];

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
    scales: {
      x: {
        ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 15 },
      },
      y: {
        title: { display: true, text: "Price" },
      },
    },
  };

  return (
    <div style={{ width: "100%", height: 420 }}>
      <Line data={{ labels, datasets }} options={options} />
    </div>
  );
}
