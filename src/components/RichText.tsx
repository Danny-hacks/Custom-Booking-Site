import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Renders the plain-text article format used in the admin, with no HTML involved:
 *   a blank line starts a new paragraph        ## Heading        ### Smaller heading
 *   - lines starting with a dash form a list   **bold**         [link text](https://example.com or /en/area)
 * Everything is built as React elements, so article text can never inject markup or scripts.
 */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={`${key}-${i++}`}>{inline(m[1], `${key}-b${i}`)}</strong>);
    else {
      const href = m[3];
      const external = /^https?:\/\//i.test(href);
      const internal = href.startsWith("/") && !href.startsWith("//");
      if (external) out.push(<a key={`${key}-${i++}`} href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline underline-offset-2">{m[2]}</a>);
      else if (internal) out.push(<Link key={`${key}-${i++}`} href={href} className="font-semibold text-brand underline underline-offset-2">{m[2]}</Link>);
      else out.push(m[0]);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function RichText({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-5 text-[17px] leading-relaxed text-ink-soft">
      {blocks.map((b, i) => {
        const key = `b${i}`;
        if (b.startsWith("### ")) return <h3 key={key} className="!mt-8 text-[20px] text-ink">{inline(b.slice(4), key)}</h3>;
        if (b.startsWith("## ")) return <h2 key={key} className="!mt-10 text-[26px] text-ink sm:text-[30px]">{inline(b.slice(3), key)}</h2>;
        const lines = b.split("\n");
        if (lines.every((l) => l.trim().startsWith("- "))) {
          return (
            <ul key={key} className="space-y-2 pl-1">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-3"><span aria-hidden className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-sun" /><span>{inline(l.trim().slice(2), `${key}-${j}`)}</span></li>
              ))}
            </ul>
          );
        }
        return <p key={key}>{lines.map((l, j) => <span key={j}>{j > 0 && <br />}{inline(l, `${key}-${j}`)}</span>)}</p>;
      })}
    </div>
  );
}
