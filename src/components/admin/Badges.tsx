const src: Record<string, string> = {
  direct: "bg-[#e6ecd9] text-leaf",
  airbnb: "bg-[#fbe0dd] text-[#b0322a]",
  manual: "bg-[#dfe7ef] text-navy",
  block: "bg-[#e9e4da] text-ink-soft",
};
const st: Record<string, string> = {
  confirmed: "bg-[#e6ecd9] text-leaf",
  hold: "bg-[#f6ead0] text-[#8a6212]",
  cancelled: "bg-[#f3e0dd] text-danger",
};

export const SourceBadge = ({ status, source }: { status?: string; source?: string }) => {
  const v = (status ?? source)!;
  const cls = (status ? st : src)[v] ?? "bg-line";
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>{v === "hold" ? "awaiting payment" : v}</span>;
};
