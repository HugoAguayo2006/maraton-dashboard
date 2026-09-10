"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { convertKilograms } from "@/lib/strength/constants";
import type { StrengthProgressPoint, StrengthUnit } from "@/types/training";

export function StrengthProgressChart({ data, unit }: { data: StrengthProgressPoint[]; unit: StrengthUnit }) {
  const chartData = data.map((point) => ({
    ...point,
    label: point.date.slice(5).replace("-", "/"),
    maximum: Number(convertKilograms(point.maximumKg, unit).toFixed(2)),
    volume: Number(convertKilograms(point.volumeKg, unit).toFixed(2)),
    repetitions: point.maximumRepetitions,
  }));

  if (!chartData.length) {
    return <div className="grid min-h-64 place-items-center rounded-2xl bg-surface-subtle px-6 text-center"><div><p className="text-sm font-bold">Aún no hay progresión</p><p className="mt-1 text-xs leading-5 text-muted">Registra este ejercicio en una sesión para activar las gráficas.</p></div></div>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <ChartShell eyebrow="Peso máximo" description={`Mejor carga por sesión en ${unit}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 6, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#ededf1" strokeDasharray="3 5" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#8b8b91", fontSize: 10 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#a0a0a6", fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle()} itemStyle={{ color: "white" }} formatter={(value) => [`${Number(value).toFixed(1)} ${unit}`, "Peso máximo"]} />
            <Line type="monotone" dataKey="maximum" stroke="#2478ee" strokeWidth={2.5} dot={{ r: 3, fill: "#2478ee", strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartShell>
      <ChartShell eyebrow="Volumen" description={`Carga × repeticiones en ${unit}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 6, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#ededf1" strokeDasharray="3 5" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#8b8b91", fontSize: 10 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#a0a0a6", fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle()} itemStyle={{ color: "white" }} formatter={(value) => [`${Number(value).toFixed(0)} ${unit}`, "Volumen"]} />
            <Bar dataKey="volume" fill="#d98019" radius={[8, 8, 4, 4]} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>
      <ChartShell eyebrow="Repeticiones" description="Máximo de repeticiones por sesión" className="lg:col-span-2 xl:col-span-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 6, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#ededf1" strokeDasharray="3 5" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#8b8b91", fontSize: 10 }} dy={8} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#a0a0a6", fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle()} itemStyle={{ color: "white" }} formatter={(value) => [`${Number(value)} reps`, "Máximo"]} />
            <Line type="monotone" dataKey="repetitions" stroke="#2d9d62" strokeWidth={2.5} dot={{ r: 3, fill: "#2d9d62", strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartShell>
    </div>
  );
}

function ChartShell({ eyebrow, description, className = "", children }: { eyebrow: string; description: string; className?: string; children: React.ReactNode }) {
  return <section className={`app-card p-5 sm:p-6 ${className}`}><p className="eyebrow">{eyebrow}</p><p className="mt-2 text-sm text-muted">{description}</p><div className="mt-5 h-64">{children}</div></section>;
}

function tooltipStyle() {
  return { background: "rgba(17,17,20,.94)", border: "none", borderRadius: 14, color: "white", fontSize: 12 };
}
