"use client";

import { useEffect, useMemo, useRef, useState, CSSProperties } from "react";
import Image from "next/image";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import { viewTransitionName, supportsViewTimeline } from "../lib/viewTransitions";

export interface TimelineStep {
  _key: string;
  stage?: string;
  caption?: string;
  capturedAt?: string;
  mediaType?: "image" | "video";
  imageUrl?: string;
  imageLqip?: string;
  videoUrl?: string;
  videoMimeType?: string;
  videoPosterUrl?: string;
  videoPosterLqip?: string;
}

export interface TimelineViewerProps {
  steps: TimelineStep[];
  finalImageUrl?: string;
  finalImageLqip?: string;
  finalTitle?: string;
  variant?: "inline" | "page";
  theme?: "dark" | "light";
  artworkId?: string;
}

const STAGE_LABELS: Record<string, string> = {
  blank: "Blank Canvas",
  underpainting: "Underpainting",
  early: "Early Progress",
  mid: "Mid Progress",
  late: "Late Progress",
  finished: "Finished",
  detail: "Detail",
  studio: "In Studio",
  other: "Step",
};

const THEME = {
  dark: {
    surface: "#1E1B17",
    surfaceRaised: "#2A2520",
    text: "#F5F0E8",
    muted: "#D4C9B8",
    dim: "#B8AFA3",
    accent: "#C4A86E",
    border: "rgba(245,240,232,0.1)",
  },
  light: {
    surface: "#F5F0E8",
    surfaceRaised: "#FFFFFF",
    text: "#1E1B17",
    muted: "#3F3A32",
    dim: "#6B6459",
    accent: "#C47D5A",
    border: "rgba(30,27,23,0.1)",
  },
};

const FALLBACK_BLUR =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyYTI1MjAiLz48L3N2Zz4=";

