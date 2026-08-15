import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const CATEGORY_COLORS = {
  Documents: "#2dd4bf",
  Media: "#8b5cf6",
  Archives: "#f59e0b",
  Folders: "#64748b",
  Other: "#f43f5e",
};

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function StorageChart({ summary }) {
  const categories = Object.keys(summary || {});
  const sizes = categories.map((c) => summary[c].sizeBytes);
  const totalBytes = sizes.reduce((a, b) => a + b, 0);

  const data = {
    labels: categories,
    datasets: [
      {
        data: sizes,
        backgroundColor: categories.map((c) => CATEGORY_COLORS[c] || "#475569"),
        borderColor: "#0f1420",
        borderWidth: 3,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#cbd5e1", font: { family: "Space Grotesk" } },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${formatBytes(ctx.raw)}`,
        },
      },
    },
    cutout: "68%",
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-100">Storage by category</h3>
        <span className="text-sm text-slate-400 font-mono">{formatBytes(totalBytes)} total</span>
      </div>
      {categories.length ? (
        <Doughnut data={data} options={options} />
      ) : (
        <p className="text-slate-500 text-sm">No data yet — connect Drive to scan.</p>
      )}
    </div>
  );
}
