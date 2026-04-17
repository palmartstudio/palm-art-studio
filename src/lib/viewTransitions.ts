import type { CSSProperties } from "react";

export const viewTransitionName = (name: string): CSSProperties =>
  typeof document !== "undefined" && "startViewTransition" in document
    ? ({ viewTransitionName: name } as CSSProperties)
    : {};

export const supportsViewTimeline = (): boolean =>
  typeof window !== "undefined" &&
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("animation-timeline", "view()");

export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
