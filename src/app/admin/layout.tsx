import type { Metadata } from "next";
import { Figtree, Playfair_Display } from "next/font/google";
import "../globals.css";

const body = Figtree({ variable: "--font-body", subsets: ["latin"] });
const head = Playfair_Display({ variable: "--font-head", subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"] });

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false } };

export default function AdminRoot({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="en" className={`${body.variable} ${head.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
