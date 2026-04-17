"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import NavClient from "../../components/NavClient";
import TimelineViewer, { TimelineStep } from "../../components/TimelineViewer";
import { viewTransitionName } from "../../lib/viewTransitions";

interface Artwork {
  _id: string;
  slug?: { current?: string };
  title: string;
  medium?: string;
  year?: number;
  dimensions?: string;
  imageUrl?: string;
  imageLqip?: string;
  processTimeline?: TimelineStep[];
}

interface ProcessPageCopy {
  eyebrow?: string;
  heading?: string;
  subtitle?: string;
  emptyStateMessage?: string;
  ctaBannerHeading?: string;
  ctaBannerDescription?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
}

export default function ProcessClient({
  artworks,
  pageContent,
}: {
  artworks: Artwork[];
  pageContent: Record<string, any>;
}) {
  const copy: ProcessPageCopy = pageContent?.processPage || {};
  const [activeId, setActiveId] = useState<string | null>(null);

  const items = useMemo(
    () => (artworks || []).filter((a) => (a.processTimeline?.length || 0) > 0 && a.imageUrl),
    [artworks]
  );

  const active = useMemo(() => items.find((a) => a._id === activeId) || null, [items, activeId]);

  useEffect(() => {
    if (!active) return;
    const onPop = (e: PopStateEvent) => {
      if (!e.state?.processView) setActiveId(null);
    };
    window.history.pushState({ processView: true, artworkId: active._id }, "");
    window.addEventListener("popstate", onPop);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("popstate", onPop);
      document.body.style.overflow = prevOverflow;
      if (window.history.state?.processView) window.history.back();
    };
  }, [active]);

  return (
    <div style={{ background: "#1E1B17", minHeight: "100vh" }}>
      <NavClient theme="dark" activeHref="/process" />

      {/* ═══ HERO ═══ */}
      <section
        style={{
          minHeight: "clamp(320px,50vh,60vh)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "#2A2520",
          padding: "clamp(100px,18vw,140px) clamp(16px,4vw,80px) clamp(32px,4vw,48px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle,rgba(196,125,90,0.12),transparent 70%)",
            top: "-15%",
            right: "-10%",
            animation: "floatSlow 20s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 350,
            height: 350,
            borderRadius: "50%",
            background: "radial-gradient(circle,rgba(139,154,126,0.1),transparent 70%)",
            bottom: "-10%",
            left: "-5%",
            animation: "floatSlow 20s ease-in-out infinite",
            animationDelay: "-8s",
          }}
        />

        <div style={{ maxWidth: 1400, margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  fontFamily: "'Outfit',sans-serif",
                  fontSize: "0.7rem",
                  fontWeight: 500,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#C4A86E",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ width: 24, height: 1.5, background: "#C4A86E", display: "inline-block" }} />
                {copy.eyebrow || "Behind the Canvas"}
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
                style={{
                  fontFamily: "'DM Serif Display',serif",
                  fontSize: "clamp(2.2rem,6vw,5rem)",
                  fontWeight: 400,
                  color: "#F5F0E8",
                  lineHeight: 1.05,
                  margin: 0,
                }}
              >
                How the Work{" "}
                <em style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontStyle: "italic", color: "#C47D5A" }}>
                  Gets Made
                </em>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.16 }}
                style={{
                  fontFamily: "'Cormorant Garamond',serif",
                  fontSize: "clamp(1rem,2vw,1.15rem)",
                  fontWeight: 300,
                  fontStyle: "italic",
                  color: "#D4C9B8",
                  marginTop: 12,
                  maxWidth: 620,
                  lineHeight: 1.7,
                }}
              >
                {copy.subtitle ||
                  "Every painting starts with a blank canvas, a reference, and an idea. These are the pieces documented stage by stage — proof of the hours behind each finished work."}
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 6,
                fontFamily: "'DM Serif Display',serif",
                color: "#F5F0E8",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "clamp(2.5rem,8vw,3.5rem)", lineHeight: 1 }}>{items.length}</span>
              <span
                style={{
                  fontSize: "0.9rem",
                  color: "#B8AFA3",
                  fontFamily: "'Outfit',sans-serif",
                  fontWeight: 300,
                  letterSpacing: "0.05em",
                }}
              >
                {items.length === 1 ? "timeline" : "timelines"}
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ GRID ═══ */}
      <section style={{ padding: "clamp(40px,5vw,80px) clamp(16px,4vw,80px)", minHeight: "60vh" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          {items.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 20px",
                fontFamily: "'Cormorant Garamond',serif",
                fontStyle: "italic",
                fontSize: "1.2rem",
                color: "#D4C9B8",
              }}
            >
              <p style={{ marginBottom: 24 }}>
                {copy.emptyStateMessage || "New process timelines coming soon. Check back shortly."}
              </p>
              <a
                href="/gallery"
                className="btn-secondary"
                style={{ color: "#F5F0E8", borderColor: "#F5F0E8", display: "inline-block" }}
              >
                Browse the Gallery
              </a>
            </div>
          ) : (
            <div className="proc-grid">
              {items.map((art) => {
                const slug = art.slug?.current || art._id;
                const timeline = art.processTimeline || [];
                const previews = pickPreviews(timeline, art.imageUrl);
                return (
                  <motion.button
                    key={art._id}
                    type="button"
                    onClick={() => setActiveId(art._id)}
                    className="proc-card"
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -4 }}
                    style={{
                      appearance: "none",
                      background: "#2A2520",
                      border: "1px solid rgba(245,240,232,0.08)",
                      color: "#F5F0E8",
                      cursor: "pointer",
                      padding: 0,
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "4 / 5",
                        overflow: "hidden",
                        ...viewTransitionName(`artwork-${slug}`),
                      }}
                    >
                      {art.imageUrl && (
                        <Image
                          src={art.imageUrl}
                          alt={art.title}
                          fill
                          sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                          placeholder={art.imageLqip ? "blur" : "empty"}
                          blurDataURL={art.imageLqip}
                          style={{ objectFit: "cover" }}
                        />
                      )}
                      <div
                        style={{
                          position: "absolute",
                          top: 14,
                          left: 14,
                          fontFamily: "'Outfit',sans-serif",
                          fontSize: "0.6rem",
                          fontWeight: 700,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "#F5F0E8",
                          background: "rgba(196,125,90,0.85)",
                          padding: "4px 10px",
                        }}
                      >
                        {timeline.length} {timeline.length === 1 ? "step" : "steps"}
                      </div>
                    </div>

                    <div style={{ padding: "18px 20px 10px" }}>
                      <div
                        style={{
                          fontFamily: "'Outfit',sans-serif",
                          fontSize: "0.65rem",
                          fontWeight: 500,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          color: "#C4A86E",
                          marginBottom: 4,
                        }}
                      >
                        {art.medium || "Original Work"}
                        {art.year ? ` · ${art.year}` : ""}
                      </div>
                      <div
                        style={{
                          fontFamily: "'DM Serif Display',serif",
                          fontSize: "1.35rem",
                          color: "#F5F0E8",
                          marginBottom: 2,
                        }}
                      >
                        {art.title}
                      </div>
                      {art.dimensions && (
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: "0.72rem", color: "#B8AFA3" }}>
                          {art.dimensions}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 2,
                        padding: "10px 12px 14px",
                      }}
                    >
                      {previews.map((url, i) => (
                        <div
                          key={`${art._id}-prev-${i}`}
                          style={{ position: "relative", aspectRatio: "1 / 1", background: "#1E1B17", overflow: "hidden" }}
                        >
                          {url && (
                            <Image
                              src={url}
                              alt=""
                              fill
                              sizes="120px"
                              style={{ objectFit: "cover", opacity: 0.85 }}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        padding: "0 20px 18px",
                        fontFamily: "'Outfit',sans-serif",
                        fontSize: "0.72rem",
                        fontWeight: 500,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "#C47D5A",
                      }}
                    >
                      See the Process →
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        <style>{`
          .proc-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: clamp(16px, 2vw, 28px);
          }
          @media (max-width: 1100px) { .proc-grid { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 700px)  { .proc-grid { grid-template-columns: 1fr; } }
          .proc-card { transition: box-shadow 0.4s ease; }
          .proc-card:hover { box-shadow: 0 20px 50px rgba(0,0,0,0.4); }
          @supports (animation-timeline: view()) {
            .proc-card {
              animation: procRise linear both;
              animation-timeline: view();
              animation-range: entry 0% entry 60%;
            }
            @keyframes procRise {
              from { opacity: 0; transform: translateY(22px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          }
          @keyframes floatSlow {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -20px) scale(1.05); }
            66% { transform: translate(-20px, 15px) scale(0.95); }
          }
        `}</style>
      </section>

      {/* ═══ TAKEOVER ═══ */}
      <AnimatePresence>
        {active && (
          <motion.div
            key={active._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 2500,
              background: "rgba(30,27,23,0.97)",
              overflowY: "auto",
              padding:
                "calc(env(safe-area-inset-top) + 24px) clamp(16px, 4vw, 48px) calc(env(safe-area-inset-bottom) + 48px)",
            }}
            onClick={() => setActiveId(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.25}
              onDragEnd={(_e, info: PanInfo) => {
                if (info.offset.y > 120 || info.velocity.y > 500) setActiveId(null);
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: 1200,
                margin: "0 auto",
                background: "#1E1B17",
                padding: "clamp(20px, 4vw, 40px)",
                position: "relative",
              }}
            >
              <button
                onClick={() => setActiveId(null)}
                aria-label="Close"
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 44,
                  height: 44,
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(245,240,232,0.2)",
                  color: "#F5F0E8",
                  fontSize: "1.4rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>

              <div
                style={{
                  fontFamily: "'Outfit',sans-serif",
                  fontSize: "0.65rem",
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#C4A86E",
                  marginBottom: 8,
                }}
              >
                {active.medium || "Original Work"}
                {active.year ? ` · ${active.year}` : ""}
              </div>
              <h2
                style={{
                  fontFamily: "'DM Serif Display',serif",
                  fontSize: "clamp(1.6rem, 3.2vw, 2.4rem)",
                  color: "#F5F0E8",
                  marginBottom: 4,
                }}
              >
                {active.title}
              </h2>
              {active.dimensions && (
                <div
                  style={{
                    fontFamily: "'Outfit',sans-serif",
                    fontSize: "0.75rem",
                    color: "#B8AFA3",
                    marginBottom: 24,
                    letterSpacing: "0.05em",
                  }}
                >
                  {active.dimensions}
                </div>
              )}

              <div style={{ width: 40, height: 1.5, background: "#C47D5A", margin: "4px 0 28px" }} />

              <TimelineViewer
                steps={active.processTimeline || []}
                finalImageUrl={active.imageUrl}
                finalImageLqip={active.imageLqip}
                finalTitle={active.title}
                variant="page"
                artworkId={active.slug?.current || active._id}
              />

              <div style={{ textAlign: "center", marginTop: 32 }}>
                <a
                  href="/#contact"
                  className="btn-primary"
                  style={{ background: "#C47D5A", display: "inline-block" }}
                >
                  Commission a Similar Piece
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ CTA BANNER ═══ */}
      <section
        style={{
          background: "#2A2520",
          padding: "clamp(60px,8vw,100px) clamp(24px,5vw,80px)",
          textAlign: "center",
          borderTop: "1px solid rgba(245,240,232,0.06)",
        }}
      >
        <h2
          style={{
            fontFamily: "'DM Serif Display',serif",
            fontSize: "clamp(1.8rem,3vw,2.4rem)",
            fontWeight: 400,
            color: "#F5F0E8",
            marginBottom: 12,
          }}
        >
          {copy.ctaBannerHeading || "Commission a piece"}
        </h2>
        <p
          style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: "1.1rem",
            fontWeight: 300,
            fontStyle: "italic",
            color: "#D4C9B8",
            marginBottom: 36,
            maxWidth: 560,
            margin: "0 auto 36px",
          }}
        >
          {copy.ctaBannerDescription ||
            "Interested in commissioning a custom piece? I document the full process for every commission."}
        </p>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/#contact" className="btn-primary" style={{ background: "#C47D5A" }}>
            {copy.ctaPrimary || "Start a Commission"}
          </a>
          <a href="/gallery" className="btn-secondary" style={{ color: "#F5F0E8", borderColor: "#F5F0E8" }}>
            {copy.ctaSecondary || "View Gallery"}
          </a>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo">Palm Art Studio</div>
          <ul className="footer-links">
            <li>
              <a href="/gallery">Gallery</a>
            </li>
            <li>
              <a href="/process" aria-current="page">
                Process
              </a>
            </li>
            <li>
              <a href="/about">About</a>
            </li>
            <li>
              <a href="/#shop">Shop</a>
            </li>
            <li>
              <a href="/#community">Events</a>
            </li>
            <li>
              <a href="/#contact">Contact</a>
            </li>
          </ul>
          <div className="footer-copy">&copy; 2026 Palm Art Studio &mdash; Carolyn Jenkins. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

function pickPreviews(timeline: TimelineStep[], finalUrl?: string): (string | undefined)[] {
  const urls = timeline.map((t) => t.imageUrl).filter(Boolean) as string[];
  if (urls.length === 0) return [finalUrl, finalUrl, finalUrl];
  if (urls.length === 1) return [urls[0], urls[0], finalUrl || urls[0]];
  if (urls.length === 2) return [urls[0], urls[1], finalUrl || urls[1]];
  const first = urls[0];
  const mid = urls[Math.floor(urls.length / 2)];
  const last = finalUrl || urls[urls.length - 1];
  return [first, mid, last];
}
