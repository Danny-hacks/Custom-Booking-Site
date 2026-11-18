"use client";
import { useState } from "react";
import { Icon } from "./Icon";

export function CopyCode({ code, label, done }: { code: string; label: string; done: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      aria-label={`${label}: ${code}`}
      onClick={() => {
        navigator.clipboard?.writeText(code).catch(() => {});
        setOk(true);
        setTimeout(() => setOk(false), 1800);
      }}
      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-dashed border-brand bg-tint px-3 text-sm font-bold tracking-widest text-brand-deep transition-colors hover:bg-white"
    >
      <Icon name={ok ? "check" : "copy"} size={16} weight="bold" /> {ok ? done : code}
    </button>
  );
}
