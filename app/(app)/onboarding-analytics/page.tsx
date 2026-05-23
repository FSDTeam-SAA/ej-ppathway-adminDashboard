"use client";

import { useMemo, useState } from "react";
import { Topbar } from "../../components/Topbar";
import { PageHeader } from "../../components/PageHeader";
import { DonutChart, MiniArea } from "../../components/charts";
import {
  ApproveIcon,
  CalendarIcon,
  ChevronDownIcon,
  ClockIcon,
  CrownIcon,
  SmartphoneIcon,
  UsersIcon,
} from "../../components/Icons";

type RangeKey = "today" | "this-week" | "this-month" | "custom";

const RANGE_LABEL: Record<RangeKey, string> = {
  today: "Today",
  "this-week": "This Week",
  "this-month": "This Month",
  custom: "Custom",
};

export default function OnboardingAnalyticsPage() {
  const [dateLabel] = useState("May 07 - May 13, 2026");

  return (
    <>
      <Topbar />
      <main className="px-6 md:px-8 pb-10">
        <PageHeader
          title="Onboarding Analytics"
          description="Track onboarding performance, user behavior and conversion metrics."
          action={<DateRangePill value={dateLabel} />}
        />

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Onboarding Started"
            value="12,580"
            icon={<UsersIcon />}
            color="#a78bfa"
          />
          <StatCard
            label="Completed Onboarding"
            value="7725"
            icon={<ApproveIcon />}
            color="#60a5fa"
          />
          <StatCard
            label="Completion Rate"
            value="61.5%"
            icon={<CrownIcon />}
            color="#fbbf24"
          />
          <StatCard
            label="Avg. Completion Time"
            value="1m 24s"
            icon={<ClockIcon />}
            color="#c084fc"
          />
        </div>

        {/* Funnel + Completion over time */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader title="Onboarding Funnel" range="this-week" />
            <FunnelChart />
          </Card>

          <Card>
            <CardHeader title="Onboarding Completion Over Time" range="this-week" />
            <CompletionLineChart />
          </Card>
        </div>

        {/* Drop-off + Paywall donut + Device donut */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card>
            <CardHeader title="Drop-off Analysis" range="this-week" />
            <DropOffTable />
          </Card>

          <Card>
            <CardHeader title="Paywall Conversion Overview" range="this-week" />
            <PaywallDonut />
          </Card>

          <Card>
            <CardHeader title="Completion Rate by Device" range="this-week" />
            <DeviceDonut />
            <MobileCompletionWidget rate={62.3} delta={6.1} />
          </Card>
        </div>
      </main>
    </>
  );
}

// ---------- Shared building blocks ----------

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function CardHeader({
  title,
  range = "this-week",
}: {
  title: string;
  range?: RangeKey;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <RangePill value={range} />
    </div>
  );
}

function RangePill({ value }: { value: RangeKey }) {
  return (
    <span className="inline-flex items-center gap-2 h-8 px-3 rounded-md border border-slate-200 bg-white text-xs text-slate-700">
      {RANGE_LABEL[value]}
      <ChevronDownIcon size={14} />
    </span>
  );
}

function DateRangePill({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-slate-200 bg-white text-sm text-slate-700">
      <CalendarIcon size={16} className="text-[#0a7a90]" />
      {value}
      <ChevronDownIcon size={14} />
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm relative overflow-hidden min-h-35">
      <div
        className="h-11 w-11 rounded-xl inline-flex items-center justify-center"
        style={{ background: `${color}22`, color }}
      >
        {icon}
      </div>
      <div className="mt-3 text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl md:text-3xl font-bold text-slate-900">
        {value}
      </div>
      <div className="absolute right-0 bottom-0 w-28 opacity-90 pointer-events-none">
        <MiniArea
          values={[2, 3, 4, 3, 5, 7, 6, 8, 9, 8]}
          color={color}
          height={48}
        />
      </div>
    </div>
  );
}

// ---------- Funnel ----------

const FUNNEL_STEPS = [
  { label: "Users Signed UP", value: 12580, pct: 100, color: "#c4b5fd" },
  { label: "Started Onboarding", value: 12580, pct: 100, color: "#7dd3fc" },
  { label: "Completed  Step 1", value: 12580, pct: 100, color: "#bae6fd" },
  { label: "Completed  Step2", value: 12580, pct: 100, color: "#86efac" },
  { label: "Completed  Step 3", value: 12580, pct: 100, color: "#fde68a" },
  { label: "Viewed Recommendations", value: 12580, pct: 100, color: "#fdba74" },
  { label: "Viewed paywall", value: 12580, pct: 100, color: "#fda4af" },
  { label: "Completed Payment", value: 12580, pct: 100, color: "#fca5a5" },
];

function FunnelChart() {
  return (
    <div className="space-y-3">
      {FUNNEL_STEPS.map((s, i) => {
        // The widest bar in the mockup is at the top; each row narrows slightly.
        const width = 100 - i * 5;
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="flex-1">
              <div
                className="rounded-full h-9 inline-flex items-center justify-center text-sm text-slate-800 font-medium"
                style={{
                  width: `${width}%`,
                  background: s.color,
                  minWidth: 220,
                }}
              >
                {s.label}
              </div>
            </div>
            <div className="text-sm text-slate-700 font-medium w-14 text-right">
              {s.value.toLocaleString()}
            </div>
            <div className="text-sm text-slate-700 font-semibold w-12 text-right">
              {s.pct}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Completion Over Time line chart ----------

const COMPLETION_DATA = [
  { label: "Mon", value: 53 },
  { label: "Tue", value: 55 },
  { label: "Wed", value: 57 },
  { label: "Thu", value: 90 },
  { label: "Fri", value: 55 },
  { label: "Sat", value: 75 },
  { label: "Sun", value: 95 },
];

function CompletionLineChart() {
  return (
    <div className="h-80">
      <AnnotatedLineChart data={COMPLETION_DATA} />
    </div>
  );
}

function AnnotatedLineChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const w = 800;
  const h = 320;
  const padX = 40;
  const padY = 36;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2 - 24;
  const max = 100;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const points = data.map((d, i) => {
    const x = padX + i * stepX;
    const y = padY + innerH - (d.value / max) * innerH;
    return [x, y] as const;
  });

  const linePath = points
    .map((p, i, arr) => {
      if (i === 0) return `M ${p[0]} ${p[1]}`;
      const prev = arr[i - 1];
      const cx1 = (prev[0] + p[0]) / 2;
      return `C ${cx1} ${prev[1]} ${cx1} ${p[1]} ${p[0]} ${p[1]}`;
    })
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1][0]} ${
    padY + innerH
  } L ${points[0][0]} ${padY + innerH} Z`;

  const yTicks = [0, 300, 600, 900, 1200];

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="completionFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.04" />
        </linearGradient>
      </defs>

      {yTicks.map((t, i) => {
        const y = padY + innerH * (1 - i / (yTicks.length - 1));
        return (
          <g key={t}>
            <line
              x1={padX}
              y1={y}
              x2={padX + innerW}
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray="3,3"
            />
            <text x={padX - 8} y={y + 3} fontSize="11" textAnchor="end" fill="#94a3b8">
              {t}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#completionFill)" />
      <path d={linePath} fill="none" stroke="#0a7a90" strokeWidth="2.5" />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="5" fill="white" stroke="#0a7a90" strokeWidth="2" />
          <text
            x={p[0]}
            y={p[1] - 12}
            fontSize="12"
            fontWeight="600"
            textAnchor="middle"
            fill="#0a7a90"
          >
            {data[i].value}%
          </text>
        </g>
      ))}

      {data.map((d, i) => (
        <text
          key={i}
          x={padX + i * stepX}
          y={h - 6}
          fontSize="12"
          textAnchor="middle"
          fill="#64748b"
        >
          {d.label}
        </text>
      ))}
    </svg>
  );
}

// ---------- Drop-off table ----------

const DROPOFFS = [
  { step: "Step 1 : User Intent", rate: 12.7, users: 2580 },
  { step: "Step2 : Guidance Style", rate: 12.7, users: 1710 },
  { step: "Step 3 : Communication Method", rate: 12.7, users: 1130 },
  { step: "Step 4 : Comfort & Personality", rate: 12.7, users: 970 },
  { step: "Step 5 : Usage Frequency", rate: 12.7, users: 780 },
  { step: "Step 6 : Focus Area", rate: 12.7, users: 1230 },
  { step: "Step 7 : Trust Priorities", rate: 12.7, users: 1230 },
  { step: "Step 8 : Review & complete", rate: 12.7, users: 1230 },
];

function DropOffTable() {
  return (
    <div>
      <div className="grid grid-cols-[1fr_140px_90px] text-xs text-slate-500 px-1 pb-3 border-b border-slate-100">
        <span>Step</span>
        <span>Drop-off Rate</span>
        <span className="text-right">Users Drop-off</span>
      </div>
      <div className="divide-y divide-slate-50">
        {DROPOFFS.map((d) => (
          <div
            key={d.step}
            className="grid grid-cols-[1fr_140px_90px] items-center py-3 text-sm"
          >
            <span className="text-slate-700 pr-2 leading-tight">{d.step}</span>
            <div className="flex items-center gap-2 pr-3">
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#0a7a90]"
                  style={{ width: `${Math.min(100, d.rate * 4)}%` }}
                />
              </div>
              <span className="text-slate-700 font-medium tabular-nums">
                {d.rate}%
              </span>
            </div>
            <span className="text-right text-slate-700 tabular-nums">
              {d.users.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Paywall donut ----------

const PAYWALL = [
  { label: "Wallet Selected", value: 1360, pct: 32.0, color: "#10b981" },
  { label: "Subscription Selected", value: 1150, pct: 27.1, color: "#fbbf24" },
  { label: "Payment Completed", value: 1020, pct: 24.0, color: "#bae6fd" },
  { label: "Abandoned", value: 720, pct: 16.9, color: "#0a7a90" },
];

function PaywallDonut() {
  const data = useMemo(
    () => PAYWALL.map((p) => ({ label: p.label, value: p.value, color: p.color })),
    []
  );
  return (
    <div className="flex flex-col items-center">
      <DonutChart
        data={data}
        centerLabel="4250"
        centerSub="Users Reached pay wall"
        showLegend={false}
      />
      <div className="mt-4 w-full space-y-3">
        {PAYWALL.map((p) => (
          <div
            key={p.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="flex items-center gap-2 text-slate-700">
              <span
                className="h-2.5 w-2.5 rounded-full inline-block"
                style={{ background: p.color }}
              />
              {p.label}
            </span>
            <span className="text-slate-700 tabular-nums">
              {p.value.toLocaleString()}{" "}
              <span className="text-slate-400">({p.pct.toFixed(1)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Device donut ----------

const DEVICES = [
  { label: "Mobile app", value: 5160, pct: 66.8, color: "#10b981" },
  { label: "Mobile Web", value: 1780, pct: 23.1, color: "#fbbf24" },
  { label: "Desktop", value: 785, pct: 10.1, color: "#0a7a90" },
];

function DeviceDonut() {
  return (
    <div className="flex items-center gap-4">
      <DonutChart
        data={DEVICES.map((d) => ({
          label: d.label,
          value: d.value,
          color: d.color,
        }))}
        size={170}
        thickness={28}
        centerLabel="7,725"
        centerSub="Completed Users"
        showLegend={false}
      />
      <div className="flex-1 space-y-2">
        {DEVICES.map((d) => (
          <div
            key={d.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="flex items-center gap-2 text-slate-700">
              <span
                className="h-2.5 w-2.5 rounded-full inline-block"
                style={{ background: d.color }}
              />
              {d.label}
            </span>
            <span className="text-slate-700 tabular-nums">
              {d.value.toLocaleString()}{" "}
              <span className="text-slate-400">({d.pct.toFixed(1)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileCompletionWidget({
  rate,
  delta,
}: {
  rate: number;
  delta: number;
}) {
  return (
    <div className="mt-5 rounded-xl bg-[#e6f2f6]/80 px-4 py-3 flex items-center gap-3">
      <div className="h-11 w-11 rounded-lg bg-white inline-flex items-center justify-center text-[#0a7a90]">
        <SmartphoneIcon size={20} />
      </div>
      <div className="flex-1">
        <div className="text-xs text-slate-600">
          Mobile Users Completion Rate
        </div>
        <div className="text-2xl font-bold text-slate-900 leading-tight">
          {rate.toFixed(1)}%
        </div>
      </div>
      <div className="text-xs text-[#0a7a90] font-medium whitespace-nowrap">
        {delta.toFixed(1)}% From last week
      </div>
    </div>
  );
}

