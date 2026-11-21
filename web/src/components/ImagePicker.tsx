import { useEffect, useState } from "react";

export const MAX_IMAGES = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Lets the user pick up to `remaining` images, validating type and size before upload. */
export function ImagePicker({ files, onChange, remaining = MAX_IMAGES }: { files: File[]; onChange: (f: File[]) => void; remaining?: number }) {
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const add = (list: FileList | null) => {
    if (!list) return;
    const picked = Array.from(list);
    const bad = picked.find((f) => !TYPES.includes(f.type));
    if (bad) return setError(`${bad.name} is not a JPEG, PNG or WebP image`);
    const big = picked.find((f) => f.size > MAX_BYTES);
    if (big) return setError(`${big.name} is larger than 5 MB`);
    const next = [...files, ...picked];
    if (next.length > remaining) return setError(`You can add ${remaining} more photo${remaining === 1 ? "" : "s"}`);
    setError(null);
    onChange(next);
  };

  return (
    <div className="field">
      <span>Photos (optional, up to {remaining}, max 5 MB each)</span>
      <div className="thumbs">
        {previews.map((src, i) => (
          <div className="thumb" key={src}>
            <img src={src} alt={files[i]?.name} />
            <button type="button" className="thumb-remove" aria-label="Remove photo"
              onClick={() => onChange(files.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
        {files.length < remaining && (
          <label className="thumb thumb-add">
            <input type="file" accept={TYPES.join(",")} multiple hidden
              onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
            + Add
          </label>
        )}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