export default function TimelineViewer({
  steps,
  finalImageUrl,
  finalImageLqip,
  finalTitle,
  variant = "inline",
  theme = "dark",
  artworkId,
}: TimelineViewerProps) {
  const c = THEME[theme];
  const railRef = useRef<HTMLDivElement>(null);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const [useCssTimeline, setUseCssTimeline] = useState<boolean>(true);

  useEffect(() => {
    setUseCssTimeline(supportsViewTimeline());
  }, []);

  const ordered = useMemo<TimelineStep[]>(() => {
    const base = [...steps];
    const datedCount = base.filter((s) => s.capturedAt).length;
    if (datedCount >= 2) {
      base.sort((a, b) => {
        const da = a.capturedAt || "";
        const db = b.capturedAt || "";
        if (da && db) return da.localeCompare(db);
        if (da) return -1;
        if (db) return 1;
        return 0;
      });
    }
    const hasFinished = base.some((s) => s.stage === "finished");
    if (finalImageUrl && !hasFinished) {
      base.push({
        _key: `__final_${artworkId || "synthetic"}`,
        stage: "finished",
        caption: finalTitle ? `Finished — ${finalTitle}` : "Finished",
        imageUrl: finalImageUrl,
        imageLqip: finalImageLqip,
      });
    }
    return base;
  }, [steps, finalImageUrl, finalImageLqip, finalTitle, artworkId]);

  useEffect(() => {
    if (zoomIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeZoom();
      else if (e.key === "ArrowLeft") setZoomIndex((i) => (i === null ? null : Math.max(0, i - 1)));
      else if (e.key === "ArrowRight") setZoomIndex((i) => (i === null ? null : Math.min(ordered.length - 1, i + 1)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomIndex, ordered.length]);

  useEffect(() => {
    if (zoomIndex === null) return;
    const onPop = (e: PopStateEvent) => {
      if (!e.state?.timelineZoom) setZoomIndex(null);
    };
    window.history.pushState({ timelineZoom: true, stepKey: ordered[zoomIndex]?._key }, "");
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (window.history.state?.timelineZoom) window.history.back();
    };
  }, [zoomIndex, ordered]);

  const closeZoom = () => setZoomIndex(null);

  const stepWidth = variant === "page" ? "clamp(260px, 42vw, 420px)" : "clamp(220px, 60vw, 320px)";

  const scrollByStep = (dir: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const firstStep = rail.querySelector<HTMLElement>(".tl-step");
    const delta = firstStep ? firstStep.getBoundingClientRect().width + 20 : 280;
    rail.scrollBy({ left: delta * dir, behavior: "smooth" });
  };

  if (ordered.length === 0) return null;

  return (
    <div className="tl-root" style={{ position: "relative" }}>
      <div
        ref={railRef}
        className={`tl-rail ${variant === "page" ? "tl-rail-page" : ""}`}
        style={{ display: "flex", gap: 20, overflowX: "auto", paddingBottom: 8 }}
      >
        {ordered.map((step, i) => {
          const isFinal = step._key.startsWith("__final_") && artworkId;
          const finalStyle: CSSProperties = isFinal ? viewTransitionName(`artwork-${artworkId}`) : {};
          return (
            <motion.div
              key={step._key}
              className="tl-step"
              onClick={() => setZoomIndex(i)}
              initial={useCssTimeline ? false : { opacity: 0, y: 16 }}
              whileInView={useCssTimeline ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: i * 0.04 }}
              style={{
                flex: "0 0 auto",
                width: stepWidth,
                cursor: "zoom-in",
                background: c.surfaceRaised,
                border: `1px solid ${c.border}`,
                padding: 10,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "4 / 5",
                  background: c.surface,
                  overflow: "hidden",
                  ...finalStyle,
                }}
              >
                {step.mediaType === "video" && step.videoUrl ? (
                  <TimelineVideo
                    src={step.videoUrl}
                    mime={step.videoMimeType}
                    poster={step.videoPosterUrl || step.imageUrl}
                    posterLqip={step.videoPosterLqip || step.imageLqip}
                    alt={step.caption || STAGE_LABELS[step.stage || "other"] || "Timeline step"}
                  />
                ) : step.imageUrl ? (
                  <Image
                    src={step.imageUrl}
                    alt={step.caption || STAGE_LABELS[step.stage || "other"] || "Timeline step"}
                    fill
                    sizes={variant === "page" ? "(max-width: 768px) 80vw, 420px" : "(max-width: 768px) 60vw, 320px"}
                    placeholder="blur"
                    blurDataURL={step.imageLqip || FALLBACK_BLUR}
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ position: "absolute", inset: 0, background: c.surface }} />
                )}
              </div>
              <div
                style={{
                  fontFamily: "'Outfit',sans-serif",
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: c.accent,
                }}
              >
                {STAGE_LABELS[step.stage || "other"] || "Step"}{" "}
                <span style={{ color: c.dim, fontWeight: 400 }}>
                  {"  "}·{"  "}
                  {String(i + 1).padStart(2, "0")}/{String(ordered.length).padStart(2, "0")}
                </span>
              </div>
              {step.caption && (
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond',serif",
                    fontSize: "0.98rem",
                    fontStyle: "italic",
                    color: c.muted,
                    lineHeight: 1.45,
                  }}
                >
                  {step.caption}
                </div>
              )}
              {step.capturedAt && (
                <div
                  style={{
                    fontFamily: "'Outfit',sans-serif",
                    fontSize: "0.7rem",
                    color: c.dim,
                    letterSpacing: "0.05em",
                  }}
                >
                  {formatDate(step.capturedAt)}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="tl-arrows" aria-hidden="true">
        <button className="tl-arrow tl-arrow-prev" onClick={() => scrollByStep(-1)} aria-label="Previous step">
          ‹
        </button>
        <button className="tl-arrow tl-arrow-next" onClick={() => scrollByStep(1)} aria-label="Next step">
          ›
        </button>
      </div>

      <AnimatePresence>
        {zoomIndex !== null && ordered[zoomIndex] && (
          <motion.div
            key="zoom"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeZoom}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 3000,
              background: "rgba(10,8,6,0.96)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)",
            }}
          >
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.3}
              onClick={(e) => e.stopPropagation()}
              onDragEnd={(_e, info: PanInfo) => {
                if (info.offset.y > 140 || info.velocity.y > 500) closeZoom();
              }}
              style={{
                position: "relative",
                width: "min(94vw, 900px)",
                maxHeight: "86vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                touchAction: "pinch-zoom",
              }}
            >
              {ordered[zoomIndex].mediaType === "video" && ordered[zoomIndex].videoUrl ? (
                <video
                  src={ordered[zoomIndex].videoUrl}
                  poster={ordered[zoomIndex].videoPosterUrl || ordered[zoomIndex].imageUrl}
                  controls
                  autoPlay
                  playsInline
                  loop
                  preload="metadata"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "86vh",
                    objectFit: "contain",
                    background: "#000",
                  }}
                />
              ) : ordered[zoomIndex].imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ordered[zoomIndex].imageUrl}
                  alt={ordered[zoomIndex].caption || STAGE_LABELS[ordered[zoomIndex].stage || "other"]}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "86vh",
                    objectFit: "contain",
                    userSelect: "none",
                    ...({ WebkitUserDrag: "none" } as CSSProperties),
                  }}
                  draggable={false}
                />
              ) : null}
            </motion.div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoomIndex((i) => (i === null ? null : Math.max(0, i - 1)));
              }}
              aria-label="Previous"
              style={zoomArrowStyle("left")}
            >
              ‹
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoomIndex((i) => (i === null ? null : Math.min(ordered.length - 1, i + 1)));
              }}
              aria-label="Next"
              style={zoomArrowStyle("right")}
            >
              ›
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeZoom();
              }}
              aria-label="Close"
              style={{
                position: "fixed",
                top: "calc(env(safe-area-inset-top) + 16px)",
                right: 16,
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.4)",
                color: "#F5F0E8",
                border: "1px solid rgba(245,240,232,0.2)",
                fontSize: "1.4rem",
                cursor: "pointer",
              }}
            >
              ×
            </button>
            <div
              style={{
                position: "fixed",
                bottom: "calc(env(safe-area-inset-bottom) + 16px)",
                left: 0,
                right: 0,
                textAlign: "center",
                fontFamily: "'Outfit',sans-serif",
                fontSize: "0.7rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(245,240,232,0.6)",
                pointerEvents: "none",
              }}
            >
              {String(zoomIndex + 1).padStart(2, "0")} / {String(ordered.length).padStart(2, "0")}
              {ordered[zoomIndex].stage ? ` · ${STAGE_LABELS[ordered[zoomIndex].stage || "other"]}` : ""}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .tl-rail {
          scroll-snap-type: x mandatory;
          scroll-padding-inline: 24px;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
          scrollbar-width: none;
        }
        .tl-rail::-webkit-scrollbar {
          display: none;
        }
        .tl-rail-page {
          mask-image: linear-gradient(to right, transparent 0, #000 40px, #000 calc(100% - 40px), transparent);
          -webkit-mask-image: linear-gradient(to right, transparent 0, #000 40px, #000 calc(100% - 40px), transparent);
        }
        .tl-step {
          scroll-snap-align: center;
        }
        @supports (animation-timeline: view()) {
          .tl-step {
            animation: tlRise linear both;
            animation-timeline: view(inline);
            animation-range: entry 0% entry 80%;
          }
          @keyframes tlRise {
            from {
              opacity: 0;
              transform: translateY(16px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .tl-step {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
        .tl-arrows {
          display: none;
        }
        @media (hover: hover) and (pointer: fine) {
          .tl-arrows {
            display: block;
          }
          .tl-arrow {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            border-radius: 999px;
            border: 1px solid rgba(245, 240, 232, 0.25);
            background: rgba(30, 27, 23, 0.65);
            color: #f5f0e8;
            font-size: 1.4rem;
            line-height: 1;
            cursor: pointer;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
          }
          .tl-arrow:hover {
            background: rgba(196, 125, 90, 0.6);
          }
          .tl-arrow-prev {
            left: -8px;
          }
          .tl-arrow-next {
            right: -8px;
          }
        }
      `}</style>
    </div>
  );
}

function TimelineVideo({
  src,
  mime,
  poster,
  posterLqip,
  alt,
}: {
  src: string;
  mime?: string;
  poster?: string;
  posterLqip?: string;
  alt: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            el.play().catch(() => {
              /* autoplay blocked — user can tap to fullscreen */
            });
          } else {
            el.pause();
          }
        });
      },
      { threshold: [0, 0.5, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={alt}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          background: posterLqip ? `url(${posterLqip}) center/cover` : "#1E1B17",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          padding: "4px 8px",
          background: "rgba(0,0,0,0.55)",
          color: "#F5F0E8",
          fontFamily: "'Outfit',sans-serif",
          fontSize: "0.6rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          fontWeight: 600,
          pointerEvents: "none",
        }}
      >
        ▶ Video
      </div>
    </>
  );
}

function zoomArrowStyle(side: "left" | "right"): CSSProperties {
  return {
    position: "fixed",
    top: "50%",
    [side]: 12,
    transform: "translateY(-50%)",
    width: 52,
    height: 52,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.45)",
    border: "1px solid rgba(245,240,232,0.2)",
    color: "#F5F0E8",
    fontSize: "1.8rem",
    cursor: "pointer",
  } as CSSProperties;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}
