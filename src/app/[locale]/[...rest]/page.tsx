import { notFound } from "next/navigation";

// Any unknown address under /en or /fr: show the site's own "not found" page (inside the header and footer).
export default function CatchAll() {
  notFound();
}
