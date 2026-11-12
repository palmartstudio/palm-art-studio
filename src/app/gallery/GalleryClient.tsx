"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import NavClient from "../../components/NavClient";
import SiteFooter from "../../components/SiteFooter";
import { sanityImg, sanitySrcSet } from "../../lib/img";
import TimelineViewer, { TimelineStep } from "../../components/TimelineViewer";
import { viewTransitionName } from "../../lib/viewTransitions";

gsap.registerPlugin(ScrollTrigger);

// ─── Color palette per medium (used when no image is uploaded yet) ───
const MEDIUM_COLORS: Record<string, string> = {
  watercolor:    "#7A8E72",
  acrylic:       "#8B6F5C",
  "mixed-media": "#6B7F8E",
  oil:           "#8E6B3A",
  digital:       "#6B6B8E",
  other:         "#8B8B6B",
};

// ─── Display helpers ───
function displayMedium(medium: string, dimensions?: string): string {
  const labels: Record<string, string> = {
    watercolor:    "Watercolor on Paper",
    acrylic:       "Acrylic",
    "mixed-media": "Mixed Media",
    oil:           "Oil",
    digital:       "Digital",
    other:         "Original Work",
  };
  const label = labels[medium] || medium;
  return dimensions ? `${label} · ${dimensions}` : label;
}

function displayCategory(medium: string, category: string): string {
  if (category === "daily")    return "Daily Painting";
  if (medium === "watercolor") return "Watercolor";
  if (medium === "mixed-media") return "Mixed Media";
  return "Fine Art";
}

// ─── Types ───
interface Artwork {
  _id: string;
  slug?: string;
  title: string;
  medium: string;
  dimensions?: string;
  price?: number;
  status: string;
  category: string;
  year?: number;
  featured?: boolean;
  description?: string;
  imageUrl?: string;
  imageLqip?: string;
  processTimeline?: TimelineStep[];
  // derived display fields
  displayCategory: string;
  displayMedium: string;
  color: string;
}

const FILTER_CATEGORIES = ["All", "Fine Art", "Watercolor", "Mixed Media", "Daily Painting"];
const CARD_HEIGHTS = [340, 420, 300, 380, 440, 320, 400, 360, 280, 420, 350, 390];

function mapArtwork(item: any): Artwork {
  return {
    _id: item._id,
    slug: item.slug?.current,
    title: item.title,
    medium: item.medium || "other",
    dimensions: item.dimensions,
    price: item.price,
    status: item.status || "available",
    category: item.category || "fine-art",
    year: item.year,
    featured: item.featured,
    description: item.description,
    imageUrl: item.imageUrl,
    imageLqip: item.imageLqip,
    processTimeline: Array.isArray(item.processTimeline)
      ? item.processTimeline.filter((t: any) => t?.imageUrl)
      : [],
    displayCategory: displayCategory(item.medium || "other", item.category || "fine-art"),
    displayMedium: displayMedium(item.medium || "other", item.dimensions),
    color: MEDIUM_COLORS[item.medium] || "#8B6F5C",
  };
}

interface GalleryProps {
  initialArtworks: any[];
  pageContent?: Record<string, any> | null;
}

