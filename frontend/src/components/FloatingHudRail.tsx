"use client";

import { useEffect, useState } from "react";

interface HudSection {
  id: string;
  code: string;
  label: string;
}

const HUD_SECTIONS: HudSection[] = [
  { id: "top", code: "01", label: "INTRO" },
  { id: "fitment", code: "02", label: "TRA XE" },
  { id: "catalog", code: "03", label: "KỆ HÀNG" },
  { id: "simulator", code: "04", label: "THỬ ĐÈN" },
  { id: "builds", code: "05", label: "COMBO XE" },
  { id: "reviews", code: "06", label: "ĐÁNH GIÁ" },
  { id: "order-lookup", code: "07", label: "ĐƠN HÀNG" },
];

export function FloatingHudRail() {
  const [visible, setVisible] = useState(false);
  const [activeId, setActiveId] = useState("top");

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 180);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      {
        rootMargin: "-35% 0px -45% 0px",
        threshold: 0.01,
      },
    );

    for (const sec of HUD_SECTIONS) {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  const activeIdx = Math.max(
    0,
    HUD_SECTIONS.findIndex((s) => s.id === activeId),
  );
  const progressPct = Math.round(((activeIdx + 1) / HUD_SECTIONS.length) * 100);

  return (
    <aside
      aria-label="Điều hướng nhanh theo phân khu"
      className={`fixed bottom-5 left-5 z-30 hidden flex-col rounded-2xl border border-red-800/45 bg-[#080306]/82 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.85),0_0_24px_rgba(225,29,46,0.18)] backdrop-blur-xl transition-all duration-300 xl:flex ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-4 border-b border-red-900/40 pb-1.5 font-mono text-[9px] tracking-[0.2em] text-zinc-400 uppercase">
        <span className="inline-flex items-center gap-1.5 text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff2e43] shadow-[0_0_8px_#ff2e43]" />
          SECTOR HUD
        </span>
        <span>{String(activeIdx + 1).padStart(2, "0")}/07</span>
      </div>

      <nav className="flex flex-col gap-0.5">
        {HUD_SECTIONS.map((sec) => {
          const isActive = activeId === sec.id;
          return (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              className={`group flex items-center justify-between gap-4 rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] uppercase transition ${
                isActive
                  ? "bg-gradient-to-r from-[#e11d2e]/30 to-amber-500/15 font-bold text-white ring-1 ring-[#ff2e43]/60"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={isActive ? "text-amber-300" : "text-zinc-500"}>
                  {sec.code}
                </span>
                <span>{sec.label}</span>
              </span>
              <span
                className={`h-1.5 w-1.5 rounded-full transition-transform ${
                  isActive
                    ? "scale-100 bg-amber-300 shadow-[0_0_8px_#f59e0b]"
                    : "scale-50 bg-zinc-700 group-hover:scale-75 group-hover:bg-red-400"
                }`}
              />
            </a>
          );
        })}
      </nav>

      <div className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full bg-gradient-to-r from-[#ff2e43] to-amber-400 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </aside>
  );
}
