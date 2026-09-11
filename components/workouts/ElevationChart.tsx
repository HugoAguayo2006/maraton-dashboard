"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ElevationChart({ distances, elevations }: { distances: number[]; elevations: number[] }) {
  const length = Math.min(distances.length, elevations.length);
  const step = Math.max(1, Math.ceil(length / 300));
  const data = Array.from({ length: Math.ceil(length / step) }, (_, index) => {
    const sourceIndex = Math.min(index * step, length - 1);
    return { distance: distances[sourceIndex] / 1000, elevation: elevations[sourceIndex] };
  });
  if (data.length < 2) return null;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
          <defs><linearGradient id="elevationFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2478ee" stopOpacity={0.3} /><stop offset="100%" stopColor="#2478ee" stopOpacity={0.02} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="#ededf1" strokeDasharray="3 5" />
          <XAxis dataKey="distance" type="number" domain={["dataMin", "dataMax"]} axisLine={false} tickLine={false} tick={{ fill: "#8b8b91", fontSize: 10 }} tickFormatter={(value) => `${Number(value).toFixed(0)} km`} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#a0a0a6", fontSize: 10 }} tickFormatter={(value) => `${value} m`} />
          <Tooltip contentStyle={{ background: "rgba(17,17,20,.94)", border: "none", borderRadius: 14, color: "white", fontSize: 12 }} labelFormatter={(value) => `${Number(value).toFixed(2)} km`} formatter={(value) => [`${Math.round(Number(value))} m`, "Elevación"]} />
          <Area type="monotone" dataKey="elevation" stroke="#2478ee" strokeWidth={2.5} fill="url(#elevationFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

