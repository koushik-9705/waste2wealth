import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import type { RequestStep } from "../lib/demo";

/** Marks screens/sections that still show placeholder data (no backend yet). */
export function DemoBadge() {
  return <span className="demo-badge" title="Placeholder content until the backend for this feature is built">Demo data</span>;
}

export function PageHeader({ title, subtitle, action, demo }: { title: string; subtitle?: ReactNode; action?: ReactNode; demo?: boolean }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title} {demo && <DemoBadge />}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, change, icon }: { label: string; value: string; change?: string; icon: IconName }) {
  return (
    <div className="stat-card">
      <span className="stat-icon"><Icon name={icon} size={22} /></span>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {change && <span className="stat-change"><Icon name="trendUp" size={14} /> {change}</span>}
    </div>
  );
}

/** Minimal responsive SVG line chart (no chart library). */
export function LineChart({ labels, series, height = 220 }: {
  labels: string[];
  series: { name: string; values: number[]; color: string }[];
  height?: number;
}) {
  const W = 560, H = height, P = { l: 36, r: 12, t: 12, b: 28 };
  const max = Math.max(...series.flatMap((s) => s.values)) * 1.1 || 1;
  const x = (i: number) => P.l + (i * (W - P.l - P.r)) / Math.max(1, labels.length - 1);
  const y = (v: number) => H - P.b - (v / max) * (H - P.t - P.b);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Line chart of ${series.map((s) => s.name).join(" and ")}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} className="chart-grid" />
            <text x={P.l - 8} y={y(t) + 4} textAnchor="end" className="chart-axis">{t}</text>
          </g>
        ))}
        {labels.map((l, i) => <text key={l} x={x(i)} y={H - 8} textAnchor="middle" className="chart-axis">{l}</text>)}
        {series.map((s) => (
          <g key={s.name}>
            <path d={`M${s.values.map((v, i) => `${x(i)},${y(v)}`).join(" L")} L${x(s.values.length - 1)},${H - P.b} L${x(0)},${H - P.b}Z`}
              fill={s.color} opacity=".08" />
            <polyline points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" />
            {s.values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill="#fff" stroke={s.color} strokeWidth="2" />)}
          </g>
        ))}
      </svg>
      <ChartLegend items={series.map((s) => ({ label: s.name, color: s.color }))} />
    </div>
  );
}

export function BarChart({ labels, series, height = 220 }: {
  labels: string[];
  series: { name: string; values: number[]; color: string }[];
  height?: number;
}) {
  const W = 560, H = height, P = { l: 36, r: 12, t: 12, b: 28 };
  const max = Math.max(...series.flatMap((s) => s.values)) * 1.1 || 1;
  const group = (W - P.l - P.r) / labels.length;
  const bar = Math.min(26, (group * 0.7) / series.length);
  const y = (v: number) => H - P.b - (v / max) * (H - P.t - P.b);
  const ticks = [0, 0.5, 1].map((t) => +(max * t).toFixed(1));
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Bar chart of ${series.map((s) => s.name).join(" and ")}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} className="chart-grid" />
            <text x={P.l - 8} y={y(t) + 4} textAnchor="end" className="chart-axis">{t}</text>
          </g>
        ))}
        {labels.map((l, i) => {
          const gx = P.l + i * group + (group - bar * series.length) / 2;
          return (
            <g key={l}>
              {series.map((s, j) => (
                <rect key={s.name} x={gx + j * bar} y={y(s.values[i])} width={bar - 3} height={H - P.b - y(s.values[i])} rx="3" fill={s.color} />
              ))}
              <text x={P.l + i * group + group / 2} y={H - 8} textAnchor="middle" className="chart-axis">{l}</text>
            </g>
          );
        })}
      </svg>
      <ChartLegend items={series.map((s) => ({ label: s.name, color: s.color }))} />
    </div>
  );
}

function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="chart-legend">
      {items.map((i) => <span key={i.label}><i style={{ background: i.color }} />{i.label}</span>)}
    </div>
  );
}

export function Timeline({ steps }: { steps: RequestStep[] }) {
  const current = steps.findIndex((s) => !s.done);
  return (
    <ol className="timeline">
      {steps.map((s, i) => (
        <li key={s.label} className={s.done ? "done" : i === current ? "current" : ""}>
          <span className="tl-dot">{s.done ? <Icon name="check" size={13} strokeWidth={3} /> : null}</span>
          <div>
            <strong>{s.label}</strong>
            <span className="muted small">{s.at ?? (i === current ? "Pending..." : "Soon")}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

const ART: Record<string, { bg: string; icon: IconName }> = {
  plastic: { bg: "linear-gradient(135deg,#d6ecfb,#9fd0f2)", icon: "recycle" },
  paper: { bg: "linear-gradient(135deg,#f3e3c7,#d9b98a)", icon: "box" },
  cardboard: { bg: "linear-gradient(135deg,#f3e3c7,#d9b98a)", icon: "box" },
  metal: { bg: "linear-gradient(135deg,#e4e7ea,#aeb6bd)", icon: "settings" },
  laptop: { bg: "linear-gradient(135deg,#e2e6f3,#a9b4d6)", icon: "box" },
  circuit: { bg: "linear-gradient(135deg,#d9efe2,#8fcca6)", icon: "dashboard" },
  agricultural: { bg: "linear-gradient(135deg,#eef6d8,#c6e08f)", icon: "leaf" },
  electronic: { bg: "linear-gradient(135deg,#e2e6f3,#a9b4d6)", icon: "box" },
};

/** Illustrated placeholder shown when a listing has no photo yet. */
export function MaterialArt({ material, category }: { material: string; category: string }) {
  const key = Object.keys(ART).find((k) => material.toLowerCase().includes(k)) ?? category;
  const art = ART[key] ?? ART.agricultural;
  return (
    <div className="material-art" style={{ background: art.bg }}>
      <Icon name={art.icon} size={44} strokeWidth={1.5} />
    </div>
  );
}
