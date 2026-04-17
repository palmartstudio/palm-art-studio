"use client";
import { useState, useEffect, useCallback } from "react";

interface NavProps {
  theme?: "light" | "dark";
  activeHref?: string;
}

const NAV_ITEMS = [
  { href: "/gallery",    label: "Gallery" },
  { href: "/process",    label: "Process" },
  { href: "/about",      label: "About" },
  { href: "/#shop",      label: "Shop" },
  { href: "/#community", label: "Events" },
  { href: "/#contact",   label: "Contact" },
];

export default function NavClient({ theme = "light", activeHref }: NavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleLink = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute("href") || "";
    if (href.startsWith("/#") && window.location.pathname === "/") {
      e.preventDefault();
      setOpen(false);
      setTimeout(() => {
        document.querySelector(href.replace("/", ""))?.scrollIntoView({ behavior: "smooth" });
      }, 350);
    } else {
      setOpen(false);
    }
  }, []);

  const isDark = theme === "dark";
  const textCol = isDark ? "#F5F0E8" : "#2A2520";
  const dimCol  = isDark ? "#D4C9B8" : "#6B5E54";
  const bg      = isDark ? "rgba(42,37,32,0.97)" : "rgba(245,240,232,0.95)";

  return (
    <nav className="nav scrolled" style={{ background: bg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
      <a href="/" className="nav-logo" style={{ color: textCol }}>Palm Art Studio</a>

      <button
        className="menu-toggle"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle menu"
        aria-expanded={open}
        style={{ zIndex: 1002 }}
      >
        <span style={{ background: textCol, transform: open ? "rotate(45deg) translate(5px,5px)" : "none", transition: "all 0.3s" }} />
        <span style={{ background: textCol, opacity: open ? 0 : 1, transition: "all 0.3s" }} />
        <span style={{ background: textCol, transform: open ? "rotate(-45deg) translate(5px,-5px)" : "none", transition: "all 0.3s" }} />
      </button>

      <ul className={`nav-links${open ? " open" : ""}`} style={{ zIndex: 1001 }}>
        {NAV_ITEMS.map(item => (
          <li key={item.href}>
            <a href={item.href} onClick={handleLink}
              className={activeHref === item.href ? "active" : ""}
              style={{ color: open ? "#2A2520" : dimCol }}>
              {item.label}
            </a>
          </li>
        ))}
        <li><a href="/#shop" className="nav-cta" onClick={handleLink}>Shop Prints</a></li>
      </ul>
    </nav>
  );
}
