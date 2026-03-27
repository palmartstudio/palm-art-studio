"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";

gsap.registerPlugin(ScrollTrigger, TextPlugin);

interface Artwork { _id:string; title:string; medium?:string; dimensions?:string; price?:number; status?:string; imageUrl?:string; }
interface ShopItem { _id:string; title:string; medium?:string; price?:number; comparePrice?:number; badge?:string; imageUrl?:string; }
interface Event { _id:string; title:string; date:string; location?:string; rsvpUrl?:string; }
interface Settings { heroTitle?:string; heroSubtitle?:string; newsletterHeading?:string; newsletterText?:string; footerText?:string; announcementText?:string; announcementLink?:string; }
interface Artist { name?:string; tagline?:string; studioLocation?:string; phone?:string; email?:string; quote?:string; portrait?:any; credentials?:{number:string;label:string}[]; commercialClients?:{name:string;description:string}[]; socialLinks?:{platform:string;url:string;label:string}[]; }

interface Props { settings:Settings|null; artist:Artist|null; artwork:Artwork[]; shopItems:ShopItem[]; events:Event[]; portraitUrl:string|null; }

export default function HomeClient({ settings, artist, artwork, shopItems, events, portraitUrl }:Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const artistName = artist?.name || "Carolyn Jenkins";
  const studioLocation = artist?.studioLocation || "Deltona, FL";
  const quote = artist?.quote || "It doesn't matter what others think—create for yourself. It is good for the soul and well-being. Feel the freedom!";
  const heroTitle = settings?.heroTitle || "Art from the Soul";

  // Nav scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const closeMenu = useCallback((e?: React.MouseEvent) => {
    if (e) {
      const target = e.currentTarget as HTMLAnchorElement;
      const href = target.getAttribute("href") || "";
      if (href.startsWith("#")) {
        e.preventDefault();
        setMenuOpen(false);
        setTimeout(() => {
          const el = document.querySelector(href);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 350);
        return;
      }
    }
    setMenuOpen(false);
  }, []);

  // GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // ── Hero entrance ──
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.from(".h-eyebrow",  { y: 30, opacity: 0, duration: 0.9, delay: 0.2 })
        .from(".h-title-1",  { y: 60, opacity: 0, duration: 1   }, "-=0.5")
        .from(".h-title-2",  { y: 60, opacity: 0, duration: 1   }, "-=0.75")
        .from(".h-sub",      { y: 30, opacity: 0, duration: 0.8 }, "-=0.6")
        .from(".h-actions",  { y: 24, opacity: 0, duration: 0.7 }, "-=0.5")
        .from(".h-frame",    { scale: 0.9, opacity: 0, duration: 1.2, stagger: 0.12, ease: "power3.out" }, "-=0.7")
        .from(".h-scroll-hint", { opacity: 0, duration: 0.6 }, "-=0.3");

      // ── Gallery section ──
      ScrollTrigger.create({
        trigger: "#gallery",
        start: "top 80%",
        onEnter: () => {
          gsap.from(".g-header", { y: 40, opacity: 0, duration: 0.9, ease: "power3.out" });
          gsap.from(".gallery-item", { y: 60, opacity: 0, duration: 0.8, stagger: { amount: 0.6, from: "start" }, ease: "power3.out", delay: 0.2 });
        },
        once: true,
      });

      // ── About ──
      ScrollTrigger.create({
        trigger: "#about",
        start: "top 75%",
        onEnter: () => {
          gsap.from(".about-image",  { x: -60, opacity: 0, duration: 1.1, ease: "power3.out" });
          gsap.from(".about-body",   { x:  60, opacity: 0, duration: 1.1, ease: "power3.out", delay: 0.15 });
          gsap.from(".credential",   { y: 30, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power2.out", delay: 0.5 });
        },
        once: true,
      });

      // ── Credential counter ──
      ScrollTrigger.create({
        trigger: ".about-credentials",
        start: "top 80%",
        onEnter: () => {
          document.querySelectorAll(".credential-number").forEach(el => {
            const text = el.textContent || "";
            const num = parseFloat(text.replace(/[^0-9.]/g, ""));
            const suffix = text.replace(/[0-9.]/g, "");
            if (!isNaN(num)) {
              gsap.fromTo(el, { textContent: "0" }, {
                textContent: num, duration: 1.8, ease: "power2.out", snap: { textContent: num < 10 ? 0.1 : 1 },
                onUpdate() { (el as HTMLElement).textContent = parseFloat((el as HTMLElement).textContent || "0").toFixed(num < 10 ? 1 : 0) + suffix; },
              });
            }
          });
        },
        once: true,
      });

      // ── Commercial ──
      ScrollTrigger.create({
        trigger: "#commercial",
        start: "top 80%",
        onEnter: () => gsap.from(".commercial-card", { y: 40, opacity: 0, stagger: 0.08, duration: 0.7, ease: "power3.out" }),
        once: true,
      });

      // ── Quote parallax ──
      gsap.to(".quote-text", {
        y: -40,
        ease: "none",
        scrollTrigger: { trigger: ".quote-banner", scrub: 1.5 },
      });

      // ── Shop ──
      ScrollTrigger.create({
        trigger: "#shop",
        start: "top 80%",
        onEnter: () => gsap.from(".shop-card", { y: 50, opacity: 0, stagger: 0.1, duration: 0.8, ease: "power3.out" }),
        once: true,
      });

      // ── Events ──
      ScrollTrigger.create({
        trigger: "#community",
        start: "top 80%",
        onEnter: () => gsap.from(".event-item", { x: -40, opacity: 0, stagger: 0.12, duration: 0.8, ease: "power3.out" }),
        once: true,
      });

      // ── Newsletter ──
      ScrollTrigger.create({
        trigger: ".newsletter",
        start: "top 85%",
        onEnter: () => gsap.from(".nl-inner", { y: 40, opacity: 0, duration: 0.9, ease: "power3.out" }),
        once: true,
      });

      // ── Contact ──
      ScrollTrigger.create({
        trigger: "#contact",
        start: "top 80%",
        onEnter: () => {
          gsap.from(".contact-info", { x: -50, opacity: 0, duration: 1, ease: "power3.out" });
          gsap.from(".contact-form", { x:  50, opacity: 0, duration: 1, ease: "power3.out", delay: 0.15 });
        },
        once: true,
      });

      // ── Section headers generic ──
      gsap.utils.toArray<HTMLElement>(".reveal").forEach(el => {
        gsap.from(el, {
          y: 36, opacity: 0, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });

    }, mainRef);
    return () => ctx.revert();
  }, []);


  const navItems = [
    { href: "/gallery", label: "Gallery" },
    { href: "/about",   label: "About" },
    { href: "#shop",    label: "Shop" },
    { href: "#community", label: "Events" },
    { href: "#contact", label: "Contact" },
  ];

  const fallbackArtwork = Array(6).fill(null).map((_,i) => ({ _id:`ph${i}`, title:`Artwork ${i+1}`, medium:"Mixed Media" })) as Artwork[];
  const displayArtwork  = artwork.length > 0 ? artwork : fallbackArtwork;
  const displayShop     = shopItems.length > 0 ? shopItems : [
    { _id:"s1", title:"Victorian Dawn — Print",     medium:"Giclée · 18×24 in",          price:85,  badge:"Limited Edition" },
    { _id:"s2", title:"Emotional Currents",         medium:"Mixed Media · 24×36 in",     price:1800,badge:"Original" },
    { _id:"s3", title:"Florida Collection — Set 3", medium:"Giclée Prints · 11×14 in ea",price:180 },
    { _id:"s4", title:"Custom Commission",          medium:"Watercolor or Mixed Media",  price:500 },
  ] as ShopItem[];
  const displayEvents   = events.length > 0 ? events : [
    { _id:"e1", title:"CityArts Spring Exhibition",    date:"2026-04-12", location:"Orlando, FL" },
    { _id:"e2", title:"Central Florida Art Festival",  date:"2026-05-03", location:"Winter Park, FL" },
    { _id:"e3", title:"Studio Open House",             date:"2026-06-18", location:"Palm Art Studio" },
  ] as Event[];

  return (
    <div ref={mainRef}>
      {/* ═══ ANNOUNCEMENT BANNER ═══ */}
      {settings?.announcementText && (
        <div style={{ background:"var(--terracotta)", color:"var(--warm-white)", textAlign:"center", padding:"10px 20px", fontSize:"0.78rem", fontFamily:"var(--font-body)", letterSpacing:"0.08em", position:"relative", zIndex:1001 }}>
          {settings.announcementLink
            ? <a href={settings.announcementLink} style={{ color:"inherit", textDecoration:"underline" }}>{settings.announcementText}</a>
            : settings.announcementText}
        </div>
      )}

      {/* ═══ NAV ═══ */}
      <nav ref={navRef} className={`nav${scrolled ? " scrolled" : ""}`} style={{ zIndex:1000 }}>
        <a href="/" className="nav-logo">Palm Art Studio</a>
        <button className="menu-toggle" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu" aria-expanded={menuOpen} style={{ zIndex:1002, position:"relative" }}>
          <span style={{ transform: menuOpen ? "rotate(45deg) translate(5px,5px)" : "none" }} />
          <span style={{ opacity: menuOpen ? 0 : 1, transform: menuOpen ? "scaleX(0)" : "none" }} />
          <span style={{ transform: menuOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
        </button>
        <ul className={`nav-links${menuOpen ? " open" : ""}`} style={{ zIndex:1001 }}>
          {navItems.map(item => (
            <li key={item.href}>
              <a href={item.href} onClick={closeMenu}>{item.label}</a>
            </li>
          ))}
          <li><a href="#shop" className="nav-cta" onClick={closeMenu}>Shop Prints</a></li>
        </ul>
      </nav>


      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="hero" id="hero">
        <div className="hero-bg-element hero-bg-1" />
        <div className="hero-bg-element hero-bg-2" />
        <div className="hero-bg-element hero-bg-3" />
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-eyebrow h-eyebrow">{artistName} · {studioLocation}</div>
            <h1 className="hero-title">
              <span className="h-title-1" style={{ display:"block" }}>Art from the</span>
              <em className="h-title-2" style={{ display:"block" }}>Soul</em>
            </h1>
            <p className="hero-subtitle h-sub">&ldquo;{quote}&rdquo;</p>
            <div className="hero-actions h-actions">
              <a href="/gallery" className="btn-primary">Explore the Gallery</a>
              <a href="#shop" className="btn-secondary">Shop Originals &amp; Prints</a>
            </div>
          </div>
          <div className="hero-gallery">
            <div className="hero-frame hero-frame-1 h-frame">
              {portraitUrl
                ? <img src={portraitUrl} alt={artistName} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <div className="hero-frame-inner"><span>Featured Artwork</span></div>}
            </div>
            <div className="hero-frame hero-frame-2 h-frame">
              <div className="hero-frame-inner"><span>Recent Work</span></div>
            </div>
            <div className="hero-frame hero-frame-3 h-frame">
              <div className="hero-frame-inner"><span>Daily Study</span></div>
            </div>
          </div>
        </div>
        <div className="h-scroll-hint" style={{ position:"absolute", bottom:32, left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:8, opacity:0.5 }}>
          <span style={{ fontFamily:"var(--font-body)", fontSize:"0.65rem", letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--charcoal)" }}>Scroll</span>
          <div style={{ width:1, height:40, background:"var(--terracotta)", animation:"scrollPulse 2s ease-in-out infinite" }} />
        </div>
      </section>

      {/* ═══ FEATURED GALLERY ═══ */}
      <section id="gallery">
        <div className="section-header g-header">
          <div className="section-eyebrow">Featured Works</div>
          <h2 className="section-title">The Collection</h2>
          <p className="section-desc">From watercolors of historic Florida architecture to bold mixed-media explorations — each piece carries emotion, story, and soul.</p>
        </div>
        <div className="gallery-grid">
          {displayArtwork.slice(0,6).map((item, i) => (
            <div key={item._id} className="gallery-item">
              <div className="gallery-item-bg">
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : <span className="gallery-placeholder">Artwork {i+1}</span>}
              </div>
              <div className="gallery-item-overlay">
                <div className="gallery-item-title">{item.title}</div>
                <div className="gallery-item-meta">{item.medium || "Mixed Media"}{item.dimensions ? ` · ${item.dimensions}` : ""}</div>
                {item.price && <div className="gallery-item-price">${item.price.toLocaleString()}</div>}
              </div>
            </div>
          ))}
        </div>
        <div className="gallery-cta">
          <a href="/gallery" className="btn-primary">View Full Collection</a>
        </div>
      </section>


      {/* ═══ ABOUT ═══ */}
      <section id="about">
        <div className="about-grid">
          <div className="about-image">
            {portraitUrl
              ? <img src={portraitUrl} alt={artistName} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              : <div className="about-image-placeholder">Artist Portrait</div>}
          </div>
          <div className="about-body">
            <div className="section-eyebrow">The Artist</div>
            <h3>From AOL &amp; Disney to <em>Fine Art</em></h3>
            <p>Born in Towson, Maryland, and raised in Winter Park, Florida, Carolyn Jenkins has been painting and creating since childhood. Her artistic journey spans from the Maitland Center of the Arts and Rollins College to founding her own design firm, Storm Hill Studio.</p>
            <p>Her commercial career began in the pre-digital era at Tom Griffin Commercial Art Studio in Winter Park. She went on to create original icon art for AOL's early user interface, design menus for Walt Disney World and Darden Restaurants, illustrate for the Wayne Taylor Indy Racing team, and create packaging for brands like Juice Bowl.</p>
            <p>Now based in {studioLocation}, Carolyn continues to create works in acrylic and watercolor, with over fourteen years exhibiting in art festivals across Florida.</p>
            <div className="about-credentials">
              {(artist?.credentials || [
                { number: "40+", label: "Years Creating" },
                { number: "14+", label: "Years Exhibiting" },
                { number: "6+",  label: "Awards Won" },
              ]).map((c, i) => (
                <div key={i} className="credential">
                  <div className="credential-number">{c.number}</div>
                  <div className="credential-label">{c.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ COMMERCIAL ═══ */}
      <section id="commercial" style={{ background:"var(--warm-white)" }}>
        <div className="section-header reveal">
          <div className="section-eyebrow">Commercial Work</div>
          <h2 className="section-title">Design &amp; Illustration</h2>
          <p className="section-desc">Decades of professional design work for iconic brands.</p>
        </div>
        <div className="commercial-grid">
          {(artist?.commercialClients || [
            { name:"AOL",                   description:"Original icon art for early UI" },
            { name:"Walt Disney World",     description:"Menu design for Disney dining" },
            { name:"Darden Restaurants",   description:"Menu and promotional design" },
            { name:"Wayne Taylor Racing",  description:"Indy Racing team illustrations" },
            { name:"Sea Ray Boats",        description:"T-shirt line design" },
            { name:"Juice Bowl",           description:"Classic juice can packaging" },
            { name:"Orlando Museum of Art",description:"Promotional materials" },
            { name:"Coach Transit",        description:"Product catalogs" },
          ]).map((c, i) => (
            <div key={i} className="commercial-card">
              <div className="commercial-card-name">{c.name}</div>
              <div className="commercial-card-desc">{c.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ QUOTE ═══ */}
      <div className="quote-banner">
        <p className="quote-text">&ldquo;{quote}&rdquo;</p>
        <div className="quote-attr">— {artistName}</div>
      </div>


      {/* ═══ SHOP ═══ */}
      <section id="shop">
        <div className="section-header reveal">
          <div className="section-eyebrow">Shop</div>
          <h2 className="section-title">Bring Art Home</h2>
          <p className="section-desc">Original paintings, limited edition prints, and commissions. Each piece ships with a certificate of authenticity.</p>
        </div>
        <div className="shop-grid">
          {displayShop.map((item, i) => (
            <div key={item._id} className="shop-card">
              <div className="shop-card-image">
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : <span className="gallery-placeholder">{item.title}</span>}
                {item.badge && <div className="shop-card-badge">{item.badge}</div>}
              </div>
              <div className="shop-card-body">
                <div className="shop-card-title">{item.title}</div>
                <div className="shop-card-medium">{item.medium}</div>
                <div className="shop-card-footer">
                  <div className="shop-card-price">
                    {item.price ? `$${item.price.toLocaleString()}` : "Inquire"}
                    {item.comparePrice && <span className="original">${item.comparePrice}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ EVENTS ═══ */}
      <section id="community">
        <div className="section-header reveal">
          <div className="section-eyebrow">Community</div>
          <h2 className="section-title">Shows &amp; Events</h2>
          <p className="section-desc">Join Carolyn at upcoming exhibitions, art festivals, and studio events.</p>
        </div>
        <div className="events-list">
          {displayEvents.map((evt) => {
            const d = new Date(evt.date + "T00:00:00");
            return (
              <div key={evt._id} className="event-item">
                <div className="event-date">
                  <div className="event-month">{d.toLocaleString("en", { month:"short" })}</div>
                  <div className="event-day">{String(d.getDate()).padStart(2,"0")}</div>
                </div>
                <div className="event-info">
                  <h4>{evt.title}</h4>
                  <p>{evt.location}</p>
                </div>
                {evt.rsvpUrl
                  ? <a href={evt.rsvpUrl} className="event-action">RSVP</a>
                  : <a href="#contact" className="event-action">Details</a>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ NEWSLETTER ═══ */}
      <div className="newsletter">
        <div className="nl-inner">
          <h3>{settings?.newsletterHeading || "Stay in the Studio"}</h3>
          <p>{settings?.newsletterText || "New works, behind-the-scenes stories, and exhibition announcements — delivered to your inbox."}</p>
          <div className="newsletter-form">
            <input type="email" placeholder="Your email address" aria-label="Email address" />
            <button type="button">Subscribe</button>
          </div>
        </div>
      </div>


      {/* ═══ CONTACT ═══ */}
      <section id="contact">
        <div className="section-header reveal">
          <div className="section-eyebrow">Get in Touch</div>
          <h2 className="section-title">Let&apos;s Connect</h2>
          <p className="section-desc">Interested in a commission, a purchase, or just want to talk art? Reach out anytime.</p>
        </div>
        <div className="contact-grid">
          <div className="contact-info">
            <h3>Palm Art Studio</h3>
            <div className="contact-detail">
              <div className="contact-detail-text">
                <a href={`tel:${(artist?.phone || "3522179709").replace(/\D/g,"")}`}>{artist?.phone || "(352) 217-9709"}</a>
                <small>Call or Text</small>
              </div>
            </div>
            <div className="contact-detail">
              <div className="contact-detail-text">
                <a href={`mailto:${artist?.email || "cj@palmartstudio.com"}`}>{artist?.email || "cj@palmartstudio.com"}</a>
                <small>For inquiries &amp; commissions</small>
              </div>
            </div>
            <div className="contact-detail">
              <div className="contact-detail-text">
                <span>{studioLocation}</span>
                <small>Studio visits by appointment</small>
              </div>
            </div>
            <div className="social-links">
              {(artist?.socialLinks || [
                { label:"TT", url:"#", platform:"TikTok" },
                { label:"IG", url:"#", platform:"Instagram" },
                { label:"SA", url:"#", platform:"Saatchi" },
                { label:"FB", url:"#", platform:"Facebook" },
              ]).map((s, i) => (
                <a key={i} href={s.url || "#"} className="social-link" aria-label={s.platform}>{s.label}</a>
              ))}
            </div>
          </div>
          <div className="contact-form">
            <input type="text"  placeholder="Your Name"   aria-label="Name" />
            <input type="email" placeholder="Email Address" aria-label="Email" />
            <input type="text"  placeholder="Subject — Commission, Purchase, Other" aria-label="Subject" />
            <textarea placeholder="Tell me about what you're looking for..." aria-label="Message" />
            <button className="btn-primary" type="button">Send Message</button>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo">Palm Art Studio</div>
          <ul className="footer-links">
            <li><a href="/gallery">Gallery</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="#shop">Shop</a></li>
            <li><a href="#community">Events</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
          <div className="footer-copy">{settings?.footerText || "© 2026 Palm Art Studio — Carolyn Jenkins. All rights reserved."}</div>
        </div>
      </footer>

      <style>{`
        @keyframes scrollPulse { 0%,100%{opacity:.4;transform:scaleY(1)} 50%{opacity:1;transform:scaleY(1.15)} }
        @media(max-width:900px){
          .h-scroll-hint{display:none}
          .hero-frame-2,.hero-frame-3{display:none}
          .hero-frame-1{width:90%;height:90%;top:5%;left:5%}
        }
      `}</style>
    </div>
  );
}
