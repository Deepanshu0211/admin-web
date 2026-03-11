import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import type { ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const location = useLocation();

  const generateLiquidPath = (x: number) => {
    const progress = x / 100;

    const wave = Math.sin(progress * Math.PI) * 30;

    const cp1x = x + wave;
    const cp2x = x - wave;

    return `
      M 0 0
      L 0 100
      L ${x} 100
      C ${cp1x} 80 ${cp2x} 20 ${x} 0
      Z
    `;
  };

  const showOverlay = () => {
    if (!overlayRef.current) return;

    overlayRef.current.style.display = "flex";
    overlayRef.current.style.pointerEvents = "auto";
  };

  const hideOverlay = () => {
    if (!overlayRef.current) return;

    overlayRef.current.style.display = "none";
    overlayRef.current.style.pointerEvents = "none";
  };

  const animate = (onComplete?: () => void) => {
    const state = { x: 0 };

    tl.current?.kill();

    tl.current = gsap.timeline({
      defaults: { ease: "power4.inOut" },
      onComplete,
    });

    tl.current

      // liquid sweep
      .to(state, {
        x: 100,
        duration: 0.9,
        onUpdate: () => {
          if (!pathRef.current) return;
          pathRef.current.setAttribute("d", generateLiquidPath(state.x));
        },
      })

      // page reveal
      .from(
        "main",
        {
          opacity: 0,
          scale: 0.96,
          y: 40,
          filter: "blur(12px)",
          duration: 0.7,
        },
        0.2
      );
  };

  useEffect(() => {
    const handler = (e: any) => {
      const callback = e.detail?.callback;

      if (!callback) return;

      showOverlay();

      animate(() => {
        callback();
      });
    };

    window.addEventListener("start-page-transition", handler);

    return () =>
      window.removeEventListener("start-page-transition", handler);
  }, []);

  useGSAP(() => {
    showOverlay();

    animate(() => {
      hideOverlay();
    });
  }, [location.pathname]);

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none backdrop-blur-md"
      >
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="liquidGradient" gradientTransform="rotate(45)">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>

          <path
            ref={pathRef}
            fill="url(#liquidGradient)"
            d="M 0 0 L 0 100 L 0 100 C 0 75 0 25 0 0 Z"
          />
        </svg>
      </div>

      <main className="will-change-transform">
        {children}
      </main>
    </>
  );
}