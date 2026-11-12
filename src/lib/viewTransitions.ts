import type { CSSProperties } from "react";

// Always emit the property: branching on `document` made the server and browser
// render different style attributes (a hydration mismatch). Browsers without
// view transitions simply ignore it.
export const viewTransitionName = (name: string): CSSProperties =>
  ({ viewTransitionName: name } as CSSProperties);

export const supportsViewTimeline = (): boolean =>
  typeof window !== "undefined" &&
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("animation-timeline", "view()");

export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
