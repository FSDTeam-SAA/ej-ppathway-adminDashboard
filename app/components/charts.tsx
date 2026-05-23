"use client";

// Lightweight, dependency-free chart primitives drawn with SVG.

export function BarChartSimple({
  data,
  height = 280,
  formatValue,
  showGrid = true,
}: {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  formatValue?: (n: number) => string;
  showGrid?: boolean;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const palette = [
    "#fbbf24",
    "#fbbf24",
    "#60a5fa",
    "#a78bfa",
    "#34d399",
    "#f87171",
    "#22c55e",
  ];
  const ticks = [0, 20, 40, 60, 80, 100];

  return (
    <div className="w-full flex" style={{ height }}>
      {showGrid ? (
        <div
          className="flex flex-col justify-between py-2 pr-3 text-[11px] text-slate-400 select-none"
          style={{ height }}
        >
          {[...ticks].reverse().map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      ) : null}
      <div className="relative flex-1 h-full">
        {showGrid ? (
          <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
            {ticks.map((t) => (
              <div key={t} className="border-t border-dashed border-slate-200" />
            ))}
          </div>
        ) : null}
        <div className="relative grid grid-cols-7 gap-2 sm:gap-3 h-full items-end pt-3 pb-6">
          {data.map((d, i) => {
            const pct = (d.value / max) * 100;
            const h = `${Math.max(6, pct)}%`;
            const color = d.color || palette[i % palette.length];
            return (
              <div
                key={i}
                className="relative flex flex-col items-center justify-end h-full"
              >
                <div
                  className="w-full max-w-12.5 rounded-t-2xl flex items-start justify-center pt-2"
                  style={{ height: h, background: color }}
                >
                  <span className="text-[11px] font-semibold text-white drop-shadow">
                    {formatValue ? formatValue(d.value) : `${Math.round(pct)}%`}
                  </span>
                </div>
                <div className="absolute -bottom-5 text-[11px] text-slate-500">
                  {d.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function HorizontalBarChart({
  data,
}: {
  data: { label: string; value: number; max?: number; color?: string }[];
}) {
  const overallMax = 100;
  const palette = ["#22d3ee", "#a78bfa", "#fbbf24", "#7c3aed", "#34d399"];
  const ticks = [0, 20, 40, 60, 80, 100];

  return (
    <div>
      {/* top axis */}
      <div className="ml-20 mb-2 flex justify-between text-[11px] text-slate-400">
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <div className="space-y-5">
        {data.map((d, i) => {
          const pct = Math.min(100, Math.round((d.value / overallMax) * 100));
          const color = d.color || palette[i % palette.length];
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="w-20 text-sm text-slate-700 truncate">
                {d.label}
              </span>
              <div className="relative flex-1 h-6 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full flex items-center justify-end pr-3"
                  style={{ width: `${pct}%`, background: color }}
                >
                  <span className="text-[11px] font-semibold text-white">
                    {pct}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DonutChart({
  data,
  size = 200,
  thickness = 30,
  centerLabel,
  centerSub,
  showLegend = true,
  showLabels = false,
}: {
  data: { label: string; value: number; color?: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
  showLegend?: boolean;
  showLabels?: boolean;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const palette = ["#0a7a90", "#fbbf24", "#a78bfa", "#60a5fa", "#34d399", "#f87171"];
  const radius = size / 2 - thickness / 2;
  const cx = size / 2;
  const cy = size / 2;
  let cumulative = 0;

  const arcs = data.map((d, i) => {
    const portion = d.value / total;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += portion;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const largeArc = portion > 0.5 ? 1 : 0;
    const dpath = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
    const color = d.color || palette[i % palette.length];
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = radius + thickness / 2 + 14;
    const lx = cx + labelRadius * Math.cos(midAngle);
    const ly = cy + labelRadius * Math.sin(midAngle);
    return {
      dpath,
      color,
      label: d.label,
      value: d.value,
      pct: Math.round(portion * 100),
      lx,
      ly,
    };
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {arcs.map((a, i) => (
            <path
              key={i}
              d={a.dpath}
              fill="none"
              stroke={a.color}
              strokeWidth={thickness}
              strokeLinecap="butt"
            />
          ))}
          {showLabels &&
            arcs.map((a, i) => (
              <text
                key={`t-${i}`}
                x={a.lx}
                y={a.ly}
                fontSize="11"
                fontWeight="600"
                textAnchor="middle"
                fill={a.color}
              >
                {a.pct}%
              </text>
            ))}
        </svg>
        {(centerLabel || centerSub) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {centerLabel ? (
              <div className="text-2xl font-bold text-slate-900">
                {centerLabel}
              </div>
            ) : null}
            {centerSub ? (
              <div className="text-sm text-slate-500">{centerSub}</div>
            ) : null}
          </div>
        )}
      </div>

      {showLegend ? (
        <div className="mt-4 w-full space-y-2">
          {arcs.map((a, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-sm gap-3"
            >
              <span className="flex items-center gap-2 text-slate-700">
                <span
                  className="h-2.5 w-2.5 rounded-full inline-block"
                  style={{ background: a.color }}
                />
                {a.label}
              </span>
              <span className="text-slate-500 font-semibold">{a.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AreaChart({
  data,
  height = 320,
  color = "#0a7a90",
  formatValue,
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatValue?: (n: number) => string;
}) {
  const w = 1000;
  const h = height;
  const padX = 50;
  const padY = 24;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2 - 20;

  const max = Math.max(1, ...data.map((d) => d.value));
  const min = 0;
  const range = max - min;

  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const points = data.map((d, i) => {
    const x = padX + i * stepX;
    const y = padY + innerH - ((d.value - min) / range) * innerH;
    return [x, y] as const;
  });

  // Smooth curve via simple cardinal
  const linePath = points
    .map((p, i, arr) => {
      if (i === 0) return `M ${p[0]} ${p[1]}`;
      const prev = arr[i - 1];
      const cx1 = (prev[0] + p[0]) / 2;
      return `C ${cx1} ${prev[1]} ${cx1} ${p[1]} ${p[0]} ${p[1]}`;
    })
    .join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1][0]} ${
          padY + innerH
        } L ${points[0][0]} ${padY + innerH} Z`
      : "";

  const yTicks = 5;
  return (
    <div className="w-full overflow-x-auto">
      <svg
        width="100%"
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const t = i / yTicks;
          return (
            <line
              key={i}
              x1={padX}
              y1={padY + innerH * (1 - t)}
              x2={padX + innerW}
              y2={padY + innerH * (1 - t)}
              stroke="#e2e8f0"
              strokeDasharray="3,3"
            />
          );
        })}
        {areaPath && <path d={areaPath} fill="url(#areaFill)" />}
        {linePath && (
          <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" />
        )}
        {data.map((d, i) => (
          <text
            key={i}
            x={padX + i * stepX}
            y={h - 6}
            fontSize="11"
            textAnchor="middle"
            fill="#64748b"
          >
            {d.label}
          </text>
        ))}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const t = i / yTicks;
          return (
            <text
              key={i}
              x={padX - 10}
              y={padY + innerH * (1 - t) + 4}
              fontSize="11"
              textAnchor="end"
              fill="#94a3b8"
            >
              {formatValue ? formatValue(max * t) : Math.round(max * t)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export function MiniArea({
  values,
  color = "#a78bfa",
  height = 60,
}: {
  values: number[];
  color?: string;
  height?: number;
}) {
  if (!values.length) {
    return <div style={{ height }} />;
  }
  const w = 200;
  const h = height;
  const max = Math.max(1, ...values);
  const stepX = values.length > 1 ? w / (values.length - 1) : w;
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = h - (v / max) * (h - 4) - 2;
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
  const areaPath = `${linePath} L ${w} ${h} L 0 ${h} Z`;
  const gradId = `mini-${color.replace("#", "")}`;

  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}
