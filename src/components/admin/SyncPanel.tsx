"use client";
import { useActionState, useState } from "react";
import { Icon } from "../Icon";
import type { TestState } from "@/app/admin/actions";

type Action = (f: FormData) => void | Promise<void>;
type TestAction = (prev: TestState, f: FormData) => Promise<TestState>;

const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** Step 1: paste Airbnb's link, test it without saving, then save (which also runs the first sync). */
export function SyncPanel({ url, beds24Id, save, test }: { url: string; beds24Id: string; save: Action; test: TestAction }) {
  const [value, setValue] = useState(url);
  const [state, testAction, testing] = useActionState<TestState, FormData>(test, {});
  const r = state.report;
  return (
    <form action={save} className="space-y-4">
      <div>
        <label htmlFor="icalImportUrl" className="label">Airbnb calendar link</label>
        <input
          id="icalImportUrl" name="icalImportUrl" type="url" value={value} onChange={(e) => setValue(e.target.value)}
          placeholder="https://www.airbnb.com/calendar/ical/….ics" className="field font-mono text-sm"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <button className="btn"><Icon name="sync" size={18} /> Save and sync now</button>
        <button type="submit" formAction={testAction} disabled={testing || !value} className="btn-ghost">
          <Icon name="check" size={18} /> {testing ? "Testing…" : "Test this link first"}
        </button>
      </div>

      {state.ran && r && (
        <div role="status" className={`rounded-2xl border p-4 text-[15px] ${r.ok ? "border-leaf/40 bg-[#eaf6ef]" : "border-danger/40 bg-[#fdecea]"}`}>
          {!r.ok ? (
            <p className="flex gap-2"><Icon name="warn" size={20} className="mt-0.5 shrink-0 text-danger" /> <span><strong>That link does not work.</strong> {r.error}</span></p>
          ) : (
            <div>
              <p className="flex gap-2 font-semibold"><Icon name="check" size={20} weight="bold" className="mt-0.5 shrink-0 text-leaf" /> The link works. Nothing was saved yet.</p>
              <ul className="mt-2 list-disc space-y-1 pl-9 text-ink-soft">
                <li><strong className="text-ink">{r.reservations.length}</strong> Airbnb reservation{r.reservations.length === 1 ? "" : "s"} would be imported
                  {r.reservations.length > 0 && <>: {r.reservations.slice(0, 3).map((e) => `${fmt(e.start)} → ${fmt(e.end)}`).join(", ")}{r.reservations.length > 3 ? "…" : ""}</>}</li>
                <li><strong className="text-ink">{r.blocks.length}</strong> blocked period{r.blocks.length === 1 ? "" : "s"} would be imported</li>
                {r.echoes > 0 && <li>{r.echoes} date range{r.echoes === 1 ? "" : "s"} are just our own bookings coming back from Airbnb, so they are ignored (that is normal)</li>}
              </ul>
            </div>
          )}
        </div>
      )}

      <details className="rounded-xl border border-line p-4">
        <summary className="cursor-pointer font-semibold">Advanced</summary>
        <div className="mt-3 max-w-sm">
          <label htmlFor="beds24Id" className="label">Beds24 room ID</label>
          <input id="beds24Id" name="beds24Id" defaultValue={beds24Id} className="field" />
          <p className="mt-1 text-xs text-ink-soft">Only if you later switch to the Beds24 channel manager for instant sync. Leave empty otherwise.</p>
        </div>
      </details>
    </form>
  );
}
