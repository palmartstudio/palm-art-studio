"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import NavClient from "../../components/NavClient";

gsap.registerPlugin(ScrollTrigger);

const clients = [
  { name: "AOL", work: "Original icon art for early user interface", era: "Digital Pioneer" },
  { name: "Walt Disney World", work: "Menu design for Disney dining experiences", era: "Theme Parks" },
  { name: "Darden Restaurants", work: "Menu and promotional design", era: "Hospitality" },
  { name: "Wayne Taylor Racing", work: "Illustrations for the Indy Racing team", era: "Motorsport" },
  { name: "Sea Ray Boats", work: "T-shirt line design", era: "Marine" },
  { name: "Juice Bowl", work: "Classic juice can packaging design", era: "Packaging" },
  { name: "Orlando Museum of Art", work: "Promotional materials", era: "Fine Art" },
  { name: "Coach Transit Components", work: "Product catalogs", era: "Industrial" },
];

function preferUpdatedCopy(value: string | undefined, legacy: string, updated: string) {
  if (!value || value === legacy) return updated;
  return value;
}

export default function AboutPage() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [pc, setPc] = useState<Record<string, any>>({});
  const aboutHeroSubtitle = preferUpdatedCopy(
    pc.aboutHero?.subtitle,
    "From the pre-digital art studios of Winter Park to AOL, Disney World, and award-winning fine art exhibitions across America.",
    "From hand-drawn commercial studios to a lifetime of watercolor, acrylic, and mixed-media work in Florida."
  );
  const aboutOriginHeading = preferUpdatedCopy(pc.aboutOrigin?.heading, "Born to Create", "A Life in Art");
  const aboutOriginParagraph1 = preferUpdatedCopy(
    pc.aboutOrigin?.paragraph1,
    "Born in Towson, Maryland, and raised in Winter Park, Florida, I have been painting and creating since childhood. My artistic journey has taken me from the Maitland Center of the Arts and Rollins College to establishing my own design firm, Storm Hill Studio.",
    "Born in Towson, Maryland, and raised in Winter Park, Florida, I have been painting and creating since childhood. My artistic journey has taken me from the Maitland Art Center and Rollins College to establishing my own design firm, Storm Hill Studio."
  );
  const aboutOriginParagraph2 = preferUpdatedCopy(
    pc.aboutOrigin?.paragraph2,
    "Now based in Deltona, I continue to create works in acrylic and watercolor, drawing inspiration from a lifetime of artistic exploration.",
    "Now based in Deltona, I continue to create works in acrylic and watercolor shaped by a lifetime of looking closely, working steadily, and following where the work leads."
  );
  const aboutSacrificeClosing = preferUpdatedCopy(
    pc.aboutSacrifice?.closing,
    "Today, I create with a sense of gratitude and freedom, aiming to learn without judgment and share the joy of art with others.",
    "Today, I create with gratitude, curiosity, and a commitment to learning without judgment."
  );
  const aboutExhibitionsParagraph1 = preferUpdatedCopy(
    pc.aboutExhibitions?.paragraph1,
    "In addition to commercial work, I have spent over fourteen years exhibiting in art festivals across Florida, earning multiple awards for my watercolor paintings — including 1st, 2nd, 3rd place and Honorable Mentions for detailed watercolors of old buildings and Victorian-era houses.",
    "In addition to commercial work, I have spent over fourteen years exhibiting in art festivals across Florida, with watercolor paintings that have received festival recognition and gallery placement."
  );
  const aboutQuoteText = preferUpdatedCopy(
    pc.aboutQuote?.text,
    "What I tell anyone who wants to create is simple: Do it. It doesn’t matter what others think — create for yourself. It is good for the soul and well-being. Feel the freedom!",
    "What I tell anyone who wants to create is simple: Do it. Create for yourself, keep learning, and keep going."
  );
  const personalNoteParagraph2 = preferUpdatedCopy(
    pc.aboutPersonalNote?.paragraph2,
    "I am not inspired by any single artist. I feel if I was, I would just be considered a copier. I proceed because it’s my way naturally — to project my emotions, my method of communication, my heart and soul.",
    "I am not inspired by any single artist. The work has to come from your own hand, your own eye, and your own way of seeing."
  );
  const personalNoteParagraph3 = preferUpdatedCopy(
    pc.aboutPersonalNote?.paragraph3,
    "I love to utilize recycled pieces in some of my paintings and explore as far as I can with my work. Every day I paint, I exceed my own limitations and imagination.",
    "I love incorporating recycled materials into some of my paintings and pushing each piece a little further. Every day in the studio is a chance to learn, refine, and see something new."
  );

  useEffect(() => {
    fetch("/api/admin/page-content").then(r => r.json()).then(d => setPc(d || {})).catch(() => {});
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const mm = gsap.matchMedia();

      // Hero lines stagger in
      gsap.from(".ah-line", {
        y: 100, opacity: 0, rotateX: -30,
        stagger: 0.1, duration: 1.1, ease: "power4.out", delay: 0.15,
      });
      gsap.from(".ah-sub", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out", delay: 0.7 });
      gsap.from(".ah-scroll", { opacity: 0, duration: 0.5, delay: 1.2 });

      // Every .reveal-up fades up on scroll
      gsap.utils.toArray<HTMLElement>(".reveal-up").forEach((el) => {
        gsap.from(el, {
          y: 60, opacity: 0, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
        });
      });

      // Parallax portrait
      const portrait = document.querySelector(".portrait-wrap");
      if (portrait) {
        gsap.to(portrait, {
          y: -80, ease: "none",
          scrollTrigger: { trigger: portrait, start: "top bottom", end: "bottom top", scrub: true },
        });
      }

      // Client cards stagger
      gsap.from(".client-card", {
        y: 40, opacity: 0, stagger: 0.07, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: ".client-grid", start: "top 80%" },
      });

      // Stats count up
      gsap.utils.toArray<HTMLElement>(".stat-num").forEach((el) => {
        const target = parseInt(el.getAttribute("data-val") || "0", 10);
        gsap.fromTo(el, { innerText: "0" }, {
          innerText: target, duration: 1.8, ease: "power2.out", snap: { innerText: 1 },
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
      });

      // Horizontal scroll for timeline — desktop only
      const tl = document.querySelector(".timeline-track");
      if (tl && window.innerWidth > 900) {
        gsap.to(tl, {
          x: () => -(tl.scrollWidth - window.innerWidth + 80),
          ease: "none",
          scrollTrigger: {
            trigger: ".timeline-section",
            start: "top top", end: () => `+=${tl.scrollWidth}`,
            scrub: 1, pin: true, anticipatePin: 1,
          },
        });
      }

      // Quote reveal
      gsap.from(".quote-reveal", {
        scale: 0.92, opacity: 0, duration: 1, ease: "power2.out",
        scrollTrigger: { trigger: ".quote-reveal", start: "top 80%" },
      });

      mm.add("(max-width: 900px)", () => {
        gsap.to(".ah-line", {
          yPercent: -10,
          ease: "none",
          scrollTrigger: { trigger: "section:first-of-type", start: "top top", end: "bottom top", scrub: 1 },
        });

        gsap.utils.toArray<HTMLElement>(".client-card").forEach((el, index) => {
          gsap.fromTo(
            el,
            { y: 38, opacity: 0, scale: 0.96 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.8,
              ease: "power3.out",
              delay: index * 0.02,
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
            }
          );
        });

        gsap.fromTo(
          ".quote-reveal",
          { y: 28, opacity: 0, clipPath: "inset(8% 0 8% 0 round 28px)" },
          {
            y: 0,
            opacity: 1,
            clipPath: "inset(0% 0 0% 0 round 0px)",
            duration: 0.95,
            ease: "power3.out",
            scrollTrigger: { trigger: ".quote-reveal", start: "top 88%", once: true },
          }
        );
      });

      mm.add("(min-width: 901px)", () => {
        gsap.to(".portrait-wrap", {
          yPercent: -8,
          ease: "none",
          scrollTrigger: { trigger: ".story-grid", start: "top bottom", end: "bottom top", scrub: 1.2 },
        });
      });

    }, mainRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={mainRef}>
      {/* NAV */}
      <NavClient theme="light" activeHref="/about" />

      {/* ═══ HERO ═══ */}
      <section style={{
        minHeight:"100vh", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center",
        background:"linear-gradient(165deg, #FAF8F4 0%, #EDE7DB 50%, #F5F0E8 100%)",
        padding:"clamp(100px,20vw,140px) clamp(20px,5vw,80px) clamp(60px,8vw,80px)", textAlign:"center", position:"relative", overflow:"hidden",
      }}>
        {/* Decorative circles */}
        <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",border:"1px solid rgba(196,125,90,0.08)",top:"-10%",right:"-8%"}} />
        <div style={{position:"absolute",width:300,height:300,borderRadius:"50%",border:"1px solid rgba(139,154,126,0.1)",bottom:"10%",left:"-5%"}} />
        <div style={{position:"absolute",width:200,height:200,borderRadius:"50%",background:"rgba(196,168,110,0.06)",top:"30%",left:"15%",filter:"blur(60px)"}} />
        <div style={{position:"absolute",width:"60vw",height:"60vw",maxWidth:520,maxHeight:520,borderRadius:"50%",background:"radial-gradient(circle, rgba(255,255,255,0.44), transparent 68%)",top:"-10%",right:"-12%",filter:"blur(18px)",pointerEvents:"none"}} />
        <div style={{position:"absolute",width:"58vw",height:"58vw",maxWidth:460,maxHeight:460,borderRadius:"50%",background:"radial-gradient(circle, rgba(196,125,90,0.14), transparent 72%)",bottom:"-15%",left:"-10%",filter:"blur(28px)",pointerEvents:"none"}} />

        <div style={{perspective:"600px",overflow:"hidden"}}>
          <div className="ah-line" style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.72rem",fontWeight:500,letterSpacing:"0.2em",textTransform:"uppercase",color:"#C47D5A",marginBottom:24,display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
            <span style={{width:32,height:1.5,background:"#C47D5A",display:"inline-block"}} /> {pc.aboutHero?.eyebrow || "Artist & Designer"}
          </div>
          <h1 className="ah-line" style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(3.5rem,8vw,7rem)",fontWeight:400,lineHeight:1,color:"#2A2520",margin:0}}>Carolyn</h1>
          <h1 className="ah-line" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(3.5rem,8vw,7rem)",fontWeight:300,fontStyle:"italic",lineHeight:1,color:"#C47D5A",margin:"0 0 28px"}}>Jenkins</h1>
        </div>
        <p className="ah-sub" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(1.1rem,2vw,1.4rem)",fontWeight:300,fontStyle:"italic",color:"#3D3530",opacity:0.7,maxWidth:500,lineHeight:1.7,margin:"0 auto 48px"}}>
          {aboutHeroSubtitle}
        </p>
        <div className="ah-scroll" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,color:"#B8AFA3",fontSize:"0.7rem",letterSpacing:"0.15em",textTransform:"uppercase",fontFamily:"'Outfit',sans-serif"}}>
          Scroll to explore
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{animation:"bobDown 2s ease-in-out infinite"}}><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </div>
        <style>{`@keyframes bobDown{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}`}</style>
      </section>

      {/* ═══ ORIGIN STORY ═══ */}
      <section style={{background:"#F5F0E8",padding:"clamp(60px,10vw,140px) 0",overflow:"hidden"}}>
        <style>{`
          .story-grid{display:grid;grid-template-columns:1fr 1.2fr;}
          @media(max-width:768px){.story-grid{grid-template-columns:1fr!important;} .portrait-wrap{position:static!important;} .portrait-wrap > div{max-height:280px!important;aspect-ratio:4/3!important;} }
        `}</style>
        <div className="story-grid" style={{maxWidth:1300,margin:"0 auto",gap:"clamp(40px,6vw,100px)",padding:"0 clamp(20px,5vw,80px)",alignItems:"start"}}>
          {/* Portrait */}
          <div className="portrait-wrap reveal-up" style={{position:"sticky",top:100}}>
            <div style={{aspectRatio:"3/4",background:"#D4C9B8",overflow:"hidden",position:"relative",maxHeight:"70vh"}}>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",color:"#B8AFA3",fontSize:"1rem"}}>Artist Portrait</div>
            </div>
          </div>
          {/* Story text */}
          <div>
            <div className="reveal-up" style={{marginBottom:48}}>
              <div style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.72rem",fontWeight:500,letterSpacing:"0.2em",textTransform:"uppercase",color:"#C47D5A",marginBottom:16}}>{pc.aboutOrigin?.eyebrow || "The Beginning"}</div>
              <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(2rem,3.5vw,2.8rem)",fontWeight:400,color:"#2A2520",lineHeight:1.15,marginBottom:24}}>{aboutOriginHeading}</h2>
              <p style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.95rem",fontWeight:300,lineHeight:1.9,color:"#3D3530",marginBottom:20}}>{aboutOriginParagraph1}</p>
              <p style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.95rem",fontWeight:300,lineHeight:1.9,color:"#3D3530",marginBottom:20}}>{aboutOriginParagraph2}</p>
            </div>

            {/* Ringling story — emotional highlight */}
            <div className="reveal-up" style={{borderLeft:"3px solid #C47D5A",paddingLeft:28,marginBottom:48}}>
              <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.6rem",fontWeight:400,color:"#2A2520",marginBottom:16}}>{pc.aboutSacrifice?.heading || "The Sacrifice"}</h3>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.15rem",fontWeight:300,fontStyle:"italic",lineHeight:1.8,color:"#3D3530",marginBottom:16}}>{pc.aboutSacrifice?.paragraph1 || "In 1972, I was accepted into the prestigious Ringling School of Art. However, faced with a family emergency, I chose to redirect my college funds to pay for my Godmother\u2019s life-saving open-heart surgery."}</p>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.15rem",fontWeight:300,fontStyle:"italic",lineHeight:1.8,color:"#C47D5A"}}>{pc.aboutSacrifice?.highlight || "That decision blessed me with her presence for another twenty years."}</p>
            </div>

            <div className="reveal-up" style={{marginBottom:0}}>
              <p style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.95rem",fontWeight:300,lineHeight:1.9,color:"#3D3530"}}>{aboutSacrificeClosing}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ COMMERCIAL CAREER ═══ */}
      <section className="timeline-section" style={{background:"#2A2520",overflow:"hidden",position:"relative"}}>
        {/* Desktop: horizontal pin scroll. Mobile: vertical card stack */}
        <style>{`
          @media(min-width:901px){ .timeline-section{height:100vh;} .timeline-track{position:absolute;bottom:clamp(40px,6vw,80px);left:80px;padding-right:80px;} }
          @media(max-width:900px){ .timeline-track{display:grid!important;grid-template-columns:1fr 1fr!important;gap:12px!important;position:static!important;padding:0 16px 40px!important;} .client-card{min-width:unset!important;width:100%!important;} .timeline-header{position:static!important;padding:40px 16px 24px!important;} }
          @media(max-width:500px){ .timeline-track{grid-template-columns:1fr!important;} }
        `}</style>
        <div className="timeline-header" style={{position:"absolute",top:"clamp(40px,6vw,80px)",left:"clamp(24px,5vw,80px)",zIndex:2,maxWidth:"60%"}}>
          <div style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.72rem",fontWeight:500,letterSpacing:"0.2em",textTransform:"uppercase",color:"#C4A86E",marginBottom:12}}>{pc.aboutCareer?.eyebrow || "Commercial Design & Illustration"}</div>
          <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(1.8rem,3vw,2.6rem)",fontWeight:400,color:"#F5F0E8",marginBottom:12}}>{pc.aboutCareer?.heading || "The Professional Journey"}</h2>
          <p style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.85rem",fontWeight:300,color:"#D4C9B8",maxWidth:500,lineHeight:1.7}}>{pc.aboutCareer?.description || "My career began in the pre-digital era at Tom Griffin Commercial Art Studio in Winter Park, specializing in hand-drawn designs for packaging, logos, and brochures."}</p>
        </div>
        <div className="timeline-track" style={{display:"flex",gap:24}}>
          {clients.map((c, i) => (
            <div key={i} className="client-card" style={{
              minWidth:320,width:320,background:"rgba(245,240,232,0.06)",border:"1px solid rgba(245,240,232,0.08)",
              padding:"36px 28px",flexShrink:0,transition:"transform 0.3s,background 0.3s",cursor:"default",
            }}
            onMouseEnter={e=>(e.currentTarget.style.background="rgba(245,240,232,0.12)",e.currentTarget.style.transform="translateY(-6px)")}
            onMouseLeave={e=>(e.currentTarget.style.background="rgba(245,240,232,0.06)",e.currentTarget.style.transform="translateY(0)")}
            >
              <div style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.65rem",fontWeight:500,letterSpacing:"0.15em",textTransform:"uppercase",color:"#C4A86E",marginBottom:12}}>{c.era}</div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.4rem",color:"#F5F0E8",marginBottom:10}}>{c.name}</div>
              <div style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.85rem",fontWeight:300,color:"#B8AFA3",lineHeight:1.65}}>{c.work}</div>
            </div>
          ))}
        </div>
        {/* Progress line */}
        <div style={{position:"absolute",bottom:"clamp(30px,5vw,70px)",left:0,right:0,height:1,background:"rgba(245,240,232,0.06)"}} />
      </section>

      {/* ═══ STATS ═══ */}
      <section style={{background:"linear-gradient(135deg,#3E5940 0%,#5A7A5E 50%,#8B9A7E 100%)",padding:"clamp(60px,8vw,100px) clamp(24px,5vw,80px)"}}>
        <div style={{maxWidth:1000,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:32,textAlign:"center"}}>
          <style>{`@media(max-width:700px){.stats-grid{grid-template-columns:repeat(2,1fr)!important;gap:24px!important;}}`}</style>
          {(pc.aboutStats || [
            { value: 40, suffix: "+", label: "Years Creating Art" },
            { value: 14, suffix: "+", label: "Years Exhibiting" },
            { value: 8,  suffix: "", label: "Major Clients" },
            { value: 5,  suffix: "", label: "States Exhibited" },
          ]).map((s: any, i: number) => (
            <div key={i} className="reveal-up">
              <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:2}}>
                <span className="stat-num" data-val={s.value || s.val} style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(2.5rem,5vw,3.8rem)",color:"#F5F0E8",lineHeight:1}}>0</span>
                <span style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(1.5rem,3vw,2.2rem)",color:"#C5CFBC"}}>{s.suffix}</span>
              </div>
              <div style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.72rem",fontWeight:500,letterSpacing:"0.12em",textTransform:"uppercase",color:"#C5CFBC",marginTop:8}}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FINE ART & EXHIBITIONS ═══ */}
      <section style={{background:"#FAF8F4",padding:"clamp(80px,10vw,140px) clamp(24px,5vw,80px)"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div className="reveal-up" style={{textAlign:"center",marginBottom:64}}>
            <div style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.72rem",fontWeight:500,letterSpacing:"0.2em",textTransform:"uppercase",color:"#C47D5A",marginBottom:16}}>{pc.aboutExhibitions?.eyebrow || "Fine Art & Exhibitions"}</div>
            <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(2rem,3.5vw,2.8rem)",fontWeight:400,color:"#2A2520",marginBottom:20}}>{pc.aboutExhibitions?.heading || "Returning to the Canvas"}</h2>
          </div>
          <div className="reveal-up" style={{display:"grid",gridTemplateColumns:"3px 1fr",gap:32,marginBottom:40}}>
            <div style={{background:"linear-gradient(to bottom, #C47D5A, #C4A86E)",borderRadius:2}} />
            <div>
              <p style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.95rem",fontWeight:300,lineHeight:1.9,color:"#3D3530",marginBottom:20}}>{aboutExhibitionsParagraph1}</p>
              <p style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.95rem",fontWeight:300,lineHeight:1.9,color:"#3D3530",marginBottom:20}}>{pc.aboutExhibitions?.paragraph2 || "I entered a show in Orlando benefiting Harbor House, a haven for domestic abuse survivors. Out of 4,000 entries, only three hundred were chosen. My work was among them."}</p>
              <p style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.95rem",fontWeight:300,lineHeight:1.9,color:"#3D3530"}}>{pc.aboutExhibitions?.paragraph3 || "My work has been featured in gallery exhibits including City Arts Orlando. I am currently an active member of the West Volusia Artists."}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ QUOTE — cinematic ═══ */}
      <div className="quote-reveal" style={{
        background:"linear-gradient(135deg,#3E5940 0%,#5A7A5E 50%,#8B9A7E 100%)",
        padding:"clamp(80px,10vw,140px) clamp(24px,5vw,80px)",textAlign:"center",position:"relative",overflow:"hidden",
      }}>
        <div style={{position:"absolute",top:-40,left:"50%",transform:"translateX(-50%)",fontFamily:"'Cormorant Garamond',serif",fontSize:"20rem",color:"rgba(255,255,255,0.04)",lineHeight:1}}>&ldquo;</div>
        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(1.5rem,3.5vw,2.4rem)",fontWeight:300,fontStyle:"italic",lineHeight:1.6,color:"#F5F0E8",maxWidth:800,margin:"0 auto 24px",position:"relative",zIndex:1}}>
          &ldquo;{aboutQuoteText}&rdquo;
        </p>
        <div style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.8rem",fontWeight:500,letterSpacing:"0.15em",textTransform:"uppercase",color:"#C5CFBC",position:"relative",zIndex:1}}>&mdash; {pc.aboutQuote?.attribution || "Carolyn Jenkins"}</div>
      </div>

      {/* ═══ PERSONAL NOTE ═══ */}
      <section style={{background:"#F5F0E8",padding:"clamp(80px,10vw,140px) clamp(24px,5vw,80px)"}}>
        <div style={{maxWidth:720,margin:"0 auto"}}>
          <div className="reveal-up" style={{textAlign:"center",marginBottom:48}}>
            <div style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.72rem",fontWeight:500,letterSpacing:"0.2em",textTransform:"uppercase",color:"#C47D5A",marginBottom:16}}>{pc.aboutPersonalNote?.eyebrow || "A Personal Note"}</div>
            <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(2rem,3.5vw,2.8rem)",fontWeight:400,color:"#2A2520"}}>Gratitude &amp; <em style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,color:"#C47D5A"}}>Practice</em></h2>
          </div>
          <div className="reveal-up">
            <p style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.95rem",fontWeight:300,lineHeight:1.9,color:"#3D3530",marginBottom:24}}>{pc.aboutPersonalNote?.paragraph1 || "My path as an artist has been defined by both passion and sacrifice. The decision to forgo Ringling in 1972 shaped everything that followed \u2014 it taught me that art is not just what you put on canvas, but the choices you make with your life."}</p>
            <p style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.95rem",fontWeight:300,lineHeight:1.9,color:"#3D3530",marginBottom:24}}>{personalNoteParagraph2}</p>
            <p style={{fontFamily:"'Outfit',sans-serif",fontSize:"0.95rem",fontWeight:300,lineHeight:1.9,color:"#3D3530",marginBottom:40}}>{personalNoteParagraph3}</p>
          </div>
          <div className="reveal-up" style={{display:"flex",gap:20,alignItems:"center",flexWrap:"wrap",justifyContent:"center"}}>
            <a href="/#gallery" className="btn-primary">{pc.aboutPersonalNote?.ctaPrimary || "View My Work"}</a>
            <a href="/#contact" className="btn-secondary">{pc.aboutPersonalNote?.ctaSecondary || "Get in Touch"}</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo">Palm Art Studio</div>
          <ul className="footer-links">
            <li><a href="/#gallery">Gallery</a></li>
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
