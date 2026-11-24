import { analytics, dashboardStats } from "../lib/demo";
import { BarChart, PageHeader, StatCard } from "../components/widgets";

export function AnalyticsPage() {
  const total = analytics.byMaterial.reduce((s, m) => s + m.value, 0);
  const colors = ["#1f7a4d", "#7cc242", "#2e9e4f", "#a5d86b"];
  return (
    <>
      <PageHeader title="Analytics" subtitle="Your recycling impact over time" demo />
      <div className="stat-grid">
        {dashboardStats.map((s) => <StatCard key={s.key} label={s.label} value={s.value} change={s.change} icon={s.icon} />)}
      </div>
      <div className="two-col wide-left">
        <section className="card panel">
          <div className="panel-head"><h2>Waste recycled per month (kg)</h2></div>
          <BarChart labels={analytics.monthlyRecycled.labels} series={[{ name: "Recycled (kg)", values: analytics.monthlyRecycled.values, color: "#2e9e4f" }]} />
        </section>
        <section className="card panel">
          <div className="panel-head"><h2>By material</h2></div>
          <ul className="share-list">
            {analytics.byMaterial.map((m, i) => (
              <li key={m.label}>
                <span>{m.label}</span>
                <span className="share-bar"><i style={{ width: `${(m.value / total) * 100}%`, background: colors[i] }} /></span>
                <strong>{Math.round((m.value / total) * 100)}%</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
