"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MileageWeek } from "@/types/training";

function tooltipStyle() {
  return {
    background: "rgba(17, 17, 20, 0.94)",
    border: "none",
    borderRadius: 14,
    boxShadow: "0 12px 30px rgba(0,0,0,0.16)",
    color: "white",
    fontSize: 12,
  };
}

export function ProgressCharts({ data }: { data: MileageWeek[] }) {
  const hasMileage = data.some(
    (week) => week.kilometers > 0 || (week.plannedKilometers ?? 0) > 0,
  );
  const hasRpe = data.some((week) => week.averageRpe !== undefined);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="app-card p-5 sm:p-6">
        <p className="eyebrow">Kilómetros semanales</p>
        <p className="mt-2 text-sm text-muted">Carga real vs. planificada</p>
        {hasMileage ? <div className="mt-5 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 6, right: 0, bottom: 0, left: -25 }}>
              <CartesianGrid vertical={false} stroke="#ededf1" strokeDasharray="3 5" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#8b8b91", fontSize: 11 }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#a0a0a6", fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle()} cursor={{ fill: "rgba(36,120,238,.04)" }} itemStyle={{ color: "white" }} formatter={(value, name) => [`${Number(value).toFixed(1)} km`, name === "kilometers" ? "Real" : "Plan"]} />
              <Bar dataKey="plannedKilometers" fill="#eaf3ff" radius={[8, 8, 4, 4]} />
              <Bar dataKey="kilometers" fill="#2478ee" radius={[8, 8, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </div> : <ChartEmptyState message="Carga tu plan o registra una sesión para ver el volumen." />}
      </section>

      <section className="app-card p-5 sm:p-6">
        <p className="eyebrow">Esfuerzo percibido</p>
        <p className="mt-2 text-sm text-muted">Promedio de RPE por semana</p>
        {hasRpe ? <div className="mt-5 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: -28 }}>
              <defs>
                <linearGradient id="rpeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d98019" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#d98019" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#ededf1" strokeDasharray="3 5" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#8b8b91", fontSize: 11 }} dy={8} />
              <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: "#a0a0a6", fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle()} itemStyle={{ color: "white" }} formatter={(value) => [`${Number(value).toFixed(1)} / 10`, "RPE"]} />
              <Area type="monotone" dataKey="averageRpe" stroke="#d98019" strokeWidth={2.5} fill="url(#rpeFill)" activeDot={{ r: 5, fill: "#d98019", stroke: "white", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div> : <ChartEmptyState message="El esfuerzo aparecerá después de tu primer registro." />}
      </section>
    </div>
  );
}

function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="mt-5 grid h-64 place-items-center rounded-2xl bg-surface-subtle px-6 text-center">
      <div><p className="text-sm font-bold">Aún no hay suficientes datos</p><p className="mt-1 text-xs leading-5 text-muted">{message}</p></div>
    </div>
  );
}
