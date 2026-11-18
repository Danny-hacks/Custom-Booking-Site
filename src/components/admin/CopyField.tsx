"use client";
import { useState } from "react";
import { Icon } from "../Icon";

export function CopyField({ value, label }: { value: string; label: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div>
      <label className="label" htmlFor="copyfield">{label}</label>
      <div className="flex gap-2">
        <input id="copyfield" readOnly value={value} onFocus={(e) => e.currentTarget.select()} className="field font-mono text-sm" />
        <button
          type="button"
          className="btn-ghost shrink-0"
          onClick={() => { navigator.clipboard?.writeText(value).catch(() => {}); setOk(true); setTimeout(() => setOk(false), 1800); }}
        >
          <Icon name={ok ? "check" : "copy"} size={18} weight="bold" /> {ok ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
