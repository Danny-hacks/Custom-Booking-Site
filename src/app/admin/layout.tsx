import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "../globals.css";

const body = Figtree({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false } };

export default function AdminRoot({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="en" className={`${body.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
