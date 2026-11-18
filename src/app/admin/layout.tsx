import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";

const body = Inter({ variable: "--font-body", subsets: ["latin"] });
const head = Plus_Jakarta_Sans({ variable: "--font-head", subsets: ["latin"], weight: ["600", "700", "800"] });

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false } };

export default function AdminRoot({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="en" className={`${body.variable} ${head.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
