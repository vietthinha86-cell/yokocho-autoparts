"use client";

import { useEffect, useRef, type RefObject } from "react";

export type RainBeamColorMode = "off" | "3000k" | "4300k" | "6000k" | "combo";

export interface CanvasPointerTarget {
  x: number;
  y: number;
  active: boolean;
}

interface MidnightRainCanvasProps {
  intensity?: "hero" | "simulator" | "subtle";
  beamMode?: RainBeamColorMode;
  highBeam?: boolean;
  pointerRef?: RefObject<CanvasPointerTarget>;
  className?: string;
}

interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
  width: number;
  alpha: number;
  crimson: boolean;
}

interface Ember {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  phase: number;
  amber: boolean;
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
  crimson: boolean;
}

interface VortexParticle {
  t: number;
  speed: number;
  spreadX: number;
  spreadY: number;
  size: number;
  alpha: number;
  palette: "amber" | "crimson" | "pearl";
}

function resolveBeamTint(beamMode: RainBeamColorMode, highBeam: boolean): string {
  if (highBeam && beamMode !== "off") {
    return "rgba(186, 230, 253, ";
  }
  switch (beamMode) {
    case "3000k":
      return "rgba(251, 191, 36, ";
    case "4300k":
      return "rgba(254, 240, 138, ";
    case "6000k":
      return "rgba(191, 232, 255, ";
    case "combo":
      return "rgba(253, 224, 150, ";
    default:
      return "rgba(255, 75, 95, ";
  }
}

