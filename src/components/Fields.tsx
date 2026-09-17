"use client";
import { useEffect, useState } from "react";
export function NumberField({
  label,
  value,
  onChange,
  min = -600,
  max = 900,
  step = 0.1,
  unit = "мм",
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(String(Number(value.toFixed(3))));
  useEffect(() => setDraft(String(Number(value.toFixed(3)))), [value]);
  function commit() {
    const n = Number(draft);
    if (draft.trim() && Number.isFinite(n) && n >= min && n <= max) onChange(n);
    else setDraft(String(Number(value.toFixed(3))));
  }
  return (
    <label className="field">
      <span>{label}</span>
      <div>
        <input
          aria-label={label}
          type="number"
          value={draft}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
        <small>{unit}</small>
      </div>
    </label>
  );
}
export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="toggle-label">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} />
    </label>
  );
}
