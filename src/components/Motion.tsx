"use client";
import { createElement, useEffect, useRef, type ReactNode } from "react";

type Kind = "up" | "fade" | "left" | "right" | "scale" | "img";

/** One shared observer: elements fade/slide in once as they enter the viewport. */
let io: IntersectionObserver | null = null;
function observer() {
  if (!io) {
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io?.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
  }
  return io;
}

export function Reveal({
  children, kind = "up", d = 0, as = "div", className = "",
}: { children: ReactNode; kind?: Kind; d?: number; as?: string; className?: string }) {
  // callback ref with cleanup (React 19): observe on mount, unobserve on unmount
  const ref = (el: HTMLElement | null) => {
    if (!el) return;
    const o = observer();
    o.observe(el);
    return () => o.unobserve(el);
  };
  return createElement(as, { ref, "data-reveal": kind, style: { "--d": d }, className }, children);
}

/** Counts up to `to` the first time it scrolls into view. Final value is the server-rendered text. */
export function CountUp({ to, decimals = 0, className = "" }: { to: number; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const t0 = performance.now();
      const run = (now: number) => {
        const p = Math.min(1, (now - t0) / 1400);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (to * eased).toFixed(decimals);
        if (p < 1) raf = requestAnimationFrame(run);
      };
      raf = requestAnimationFrame(run);
    }, { threshold: 0.6 });
    obs.observe(el);
    return () => { obs.disconnect(); cancelAnimationFrame(raf); };
  }, [to, decimals]);
  return <span ref={ref} className={`tabular-nums ${className}`}>{to.toFixed(decimals)}</span>;
}

/** Marks <html data-scrolled> once the page leaves the top, so the header can settle into a shadow. */
export function ScrollState() {
  useEffect(() => {
    const root = document.documentElement;
    const on = () => (window.scrollY > 8 ? root.setAttribute("data-scrolled", "") : root.removeAttribute("data-scrolled"));
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return null;
}
