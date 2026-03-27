"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
  // derived display fields
  displayCategory: string;
  displayMedium: string;
  color: string;
}

// ─── Fallback hardcoded data (shown while loading or if Sanity is empty) ───
const FALLBACK: Artwork[] = [
  { _id:"f1",  title:"Early Morning Breakfast", medium:"acrylic",     dimensions:"24 × 36 in", price:1800, status:"available", category:"fine-art", year:2024, displayCategory:"Fine Art",     displayMedium:"Acrylic · 24 × 36 in",          color:"#8B6F5C" },
  { _id:"f2",  title:"Victorian Dawn",          medium:"watercolor",  dimensions:"18 × 24 in", price:1200, status:"available", category:"fine-art", year:2023, displayCategory:"Watercolor",   displayMedium:"Watercolor on Paper · 18 × 24 in", color:"#7A8E72" },
  { _id:"f3",  title:"Old Florida",             medium:"watercolor",  dimensions:"16 × 20 in", price:950,  status:"available", category:"fine-art", year:2022, displayCategory:"Watercolor",   displayMedium:"Watercolor on Paper · 16 × 20 in", color:"#B8956B" },
  { _id:"f4",  title:"Emotional Currents",      medium:"mixed-media", dimensions:"24 × 36 in", price:1800, status:"available", category:"fine-art", year:2024, displayCategory:"Mixed Media",  displayMedium:"Mixed Media · 24 × 36 in",         color:"#6B7F8E" },
  { _id:"f5",  title:"Second Life",             medium:"mixed-media", dimensions:"20 × 24 in", price:750,  status:"available", category:"fine-art", year:2023, displayCategory:"Mixed Media",  displayMedium:"Mixed Media · 20 × 24 in",         color:"#8E7B6B" },
  { _id:"f6",  title:"Horizon Line",            medium:"watercolor",  dimensions:"12 × 36 in", price:1400, status:"available", category:"fine-art", year:2024, displayCategory:"Watercolor",   displayMedium:"Watercolor on Paper · 12 × 36 in", color:"#6B8E7F" },
  { _id:"f7",  title:"Storm Hill Memory",       medium:"acrylic",     dimensions:"16 × 20 in", price:900,  status:"sold",      category:"fine-art", year:2023, displayCategory:"Fine Art",     displayMedium:"Acrylic · 16 × 20 in",             color:"#7B6B8E" },
  { _id:"f8",  title:"Harbor House Tribute",    medium:"watercolor",  dimensions:"18 × 24 in", price:1100, status:"available", category:"fine-art", year:2022, displayCategory:"Watercolor",   displayMedium:"Watercolor on Paper · 18 × 24 in", color:"#8E6B7B" },
  { _id:"f9",  title:"Daily Study #47",         medium:"acrylic",     dimensions:"8 × 10 in",  price:350,  status:"available", category:"daily",    year:2024, displayCategory:"Daily Painting",displayMedium:"Acrylic · 8 × 10 in",             color:"#6B8E85" },
  { _id:"f10", title:"Winter Park Porch",       medium:"watercolor",  dimensions:"14 × 18 in", price:800,  status:"available", category:"fine-art", year:2021, displayCategory:"Watercolor",   displayMedium:"Watercolor on Paper · 14 × 18 in", color:"#8E8B6B" },
  { _id:"f11", title:"Deltona Sunrise",         medium:"acrylic",     dimensions:"20 × 30 in", price:1500, status:"available", category:"fine-art", year:2024, displayCategory:"Fine Art",     displayMedium:"Acrylic · 20 × 30 in",             color:"#C4956B" },
  { _id:"f12", title:"Daily Study #62",         medium:"acrylic",     dimensions:"8 × 10 in",  price:350,  status:"available", category:"daily",    year:2025, displayCategory:"Daily Painting",displayMedium:"Acrylic · 8 × 10 in",             color:"#6B7A8E" },
];

const FILTER_CATEGORIES = ["All", "Fine Art", "Watercolor", "Mixed Media", "Daily Painting"];
const CARD_HEIGHTS = [340, 420, 300, 380, 440, 320, 400, 360, 280, 420, 350, 390];