// Artwork arrives from the server (see page.tsx) so the real pieces are in the
// HTML for search engines and there is no loading flash.
export default function GalleryClient({ initialArtworks, pageContent }: GalleryProps) {
  const mainRef = useRef<HTMLDivElement>(null);
  const artworks = useMemo(() => (initialArtworks || []).map(mapArtwork), [initialArtworks]);
  const loading = false;
  const [filter, setFilter] = useState("All");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedArt, setSelectedArt] = useState<Artwork | null>(null);
  const pc = pageContent || {};
  const artHref = (a: Artwork) => `/gallery/${a.slug || a._id}`;
  const inquireHref = (a: Artwork) => `/?about=${encodeURIComponent(a.title)}#contact`;

  // Close the preview with Escape
  useEffect(() => {
    if (!selectedArt) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedArt(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedArt]);

  // ─── Filter ───
  const filtered = artworks.filter(a => {
    if (filter === "All") return true;
    return a.displayCategory === filter;
  });

  // ─── Hero + filter bar entrance ───
  useEffect(() => {
    if (loading || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // gsap.context + revert: without cleanup a second run of this effect starts
    // from the already-hidden state and the header stays invisible.
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.from(".gh-line",    { y: 80, opacity: 0, stagger: 0.1, duration: 1, delay: 0.1 })
        .from(".gh-sub",     { y: 20, opacity: 0, duration: 0.7 }, "-=0.5")
        .from(".gh-count",   { scale: 0, opacity: 0, duration: 0.5, ease: "back.out(2)" }, "-=0.4")
        .from(".filter-bar", { y: 30, opacity: 0, duration: 0.6 }, "-=0.4");
    }, mainRef);
    return () => ctx.revert();
  }, [loading]);

  // ─── GSAP card scroll animations ───
  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      ScrollTrigger.create({
        trigger: ".masonry-grid",
        start: "top 90%",
        onEnter: () => {
          gsap.from(".art-card", {
            y: 60, opacity: 0, scale: 0.94,
            stagger: { amount: 0.8, from: "start" },
            duration: 0.75, ease: "power3.out",
          });
        },
        once: true,
      });

      mm.add("(max-width: 900px)", () => {
        // (No scroll parallax on .gh-line: it fought the entrance animation on the
        // same elements and could leave the heading stuck 80px low, overlapping the text.)
        gsap.utils.toArray<HTMLElement>(".art-card").forEach((el, index) => {
          gsap.fromTo(
            el,
            {
              y: 48,
              opacity: 0,
              scale: 0.95,
            },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.75,
              ease: "power3.out",
              delay: index * 0.015,
              scrollTrigger: { trigger: el, start: "top 92%", once: true },
            }
          );
        });
      });
    }, mainRef);
    return () => ctx.revert();
  }, [loading]);
  useEffect(() => {
    gsap.fromTo(".art-card",
      { y: 50, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, stagger: 0.06, duration: 0.6, ease: "power3.out" }
    );
  }, [filter, artworks]);

  return (
    <div ref={mainRef}>
      {/* NAV */}
      <NavClient theme="dark" activeHref="/gallery" />

      {/* ═══ GALLERY HERO ═══ */}
      <section style={{
        minHeight:"clamp(320px,50vh,60vh)", display:"flex", flexDirection:"column", justifyContent:"flex-end",
        background:"#2A2520", padding:"clamp(100px,18vw,140px) clamp(16px,4vw,80px) clamp(32px,4vw,48px)", position:"relative", overflow:"hidden"
      }}>
        <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(196,125,90,0.12),transparent 70%)",top:"-15%",right:"-10%",animation:"floatSlow 20s ease-in-out infinite"}} />
        <div style={{position:"absolute",width:350,height:350,borderRadius:"50%",background:"radial-gradient(circle,rgba(139,154,126,0.1),transparent 70%)",bottom:"-10%",left:"-5%",animation:"floatSlow 20s ease-in-out infinite",animationDelay:"-8s"}} />
        <div style={{position:"absolute",width:"62vw",height:"62vw",maxWidth:560,maxHeight:560,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,255,255,0.12),transparent 68%)",top:"-20%",right:"8%",filter:"blur(24px)",pointerEvents:"none"}} />
        <div style={{position:"absolute",width:"50vw",height:"50vw",maxWidth:420,maxHeight:420,borderRadius:"50%",background:"radial-gradient(circle,rgba(196,125,90,0.18),transparent 70%)",bottom:"-12%",left:"-6%",filter:"blur(34px)",pointerEvents:"none"}} />

        <div style={{maxWidth:1400,margin:"0 auto",width:"100%",position:"relative",zIndex:1}}>
          <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
            <div style={{flex:1,minWidth:0}}>
              <div className="gh-line" style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.8125rem",fontWeight:500,letterSpacing:"0.2em",textTransform:"uppercase",color:"#C4A86E",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
                <span style={{width:24,height:1.5,background:"#C4A86E",display:"inline-block",flexShrink:0}} /> The Collection
              </div>
              <h1 className="gh-line" style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(2.2rem,6vw,5rem)",fontWeight:400,color:"#F5F0E8",lineHeight:1.05,margin:0}}>
                Art <em style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontStyle:"italic",color:"#C47D5A"}}>Gallery</em>
              </h1>
              <p className="gh-sub" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(1rem,2vw,1.15rem)",fontWeight:300,fontStyle:"italic",color:"#D4C9B8",marginTop:12,maxWidth:500,lineHeight:1.7}}>
                Original watercolors, acrylics, and mixed-media works shaped by observation, craft, and years of studio practice.
              </p>
            </div>
            <div className="gh-count" style={{display:"flex",alignItems:"baseline",gap:6,fontFamily:"'DM Serif Display',serif",color:"#F5F0E8",flexShrink:0}}>
              <span style={{fontSize:"clamp(2.5rem,8vw,3.5rem)",lineHeight:1}}>{filtered.length}</span>
              <span style={{fontSize:"0.975rem",color:"#B8AFA3",fontFamily:"'Outfit',sans-serif",fontWeight:300,letterSpacing:"0.05em"}}>works</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FILTER BAR ═══ */}
      <div className="filter-bar" style={{
        background:"#2A2520",borderBottom:"1px solid rgba(245,240,232,0.06)",
        padding:"0 clamp(12px,4vw,80px)",position:"sticky",top:72,zIndex:100
      }}>
        <div style={{maxWidth:1400,margin:"0 auto",display:"flex",gap:0,overflowX:"auto",WebkitOverflowScrolling:"touch" as any}}>
          {FILTER_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              style={{
                fontFamily:"'Outfit',sans-serif",fontSize:"clamp(0.8125rem,2vw,0.875rem)",fontWeight:filter===cat?600:400,
                letterSpacing:"0.08em",textTransform:"uppercase",
                color:filter===cat?"#C47D5A":"#B8AFA3",
                background:"none",border:"none",borderBottom:filter===cat?"2px solid #C47D5A":"2px solid transparent",
                padding:"clamp(12px,3vw,18px) clamp(12px,3vw,24px)",cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.3s ease",
              }}
            >{cat}</button>
          ))}
        </div>
      </div>

      {/* ═══ MASONRY GRID ═══ */}
      <section style={{background:"#1E1B17",padding:"clamp(40px,5vw,80px) clamp(16px,4vw,80px)",minHeight:"80vh"}}>
        <div className="masonry-grid" style={{maxWidth:1400,margin:"0 auto",columnCount:3,columnGap:16}}>
          {filtered.map((art, i) => {
            const h = CARD_HEIGHTS[i % CARD_HEIGHTS.length];
            const isHovered = hoveredId === art._id;
            return (
              <a key={art._id} className="art-card" href={artHref(art)}
                aria-label={`${art.title} — ${art.displayMedium}`}
                onMouseEnter={() => setHoveredId(art._id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  setSelectedArt(art);
                }}
                style={{
                  display:"block",textDecoration:"none",color:"inherit",
                  breakInside:"avoid",marginBottom:20,position:"relative",cursor:"pointer",
                  overflow:"hidden",height:h,
                  background: art.imageUrl
                    ? (art.imageLqip ? `#1E1B17 url(${art.imageLqip}) center / cover no-repeat` : "#1E1B17")
                    : art.color,
                  transition:"transform 0.5s cubic-bezier(0.25,0.8,0.25,1)",
                  transform: isHovered ? "translateY(-4px)" : "none",
                  boxShadow: isHovered ? "0 20px 50px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.2)",
                }}
              >
                {/* Real image OR color background */}
                {art.imageUrl ? (
                  <img
                    src={sanityImg(art.imageUrl, 900)}
                    srcSet={sanitySrcSet(art.imageUrl, [480, 900, 1400])}
                    sizes="(max-width: 500px) 100vw, (max-width: 900px) 50vw, 33vw"
                    loading={i < 3 ? "eager" : "lazy"}
                    decoding="async"
                    alt={`${art.title} — ${art.displayMedium} by Carolyn Jenkins`}
                    style={{
                    position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
                    transition:"transform 0.8s cubic-bezier(0.25,0.8,0.25,1)",
                    transform: isHovered ? "scale(1.05)" : "scale(1)",
                    ...viewTransitionName(`artwork-${art.slug || art._id}`),
                  }} />
                ) : (
                  <>
                    <div style={{
                      position:"absolute",inset:0,
                      background:`linear-gradient(135deg, ${art.color}, ${art.color}dd, ${art.color}88)`,
                      transition:"transform 0.8s cubic-bezier(0.25,0.8,0.25,1)",
                      transform: isHovered ? "scale(1.08)" : "scale(1)",
                    }} />
                    <div style={{
                      position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
                      fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",fontSize:"1rem",
                      color:"rgba(255,255,255,0.25)",textAlign:"center",padding:20,
                      transition:"opacity 0.4s", opacity: isHovered ? 0 : 1,
                    }}>{art.medium}</div>
                  </>
                )}

                {/* Hover overlay */}
                <div className="art-overlay" style={{
                  position:"absolute",inset:0,
                  background:"linear-gradient(to top, rgba(30,27,23,0.95) 0%, rgba(30,27,23,0.6) 40%, transparent 70%)",
                  opacity: isHovered ? 1 : 0,
                  transition:"opacity 0.5s ease",
                  display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"28px 24px",
                }}>
                  <div style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.8rem",fontWeight:500,letterSpacing:"0.15em",textTransform:"uppercase",color:"#C4A86E",marginBottom:6}}>{art.displayCategory}</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.4rem",fontWeight:400,color:"#F5F0E8",marginBottom:4}}>{art.title}</div>
                  <div style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.8125rem",color:"#B8AFA3",letterSpacing:"0.05em"}}>{art.displayMedium}</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:14}}>
                    <span style={{fontFamily:"'Outfit',sans-serif",fontSize:"1.0625rem",fontWeight:600,color:"#F5F0E8"}}>
                      {art.status === "sold" ? "Sold" : art.price ? `$${art.price.toLocaleString()}` : "Inquire"}
                    </span>
                    {art.status === "available" && (
                      <span style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.8rem",fontWeight:500,letterSpacing:"0.12em",textTransform:"uppercase",color:"#C47D5A",border:"1px solid #C47D5A",padding:"6px 14px"}}>Inquire</span>
                    )}
                    {art.status === "sold" && (
                      <span style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.8rem",fontWeight:500,letterSpacing:"0.12em",textTransform:"uppercase",color:"#8B9A7E",opacity:0.7}}>Collected</span>
                    )}
                  </div>
                </div>

                {/* Year badge */}
                {art.year && (
                  <div style={{
                    position:"absolute",top:16,right:16,
                    fontFamily:"'Outfit',sans-serif",fontSize:"0.8rem",fontWeight:500,letterSpacing:"0.1em",
                    color:"rgba(255,255,255,0.5)",background:"rgba(0,0,0,0.3)",backdropFilter:"blur(10px)",
                    padding:"4px 10px",
                    opacity: isHovered ? 1 : 0, transition:"opacity 0.4s",
                  }}>{art.year}</div>
                )}

                {/* Sold overlay */}
                {art.status === "sold" && !isHovered && (
                  <div style={{position:"absolute",top:16,left:16,fontFamily:"'Outfit',sans-serif",fontSize:"0.8rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(255,255,255,0.6)",background:"rgba(0,0,0,0.4)",backdropFilter:"blur(8px)",padding:"3px 10px"}}>Sold</div>
                )}

                {/* PROCESS badge — when timeline exists and sold isn't taking that corner */}
                {art.status !== "sold" && (art.processTimeline?.length || 0) > 0 && (
                  <div style={{
                    position:"absolute",top:16,left:16,
                    fontFamily:"'Outfit',sans-serif",fontSize:"0.8rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",
                    color:"#F5F0E8",background:"rgba(196,125,90,0.85)",
                    padding:"4px 10px",
                    opacity: 0.9,
                  }}>Process</div>
                )}
              </a>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",fontSize:"1.3rem",color:"#D4C9B8",textAlign:"center",padding:"60px 20px"}}>
            {artworks.length === 0 ? "New work is being added — please check back soon." : "Nothing in this category yet."}
          </p>
        )}

        <style dangerouslySetInnerHTML={{ __html: `
          .masonry-grid { column-count: 3; }
          @media(max-width:900px){ .masonry-grid{ column-count:2!important; } }
          @media(max-width:500px){ .masonry-grid{ column-count:1!important; } }
          @keyframes floatSlow{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-20px) scale(1.05)}66%{transform:translate(-20px,15px) scale(0.95)}}
          /* always show overlay on mobile touch */
          @media(max-width:900px){ .art-card .art-overlay{ opacity:1!important; } }
        ` }} />
      </section>

      {/* ═══ LIGHTBOX MODAL ═══ */}
      {selectedArt && (
        <div onClick={() => setSelectedArt(null)} style={{
          position:"fixed",inset:0,zIndex:2000,
          background:"rgba(30,27,23,0.92)",backdropFilter:"blur(20px)",
          display:"flex",alignItems:"center",justifyContent:"center",
          cursor:"pointer",animation:"fadeIn 0.3s ease",
        }}>
          <style dangerouslySetInnerHTML={{ __html: `@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
            .lightbox-inner{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);max-width:100%;}
            .lightbox-inner > *{min-width:0;}
            @media(max-width:700px){.lightbox-inner{grid-template-columns:minmax(0,1fr);} .lightbox-art{aspect-ratio:auto!important;height:46vh;max-height:420px;} .lightbox-detail{padding:24px 20px!important;} .lightbox-title{font-size:1.5rem!important;}}
          ` }} />
          <div onClick={e => e.stopPropagation()} className="lightbox-inner" role="dialog" aria-modal="true" aria-label={selectedArt.title} style={{
            maxWidth:900,width:"92%",
            background:"#2A2520",overflow:"hidden",cursor:"default",animation:"slideUp 0.4s ease",maxHeight:"92vh",overflowY:"auto",
          }}>
            {/* Art preview */}
            <div className="lightbox-art" style={{aspectRatio:"3/4",background:selectedArt.imageUrl ? "#1E1B17" : selectedArt.color,position:"relative",overflow:"hidden"}}>
              {selectedArt.imageUrl ? (
                <img
                  src={sanityImg(selectedArt.imageUrl, 1400)}
                  srcSet={sanitySrcSet(selectedArt.imageUrl, [700, 1400, 2000])}
                  sizes="(max-width: 700px) 92vw, 500px"
                  alt={`${selectedArt.title} — ${selectedArt.displayMedium} by Carolyn Jenkins`}
                  style={{
                  width:"100%",height:"100%",objectFit:"contain",
                  ...viewTransitionName(`artwork-${selectedArt.slug || selectedArt._id}`),
                }} />
              ) : (
                <>
                  <div style={{background:`linear-gradient(135deg, ${selectedArt.color}, ${selectedArt.color}cc)`,position:"absolute",inset:0}} />
                  <span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",color:"rgba(255,255,255,0.3)",fontSize:"1.1rem"}}>
                    {selectedArt.displayMedium}
                  </span>
                </>
              )}
            </div>
            {/* Details panel */}
            <div className="lightbox-detail" style={{padding:"48px 40px",display:"flex",flexDirection:"column",justifyContent:"center"}}>
              <div style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.8rem",fontWeight:500,letterSpacing:"0.15em",textTransform:"uppercase",color:"#C4A86E",marginBottom:12}}>
                {selectedArt.displayCategory}{selectedArt.year ? ` · ${selectedArt.year}` : ""}
              </div>
              <h2 className="lightbox-title" style={{fontFamily:"'DM Serif Display',serif",fontSize:"2rem",fontWeight:400,color:"#F5F0E8",marginBottom:8}}>{selectedArt.title}</h2>
              <p style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.9375rem",color:"#B8AFA3",marginBottom:24}}>{selectedArt.displayMedium}</p>
              <div style={{width:40,height:1.5,background:"#C47D5A",marginBottom:24}} />
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.05rem",fontWeight:300,fontStyle:"italic",color:"#D4C9B8",lineHeight:1.7,marginBottom:32}}>
                {selectedArt.description || "Each piece reflects careful observation, material study, and a personal studio practice developed over time."}
              </p>

              {selectedArt.processTimeline && selectedArt.processTimeline.length > 0 && (
                <details open style={{marginBottom:24,borderTop:"1px solid rgba(245,240,232,0.1)",paddingTop:20,minWidth:0,maxWidth:"100%"}}>
                  <summary style={{
                    cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontSize:"0.8125rem",fontWeight:500,
                    letterSpacing:"0.15em",textTransform:"uppercase",color:"#C4A86E",marginBottom:16,
                    listStyle:"none",display:"flex",alignItems:"center",gap:10,
                  }}>
                    <span style={{width:20,height:1.5,background:"#C4A86E"}} />
                    Creation Timeline
                    <span style={{color:"#B8AFA3",fontSize:"0.8125rem",marginLeft:"auto"}}>
                      {selectedArt.processTimeline.length} {selectedArt.processTimeline.length === 1 ? "step" : "steps"}
                    </span>
                  </summary>
                  <TimelineViewer
                    steps={selectedArt.processTimeline}
                    finalImageUrl={selectedArt.imageUrl}
                    finalImageLqip={selectedArt.imageLqip}
                    finalTitle={selectedArt.title}
                    variant="inline"
                    artworkId={selectedArt.slug || selectedArt._id}
                  />
                </details>
              )}

              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
                <span style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.8rem",color:"#F5F0E8"}}>
                  {selectedArt.status === "sold" ? "Sold" : selectedArt.price ? `$${selectedArt.price.toLocaleString()}` : "Inquire"}
                </span>
                {selectedArt.status === "available" && (
                  <a href={inquireHref(selectedArt)} style={{
                    fontFamily:"'Outfit',sans-serif",fontSize:"0.8125rem",fontWeight:500,letterSpacing:"0.12em",
                    textTransform:"uppercase",background:"#C47D5A",color:"#FAF8F4",
                    padding:"14px 28px",textDecoration:"none",display:"inline-block",
                  }}>Inquire About This Piece</a>
                )}
              </div>
              <a href={artHref(selectedArt)} style={{
                fontFamily:"'Outfit',sans-serif",fontSize:"0.8125rem",fontWeight:500,letterSpacing:"0.1em",
                textTransform:"uppercase",color:"#C4A86E",textDecoration:"none",
                borderTop:"1px solid rgba(245,240,232,0.1)",padding:"16px 0",marginBottom:8,display:"block",
              }}>View full page &amp; larger image →</a>
              <button onClick={() => setSelectedArt(null)} style={{
                fontFamily:"'Outfit',sans-serif",fontSize:"0.8125rem",fontWeight:400,letterSpacing:"0.1em",
                textTransform:"uppercase",color:"#B8AFA3",background:"none",border:"none",
                cursor:"pointer",padding:0,marginTop:"auto",
              }}
              onMouseEnter={e=>(e.target as HTMLElement).style.color="#F5F0E8"}
              onMouseLeave={e=>(e.target as HTMLElement).style.color="#B8AFA3"}
              >← Back to Gallery</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CTA BANNER ═══ */}
      <section style={{background:"#2A2520",padding:"clamp(60px,8vw,100px) clamp(24px,5vw,80px)",textAlign:"center",borderTop:"1px solid rgba(245,240,232,0.06)"}}>
        <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(1.8rem,3vw,2.4rem)",fontWeight:400,color:"#F5F0E8",marginBottom:12}}>{pc.galleryPage?.ctaBannerHeading || "Interested in a piece?"}</h2>
        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",fontWeight:300,fontStyle:"italic",color:"#D4C9B8",marginBottom:36,maxWidth:500,margin:"0 auto 36px"}}>
          {pc.galleryPage?.ctaBannerDescription || "Originals, prints, and custom commissions available. Every piece ships with a certificate of authenticity."}
        </p>
        <div style={{display:"flex",gap:20,justifyContent:"center",flexWrap:"wrap"}}>
          <a href="/#contact" className="btn-primary" style={{background:"#C47D5A"}}>{pc.galleryPage?.ctaPrimary || "Commission a Piece"}</a>
          <a href="/process" className="btn-secondary" style={{color:"#F5F0E8",borderColor:"#F5F0E8"}}>See How It&apos;s Made</a>
        </div>
      </section>

      <SiteFooter current="/gallery" />
    </div>
  );
}
