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

interface PageContent { homeHero?:any; homeGallery?:any; homeAbout?:any; homeCommercial?:any; homeQuoteBanner?:any; homeShop?:any; homeEvents?:any; homeContact?:any; }
interface Props { settings:Settings|null; artist:Artist|null; artwork:Artwork[]; shopItems:ShopItem[]; events:Event[]; portraitUrl:string|null; pageContent:PageContent|null; heroImages:(string|null)[]; }

function preferUpdatedCopy(value: string | undefined, legacy: string, updated: string) {
  if (!value || value === legacy) return updated;
  return value;
}

export default function HomeClient({ settings, artist, artwork, shopItems, events, portraitUrl, pageContent, heroImages }:Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const pc = pageContent || {};

  const artistName = artist?.name || "Carolyn Jenkins";
  const studioLocation = artist?.studioLocation || "Deltona, FL";
  const heroSubtitle = preferUpdatedCopy(
    settings?.heroSubtitle,
    "Original watercolors, acrylics, and mixed media from Carolyn Jenkins — each piece carries emotion, story, and soul.",
    "Original paintings, prints, and commissions from Carolyn Jenkins in Deltona, Florida."
  );
  const homeStatement = pc.homeQuoteBanner?.text || "A lifetime of art-making, from commercial design to studio practice.";
  const galleryDescription = preferUpdatedCopy(
    pc.homeGallery?.description,
    "From watercolors of historic Florida architecture to bold mixed-media explorations — each piece carries emotion, story, and soul.",
    "Watercolors, mixed media, and acrylic works inspired by Florida light, architecture, and everyday observation."
  );
  const aboutHeading = preferUpdatedCopy(
    pc.homeAbout?.heading,
    "From AOL & Disney to Fine Art",
    "A Life in Art and <em>Design</em>"
  );
  const aboutParagraph1 = preferUpdatedCopy(
    pc.homeAbout?.paragraph1,
    "Born in Towson, Maryland, and raised in Winter Park, Florida, Carolyn Jenkins has been painting and creating since childhood. Her artistic journey spans from the Maitland Center of the Arts and Rollins College to founding her own design firm, Storm Hill Studio.",
    "Born in Towson, Maryland, and raised in Winter Park, Florida, Carolyn Jenkins has been painting and creating since childhood. Her artistic journey has taken her from the Maitland Art Center and Rollins College to establishing her own design firm, Storm Hill Studio."
  );
  const aboutParagraph2 = pc.homeAbout?.paragraph2 || "Her commercial career began in the pre-digital era at Tom Griffin Commercial Art Studio in Winter Park. She went on to create original icon art for AOL's early user interface, design menus for Walt Disney World and Darden Restaurants, illustrate for the Wayne Taylor Indy Racing team, and create packaging for brands like Juice Bowl.";
  const aboutParagraph3Template = pc.homeAbout?.paragraph3 || "Now based in {studioLocation}, Carolyn continues to create works in acrylic and watercolor, with over fourteen years exhibiting in art festivals across Florida.";
  const commercialDescription = preferUpdatedCopy(
    pc.homeCommercial?.description,
    "Decades of professional design work for iconic brands.",
    "Decades of design and illustration work, from hand-drawn packaging and print pieces to early digital interface art."
  );
  const shopTitle = preferUpdatedCopy(pc.homeShop?.title, "Bring Art Home", "Available Work");
  const shopDescription = preferUpdatedCopy(
    pc.homeShop?.description,
    "Original paintings, limited edition prints, and commissions. Each piece ships with a certificate of authenticity.",
    "Original paintings, limited edition prints, and commissions, each prepared with care for collectors and clients."
  );
  const eventsDescription = preferUpdatedCopy(
    pc.homeEvents?.description,
    "Join Carolyn at upcoming exhibitions, art festivals, and studio events.",
    "Join Carolyn for exhibitions, art festivals, and studio events in Florida and beyond."
  );
  const contactTitle = preferUpdatedCopy(pc.homeContact?.title, "Let’s Connect", "Inquiries & Commissions");
  const contactDescription = preferUpdatedCopy(
    pc.homeContact?.description,
    "Interested in a commission, a purchase, or just want to talk art? Reach out anytime.",
    "Interested in a commission, available work, or a studio inquiry? Reach out anytime."
  );
  const displayCredentials = (artist?.credentials || [
    { number: "40+", label: "Years Creating" },
    { number: "14+", label: "Years Exhibiting" },
    { number: "Multiple", label: "Festival Honors" },
  ]).map((c) =>
    c.label === "Awards Won" && c.number === "6+"
      ? { number: "Multiple", label: "Festival Honors" }
      : c
  );

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
    const magneticCleanups: Array<() => void> = [];

    const ctx = gsap.context(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const mm = gsap.matchMedia();

      const addMagnetic = (selector: string, strength = 0.14) => {
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

        gsap.utils.toArray<HTMLElement>(selector).forEach((el) => {
          const xTo = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" });
          const yTo = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" });
          const rTo = gsap.quickTo(el, "rotateZ", { duration: 0.5, ease: "power3.out" });

          const enter = () => gsap.to(el, { scale: 1.02, duration: 0.45, ease: "power3.out" });
          const move = (event: MouseEvent) => {
            const rect = el.getBoundingClientRect();
            const relX = event.clientX - rect.left - rect.width / 2;
            const relY = event.clientY - rect.top - rect.height / 2;
            xTo(relX * strength);
            yTo(relY * strength);
            rTo((relX / rect.width) * 4);
          };
          const leave = () => {
            xTo(0);
            yTo(0);
            rTo(0);
            gsap.to(el, { scale: 1, duration: 0.5, ease: "power3.out" });
          };

          el.addEventListener("mouseenter", enter);
          el.addEventListener("mousemove", move);
          el.addEventListener("mouseleave", leave);

          magneticCleanups.push(() => {
            el.removeEventListener("mouseenter", enter);
            el.removeEventListener("mousemove", move);
            el.removeEventListener("mouseleave", leave);
          });
        });
      };

      const revealHeaders = () => {
        gsap.utils.toArray<HTMLElement>(".section-header").forEach((el) => {
          gsap.fromTo(
            el,
            { y: 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
              ease: "power2.out",
              scrollTrigger: { trigger: el, start: "top 86%", once: true },
            }
          );
        });
      };

      const revealCards = (selector: string, options?: gsap.TweenVars) => {
        gsap.utils.toArray<HTMLElement>(selector).forEach((el, index) => {
          gsap.fromTo(
            el,
            { y: 32, opacity: 0, scale: 0.97 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.75,
              delay: index * 0.06,
              ease: "power2.out",
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
              ...options,
            }
          );
        });
      };

      mm.add("(min-width: 901px)", () => {
        addMagnetic(".magnetic", 0.12);
        addMagnetic(".social-link", 0.08);
        addMagnetic(".hero-frame", 0.04);

        const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
        intro
          .fromTo(".hero-bg-element", { scale: 0.72, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.12, duration: 1.3 }, 0)
          .fromTo(".h-eyebrow", { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9 }, 0.12)
          .fromTo(".h-title-1, .h-title-2", { yPercent: 115, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.08, duration: 1.05 }, 0.18)
          .fromTo(".h-sub", { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 0.42)
          .fromTo(".h-actions > *", { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.7 }, 0.58)
          .fromTo(".h-frame", { y: 80, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 1.1 }, 0.24)
          .fromTo(".h-scroll-hint", { opacity: 0, y: -12 }, { opacity: 0.5, y: 0, duration: 0.6 }, 0.95);

        gsap.to(".hero-text", {
          yPercent: -10,
          ease: "none",
          scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero-gallery", {
          yPercent: 8,
          ease: "none",
          scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero-frame-1", {
          yPercent: -6,
          ease: "none",
          scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero-frame-2", {
          yPercent: 6,
          ease: "none",
          scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero-frame-3", {
          yPercent: -10,
          ease: "none",
          scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero-bg-1", {
          xPercent: 6,
          yPercent: -8,
          ease: "none",
          scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero-bg-2", {
          xPercent: -8,
          yPercent: 6,
          ease: "none",
          scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero-bg-3", {
          xPercent: -4,
          yPercent: -10,
          ease: "none",
          scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
        });

        revealHeaders();
        revealCards(".gallery-item");
        revealCards(".commercial-card");
        revealCards(".shop-card");

        gsap.utils.toArray<HTMLElement>(".gallery-item").forEach((el) => {
          const bg = el.querySelector<HTMLElement>(".gallery-item-bg");
          if (!bg) return;
          gsap.fromTo(
            bg,
            { scale: 1.08 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        });

        gsap.fromTo(
          ".about-image",
          { y: 40, opacity: 0, scale: 0.96 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.9,
            ease: "power2.out",
            scrollTrigger: { trigger: "#about", start: "top 76%", once: true },
          }
        );
        gsap.fromTo(
          ".about-body .section-eyebrow, .about-body h3, .about-body p, .credential",
          { y: 38, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: { trigger: "#about", start: "top 72%", once: true },
          }
        );

        ScrollTrigger.create({
          trigger: ".about-credentials",
          start: "top 82%",
          once: true,
          onEnter: () => {
            document.querySelectorAll(".credential-number").forEach((el) => {
              const text = el.textContent || "";
              const num = parseFloat(text.replace(/[^0-9.]/g, ""));
              const suffix = text.replace(/[0-9.]/g, "");
              if (!isNaN(num)) {
                gsap.fromTo(el, { textContent: "0" }, {
                  textContent: num,
                  duration: 1.8,
                  ease: "power2.out",
                  snap: { textContent: num < 10 ? 0.1 : 1 },
                  onUpdate() {
                    (el as HTMLElement).textContent = parseFloat((el as HTMLElement).textContent || "0").toFixed(num < 10 ? 1 : 0) + suffix;
                  },
                });
              }
            });
          },
        });

        gsap.fromTo(
          ".quote-banner",
          { scale: 0.97, opacity: 0.7 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.9,
            ease: "power2.out",
            scrollTrigger: { trigger: ".quote-banner", start: "top 85%", once: true },
          }
        );
        gsap.to(".quote-text", {
          y: -30,
          ease: "none",
          scrollTrigger: { trigger: ".quote-banner", start: "top bottom", end: "bottom top", scrub: true },
        });

        gsap.utils.toArray<HTMLElement>(".event-item").forEach((el, index) => {
          gsap.fromTo(
            el,
            { y: 24, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              delay: index * 0.08,
              ease: "power2.out",
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
            }
          );
        });

        gsap.fromTo(
          ".nl-inner",
          { y: 50, opacity: 0, scale: 0.96 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: ".newsletter", start: "top 86%", once: true },
          }
        );

        gsap.fromTo(
          ".contact-info",
          { x: -40, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: { trigger: "#contact", start: "top 80%", once: true },
          }
        );
        gsap.fromTo(
          ".contact-form",
          { x: 40, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: { trigger: "#contact", start: "top 80%", once: true },
          }
        );

        return () => {
          ScrollTrigger.refresh();
        };
      });

      mm.add("(max-width: 900px)", () => {
        // ═══ MOBILE: Cinematic scroll animations ═══
        // GPU-accelerated transforms only: translate, scale, opacity

        // ── Hero Intro: Dramatic staggered reveal ──
        const hero = gsap.timeline({ defaults: { ease: "power3.out" } });
        hero
          .fromTo(".hero-bg-element", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.15, duration: 1.4 }, 0)
          .fromTo(".h-eyebrow", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.2)
          .fromTo(".h-title-1", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.0 }, 0.3)
          .fromTo(".h-title-2", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.0 }, 0.45)
          .fromTo(".h-sub", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.7)
          .fromTo(".h-actions > *", { y: 40, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, stagger: 0.12, duration: 0.8 }, 0.85)
          .fromTo(".h-frame", { y: 80, opacity: 0, scale: 0.85 }, { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: "power4.out" }, 0.4);

        // Hero parallax — subtle depth on scroll
        gsap.to(".hero-bg-1", {
          yPercent: -15, ease: "none",
          scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero-bg-2", {
          yPercent: 10, ease: "none",
          scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
        });

        // ── Section Headers: Slide up with weight ──
        gsap.utils.toArray<HTMLElement>(".section-header").forEach((el) => {
          gsap.fromTo(el,
            { y: 60, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.0, ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 85%", once: true }
            }
          );
        });

        // ── Gallery Cards: Dramatic staggered entrance ──
        gsap.utils.toArray<HTMLElement>(".gallery-item").forEach((el, i) => {
          gsap.fromTo(el,
            { y: 80, opacity: 0, scale: 0.88 },
            { y: 0, opacity: 1, scale: 1, duration: 0.9, delay: i * 0.1, ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 92%", once: true }
            }
          );
        });

        // ── About Section: Portrait + text cascade ──
        gsap.fromTo(".about-image",
          { x: -60, opacity: 0, scale: 0.9 },
          { x: 0, opacity: 1, scale: 1, duration: 1.0, ease: "power3.out",
            scrollTrigger: { trigger: "#about", start: "top 82%", once: true }
          }
        );
        gsap.fromTo(".about-body .section-eyebrow, .about-body h3, .about-body p",
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: "power3.out",
            scrollTrigger: { trigger: "#about", start: "top 78%", once: true }
          }
        );

        // ── Credentials: Count up + reveal ──
        gsap.utils.toArray<HTMLElement>(".credential").forEach((el, i) => {
          gsap.fromTo(el,
            { y: 40, opacity: 0, scale: 0.85 },
            { y: 0, opacity: 1, scale: 1, duration: 0.7, delay: i * 0.15, ease: "back.out(1.4)",
              scrollTrigger: { trigger: el, start: "top 90%", once: true }
            }
          );
        });
        ScrollTrigger.create({
          trigger: ".about-credentials", start: "top 85%", once: true,
          onEnter: () => {
            document.querySelectorAll(".credential-number").forEach((el) => {
              const text = el.textContent || "";
              const num = parseFloat(text.replace(/[^0-9.]/g, ""));
              const suffix = text.replace(/[0-9.]/g, "");
              if (!isNaN(num)) {
                gsap.fromTo(el, { textContent: "0" }, {
                  textContent: num, duration: 2.0, ease: "power2.out",
                  snap: { textContent: num < 10 ? 0.1 : 1 },
                  onUpdate() { (el as HTMLElement).textContent = parseFloat((el as HTMLElement).textContent || "0").toFixed(num < 10 ? 1 : 0) + suffix; },
                });
              }
            });
          },
        });

        // ── Commercial Cards: Staggered wave ──
        gsap.utils.toArray<HTMLElement>(".commercial-card").forEach((el, i) => {
          gsap.fromTo(el,
            { y: 50, opacity: 0, scale: 0.9 },
            { y: 0, opacity: 1, scale: 1, duration: 0.7, delay: i * 0.06, ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 92%", once: true }
            }
          );
        });

        // ── Quote Banner: Scale reveal with parallax text ──
        gsap.fromTo(".quote-banner",
          { scale: 0.92, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.2, ease: "power3.out",
            scrollTrigger: { trigger: ".quote-banner", start: "top 88%", once: true }
          }
        );
        gsap.to(".quote-text", {
          y: -30, ease: "none",
          scrollTrigger: { trigger: ".quote-banner", start: "top bottom", end: "bottom top", scrub: true },
        });

        // ── Shop Cards: Bold entrance ──
        gsap.utils.toArray<HTMLElement>(".shop-card").forEach((el, i) => {
          gsap.fromTo(el,
            { y: 70, opacity: 0, scale: 0.88 },
            { y: 0, opacity: 1, scale: 1, duration: 0.9, delay: i * 0.1, ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 92%", once: true }
            }
          );
        });

        // ── Event Items: Slide in from left with spring ──
        gsap.utils.toArray<HTMLElement>(".event-item").forEach((el, i) => {
          gsap.fromTo(el,
            { x: -60, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.8, delay: i * 0.1, ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 90%", once: true }
            }
          );
        });

        // ── Newsletter: Rise up with glow ──
        gsap.fromTo(".nl-inner",
          { y: 60, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 1.0, ease: "power3.out",
            scrollTrigger: { trigger: ".newsletter", start: "top 85%", once: true }
          }
        );

        // ── Contact: Staggered columns ──
        gsap.fromTo(".contact-info",
          { x: -50, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.9, ease: "power3.out",
            scrollTrigger: { trigger: "#contact", start: "top 82%", once: true }
          }
        );
        gsap.fromTo(".contact-form",
          { x: 50, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.9, ease: "power3.out",
            scrollTrigger: { trigger: "#contact", start: "top 80%", once: true }
          }
        );
      });

      magneticCleanups.push(() => mm.revert());
    }, mainRef);

    return () => {
      magneticCleanups.forEach((cleanup) => cleanup());
      ctx.revert();
    };
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
              <span className="h-title-1" style={{ display:"block" }}>A Florida Artist</span>
              <em className="h-title-2" style={{ display:"block" }}>with a Designer's Eye</em>
            </h1>
            <p className="hero-subtitle h-sub">{heroSubtitle}</p>
            <div className="hero-actions h-actions">
              <a href="/gallery" className="btn-primary magnetic">{pc.homeHero?.ctaPrimary || "Explore the Gallery"}</a>
              <a href="#shop" className="btn-secondary magnetic">{pc.homeHero?.ctaSecondary || "Shop Originals & Prints"}</a>
            </div>
          </div>
          <div className="hero-gallery">
            <div className="hero-frame hero-frame-1 h-frame">
              {(heroImages?.[0] || portraitUrl)
                ? <img src={heroImages?.[0] || portraitUrl || ""} alt="Featured Artwork" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <div className="hero-frame-inner"><span>Featured Artwork</span></div>}
            </div>
            <div className="hero-frame hero-frame-2 h-frame">
              {heroImages?.[1]
                ? <img src={heroImages[1]} alt="Recent Work" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <div className="hero-frame-inner"><span>Recent Work</span></div>}
            </div>
            <div className="hero-frame hero-frame-3 h-frame">
              {heroImages?.[2]
                ? <img src={heroImages[2]} alt="Daily Study" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <div className="hero-frame-inner"><span>Daily Study</span></div>}
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
          <div className="section-eyebrow">{pc.homeGallery?.eyebrow || "Featured Works"}</div>
          <h2 className="section-title">{pc.homeGallery?.title || "The Collection"}</h2>
          <p className="section-desc">{galleryDescription}</p>
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
          <a href="/gallery" className="btn-primary magnetic">{pc.homeGallery?.ctaText || "View Full Collection"}</a>
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
            <div className="section-eyebrow">{pc.homeAbout?.eyebrow || "The Artist"}</div>
            <h3 dangerouslySetInnerHTML={{ __html: aboutHeading }} />
            <p>{aboutParagraph1}</p>
            <p>{aboutParagraph2}</p>
            <p>{aboutParagraph3Template.replace("{studioLocation}", studioLocation)}</p>
            <div className="about-credentials">
              {displayCredentials.map((c, i) => (
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
          <div className="section-eyebrow">{pc.homeCommercial?.eyebrow || "Commercial Work"}</div>
          <h2 className="section-title">{pc.homeCommercial?.title || "Design & Illustration"}</h2>
          <p className="section-desc">{commercialDescription}</p>
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
        <p className="quote-text">{homeStatement}</p>
      </div>


      {/* ═══ SHOP ═══ */}
      <section id="shop">
        <div className="section-header reveal">
          <div className="section-eyebrow">{pc.homeShop?.eyebrow || "Shop"}</div>
          <h2 className="section-title">{shopTitle}</h2>
          <p className="section-desc">{shopDescription}</p>
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
          <div className="section-eyebrow">{pc.homeEvents?.eyebrow || "Community"}</div>
          <h2 className="section-title">{pc.homeEvents?.title || "Shows & Events"}</h2>
          <p className="section-desc">{eventsDescription}</p>
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
          <div className="section-eyebrow">{pc.homeContact?.eyebrow || "Get in Touch"}</div>
          <h2 className="section-title">{contactTitle}</h2>
          <p className="section-desc">{contactDescription}</p>
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
                <a key={i} href={s.url || "#"} className="social-link magnetic" aria-label={s.platform}>{s.label}</a>
              ))}
            </div>
          </div>
          <div className="contact-form">
            <input type="text"  placeholder="Your Name"   aria-label="Name" />
            <input type="email" placeholder="Email Address" aria-label="Email" />
            <input type="text"  placeholder="Subject — Commission, Purchase, Other" aria-label="Subject" />
            <textarea placeholder="Tell me about what you're looking for..." aria-label="Message" />
            <button className="btn-primary magnetic" type="button">Send Message</button>
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
        @keyframes heroSafety { to { opacity: 1 !important; transform: none !important; } }
        .h-eyebrow, .h-title-1, .h-title-2, .h-sub, .h-actions > *, .h-frame {
          animation: heroSafety 0.01s 2.5s forwards;
        }
        @media(max-width:900px){
          .h-scroll-hint{display:none}
          .hero-frame-2,.hero-frame-3{display:none}
          .hero-frame-1{width:90%;height:90%;top:5%;left:5%}
        }
      `}</style>
    </div>
  );
}
