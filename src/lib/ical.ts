import { addDays, iso } from "./dates";

export type IcsEvent = { uid: string; start: string; end: string; summary: string };

const compact = (d: string) => d.replaceAll("-", "");
const expand = (d: string) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;

export function parseIcs(text: string): IcsEvent[] {
  // unfold continuation lines
  const lines = text.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const events: IcsEvent[] = [];
  let cur: Partial<IcsEvent> | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") cur = {};
    else if (line === "END:VEVENT") {
      if (cur?.uid && cur.start && cur.end) events.push({ summary: "", ...cur } as IcsEvent);
      cur = null;
    } else if (cur) {
      const i = line.indexOf(":");
      if (i < 0) continue;
      const name = line.slice(0, i).split(";")[0].toUpperCase();
      const val = line.slice(i + 1).trim();
      if (name === "UID") cur.uid = val;
      else if (name === "SUMMARY") cur.summary = val;
      else if (name === "DTSTART" && /^\d{8}/.test(val)) cur.start = expand(val.slice(0, 8));
      else if (name === "DTEND" && /^\d{8}/.test(val)) cur.end = expand(val.slice(0, 8));
    }
  }
  // single-day events without DTEND are treated as one night
  return events.filter((e) => e.end > e.start);
}

const esc = (s: string) => s.replace(/[\\;,]/g, (m) => "\\" + m).replace(/\n/g, "\\n");

export function buildIcs(name: string, events: IcsEvent[]) {
  const stamp = iso(new Date()).replaceAll("-", "") + "T000000Z";
  const out = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lestrebaldie//Direct bookings//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(name)}`,
  ];
  for (const e of events) {
    out.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(e.start)}`,
      `DTEND;VALUE=DATE:${compact(e.end)}`,
      `SUMMARY:${esc(e.summary)}`,
      "END:VEVENT",
    );
  }
  out.push("END:VCALENDAR");
  return out.join("\r\n") + "\r\n";
}

export { addDays };
