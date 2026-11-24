import { useSearchParams } from "react-router-dom";
import { requests } from "../lib/demo";
import { Icon } from "../components/Icon";
import { PageHeader, Timeline } from "../components/widgets";

const TABS = ["Active", "History"] as const;

export function RequestsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as (typeof TABS)[number]) ?? "Active";
  const list = requests.filter((r) => (tab === "Active" ? !["Completed", "Rejected"].includes(r.status) : ["Completed", "Rejected"].includes(r.status)));
  const selected = requests.find((r) => r.id === params.get("id")) ?? list[0] ?? requests[0];

  return (
    <>
      <PageHeader title="Collection Requests" subtitle="Track the status of your collection requests" demo />

      <div className="seg-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""}
            onClick={() => setParams({ tab: t })}>{t}</button>
        ))}
      </div>

      <div className="requests-layout">
        <ul className="card req-list">
          {list.length === 0 && <li className="muted small pad">No requests here yet.</li>}
          {list.map((r) => (
            <li key={r.id}>
              <button className={r.id === selected.id ? "selected" : ""} onClick={() => setParams({ tab, id: r.id })}>
                <span className="row-icon"><Icon name="truck" size={18} /></span>
                <span className="row-main">
                  <strong>{r.material} · {r.quantity}</strong>
                  <span className="muted small">{r.partner} · {r.id}</span>
                </span>
                <span className={`pill pill-${r.status.toLowerCase()}`}>{r.status}</span>
              </button>
            </li>
          ))}
        </ul>

        <section className="card track-card">
          <div className="track-head">
            <div>
              <h2>Collection Request Tracking</h2>
              <p className="muted small">{selected.id} · {selected.material} ({selected.quantity}) with {selected.partner}</p>
            </div>
            <span className={`pill pill-${selected.status.toLowerCase()}`}>{selected.status}</span>
          </div>
          <div className="track-body">
            <Timeline steps={selected.steps} />
            <TruckArt />
          </div>
          <div className="actions">
            <button className="btn btn-outline btn-sm"><Icon name="phone" size={15} /> Contact partner</button>
            {selected.status === "Pending" && <button className="btn btn-danger btn-sm">Cancel request</button>}
          </div>
        </section>
      </div>
    </>
  );
}

function TruckArt() {
  return (
    <svg className="truck-art" viewBox="0 0 240 170" aria-hidden="true">
      <ellipse cx="120" cy="150" rx="110" ry="14" fill="#cfe9b6" />
      <path d="M30 120c0-30 14-52 30-60 4 26-8 48-30 60z" fill="#7cc242" />
      <path d="M200 118c0-34 10-58 26-66 4 30-8 54-26 66z" fill="#2e9e4f" />
      <rect x="40" y="70" width="110" height="62" rx="8" fill="#2e9e4f" />
      <path d="M150 88h34l20 24v20h-54z" fill="#1f7a4d" />
      <rect x="160" y="94" width="22" height="16" rx="3" fill="#dff2e3" />
      <g transform="translate(80 86)" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round">
        <path d="M-12 8l6-12 8 4M12 8l-6 10h-14M0-14l10 2 2 10" />
      </g>
      <circle cx="70" cy="136" r="13" fill="#263238" /><circle cx="70" cy="136" r="5" fill="#cfd8dc" />
      <circle cx="176" cy="136" r="13" fill="#263238" /><circle cx="176" cy="136" r="5" fill="#cfd8dc" />
    </svg>
  );
}
