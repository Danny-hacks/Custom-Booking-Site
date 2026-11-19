/** Public address of the site. Tolerates a missing "https://" or trailing slash in SITE_URL so a typo can never crash a page. */
export function siteBase(): string {
  let v = (process.env.SITE_URL ?? "").trim().replace(/\/+$/, "");
  if (!v) return "http://localhost:3000";
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  try { return new URL(v).origin; } catch { return "http://localhost:3000"; }
}
