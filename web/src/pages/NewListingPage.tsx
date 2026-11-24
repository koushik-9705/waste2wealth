import { useEffect, useState, type DragEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { ListingInput, Unit, WasteCategory } from "../lib/types";
import { canCreateListings, useAuth } from "../auth/AuthProvider";
import { Alert, ErrorMessage } from "../components/ui";
import { Icon, type IconName } from "../components/Icon";
import { MaterialArt } from "../components/widgets";
import { categoryLabel, formatPrice, formatQuantity } from "../lib/format";
import { MAX_IMAGES } from "../components/ImagePicker";

const UNITS: Unit[] = ["kg", "tonne", "piece", "litre"];
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

const CATEGORIES: { value: WasteCategory; label: string; icon: IconName }[] = [
  { value: "agricultural", label: "Agricultural", icon: "leaf" },
  { value: "electronic", label: "E-waste", icon: "box" },
];

const PRESETS: Record<WasteCategory, { label: string; icon: IconName }[]> = {
  agricultural: [
    { label: "Paddy Straw", icon: "leaf" }, { label: "Rice Husk", icon: "leaf" }, { label: "Coconut Coir", icon: "leaf" },
    { label: "Sugarcane Bagasse", icon: "leaf" }, { label: "Organic", icon: "recycle" },
  ],
  electronic: [
    { label: "Plastic", icon: "recycle" }, { label: "Old Laptops", icon: "box" }, { label: "Mobile Phones", icon: "phone" },
    { label: "Circuit Boards", icon: "dashboard" }, { label: "Metal", icon: "settings" },
  ],
};

const STEPS = ["Basic Details", "Add Photos", "Review"];

export function NewListingPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [v, setV] = useState<ListingInput>({
    waste_category: "agricultural", material_name: "", description: "", quantity: "", unit: "kg",
    material_condition: "", location: profile?.city ? `${profile.city}${profile.state ? `, ${profile.state}` : ""}` : "", expected_price: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  if (profile && !canCreateListings(profile)) return <Navigate to="/listings" replace />;

  const set = <K extends keyof ListingInput>(k: K, value: ListingInput[K]) => setV((s) => ({ ...s, [k]: value }));

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const picked = Array.from(list);
    const bad = picked.find((f) => !TYPES.includes(f.type));
    if (bad) return setFileError(`${bad.name} is not a JPEG, PNG or WebP image`);
    const big = picked.find((f) => f.size > MAX_BYTES);
    if (big) return setFileError(`${big.name} is larger than 5 MB`);
    if (files.length + picked.length > MAX_IMAGES) return setFileError(`You can add up to ${MAX_IMAGES} photos`);
    setFileError(null);
    setFiles([...files, ...picked]);
  };

  const step1Valid = v.material_name.trim().length >= 2 && Number(v.quantity) > 0 &&
    v.material_condition.trim().length >= 2 && v.location.trim().length >= 2;

  const publish = async () => {
    setBusy(true);
    setError(null);
    try {
      const listing = await api.createListing({
        ...v,
        material_name: v.material_name.trim(),
        material_condition: v.material_condition.trim(),
        location: v.location.trim(),
        description: v.description?.trim() ? v.description.trim() : null,
        expected_price: v.expected_price ? v.expected_price : null,
      });
      if (files.length) {
        try {
          await api.uploadImages(listing.listing_id, files);
        } catch (e) {
          // The listing exists; let the user retry photos from the detail page.
          setWarning(`Listing created, but photos failed to upload: ${e instanceof Error ? e.message : e}`);
          setTimeout(() => navigate(`/listings/${listing.listing_id}`), 2500);
          return;
        }
      }
      navigate(`/listings/${listing.listing_id}?created=1`);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wizard">
      <div className="page-header">
        <div>
          <h1>Create Waste Listing</h1>
          <p className="muted">Give details about your waste material</p>
        </div>
      </div>

      <ol className="stepper" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className={i < step ? "done" : i === step ? "current" : ""}>
            <span className="step-dot">{i < step ? <Icon name="check" size={14} strokeWidth={3} /> : i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>

      {warning && <Alert kind="info">{warning}</Alert>}
      <ErrorMessage error={error} />

      <div className="card wizard-card">
        {step === 0 && (
          <div className="form">
            <fieldset className="field">
              <legend>Select Category</legend>
              <div className="tile-row">
                {CATEGORIES.map((c) => (
                  <button key={c.value} type="button" className={`tile ${v.waste_category === c.value ? "active" : ""}`}
                    onClick={() => setV((s) => ({ ...s, waste_category: c.value, material_name: "" }))}>
                    <Icon name={c.icon} size={26} /><span>{c.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="field">
              <legend>Material</legend>
              <div className="tile-row tile-row-sm">
                {PRESETS[v.waste_category].map((p) => (
                  <button key={p.label} type="button" className={`tile tile-sm ${v.material_name === p.label ? "active" : ""}`}
                    onClick={() => set("material_name", p.label)}>
                    <Icon name={p.icon} size={20} /><span>{p.label}</span>
                  </button>
                ))}
              </div>
              <input required minLength={2} maxLength={120} placeholder="Or type the material name" value={v.material_name}
                onChange={(e) => set("material_name", e.target.value)} aria-label="Material name" />
            </fieldset>

            <div className="field-row">
              <label className="field">
                <span>Quantity</span>
                <div className="input-group">
                  <input type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="50" value={v.quantity}
                    onChange={(e) => set("quantity", e.target.value)} />
                  <select aria-label="Unit" value={v.unit} onChange={(e) => set("unit", e.target.value as Unit)}>
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </label>
              <label className="field">
                <span>Expected price (₹, optional)</span>
                <input type="number" min="0" step="1" inputMode="decimal" placeholder="Leave empty for 'price on request'"
                  value={v.expected_price ?? ""} onChange={(e) => set("expected_price", e.target.value)} />
              </label>
            </div>

            <div className="field-row">
              <label className="field">
                <span>Condition</span>
                <input maxLength={120} placeholder={v.waste_category === "agricultural" ? "e.g. dry, baled" : "e.g. working, for parts"}
                  value={v.material_condition} onChange={(e) => set("material_condition", e.target.value)} />
              </label>
              <label className="field">
                <span>Location</span>
                <input maxLength={200} placeholder="Village / town, district, state" value={v.location}
                  onChange={(e) => set("location", e.target.value)} />
              </label>
            </div>

            <label className="field">
              <span>Description (optional)</span>
              <textarea rows={3} maxLength={2000} placeholder="How it's stored, when it can be collected…" value={v.description ?? ""}
                onChange={(e) => set("description", e.target.value)} />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="form">
            <span className="field-label">Upload Photos <span className="muted small">(optional, up to {MAX_IMAGES}, max 5 MB each)</span></span>
            <div className="photo-step">
              <label className={`dropzone ${dragging ? "dragging" : ""}`}
                onDragOver={(e: DragEvent) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e: DragEvent) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}>
                <input type="file" accept={TYPES.join(",")} multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                <Icon name="upload" size={30} />
                <strong>Drag &amp; drop images here</strong>
                <span className="muted small">or click to browse</span>
              </label>
              <div className="photo-grid">
                {previews.map((src, i) => (
                  <div key={src} className="photo">
                    <img src={src} alt={files[i]?.name} />
                    <button type="button" className="photo-remove" aria-label="Remove photo"
                      onClick={() => setFiles(files.filter((_, j) => j !== i))}><Icon name="x" size={14} strokeWidth={3} /></button>
                  </div>
                ))}
              </div>
            </div>
            {fileError && <p className="field-error">{fileError}</p>}
          </div>
        )}

        {step === 2 && (
          <div className="review">
            <div className="review-media">
              {previews[0] ? <img src={previews[0]} alt="" /> : <MaterialArt material={v.material_name} category={v.waste_category} />}
              <span className="muted small">{files.length} photo{files.length === 1 ? "" : "s"}</span>
            </div>
            <dl className="facts">
              <dt>Category</dt><dd>{categoryLabel[v.waste_category]}</dd>
              <dt>Material</dt><dd>{v.material_name}</dd>
              <dt>Quantity</dt><dd>{formatQuantity(v.quantity || "0", v.unit)}</dd>
              <dt>Price</dt><dd>{formatPrice(v.expected_price ? v.expected_price : null)}</dd>
              <dt>Condition</dt><dd>{v.material_condition}</dd>
              <dt>Location</dt><dd>{v.location}</dd>
              {v.description && <><dt>Description</dt><dd>{v.description}</dd></>}
            </dl>
          </div>
        )}

        <div className="wizard-actions">
          {step === 0 ? <Link to="/my-listings" className="btn btn-ghost">Cancel</Link>
            : <button className="btn btn-ghost" onClick={() => setStep(step - 1)} disabled={busy}><Icon name="arrowLeft" size={16} /> Back</button>}
          {step < 2 ? (
            <button className="btn btn-primary" disabled={step === 0 && !step1Valid} onClick={() => setStep(step + 1)}>
              Next Step <Icon name="arrowRight" size={16} />
            </button>
          ) : (
            <button className="btn btn-primary" disabled={busy} onClick={publish}>{busy ? "Publishing…" : "Publish listing"}</button>
          )}
        </div>
        {step === 0 && !step1Valid && <p className="muted small right">Fill in material, quantity, condition and location to continue.</p>}
      </div>
    </div>
  );
}
