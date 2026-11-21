import { useState, type FormEvent } from "react";
import type { ListingInput, Unit, WasteCategory } from "../lib/types";

const UNITS: Unit[] = ["kg", "tonne", "piece", "litre"];

const EXAMPLES: Record<WasteCategory, string> = {
  agricultural: "e.g. Paddy straw, rice husk, coconut coir, sugarcane bagasse",
  electronic: "e.g. Old laptops, mobile phones, circuit boards, printers",
};

interface Props {
  initial?: Partial<ListingInput>;
  /** Category cannot be changed after creation. */
  lockCategory?: boolean;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (input: ListingInput) => void;
}

export function ListingForm({ initial, lockCategory, submitLabel, busy, onSubmit }: Props) {
  const [v, setV] = useState<ListingInput>({
    waste_category: initial?.waste_category ?? "agricultural",
    material_name: initial?.material_name ?? "",
    description: initial?.description ?? "",
    quantity: initial?.quantity ?? "",
    unit: initial?.unit ?? "kg",
    material_condition: initial?.material_condition ?? "",
    location: initial?.location ?? "",
    expected_price: initial?.expected_price ?? "",
  });
  const set = <K extends keyof ListingInput>(k: K, value: ListingInput[K]) => setV((s) => ({ ...s, [k]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...v,
      description: v.description?.trim() ? v.description.trim() : null,
      expected_price: v.expected_price ? v.expected_price : null,
    });
  };

  return (
    <form className="form" onSubmit={submit}>
      <fieldset className="field" disabled={lockCategory}>
        <legend>Waste category</legend>
        <div className="segmented">
          {(["agricultural", "electronic"] as WasteCategory[]).map((c) => (
            <label key={c} className={v.waste_category === c ? "active" : ""}>
              <input type="radio" name="category" value={c} checked={v.waste_category === c} onChange={() => set("waste_category", c)} />
              {c === "agricultural" ? "Agricultural residue" : "E-waste"}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span>Material *</span>
        <input required minLength={2} maxLength={120} value={v.material_name} placeholder={EXAMPLES[v.waste_category]}
          onChange={(e) => set("material_name", e.target.value)} />
      </label>

      <div className="field-row">
        <label className="field">
          <span>Quantity *</span>
          <input required type="number" min="0.01" step="0.01" inputMode="decimal" value={v.quantity}
            onChange={(e) => set("quantity", e.target.value)} />
        </label>
        <label className="field">
          <span>Unit *</span>
          <select value={v.unit} onChange={(e) => set("unit", e.target.value as Unit)}>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
      </div>

      <label className="field">
        <span>Condition *</span>
        <input required minLength={2} maxLength={120} value={v.material_condition}
          placeholder={v.waste_category === "agricultural" ? "e.g. dry, baled, sun-dried" : "e.g. working, not working, for parts"}
          onChange={(e) => set("material_condition", e.target.value)} />
      </label>

      <label className="field">
        <span>Location *</span>
        <input required minLength={2} maxLength={200} value={v.location} placeholder="Village / town, district, state"
          onChange={(e) => set("location", e.target.value)} />
      </label>

      <label className="field">
        <span>Expected price (₹, optional)</span>
        <input type="number" min="0" step="1" inputMode="decimal" value={v.expected_price ?? ""}
          placeholder="Leave empty for 'price on request'" onChange={(e) => set("expected_price", e.target.value)} />
      </label>

      <label className="field">
        <span>Description (optional)</span>
        <textarea rows={4} maxLength={2000} value={v.description ?? ""}
          placeholder="Anything a buyer should know: how it's stored, when it can be collected…"
          onChange={(e) => set("description", e.target.value)} />
      </label>

      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
