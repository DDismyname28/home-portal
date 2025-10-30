import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

// Custom plugin for center total text
const centerTextPlugin = {
  id: "centerText",
  beforeDraw(chart) {
    const { width } = chart;
    const { height } = chart;
    const ctx = chart.ctx;
    ctx.restore();
    const total = chart.config._config.data.datasets[0].data.reduce(
      (a, b) => a + b,
      0
    );
    ctx.font = "bold 26px 'Inter', sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#111827";
    const textX = width / 2;
    const textY = height / 2;
    ctx.textAlign = "center";
    ctx.fillText(total, textX, textY - 8);
    ctx.font = "14px 'Inter', sans-serif";
    ctx.fillStyle = "#6b7280";
    ctx.fillText("Total", textX, textY + 16);
    ctx.save();
  },
};

ChartJS.register(centerTextPlugin);

export default function Reports() {
  const [data, setData] = useState([]);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${HiiincHomeDashboardData.apiRoot}reports`, {
        method: "GET",
        credentials: "include",
        headers: { "X-WP-Nonce": HiiincHomeDashboardData.nonce },
      });
      const json = await res.json();

      if (!json.success) throw new Error("Unauthorized or failed fetch.");
      setRole(json.role);

      const report = json.data;
      let summary = [];

      if (json.role === "home_member") {
        let pending = 0,
          active = 0,
          completed = 0,
          total = 0;
        Object.values(report).forEach((m) => {
          pending += m.Pending;
          active += m.Active;
          completed += m.Completed;
          total += m.Total;
        });
        summary = [
          { name: "Pending", value: pending },
          { name: "Active", value: active },
          { name: "Completed", value: completed },
          { name: "Total Requests", value: total },
        ];
      } else if (json.role === "local_provider") {
        let pending = 0,
          active = 0,
          completed = 0,
          total = 0;
        Object.values(report.months).forEach((m) => {
          pending += m.Pending;
          active += m.Active;
          completed += m.Completed;
          total += m.Total;
        });

        summary = [
          { name: "Pending", value: pending },
          { name: "Active", value: active },
          { name: "Completed", value: completed },
          { name: "Services Offered", value: report.services_offered || 0 },
        ];
      }

      setData(summary);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <p className="text-center mt-6 text-gray-500 animate-pulse">
        Loading report...
      </p>
    );

  if (!data.length)
    return <p className="text-center mt-6 text-gray-500">No data available.</p>;

  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        label: "Report Data",
        data: data.map((d) => d.value),
        backgroundColor: [
          "#ef4444",
          "#f97316",
          "#facc15",
          "#22c55e",
          "#3b82f6",
        ],
        borderColor: "#fff",
        borderWidth: 3,
        hoverOffset: 16,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    plugins: {
      legend: {
        position: "top",
        labels: {
          boxWidth: 20,
          padding: 18,
          font: { size: 14 },
        },
      },
      tooltip: {
        backgroundColor: "#111827",
        titleColor: "#f9fafb",
        bodyColor: "#f9fafb",
        padding: 10,
        borderWidth: 0,
        displayColors: false,
      },
      title: {
        display: true,
        text:
          role === "local_provider" ? "Summary Overview" : "Summary Overview",
        font: { size: 20, weight: "bold" },
        color: "#111827",
        padding: { bottom: 20 },
      },
    },
  };

  return (
    <div className="p-8 bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-4xl mx-auto mt-10">
      <div className="relative" style={{ height: "500px" }}>
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}
