import React, { useEffect, useState, useRef } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Reports() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const [chartHeight, setChartHeight] = useState(400);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.height > 0) {
          setChartHeight(entry.contentRect.height);
        }
      }
    });
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => {
      if (containerRef.current) resizeObserver.unobserve(containerRef.current);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, custRes, servRes] = await Promise.all([
        fetch(`${HiiincHomeDashboardData.apiRoot}get-requests`, {
          method: "GET",
          credentials: "include",
          headers: { "X-WP-Nonce": HiiincHomeDashboardData.nonce },
        }),
        fetch(`${HiiincHomeDashboardData.apiRoot}get-customers`, {
          method: "GET",
          credentials: "include",
          headers: { "X-WP-Nonce": HiiincHomeDashboardData.nonce },
        }),
        fetch(`${HiiincHomeDashboardData.apiRoot}get-vendor-requests`, {
          method: "GET",
          credentials: "include",
          headers: { "X-WP-Nonce": HiiincHomeDashboardData.nonce },
        }),
      ]);

      const [reqJson, custJson, servJson] = await Promise.all([
        reqRes.json(),
        custRes.json(),
        servRes.json(),
      ]);

      // Month abbreviation helper
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const getMonth = (dateStr) => {
        const d = new Date(dateStr);
        return monthNames[d.getMonth()];
      };

      // Pre-fill monthsMap with all 12 months
      const monthsMap = {};
      monthNames.forEach((m) => {
        monthsMap[m] = { month: m, Requests: 0, Customers: 0, Services: 0 };
      });

      // Aggregate monthly counts
      reqJson.data.forEach((r) => {
        const month = getMonth(r.date || r.post_date);
        monthsMap[month].Requests += 1;
      });

      custJson.data.forEach((c) => {
        const month = getMonth(c.registered || new Date());
        monthsMap[month].Customers += 1;
      });

      servJson.data.forEach((s) => {
        const month = getMonth(s.post_date || new Date());
        monthsMap[month].Services += 1;
      });

      // Convert to array in calendar order
      const sortedData = Object.values(monthsMap);

      setData(sortedData);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <p className="text-center mt-6 text-gray-500">Loading report...</p>;

  if (!data.length)
    return <p className="text-center mt-6 text-gray-500">No data available.</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        Chart Overview
      </h2>

      <div
        ref={containerRef}
        className="bg-white p-4 rounded-2xl shadow w-full"
        style={{ minHeight: "400px" }}
      >
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            {/* Stacked bars */}
            <Bar dataKey="Requests" stackId="stack" fill="#ff6384" />
            <Bar dataKey="Customers" stackId="stack" fill="#ff9f40" />
            <Bar dataKey="Services" stackId="stack" fill="#36a2eb" />
            {/* Line overlay */}
            <Line
              type="monotone"
              dataKey="Requests"
              stroke="#ffcd56"
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