export function MidnightRainCanvas({
  intensity = "hero",
  beamMode = "off",
  highBeam = false,
  pointerRef,
  className = "",
}: MidnightRainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const beamRef = useRef<{ beamMode: RainBeamColorMode; highBeam: boolean }>({
    beamMode,
    highBeam,
  });

  useEffect(() => {
    beamRef.current = { beamMode, highBeam };
  }, [beamMode, highBeam]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let rafId = 0;

    const dropCount = intensity === "simulator" ? 135 : intensity === "hero" ? 105 : 42;
    const emberCount = intensity === "hero" ? 28 : intensity === "simulator" ? 18 : 10;
    const rippleCount = intensity === "subtle" ? 0 : 12;
    const vortexCount = intensity === "hero" ? 84 : 0;

    const drops: Drop[] = [];
    const embers: Ember[] = [];
    const ripples: Ripple[] = [];
    const vortexParticles: VortexParticle[] = [];

    const seedParticles = () => {
      drops.length = 0;
      embers.length = 0;
      ripples.length = 0;
      vortexParticles.length = 0;

      for (let i = 0; i < dropCount; i += 1) {
        const depth = Math.random();
        drops.push({
          x: Math.random() * Math.max(width, 300),
          y: Math.random() * Math.max(height, 200),
          len: 14 + depth * 28,
          speed: 9 + depth * 12,
          width: 0.65 + depth * 0.9,
          alpha: 0.12 + depth * 0.38,
          crimson: Math.random() < (intensity === "hero" ? 0.24 : 0.14),
        });
      }

      for (let i = 0; i < emberCount; i += 1) {
        embers.push({
          x: Math.random() * Math.max(width, 300),
          y: Math.random() * Math.max(height, 200),
          r: 1 + Math.random() * 2.2,
          vx: (Math.random() - 0.5) * 0.45,
          vy: -0.25 - Math.random() * 0.55,
          alpha: 0.2 + Math.random() * 0.5,
          phase: Math.random() * Math.PI * 2,
          amber: Math.random() < 0.32,
        });
      }

      for (let i = 0; i < rippleCount; i += 1) {
        ripples.push({
          x: Math.random() * Math.max(width, 300),
          y: Math.max(height, 200) * (0.76 + Math.random() * 0.22),
          r: 2 + Math.random() * 14,
          maxR: 12 + Math.random() * 22,
          alpha: 0.25 + Math.random() * 0.35,
          crimson: Math.random() < 0.5,
        });
      }

      for (let i = 0; i < vortexCount; i += 1) {
        const roll = Math.random();
        vortexParticles.push({
          t: Math.random() * Math.PI * 2,
          speed: 0.007 + Math.random() * 0.008,
          spreadX: (Math.random() - 0.5) * 34,
          spreadY: (Math.random() - 0.5) * 28,
          size: 0.9 + Math.random() * 2.1,
          alpha: 0.28 + Math.random() * 0.62,
          palette: roll < 0.46 ? "amber" : roll < 0.85 ? "crimson" : "pearl",
        });
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedParticles();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let tick = 0;
    const drawFrame = () => {
      tick += 0.03;
      ctx.clearRect(0, 0, width, height);

      const { beamMode: curBeam, highBeam: curHigh } = beamRef.current;
      const beamLitTint = resolveBeamTint(curBeam, curHigh);
      const beamActive = curBeam !== "off";

      // Diagonal rain streaks (slant angle -9 deg matching wind in narrow Kyoto alley)
      const windDx = -2.1;
      for (let i = 0; i < drops.length; i += 1) {
        const d = drops[i];
        d.x += windDx * (d.speed * 0.11);
        d.y += d.speed;

        if (d.y > height + 20) {
          d.y = -d.len - Math.random() * 30;
          d.x = Math.random() * (width + 80);
        }
        if (d.x < -30) {
          d.x = width + 20;
        }

        // Check if raindrop intersects forward headlight cone inside simulator
        const inLowerCone =
          intensity === "simulator" &&
          beamActive &&
          d.y > height * 0.36 &&
          d.x > width * 0.1 &&
          d.x < width * 0.9;

        ctx.beginPath();
        ctx.lineWidth = inLowerCone ? d.width * 1.25 : d.width;
        if (inLowerCone) {
          const boost = curHigh ? 0.88 : 0.68;
          ctx.strokeStyle = `${beamLitTint}${(d.alpha * boost + 0.16).toFixed(2)})`;
        } else if (d.crimson) {
          ctx.strokeStyle = `rgba(255, 65, 85, ${(d.alpha * 0.85).toFixed(2)})`;
        } else {
          ctx.strokeStyle = `rgba(226, 232, 240, ${d.alpha.toFixed(2)})`;
        }

        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - windDx * (d.len * 0.11), d.y - d.len);
        ctx.stroke();
      }

      // Wet asphalt puddle ripples along bottom 22%
      for (let i = 0; i < ripples.length; i += 1) {
        const rp = ripples[i];
        rp.r += 0.32;
        rp.alpha *= 0.968;
        if (rp.r >= rp.maxR || rp.alpha < 0.04) {
          rp.x = width * (0.12 + Math.random() * 0.76);
          rp.y = height * (0.76 + Math.random() * 0.21);
          rp.r = 1.5;
          rp.maxR = 14 + Math.random() * 20;
          rp.alpha = beamActive ? 0.5 : 0.32;
          rp.crimson = !beamActive || Math.random() < 0.35;
        }

        ctx.save();
        ctx.translate(rp.x, rp.y);
        ctx.scale(2.4, 0.55);
        ctx.beginPath();
        ctx.arc(0, 0, rp.r, 0, Math.PI * 2);
        ctx.lineWidth = 0.85;
        ctx.strokeStyle = rp.crimson
          ? `rgba(255, 58, 78, ${rp.alpha.toFixed(2)})`
          : beamActive
            ? `${beamLitTint}${rp.alpha.toFixed(2)})`
            : `rgba(248, 250, 252, ${(rp.alpha * 0.65).toFixed(2)})`;
        ctx.stroke();
        ctx.restore();
      }

      // Drifting crimson embers & golden lantern motes
      for (let i = 0; i < embers.length; i += 1) {
        const e = embers[i];
        e.x += e.vx + Math.sin(tick + e.phase) * 0.22;
        e.y += e.vy;
        if (e.y < -10) {
          e.y = height + 8;
          e.x = Math.random() * width;
        }

        const pulse = 0.65 + 0.35 * Math.sin(tick * 2 + e.phase);
        const color =
          intensity === "simulator" && beamActive
            ? `${beamLitTint}${(e.alpha * pulse).toFixed(2)})`
            : e.amber
              ? `rgba(251, 191, 36, ${(e.alpha * pulse).toFixed(2)})`
              : `rgba(255, 55, 76, ${(e.alpha * pulse).toFixed(2)})`;

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Spatial Figure-8 / Infinity Optical Particle Vortex (Hero showcase layer)
      if (vortexParticles.length > 0) {
        const ptr = pointerRef?.current;
        const focusX = width >= 960 ? width * 0.77 : width * 0.72;
        const focusY = height * 0.43;
        const rx = width >= 960 ? Math.min(210, width * 0.16) : Math.min(130, width * 0.2);
        const ry = Math.min(145, height * 0.28);

        for (let i = 0; i < vortexParticles.length; i += 1) {
          const vp = vortexParticles[i];
          vp.t += vp.speed;

          const baseX = focusX + Math.sin(vp.t) * rx + vp.spreadX * Math.cos(vp.t * 0.5);
          const baseY =
            focusY + Math.sin(vp.t * 2) * ry * 0.65 + vp.spreadY * Math.sin(vp.t * 0.7);
          const prevX = focusX + Math.sin(vp.t - 0.09) * rx + vp.spreadX * Math.cos((vp.t - 0.09) * 0.5);
          const prevY =
            focusY +
            Math.sin((vp.t - 0.09) * 2) * ry * 0.65 +
            vp.spreadY * Math.sin((vp.t - 0.09) * 0.7);

          let px = baseX;
          let py = baseY;
          let tailX = prevX;
          let tailY = prevY;
          if (ptr?.active) {
            const dx = ptr.x - baseX;
            const dy = ptr.y - baseY;
            const dist = Math.hypot(dx, dy);
            if (dist < 220 && dist > 1) {
              const pull = ((220 - dist) / 220) * 18;
              px += (dx / dist) * pull;
              py += (dy / dist) * pull;
              tailX += (dx / dist) * pull * 0.5;
              tailY += (dy / dist) * pull * 0.5;
            }
          }

          const twinkle = 0.6 + 0.4 * Math.sin(tick * 2.5 + vp.t * 3);
          const a = (vp.alpha * twinkle).toFixed(2);
          const strokeCol =
            vp.palette === "amber"
              ? `rgba(245, 158, 11, ${a})`
              : vp.palette === "crimson"
                ? `rgba(255, 46, 67, ${a})`
                : `rgba(254, 243, 199, ${a})`;

          ctx.beginPath();
          ctx.lineWidth = vp.size * 0.85;
          ctx.strokeStyle = strokeCol;
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(px, py);
          ctx.stroke();

          ctx.beginPath();
          ctx.fillStyle = strokeCol;
          ctx.arc(px, py, vp.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const render = () => {
      drawFrame();
      rafId = window.requestAnimationFrame(render);
    };

    if (prefersReducedMotion) {
      drawFrame();
    } else {
      rafId = window.requestAnimationFrame(render);
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [intensity, pointerRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none block h-full w-full ${className}`}
    />
  );
}

