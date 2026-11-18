"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface ScrollRevealStageProps {
  children: ReactNode;
  variant?: "rise" | "iris" | "prism";
  delayMs?: number;
  replaySweep?: boolean;
  className?: string;
}

export function ScrollRevealStage({
  children,
  variant = "rise",
  delayMs = 0,
  replaySweep = false,
  className = "",
}: ScrollRevealStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [sweepCount, setSweepCount] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      const raf = window.requestAnimationFrame(() => setRevealed(true));
      return () => window.cancelAnimationFrame(raf);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            if (replaySweep || variant === "prism") {
              setSweepCount((c) => c + 1);
            }
            if (!replaySweep && variant !== "prism") {
              observer.unobserve(entry.target);
            }
          }
        }
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px 30px 0px",
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [replaySweep, variant]);

  const variantClass =
    variant === "iris"
      ? "scroll-stage-iris"
      : variant === "prism"
        ? "scroll-stage-prism"
        : "scroll-stage-rise";

  const style: CSSProperties | undefined =
    delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined;

  return (
    <div
      ref={containerRef}
      style={style}
      className={`scroll-stage ${variantClass} ${revealed ? "scroll-stage-visible" : ""} relative ${className}`}
    >
      {children}
      {(variant === "prism" || replaySweep) && sweepCount > 0 && (
        <div
          key={sweepCount}
          aria-hidden="true"
          className="animate-prism-sweep pointer-events-none absolute inset-y-0 left-0 z-30 w-1/3 bg-gradient-to-r from-transparent via-[#ff2e43]/16 to-amber-300/14 mix-blend-screen"
        />
      )}
    </div>
  );
}
