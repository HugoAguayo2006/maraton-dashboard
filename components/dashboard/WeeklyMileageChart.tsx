"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MileageWeek } from "@/types/training";

export function WeeklyMileageChart({ data }: { data: MileageWeek[] }) {
  const hasMileage = data.some((week) => week.kilometers > 0 || (week.plannedKilometers ?? 0) > 0);
  return (
    <section className="area-chart card-enter app-card min-h-[330px] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="eyebrow">Volumen semanal</span>
          <p className="mt-2 text-sm font-medium text-muted">Kilómetros de las últimas 6 semanas</p>
        </div>
        <div className="hidden items-center gap-3 text-[10px] font-semibold text-muted sm:flex">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-accent" /> Real</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-accent-soft" /> Plan</span>
        </div>
      </div>
      {hasMileage ? <div className="mt-5 h-[230px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 0, left: -24, bottom: 0 }} barGap={-14}>
            <CartesianGrid vertical={false} stroke="#ededf1" strokeDasharray="3 5" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8b8b91", fontSize: 11, fontWeight: 600 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#a0a0a6", fontSize: 10 }}
              width={34}
            />
            <Tooltip
              cursor={{ fill: "rgba(36, 120, 238, 0.04)", radius: 12 }}
              contentStyle={{
                background: "rgba(17, 17, 20, 0.94)",
                border: "none",
                borderRadius: 14,
                boxShadow: "0 12px 30px rgba(0,0,0,0.16)",
                color: "white",
                fontSize: 12,
              }}
              labelStyle={{ color: "rgba(255,255,255,.58)", marginBottom: 4 }}
              itemStyle={{ color: "white", fontWeight: 700 }}
              formatter={(value, name) => [
                `${Number(value).toFixed(1)} km`,
                name === "kilometers" ? "Real" : "Plan",
              ]}
            />
            <Bar dataKey="plannedKilometers" fill="#eaf3ff" radius={[8, 8, 8, 8]} maxBarSize={26} />
            <Bar dataKey="kilometers" fill="#2478ee" radius={[8, 8, 8, 8]} maxBarSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div> : (
        <div className="mt-5 grid h-[230px] place-items-center rounded-2xl bg-surface-subtle text-center">
          <div><p className="text-sm font-bold">Sin volumen todavía</p><p className="mt-1 text-xs text-muted">La gráfica se activará con tu plan o primer registro.</p></div>
        </div>
      )}
    </section>
  );
}