export default function GalleryPage() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [artworks, setArtworks] = useState<Artwork[]>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedArt, setSelectedArt] = useState<Artwork | null>(null);

  // ─── Fetch from Sanity via API ───
  const fetchArtworks = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/artwork");
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const mapped: Artwork[] = data.map((item: any) => ({
          _id: item._id,
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
          displayCategory: displayCategory(item.medium || "other", item.category || "fine-art"),
          displayMedium: displayMedium(item.medium || "other", item.dimensions),
          color: MEDIUM_COLORS[item.medium] || "#8B6F5C",
        }));
        setArtworks(mapped);
      }
      // If Sanity returns empty, keep FALLBACK so the page is never blank
    } catch (_) {
      // Network error — keep FALLBACK
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchArtworks(); }, [fetchArtworks]);

  // ─── Filter ───
  const filtered = artworks.filter(a => {
    if (filter === "All") return true;
    return a.displayCategory === filter;
  });

  // ─── GSAP intro (fires once data is ready) ───
  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.from(".gh-line", { y: 80, opacity: 0, stagger: 0.08, duration: 1, ease: "power4.out", delay: 0.15 });
      gsap.from(".gh-sub",  { y: 20, opacity: 0, duration: 0.7, ease: "power3.out", delay: 0.6 });
      gsap.from(".gh-count",{ scale: 0, opacity: 0, duration: 0.5, ease: "back.out(2)", delay: 0.9 });
      gsap.from(".filter-bar", { y: 30, opacity: 0, duration: 0.6, ease: "power3.out", delay: 0.5 });
    }, mainRef);
    return () => ctx.revert();
  }, [loading]);

  // ─── Re-animate cards when filter changes ───
  useEffect(() => {
    gsap.fromTo(".art-card",
      { y: 50, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, stagger: 0.06, duration: 0.6, ease: "power3.out" }
    );
  }, [filter, artworks]);

  return (
    <div ref={mainRef}>
      {/* NAV */}
      <nav className="nav scrolled" style={{background:"rgba(42,37,32,0.97)",backdropFilter:"blur(20px)"}}>
        <a href="/" className="nav-logo" style={{color:"#F5F0E8"}}>Palm Art Studio</a>
        <ul className="nav-links">
          <li><a href="/gallery" className="active" style={{color:"#F5F0E8"}}>Gallery</a></li>
          <li><a href="/about" style={{color:"#D4C9B8"}}>About</a></li>
          <li><a href="/#shop" style={{color:"#D4C9B8"}}>Shop</a></li>
          <li><a href="/#community" style={{color:"#D4C9B8"}}>Events</a></li>
          <li><a href="/#contact" style={{color:"#D4C9B8"}}>Contact</a></li>
          <li><a href="/#shop" className="nav-cta">Shop Prints</a></li>
        </ul>
      </nav>

      {/* ═══ GALLERY HERO ═══ */}
      <section style={{
        minHeight:"60vh", display:"flex", flexDirection:"column", justifyContent:"flex-end",
        background:"#2A2520", padding:"140px clamp(24px,5vw,80px) 48px", position:"relative", overflow:"hidden"
      }}>
        <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(196,125,90,0.12),transparent 70%)",top:"-15%",right:"-10%",animation:"floatSlow 20s ease-in-out infinite"}} />
        <div style={{position:"absolute",width:350,height:350,borderRadius:"50%",background:"radial-gradient(circle,rgba(139,154,126,0.1),transparent 70%)",bottom:"-10%",left:"-5%",animation:"floatSlow 20s ease-in-out infinite",animationDelay:"-8s"}} />

        <div style={{maxWidth:1400,margin:"0 auto",width:"100%",position:"relative",zIndex:1}}>
          <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:24}}>
            <div>
              <div className="gh-line" style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.72rem",fontWeight:500,letterSpacing:"0.2em",textTransform:"uppercase",color:"#C4A86E",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
                <span style={{width:32,height:1.5,background:"#C4A86E",display:"inline-block"}} /> The Collection
              </div>
              <h1 className="gh-line" style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(3rem,6vw,5rem)",fontWeight:400,color:"#F5F0E8",lineHeight:1.05,margin:0}}>
                Art <em style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontStyle:"italic",color:"#C47D5A"}}>Gallery</em>
              </h1>
              <p className="gh-sub" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.15rem",fontWeight:300,fontStyle:"italic",color:"#D4C9B8",marginTop:16,maxWidth:500,lineHeight:1.7}}>
                Original watercolors, acrylics, and mixed media — each piece carries emotion, story, and soul.
              </p>
            </div>
            <div className="gh-count" style={{display:"flex",alignItems:"baseline",gap:8,fontFamily:"'DM Serif Display',serif",color:"#F5F0E8"}}>
              <span style={{fontSize:"3.5rem",lineHeight:1}}>{filtered.length}</span>
              <span style={{fontSize:"1rem",color:"#B8AFA3",fontFamily:"'Outfit',sans-serif",fontWeight:300,letterSpacing:"0.05em"}}>works</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FILTER BAR ═══ */}
      <div className="filter-bar" style={{
        background:"#2A2520",borderBottom:"1px solid rgba(245,240,232,0.06)",
        padding:"0 clamp(24px,5vw,80px)",position:"sticky",top:72,zIndex:100
      }}>
        <div style={{maxWidth:1400,margin:"0 auto",display:"flex",gap:0,overflowX:"auto"}}>
          {FILTER_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              style={{
                fontFamily:"'Outfit',sans-serif",fontSize:"0.75rem",fontWeight:filter===cat?600:400,
                letterSpacing:"0.1em",textTransform:"uppercase",
                color:filter===cat?"#C47D5A":"#B8AFA3",
                background:"none",border:"none",borderBottom:filter===cat?"2px solid #C47D5A":"2px solid transparent",
                padding:"18px 24px",cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.3s ease",
              }}
              onMouseEnter={e=>{if(filter!==cat)(e.target as HTMLElement).style.color="#F5F0E8"}}
              onMouseLeave={e=>{if(filter!==cat)(e.target as HTMLElement).style.color="#B8AFA3"}}
            >{cat}</button>
          ))}
        </div>
      </div>

      {/* ═══ MASONRY GRID ═══ */}
      <section style={{background:"#1E1B17",padding:"clamp(40px,5vw,80px) clamp(24px,5vw,80px)",minHeight:"80vh"}}>
        <div style={{maxWidth:1400,margin:"0 auto",columnCount:3,columnGap:20}}>
          {filtered.map((art, i) => {
            const h = CARD_HEIGHTS[i % CARD_HEIGHTS.length];
            const isHovered = hoveredId === art._id;
            return (
              <div key={art._id} className="art-card"
                onMouseEnter={() => setHoveredId(art._id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelectedArt(art)}
                style={{
                  breakInside:"avoid",marginBottom:20,position:"relative",cursor:"pointer",
                  overflow:"hidden",height:h,
                  background: art.imageUrl ? "#1E1B17" : art.color,
                  transition:"transform 0.5s cubic-bezier(0.25,0.8,0.25,1)",
                  transform: isHovered ? "translateY(-4px)" : "none",
                  boxShadow: isHovered ? "0 20px 50px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.2)",
                }}
              >
                {/* Real image OR color background */}
                {art.imageUrl ? (
                  <img src={art.imageUrl} alt={art.title} style={{
                    position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
                    transition:"transform 0.8s cubic-bezier(0.25,0.8,0.25,1)",
                    transform: isHovered ? "scale(1.05)" : "scale(1)",
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
                <div style={{
                  position:"absolute",inset:0,
                  background:"linear-gradient(to top, rgba(30,27,23,0.95) 0%, rgba(30,27,23,0.6) 40%, transparent 70%)",
                  opacity: isHovered ? 1 : 0,
                  transition:"opacity 0.5s ease",
                  display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"28px 24px",
                }}>
                  <div style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.65rem",fontWeight:500,letterSpacing:"0.15em",textTransform:"uppercase",color:"#C4A86E",marginBottom:6}}>{art.displayCategory}</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.4rem",fontWeight:400,color:"#F5F0E8",marginBottom:4}}>{art.title}</div>
                  <div style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.72rem",color:"#B8AFA3",letterSpacing:"0.05em"}}>{art.displayMedium}</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:14}}>
                    <span style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.95rem",fontWeight:600,color:"#F5F0E8"}}>
                      {art.status === "sold" ? "Sold" : art.price ? `$${art.price.toLocaleString()}` : "Inquire"}
                    </span>
                    {art.status === "available" && (
                      <span style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.65rem",fontWeight:500,letterSpacing:"0.12em",textTransform:"uppercase",color:"#C47D5A",border:"1px solid #C47D5A",padding:"6px 14px"}}>Inquire</span>
                    )}
                    {art.status === "sold" && (
                      <span style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.65rem",fontWeight:500,letterSpacing:"0.12em",textTransform:"uppercase",color:"#8B9A7E",opacity:0.7}}>Collected</span>
                    )}
                  </div>
                </div>

                {/* Year badge */}
                {art.year && (
                  <div style={{
                    position:"absolute",top:16,right:16,
                    fontFamily:"'Outfit',sans-serif",fontSize:"0.65rem",fontWeight:500,letterSpacing:"0.1em",
                    color:"rgba(255,255,255,0.5)",background:"rgba(0,0,0,0.3)",backdropFilter:"blur(10px)",
                    padding:"4px 10px",
                    opacity: isHovered ? 1 : 0, transition:"opacity 0.4s",
                  }}>{art.year}</div>
                )}

                {/* Sold overlay */}
                {art.status === "sold" && !isHovered && (
                  <div style={{position:"absolute",top:16,left:16,fontFamily:"'Outfit',sans-serif",fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(255,255,255,0.6)",background:"rgba(0,0,0,0.4)",backdropFilter:"blur(8px)",padding:"3px 10px"}}>Sold</div>
                )}
              </div>
            );
          })}
        </div>

        <style>{`
          @media(max-width:900px){ section > div[style*="column-count"]{ column-count:2!important; } }
          @media(max-width:550px){ section > div[style*="column-count"]{ column-count:1!important; } }
          @keyframes floatSlow{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-20px) scale(1.05)}66%{transform:translate(-20px,15px) scale(0.95)}}
        `}</style>
      </section>

      {/* ═══ LIGHTBOX MODAL ═══ */}
      {selectedArt && (
        <div onClick={() => setSelectedArt(null)} style={{
          position:"fixed",inset:0,zIndex:2000,
          background:"rgba(30,27,23,0.92)",backdropFilter:"blur(20px)",
          display:"flex",alignItems:"center",justifyContent:"center",
          cursor:"pointer",animation:"fadeIn 0.3s ease",
        }}>
          <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div onClick={e => e.stopPropagation()} style={{
            maxWidth:900,width:"90%",display:"grid",gridTemplateColumns:"1.3fr 1fr",
            background:"#2A2520",overflow:"hidden",cursor:"default",animation:"slideUp 0.4s ease",
          }}>
            {/* Art preview */}
            <div style={{aspectRatio:"3/4",background:selectedArt.color,position:"relative",overflow:"hidden"}}>
              {selectedArt.imageUrl ? (
                <img src={selectedArt.imageUrl} alt={selectedArt.title} style={{width:"100%",height:"100%",objectFit:"cover"}} />
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
            <div style={{padding:"48px 40px",display:"flex",flexDirection:"column",justifyContent:"center"}}>
              <div style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.65rem",fontWeight:500,letterSpacing:"0.15em",textTransform:"uppercase",color:"#C4A86E",marginBottom:12}}>
                {selectedArt.displayCategory}{selectedArt.year ? ` · ${selectedArt.year}` : ""}
              </div>
              <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"2rem",fontWeight:400,color:"#F5F0E8",marginBottom:8}}>{selectedArt.title}</h2>
              <p style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.85rem",color:"#B8AFA3",marginBottom:24}}>{selectedArt.displayMedium}</p>
              <div style={{width:40,height:1.5,background:"#C47D5A",marginBottom:24}} />
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.05rem",fontWeight:300,fontStyle:"italic",color:"#D4C9B8",lineHeight:1.7,marginBottom:32}}>
                {selectedArt.description || "Each piece is an expression of emotion — a method of communication, heart and soul on canvas."}
              </p>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
                <span style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.8rem",color:"#F5F0E8"}}>
                  {selectedArt.status === "sold" ? "Sold" : selectedArt.price ? `$${selectedArt.price.toLocaleString()}` : "Inquire"}
                </span>
                {selectedArt.status === "available" && (
                  <a href="/#contact" style={{
                    fontFamily:"'Outfit',sans-serif",fontSize:"0.72rem",fontWeight:500,letterSpacing:"0.12em",
                    textTransform:"uppercase",background:"#C47D5A",color:"#FAF8F4",
                    padding:"14px 28px",textDecoration:"none",display:"inline-block",
                  }}>Purchase / Inquire</a>
                )}
              </div>
              <button onClick={() => setSelectedArt(null)} style={{
                fontFamily:"'Outfit',sans-serif",fontSize:"0.72rem",fontWeight:400,letterSpacing:"0.1em",
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
        <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(1.8rem,3vw,2.4rem)",fontWeight:400,color:"#F5F0E8",marginBottom:12}}>Interested in a piece?</h2>
        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",fontWeight:300,fontStyle:"italic",color:"#D4C9B8",marginBottom:36,maxWidth:500,margin:"0 auto 36px"}}>
          Originals, prints, and custom commissions available. Every piece ships with a certificate of authenticity.
        </p>
        <div style={{display:"flex",gap:20,justifyContent:"center",flexWrap:"wrap"}}>
          <a href="/#contact" className="btn-primary" style={{background:"#C47D5A"}}>Commission a Piece</a>
          <a href="/#shop" className="btn-secondary" style={{color:"#F5F0E8",borderColor:"#F5F0E8"}}>Browse the Shop</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo">Palm Art Studio</div>
          <ul className="footer-links">
            <li><a href="/gallery">Gallery</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/#shop">Shop</a></li>
            <li><a href="/#community">Events</a></li>
            <li><a href="/#contact">Contact</a></li>
          </ul>
          <div className="footer-copy">&copy; 2026 Palm Art Studio &mdash; Carolyn Jenkins. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
