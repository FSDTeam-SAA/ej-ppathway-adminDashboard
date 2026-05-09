"use client";

// Lightweight, dependency-free chart primitives drawn with SVG.

export function BarChartSimple({
  data,
  height = 240,
  formatValue,
}: {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  formatValue?: (n: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const palette = ["#fbbf24", "#fbbf24", "#60a5fa", "#a78bfa", "#34d399", "#f87171", "#22c55e"];

  return (
    <div className="w-full" style={{ height }}>
      <div className="grid grid-cols-7 gap-3 h-full items-end">
        {data.map((d, i) => {
          const h = Math.max(8, (d.value / max) * (height - 40));
          const color = d.color || palette[i % palette.length];
          return (
            <div key={i} className="flex flex-col items-center justify-end gap-2 h-full">
              <div className="text-[11px] text-slate-600 font-medium">
                {formatValue ? formatValue(d.value) : d.value}
              </div>
              <div
                className="w-full rounded-t-xl"
                style={{ height: h, background: color }}
              />
              <div className="text-[11px] text-slate-500">{d.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HorizontalBarChart({
  data,
}: {
  data: { label: string; value: number; max?: number; color?: string }[];
}) {
  const overallMax = Math.max(1, ...data.map((d) => d.max ?? d.value));
  const palette = ["#60a5fa", "#a78bfa", "#fbbf24", "#a855f7", "#34d399"];

  return (
    <div className="space-y-4">
      {data.map((d, i) => {
        const pct = Math.min(100, Math.round((d.value / overallMax) * 100));
        const color = d.color || palette[i % palette.length];
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-1.5 text-sm">
              <span className="text-slate-700">{d.label}</span>
              <span className="text-slate-500 font-medium">{pct}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DonutChart({
  data,
  size = 220,
  thickness = 36,
}: {
  data: { label: string; value: number; color?: string }[];
  size?: number;
  thickness?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const palette = ["#0a7a90", "#fbbf24", "#60a5fa", "#a78bfa", "#34d399"];
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
    return { dpath, color, label: d.label, value: d.value, pct: Math.round(portion * 100) };
  });

  return (
    <div className="flex items-center gap-6 flex-wrap">
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
      </svg>
      <div className="space-y-2">
        {arcs.map((a, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span
              className="h-3 w-3 rounded-full inline-block"
              style={{ background: a.color }}
            />
            <span className="text-slate-700">{a.label}</span>
            <span className="text-slate-500">— {a.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AreaChart({
  data,
  height = 280,
  color = "#7c3aed",
  formatValue,
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatValue?: (n: number) => string;
}) {
  const w = 800;
  const h = height;
  const padX = 30;
  const padY = 20;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  const max = Math.max(1, ...data.map((d) => d.value));
  const min = 0;
  const range = max - min;

  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const points = data.map((d, i) => {
    const x = padX + i * stepX;
    const y = padY + innerH - ((d.value - min) / range) * innerH;
    return [x, y] as const;
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1][0]} ${padY + innerH} L ${points[0][0]} ${padY + innerH} Z`
      : "";

  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.04" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((t, i) => (
          <line
            key={i}
            x1={padX}
            y1={padY + innerH * (1 - t)}
            x2={padX + innerW}
            y2={padY + innerH * (1 - t)}
            stroke="#e2e8f0"
            strokeDasharray="3,3"
          />
        ))}
        {areaPath && <path d={areaPath} fill="url(#areaFill)" />}
        {linePath && (
          <path d={linePath} fill="none" stroke={color} strokeWidth="2" />
        )}
        {data.map((d, i) => (
          <text
            key={i}
            x={padX + i * stepX}
            y={h - 4}
            fontSize="10"
            textAnchor="middle"
            fill="#64748b"
          >
            {d.label}
          </text>
        ))}
        {[0.25, 0.5, 0.75, 1].map((t, i) => (
          <text
            key={i}
            x={padX - 6}
            y={padY + innerH * (1 - t) + 3}
            fontSize="10"
            textAnchor="end"
            fill="#64748b"
          >
            {formatValue ? formatValue(max * t) : Math.round(max * t)}
          </text>
        ))}
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
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`)
    .join(" ");
  const areaPath = `${linePath} L ${w} ${h} L 0 ${h} Z`;

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`mini-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#mini-${color})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}
