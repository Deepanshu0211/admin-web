import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

export default function PageTransition({ children }: { children: ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const location = useLocation();

  const generatePath = (x: number, direction: "enter" | "exit") => {
    const progress = x / 100;
    const curve = 4 * progress * (1 - progress) * 60;
    const cx = direction === "enter" ? x - curve : x + curve;

    if (direction === "enter") {
      return `M 100 0 L 100 100 L ${x} 100 Q ${cx} 50 ${x} 0 Z`;
    }

    return `M 0 0 L 0 100 L ${x} 100 Q ${cx} 50 ${x} 0 Z`;
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

  const animate = (direction: "enter" | "exit", onComplete?: () => void) => {
    if (!pathRef.current) return;

    timeline.current?.kill();

    const state = { x: 0 };

    timeline.current = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete,
    });

    timeline.current.to(state, {
      x: 100,
      duration: 0.6,
      onUpdate: () => {
        pathRef.current!.setAttribute("d", generatePath(state.x, direction));
      },
    });
  };

  useEffect(() => {
    const handler = (e: any) => {
      const callback = e.detail?.callback;
      if (!callback) return;

      showOverlay();
      animate("exit", callback);
    };

    window.addEventListener("start-page-transition", handler);
    return () => window.removeEventListener("start-page-transition", handler);
  }, []);

  useGSAP(() => {
    showOverlay();

    animate("enter", () => {
      hideOverlay();
    });
  }, [location.pathname]);

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none will-change-transform"
      >
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            ref={pathRef}
            fill="var(--accent)"
            d="M 100 0 L 100 100 L 0 100 Q 0 50 0 0 Z"
          />
        </svg>
      </div>

      {children}
    </>
  );
}